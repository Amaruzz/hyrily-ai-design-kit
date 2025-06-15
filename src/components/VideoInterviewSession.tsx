import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Video, VideoOff, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import InterviewFeedbackReport from './InterviewFeedbackReport';

interface VideoInterviewSessionProps {
  sessionId: string;
  onEndSession: () => void;
}

interface InterviewQuestion {
  id: number;
  question: string;
  category: string;
}

const frontendEngineerQuestions: InterviewQuestion[] = [
  { id: 1, question: "Hello! Welcome to your Frontend Engineer interview session with Hyrily. I'm your AI interviewer. Let's start with: Can you tell me about yourself and your experience with frontend technologies?", category: "Introduction" },
  { id: 2, question: "What frontend frameworks and libraries have you worked with? Which one do you prefer and why?", category: "Technical Skills" },
  { id: 3, question: "Describe a challenging frontend project you worked on. What technologies did you use and what obstacles did you overcome?", category: "Problem Solving" },
];

const VideoInterviewSession = ({ sessionId, onEndSession }: VideoInterviewSessionProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [responses, setResponses] = useState<Record<number, { text: string; score: number }>>({});
  const [sessionTime, setSessionTime] = useState(0);
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestion[]>(frontendEngineerQuestions);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [showFeedbackReport, setShowFeedbackReport] = useState(false);
  const [isListeningContinuously, setIsListeningContinuously] = useState(false);
  const speechProcessingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFinalTranscriptRef = useRef('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const {
    transcript,
    interimTranscript,
    finalTranscript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    error: speechError
  } = useSpeechRecognition();

  // Display speech recognition errors
  useEffect(() => {
    if (speechError) {
      toast({
        title: "Speech Recognition Issue",
        description: speechError,
        variant: "destructive",
      });
    }
  }, [speechError, toast]);

  // Enhanced speech processing with real-time updates
  useEffect(() => {
    if (isListeningContinuously && finalTranscript && finalTranscript !== lastFinalTranscriptRef.current) {
      console.log('Real-time transcript update for Hyrily:', finalTranscript);
      lastFinalTranscriptRef.current = finalTranscript;
      
      // Clear any existing timeout
      if (speechProcessingTimeoutRef.current) {
        clearTimeout(speechProcessingTimeoutRef.current);
      }
      
      // Set a short delay to process complete thoughts
      speechProcessingTimeoutRef.current = setTimeout(() => {
        if (finalTranscript.trim().length > 10) { // Process when we have substantial content
          console.log('Processing substantial speech input for Hyrily...');
          handleSpeechInput(finalTranscript.trim());
        }
      }, 2000); // 2 second delay to catch complete thoughts
    }
  }, [finalTranscript, isListeningContinuously]);

  const handleSpeechInput = async (speechText: string) => {
    if (!speechText || speechText.length < 5) return;
    
    console.log('Hyrily processing speech input:', speechText);
    toast({
      title: "Hyrily Processing...",
      description: "Analyzing your response in real-time...",
    });
    
    await submitResponse(speechText);
  };

  // 2-minute session timer
  useEffect(() => {
    if (interviewStarted) {
      sessionTimerRef.current = setInterval(() => {
        setSessionTime(prev => {
          const newTime = prev + 1;
          if (newTime >= 120) { // 2 minutes
            toast({
              title: "Time's Up!",
              description: "Your 2-minute Frontend Engineer interview has ended. Generating feedback report...",
            });
            setTimeout(() => {
              endInterviewAndShowReport();
            }, 2000);
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, [interviewStarted]);

  const endInterviewAndShowReport = async () => {
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
    }
    
    // Stop recording and camera
    if (isRecording) {
      stopRecording();
    }
    stopCamera();
    
    // Update session in database
    await supabase
      .from('user_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        responses: responses,
        duration_minutes: Math.floor(sessionTime / 60)
      })
      .eq('id', sessionId);

    setShowFeedbackReport(true);
  };

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error);
        };
      }
      
      streamRef.current = stream;
      setIsCameraOn(true);
      setIsMicOn(true);
      
      toast({
        title: "Camera & Microphone Ready",
        description: "Your camera and microphone are now active. Speech recognition is ready.",
      });
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera/microphone. Please check permissions and try again.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsCameraOn(false);
    setIsMicOn(false);
  };

  const speakQuestion = async (questionText: string) => {
    setIsAISpeaking(true);
    setIsWaitingForResponse(false);
    
    try {
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(questionText);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        utterance.onend = () => {
          setIsAISpeaking(false);
          setIsWaitingForResponse(true);
          console.log('AI finished speaking, candidate can now respond');
        };

        utterance.onerror = () => {
          setIsAISpeaking(false);
          setIsWaitingForResponse(true);
          console.log('Speech synthesis error, candidate can now respond');
        };

        speechSynthesis.speak(utterance);
      } else {
        setIsAISpeaking(false);
        setIsWaitingForResponse(true);
      }
    } catch (error) {
      console.error('Error speaking question:', error);
      setIsAISpeaking(false);
      setIsWaitingForResponse(true);
    }
  };

  const startRecording = () => {
    if (!isSupported) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition. Please use Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    if (!isMicOn) {
      toast({
        title: "Microphone Required",
        description: "Please enable your microphone first.",
        variant: "destructive",
      });
      return;
    }

    console.log('Starting recording...');
    resetTranscript();
    setIsRecording(true);
    setIsProcessingAudio(false);
    startListening();
    
    toast({
      title: "Recording Started",
      description: "Hyrily is now listening to your frontend engineering response. Speak clearly.",
    });
  };

  const stopRecording = async () => {
    console.log('Stopping recording...');
    setIsRecording(false);
    setIsProcessingAudio(true);
    stopListening();
    
    toast({
      title: "Processing Response...",
      description: "Hyrily is analyzing your frontend engineering response...",
    });
    
    // Wait a moment for final speech processing
    setTimeout(async () => {
      const finalResponse = finalTranscript.trim() || transcript.trim();
      console.log('Final transcript:', finalResponse);
      
      if (finalResponse) {
        await submitResponse(finalResponse);
      } else {
        toast({
          title: "No Speech Detected",
          description: "Please try recording again. Make sure to speak clearly and check your microphone.",
          variant: "destructive",
        });
        setIsWaitingForResponse(true);
        setIsProcessingAudio(false);
      }
    }, 1500); // Give more time for final processing
  };

  const generateScore = async (question: string, response: string): Promise<number> => {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          prompt: `As an AI interviewer for a Frontend Engineer position, evaluate this candidate's response to the interview question. 

Question: ${question}

Candidate Response: ${response}

Evaluate based on Frontend Engineering criteria:
- Technical knowledge of frontend technologies (30%)
- Problem-solving approach and methodology (25%)
- Communication clarity and examples (20%)
- Understanding of best practices (15%)
- Innovation and modern frontend trends (10%)

Provide only a numerical score from 1-5 (e.g., "4.2")`,
          type: 'feedback'
        }
      });

      if (error) throw error;

      const scoreMatch = data?.content?.match(/(\d+(?:\.\d+)?)/);
      const score = scoreMatch ? Math.min(5, Math.max(1, parseFloat(scoreMatch[1]))) : 3;
      return score;
    } catch (error) {
      console.error('Error generating score:', error);
      return 3;
    }
  };

  const generateNextQuestion = async (previousResponse: string): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          prompt: `As Hyrily, an AI interviewer conducting a Frontend Engineer interview, analyze the candidate's response and generate an appropriate technical follow-up question.

Previous Question: ${interviewQuestions[currentQuestionIndex].question}
Candidate's Response: ${previousResponse}

Based on their answer, create a relevant Frontend Engineering follow-up question that:
1. Builds on their mentioned technologies or experience
2. Tests deeper technical knowledge (React, JavaScript, CSS, performance, etc.)
3. Explores their problem-solving in frontend development
4. Remains professional and interview-appropriate
5. Is specific to frontend engineering challenges

Example areas to explore:
- State management (Redux, Context API)
- Performance optimization techniques
- Responsive design and CSS frameworks
- Testing methodologies for frontend
- Build tools and deployment processes
- Browser compatibility and debugging
- Modern frontend architecture patterns

Generate only the question text, nothing else.`,
          type: 'question'
        }
      });

      if (error) throw error;

      const nextQuestion = data?.content || "Thank you for your responses. That concludes our Frontend Engineer interview.";
      return nextQuestion;
    } catch (error) {
      console.error('Error generating next question:', error);
      return "Thank you for your responses. That concludes our Frontend Engineer interview.";
    }
  };

  const submitResponse = async (responseText: string) => {
    setIsWaitingForResponse(false);
    setIsProcessingAudio(false);
    
    const currentQuestion = interviewQuestions[currentQuestionIndex];
    const score = await generateScore(currentQuestion.question, responseText);
    
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: {
        text: responseText,
        score
      }
    }));

    toast({
      title: "Response Analyzed",
      description: `Frontend Engineering Score: ${score}/5 - Hyrily is preparing the next technical question...`,
    });

    // Generate AI response based on candidate's answer
    setTimeout(async () => {
      if (currentQuestionIndex < interviewQuestions.length - 1) {
        const nextQuestion = await generateNextQuestion(responseText);
        
        const newQuestion: InterviewQuestion = {
          id: currentQuestionIndex + 2,
          question: nextQuestion,
          category: "Technical Follow-up"
        };

        setInterviewQuestions(prev => {
          const updated = [...prev];
          if (updated[currentQuestionIndex + 1]) {
            updated[currentQuestionIndex + 1] = newQuestion;
          } else {
            updated.push(newQuestion);
          }
          return updated;
        });

        setCurrentQuestionIndex(prev => prev + 1);
        resetTranscript();
      } else {
        endInterviewAndShowReport();
      }
    }, 2500);
  };

  const startContinuousListening = () => {
    if (!isSupported) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition. Please use Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    if (!isMicOn) {
      toast({
        title: "Microphone Required",
        description: "Please enable your microphone first.",
        variant: "destructive",
      });
      return;
    }

    console.log('Starting continuous listening for Hyrily...');
    resetTranscript();
    setIsListeningContinuously(true);
    setIsRecording(false);
    setIsProcessingAudio(false);
    startListening();
    
    toast({
      title: "Hyrily is Listening",
      description: "Speak naturally - Hyrily will process your responses in real-time.",
    });
  };

  const stopContinuousListening = () => {
    console.log('Stopping continuous listening...');
    setIsListeningContinuously(false);
    stopListening();
    
    if (speechProcessingTimeoutRef.current) {
      clearTimeout(speechProcessingTimeoutRef.current);
    }
    
    toast({
      title: "Listening Stopped",
      description: "Hyrily has stopped real-time listening.",
    });
  };

  const startInterview = async () => {
    await startCamera();
    setInterviewStarted(true);
    setTimeout(() => {
      speakQuestion(interviewQuestions[0].question);
      // Auto-start continuous listening after AI speaks
      setTimeout(() => {
        startContinuousListening();
      }, 2000);
    }, 1000);
  };

  useEffect(() => {
    if (interviewStarted && currentQuestionIndex > 0 && currentQuestionIndex < interviewQuestions.length) {
      setTimeout(() => {
        speakQuestion(interviewQuestions[currentQuestionIndex].question);
      }, 1000);
    }
  }, [currentQuestionIndex, interviewStarted]);

  // Show feedback report
  if (showFeedbackReport) {
    return (
      <InterviewFeedbackReport 
        sessionId={sessionId}
        responses={responses}
        onBackToHome={onEndSession}
      />
    );
  }

  const currentQuestion = interviewQuestions[currentQuestionIndex];
  const answeredCount = Object.keys(responses).length;
  const averageScore = answeredCount > 0 
    ? Object.values(responses).reduce((sum, r) => sum + r.score, 0) / answeredCount 
    : 0;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get current transcript to display
  const displayTranscript = () => {
    if (isListeningContinuously || isListening) {
      if (interimTranscript) {
        return finalTranscript + ' ' + interimTranscript;
      }
      return finalTranscript || transcript || 'Listening for your voice...';
    }
    return finalTranscript || transcript || '';
  };

  if (!interviewStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-white/20">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mx-auto flex items-center justify-center">
              <Video className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Frontend Engineer Interview</h2>
              <p className="text-gray-300">Ready to start your 2-minute AI video interview for Frontend Engineer position?</p>
            </div>
            <div className="space-y-2 text-sm text-gray-400">
              <p>• Live video interaction with AI interviewer</p>
              <p>• Frontend engineering specific questions</p>
              <p>• Real-time speech recognition</p>
              <p>• Adaptive questions based on your responses</p>
              <p>• 2-minute session with detailed feedback report</p>
            </div>
            <Button 
              onClick={startInterview}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              size="lg"
            >
              Start Frontend Engineer Interview
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="grid lg:grid-cols-2 h-screen">
        {/* Left Side - AI Interviewer */}
        <div className="bg-gray-100 flex flex-col items-center justify-center p-8 relative">
          <div className="text-center space-y-6">
            {/* AI Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mx-auto flex items-center justify-center overflow-hidden">
                <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">H</span>
                </div>
              </div>
              {/* Audio waveform effect */}
              {isAISpeaking && (
                <div className="absolute -left-8 -right-8 top-1/2 transform -translate-y-1/2 flex items-center justify-center space-x-1">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-blue-400 rounded-full animate-pulse"
                      style={{
                        height: `${Math.random() * 40 + 10}px`,
                        animationDelay: `${i * 0.1}s`
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-800">Hyrily - Frontend Engineer Interviewer</h2>
              <Badge className="mt-2 bg-blue-100 text-blue-800">{currentQuestion.category}</Badge>
            </div>

            {/* Current Question */}
            <div className="bg-white rounded-xl p-6 shadow-lg max-w-md">
              <p className="text-gray-700 leading-relaxed">
                {currentQuestion.question}
              </p>
            </div>

            {/* Session Timer */}
            <div className="flex items-center justify-center space-x-2">
              <Clock className="w-5 h-5 text-gray-600" />
              <span className="text-lg font-bold text-gray-800">
                {formatTime(sessionTime)} / 02:00
              </span>
            </div>

            {/* Enhanced Status */}
            <div className="flex items-center justify-center space-x-2">
              <div className="flex items-center space-x-2">
                {isAISpeaking ? (
                  <>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-gray-600">Hyrily is Speaking</span>
                  </>
                ) : isListeningContinuously ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-gray-600">Hyrily is listening continuously...</span>
                  </>
                ) : isRecording ? (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-gray-600">Recording specific response...</span>
                  </>
                ) : isListening ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-gray-600">Processing speech...</span>
                  </>
                ) : isWaitingForResponse ? (
                  <>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                    <span className="text-gray-600">Ready for your response</span>
                  </>
                ) : isProcessingAudio ? (
                  <>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                    <span className="text-gray-600">Analyzing your response...</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-gray-400 rounded-full" />
                    <span className="text-gray-500">Waiting...</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Candidate Video */}
        <div className="bg-gray-900 flex flex-col">
          {/* Top Stats Bar */}
          <div className="bg-black/50 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{Math.floor(sessionTime / 60)}</div>
                <div className="text-xs text-gray-400">MINUTES</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{answeredCount}</div>
                <div className="text-xs text-gray-400">ANSWERED</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{averageScore.toFixed(1)}</div>
                <div className="text-xs text-gray-400">AVG SCORE</div>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={endInterviewAndShowReport} 
              className="border-white/20 text-white"
            >
              End Interview
            </Button>
          </div>

          {/* Video Area */}
          <div className="flex-1 relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            
            {!isCameraOn && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <div className="text-center">
                  <VideoOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">Camera is off</p>
                </div>
              </div>
            )}

            {/* Enhanced live transcript overlay */}
            {(isListeningContinuously || isRecording || isListening) && (
              <div className="absolute bottom-20 left-4 right-4 bg-black/90 rounded-lg p-4 max-h-32 overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-400 font-semibold text-sm">
                    {isListeningContinuously ? '🎤 Live Transcript (Hyrily is listening):' 
                     : isRecording ? '🔴 Recording Transcript:' 
                     : '🔄 Processing...'}
                  </span>
                  {isListeningContinuously && (
                    <span className="text-xs text-gray-400">Real-time mode</span>
                  )}
                </div>
                <p className="text-white text-sm leading-relaxed">
                  {displayTranscript() || "Speak clearly into your microphone..."}
                </p>
                {interimTranscript && (
                  <p className="text-yellow-300 text-xs mt-1 italic">
                    Interim: {interimTranscript}
                  </p>
                )}
              </div>
            )}

            {/* Enhanced status indicators */}
            {isListeningContinuously && (
              <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                🎤 HYRILY LISTENING
              </div>
            )}

            {isRecording && (
              <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                🔴 RECORDING
              </div>
            )}

            {isProcessingAudio && (
              <div className="absolute top-4 left-4 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                🔄 PROCESSING...
              </div>
            )}
          </div>

          {/* Bottom Controls */}
          <div className="bg-black/50 p-6 flex items-center justify-center space-x-4">
            {/* Microphone Button */}
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                if (isMicOn) {
                  setIsMicOn(false);
                } else {
                  setIsMicOn(true);
                }
              }}
              className={`rounded-full w-12 h-12 ${isMicOn ? 'bg-white text-black' : 'bg-red-500 text-white'}`}
            >
              {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </Button>

            {/* Enhanced Recording Controls */}
            <div className="flex items-center space-x-2">
              {/* Continuous Listen Button */}
              <Button
                onClick={isListeningContinuously ? stopContinuousListening : startContinuousListening}
                disabled={isAISpeaking || !isMicOn || isRecording}
                className={`rounded-full px-4 py-2 ${
                  isListeningContinuously 
                    ? 'bg-green-600 hover:bg-green-700 animate-pulse' 
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
                size="sm"
              >
                {isListeningContinuously ? 'Stop Listening' : 'Start Listening'}
              </Button>

              {/* Record Button */}
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={!isWaitingForResponse || isAISpeaking || !isMicOn || isProcessingAudio}
                className={`rounded-full px-6 py-3 ${
                  isRecording 
                    ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                    : 'bg-orange-500 hover:bg-orange-600'
                }`}
                size="lg"
              >
                {isRecording ? 'Stop Recording' : 'Record Answer'}
              </Button>
            </div>

            {/* Camera Button */}
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                if (isCameraOn) {
                  stopCamera();
                } else {
                  startCamera();
                }
              }}
              className={`rounded-full w-12 h-12 ${isCameraOn ? 'bg-white text-black' : 'bg-red-500 text-white'}`}
            >
              {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoInterviewSession;
