
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Video, VideoOff, Phone, MessageSquare, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface VideoInterviewSessionProps {
  sessionId: string;
  onEndSession: () => void;
}

interface InterviewQuestion {
  id: number;
  question: string;
  category: string;
}

const baseQuestions: InterviewQuestion[] = [
  { id: 1, question: "Hello! Welcome to your interview session with Hyrily. I'm your AI interviewer. Let's start with: Can you tell me about yourself and your background?", category: "Introduction" },
  { id: 2, question: "What interests you about this role and what makes you a good fit for our company?", category: "Motivation" },
  { id: 3, question: "Describe a challenging project you worked on and how you overcame the obstacles.", category: "Problem Solving" },
  { id: 4, question: "How do you handle working under pressure and tight deadlines?", category: "Stress Management" },
  { id: 5, question: "Tell me about a time when you had to work with a difficult team member.", category: "Teamwork" },
  { id: 6, question: "What are your greatest strengths and how do they apply to this position?", category: "Strengths" },
  { id: 7, question: "Describe a situation where you had to learn something new quickly.", category: "Adaptability" },
  { id: 8, question: "How do you prioritize tasks when you have multiple competing deadlines?", category: "Time Management" },
  { id: 9, question: "Tell me about a mistake you made and how you handled it.", category: "Self-Awareness" },
  { id: 10, question: "Where do you see yourself in the next five years?", category: "Career Goals" }
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
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestion[]>(baseQuestions);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    isSupported
  } = useSpeechRecognition();

  // 60-minute session timer
  useEffect(() => {
    if (interviewStarted) {
      sessionTimerRef.current = setInterval(() => {
        setSessionTime(prev => {
          const newTime = prev + 1;
          // Auto-end after 60 minutes (3600 seconds)
          if (newTime >= 3600) {
            toast({
              title: "Time's Up!",
              description: "Your 60-minute interview session has ended.",
            });
            setTimeout(() => {
              onEndSession();
            }, 3000);
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
  }, [interviewStarted, onEndSession]);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      streamRef.current = stream;
      setIsCameraOn(true);
      setIsMicOn(true);
      
      toast({
        title: "Camera Started",
        description: "Your camera and microphone are now active",
      });
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
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
        const utterance = new SpeechSynthesisUtterance(questionText);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        utterance.onend = () => {
          setIsAISpeaking(false);
          setIsWaitingForResponse(true);
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
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive",
      });
      return;
    }

    resetTranscript();
    setIsRecording(true);
    startListening();
  };

  const stopRecording = async () => {
    setIsRecording(false);
    stopListening();
    
    if (transcript.trim()) {
      await submitResponse(transcript.trim());
    }
  };

  const generateScore = async (question: string, response: string): Promise<number> => {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          prompt: `Question: ${question}\n\nCandidate Response: ${response}\n\nProvide only a numerical score from 1-5 for this interview response.`,
          type: 'feedback'
        }
      });

      if (error) throw error;

      const scoreMatch = data?.content?.match(/(\d+(?:\.\d+)?)/);
      return scoreMatch ? Math.min(5, Math.max(1, parseFloat(scoreMatch[1]))) : 3;
    } catch (error) {
      console.error('Error generating score:', error);
      return 3;
    }
  };

  const generateNextQuestion = async (previousResponse: string): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          prompt: `Based on the candidate's response: "${previousResponse}", generate the next appropriate interview question. Make it relevant to their answer and different from previous questions. Keep it professional and interview-appropriate.`,
          type: 'question'
        }
      });

      if (error) throw error;

      return data?.content || interviewQuestions[currentQuestionIndex + 1]?.question || "Thank you for your responses.";
    } catch (error) {
      console.error('Error generating next question:', error);
      return interviewQuestions[currentQuestionIndex + 1]?.question || "Thank you for your responses.";
    }
  };

  const submitResponse = async (responseText: string) => {
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
      title: "Response Submitted",
      description: `Score: ${score}/5`,
    });

    setIsWaitingForResponse(false);

    // Generate next question based on response
    setTimeout(async () => {
      if (currentQuestionIndex < 9) { // Limit to 10 questions
        const nextQuestion = await generateNextQuestion(responseText);
        
        // Add the new question to our list
        const newQuestion: InterviewQuestion = {
          id: currentQuestionIndex + 2,
          question: nextQuestion,
          category: "Follow-up"
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
        toast({
          title: "Interview Complete!",
          description: "Thank you for completing the interview.",
        });
        setTimeout(() => {
          onEndSession();
        }, 3000);
      }
    }, 2500); // 2.5 second delay as requested
  };

  const startInterview = async () => {
    await startCamera();
    setInterviewStarted(true);
    setTimeout(() => {
      speakQuestion(interviewQuestions[0].question);
    }, 1000);
  };

  useEffect(() => {
    if (interviewStarted && currentQuestionIndex > 0 && currentQuestionIndex < interviewQuestions.length) {
      setTimeout(() => {
        speakQuestion(interviewQuestions[currentQuestionIndex].question);
      }, 1000);
    }
  }, [currentQuestionIndex, interviewStarted]);

  const currentQuestion = interviewQuestions[currentQuestionIndex];
  const answeredCount = Object.keys(responses).length;
  const averageScore = answeredCount > 0 
    ? Object.values(responses).reduce((sum, r) => sum + r.score, 0) / answeredCount 
    : 0;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
              <h2 className="text-2xl font-bold text-white mb-2">Video Interview</h2>
              <p className="text-gray-300">Ready to start your live AI video interview?</p>
            </div>
            <div className="space-y-2 text-sm text-gray-400">
              <p>• Live video interaction with AI interviewer</p>
              <p>• Adaptive question progression</p>
              <p>• Real-time speech recognition</p>
              <p>• 60-minute session duration</p>
            </div>
            <Button 
              onClick={startInterview}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              size="lg"
            >
              Start Video Interview
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
              <h2 className="text-xl font-semibold text-gray-800">Hyrily, Your AI Interviewer</h2>
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
                {formatTime(sessionTime)} / 60:00
              </span>
            </div>

            {/* Status */}
            <div className="flex items-center justify-center space-x-2">
              <div className="flex items-center space-x-2">
                {isAISpeaking ? (
                  <>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-gray-600">Hyrily is Speaking</span>
                  </>
                ) : isWaitingForResponse ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-gray-600">Your turn to respond</span>
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
              <div className="text-center">
                <div className="text-xs text-gray-400">COMPANY</div>
                <div className="text-xs text-gray-400">Hyrily</div>
              </div>
            </div>
            <Button variant="outline" onClick={onEndSession} className="border-white/20 text-white">
              End Interview
            </Button>
          </div>

          {/* Video Area */}
          <div className="flex-1 relative">
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-full h-full object-cover"
            />
            
            {!isCameraOn && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <div className="text-center">
                  <VideoOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">Camera is off</p>
                </div>
              </div>
            )}

            {/* Live transcript overlay */}
            {isRecording && transcript && (
              <div className="absolute bottom-20 left-4 right-4 bg-black/70 rounded-lg p-3">
                <p className="text-sm text-white">
                  <span className="text-green-400">Live transcript:</span> {transcript}
                </p>
              </div>
            )}
          </div>

          {/* Bottom Controls */}
          <div className="bg-black/50 p-6 flex items-center justify-center space-x-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setIsMicOn(!isMicOn)}
              className={`rounded-full w-12 h-12 ${isMicOn ? 'bg-white text-black' : 'bg-red-500 text-white'}`}
            >
              {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </Button>

            {/* Record Button */}
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!isWaitingForResponse || isAISpeaking}
              className={`rounded-full w-16 h-16 ${
                isRecording 
                  ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                  : 'bg-orange-500 hover:bg-orange-600'
              }`}
              size="lg"
            >
              <Phone className="w-6 h-6" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => setIsCameraOn(!isCameraOn)}
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
