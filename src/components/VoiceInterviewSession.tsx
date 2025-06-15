
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2, VolumeX, Bot, User, Star, Clock, SkipForward } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface VoiceInterviewSessionProps {
  sessionId: string;
  onEndSession: () => void;
}

interface InterviewQuestion {
  id: number;
  question: string;
  category: string;
}

const interviewQuestions: InterviewQuestion[] = [
  { id: 1, question: "Hello! Welcome to your interview session. Let's start with: Can you tell me about yourself and your background?", category: "Introduction" },
  { id: 2, question: "What interests you about this role and our company?", category: "Motivation" },
  { id: 3, question: "Describe a challenging project you worked on and how you overcame the obstacles.", category: "Problem Solving" },
  { id: 4, question: "How do you handle working under pressure and tight deadlines?", category: "Stress Management" },
  { id: 5, question: "Tell me about a time when you had to work with a difficult team member.", category: "Teamwork" },
  { id: 6, question: "What are your greatest strengths and how do they apply to this position?", category: "Strengths" },
  { id: 7, question: "Describe a situation where you had to learn something new quickly.", category: "Adaptability" },
  { id: 8, question: "How do you prioritize tasks when you have multiple competing deadlines?", category: "Time Management" },
  { id: 9, question: "Tell me about a mistake you made and how you handled it.", category: "Self-Awareness" },
  { id: 10, question: "Where do you see yourself in the next five years?", category: "Career Goals" }
];

const VoiceInterviewSession = ({ sessionId, onEndSession }: VoiceInterviewSessionProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingQuestion, setIsPlayingQuestion] = useState(false);
  const [responses, setResponses] = useState<Record<number, { text: string; score: number; status: 'answered' | 'skipped' }>>({});
  const [currentResponse, setCurrentResponse] = useState('');
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds per question
  const [isQuestionActive, setIsQuestionActive] = useState(false);
  const [averageScore, setAverageScore] = useState(0);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    isSupported
  } = useSpeechRecognition();

  useEffect(() => {
    if (interviewStarted && currentQuestionIndex < interviewQuestions.length) {
      speakQuestion(interviewQuestions[currentQuestionIndex].question);
    }
  }, [currentQuestionIndex, interviewStarted]);

  useEffect(() => {
    if (isQuestionActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isQuestionActive) {
      // Time's up - automatically skip to next question
      handleSkipQuestion();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeLeft, isQuestionActive]);

  useEffect(() => {
    if (transcript && isRecording) {
      setCurrentResponse(transcript);
    }
  }, [transcript, isRecording]);

  const speakQuestion = async (questionText: string) => {
    setIsPlayingQuestion(true);
    
    try {
      // Using Web Speech API for text-to-speech
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(questionText);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        utterance.onend = () => {
          setIsPlayingQuestion(false);
          setIsQuestionActive(true);
          setTimeLeft(60); // Start 60-second timer
        };

        speechSynthesis.speak(utterance);
      } else {
        // Fallback if TTS not supported
        setIsPlayingQuestion(false);
        setIsQuestionActive(true);
        setTimeLeft(60);
      }
    } catch (error) {
      console.error('Error speaking question:', error);
      setIsPlayingQuestion(false);
      setIsQuestionActive(true);
      setTimeLeft(60);
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

    if (!isQuestionActive) {
      toast({
        title: "Wait for Question",
        description: "Please wait for the question to finish playing.",
        variant: "destructive",
      });
      return;
    }

    resetTranscript();
    setCurrentResponse('');
    setIsRecording(true);
    startListening();
    
    toast({
      title: "Recording Started",
      description: "Speak clearly to answer the question",
    });
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
      return 3; // Default score
    }
  };

  const submitResponse = async (responseText: string) => {
    const currentQuestion = interviewQuestions[currentQuestionIndex];
    const score = await generateScore(currentQuestion.question, responseText);
    
    const newResponse = {
      text: responseText,
      score,
      status: 'answered' as const
    };

    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: newResponse
    }));

    // Update average score
    const allResponses = Object.values({...responses, [currentQuestion.id]: newResponse});
    const answeredResponses = allResponses.filter(r => r.status === 'answered');
    const newAverage = answeredResponses.reduce((sum, r) => sum + r.score, 0) / answeredResponses.length;
    setAverageScore(newAverage);

    toast({
      title: "Response Submitted",
      description: `Score: ${score}/5`,
    });

    // Move to next question
    setTimeout(() => {
      moveToNextQuestion();
    }, 2000);
  };

  const handleSkipQuestion = () => {
    const currentQuestion = interviewQuestions[currentQuestionIndex];
    
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: {
        text: 'Not attended - Time expired',
        score: 0,
        status: 'skipped'
      }
    }));

    toast({
      title: "Question Skipped",
      description: "Moving to next question",
      variant: "destructive",
    });

    moveToNextQuestion();
  };

  const moveToNextQuestion = () => {
    setIsQuestionActive(false);
    setTimeLeft(60);
    resetTranscript();
    setCurrentResponse('');
    
    if (currentQuestionIndex < interviewQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Interview complete
      toast({
        title: "Interview Complete!",
        description: "Thank you for completing all questions.",
      });
      setTimeout(() => {
        onEndSession();
      }, 3000);
    }
  };

  const startInterview = () => {
    setInterviewStarted(true);
    toast({
      title: "Interview Started",
      description: "Listen carefully to each question",
    });
  };

  const currentQuestion = interviewQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / interviewQuestions.length) * 100;
  const answeredCount = Object.values(responses).filter(r => r.status === 'answered').length;
  const skippedCount = Object.values(responses).filter(r => r.status === 'skipped').length;

  if (!interviewStarted) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-primary">Voice Interview</CardTitle>
            <p className="text-medium-gray">Ready to start your AI voice interview?</p>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div className="space-y-2">
              <p className="text-sm text-medium-gray">
                • 10 questions will be asked verbally
              </p>
              <p className="text-sm text-medium-gray">
                • 60 seconds per question
              </p>
              <p className="text-sm text-medium-gray">
                • Record your voice to answer
              </p>
              <p className="text-sm text-medium-gray">
                • Questions auto-skip if not answered in time
              </p>
            </div>
            <Button 
              onClick={startInterview}
              className="w-full bg-accent hover:bg-accent/90"
              size="lg"
            >
              Start Voice Interview
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-off-white py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-primary">Voice Interview Session</h1>
          <Button variant="outline" onClick={onEndSession}>
            End Session
          </Button>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-medium-gray">
              Question {currentQuestionIndex + 1} of {interviewQuestions.length}
            </span>
            <span className="text-medium-gray">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="w-full bg-light-gray rounded-full h-2">
            <div 
              className="bg-accent h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Interview Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Question */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Bot className="w-5 h-5 mr-2 text-accent" />
                    Current Question
                  </CardTitle>
                  <Badge variant="outline">{currentQuestion.category}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-accent/10 rounded-lg p-4">
                  <p className="text-lg text-dark-gray leading-relaxed">
                    {currentQuestion.question}
                  </p>
                </div>
                
                {isPlayingQuestion && (
                  <div className="flex items-center justify-center space-x-2 text-accent">
                    <Volume2 className="w-5 h-5 animate-pulse" />
                    <span>AI is speaking the question...</span>
                  </div>
                )}

                {isQuestionActive && (
                  <div className="flex items-center justify-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-medium-gray" />
                      <span className={`font-mono text-lg ${timeLeft <= 10 ? 'text-red-500' : 'text-primary'}`}>
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recording Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2 text-primary" />
                  Your Response
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isRecording && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-center space-x-2 mb-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-red-600 font-medium">Recording in progress...</span>
                    </div>
                    {currentResponse && (
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-sm text-gray-600 mb-1">Live Transcript:</p>
                        <p className="text-sm">{currentResponse}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-center space-x-4">
                  {!isRecording ? (
                    <Button
                      onClick={startRecording}
                      disabled={!isQuestionActive || isPlayingQuestion}
                      className="bg-red-500 hover:bg-red-600 text-white"
                      size="lg"
                    >
                      <Mic className="w-5 h-5 mr-2" />
                      Start Recording
                    </Button>
                  ) : (
                    <Button
                      onClick={stopRecording}
                      className="bg-red-600 hover:bg-red-700 text-white"
                      size="lg"
                    >
                      <MicOff className="w-5 h-5 mr-2" />
                      Stop & Submit
                    </Button>
                  )}

                  {isQuestionActive && !isRecording && (
                    <Button
                      onClick={handleSkipQuestion}
                      variant="outline"
                      size="lg"
                    >
                      <SkipForward className="w-4 h-4 mr-2" />
                      Skip Question
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Score Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="w-5 h-5 mr-2 text-yellow-500" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-medium-gray mb-2">Average Score</p>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-6 h-6 ${
                            star <= Math.round(averageScore)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xl font-bold text-primary">
                      {averageScore.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-medium-gray">Answered:</span>
                    <Badge className="bg-green-500">{answeredCount}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-medium-gray">Skipped:</span>
                    <Badge className="bg-red-500">{skippedCount}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-medium-gray">Remaining:</span>
                    <Badge variant="outline">
                      {interviewQuestions.length - answeredCount - skippedCount}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Question List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {interviewQuestions.map((q, index) => (
                    <div 
                      key={q.id}
                      className={`flex items-center justify-between p-2 rounded ${
                        index === currentQuestionIndex 
                          ? 'bg-accent/10 border border-accent' 
                          : responses[q.id]
                          ? responses[q.id].status === 'answered'
                            ? 'bg-green-50'
                            : 'bg-red-50'
                          : 'bg-gray-50'
                      }`}
                    >
                      <span className="text-sm font-medium">Q{index + 1}</span>
                      {responses[q.id] && (
                        <Badge 
                          className={`text-xs ${
                            responses[q.id].status === 'answered'
                              ? 'bg-green-500'
                              : 'bg-red-500'
                          }`}
                        >
                          {responses[q.id].status === 'answered' 
                            ? `${responses[q.id].score}/5`
                            : 'Skipped'
                          }
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceInterviewSession;
