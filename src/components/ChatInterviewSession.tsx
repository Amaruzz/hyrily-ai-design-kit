
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, StopCircle, Bot, User, Star, Mic, MicOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface Message {
  id: string;
  type: 'question' | 'response' | 'feedback';
  content: string;
  timestamp: Date;
  score?: number;
}

interface ChatInterviewSessionProps {
  sessionId: string;
  onEndSession: () => void;
}

const interviewQuestions = [
  "Can you tell me about yourself and what type of role you're preparing for?",
  "What motivates you in your work?",
  "Describe a challenging project you worked on and how you overcame obstacles.",
  "How do you handle working under pressure and tight deadlines?",
  "Tell me about a time when you had to work with a difficult team member.",
  "What are your greatest strengths and how do they apply to this role?",
  "Describe a situation where you had to learn something new quickly.",
  "How do you prioritize tasks when you have multiple deadlines?",
  "Tell me about a time when you made a mistake and how you handled it.",
  "Where do you see yourself in the next 5 years?"
];

const ChatInterviewSession = ({ sessionId, onEndSession }: ChatInterviewSessionProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [averageScore, setAverageScore] = useState<number>(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [usedQuestions, setUsedQuestions] = useState<Set<number>>(new Set());
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
    startInterview();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (transcript && !isListening && isRecordingVoice) {
      setCurrentResponse(transcript);
      setIsRecordingVoice(false);
    }
  }, [transcript, isListening, isRecordingVoice]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startInterview = async () => {
    const welcomeMessage: Message = {
      id: '1',
      type: 'question',
      content: interviewQuestions[0],
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    setQuestionCount(1);
    setUsedQuestions(new Set([0]));
  };

  const getNextQuestion = () => {
    const availableQuestions = interviewQuestions
      .map((_, index) => index)
      .filter(index => !usedQuestions.has(index));
    
    if (availableQuestions.length === 0) {
      return "Thank you for completing the interview! We've covered all the questions.";
    }
    
    const randomIndex = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    setUsedQuestions(prev => new Set([...prev, randomIndex]));
    return interviewQuestions[randomIndex];
  };

  const generateFeedback = async (question: string, response: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          prompt: `Question: ${question}\n\nCandidate Response: ${response}\n\nProvide brief feedback and a score out of 5. Format: "Score: X/5. Brief feedback here."`,
          type: 'feedback'
        }
      });

      if (error) throw error;

      const content = data?.content || "Score: 3/5. Good response, could use more specific examples.";
      const scoreMatch = content.match(/Score:\s*(\d+(?:\.\d+)?)/i);
      const score = scoreMatch ? parseFloat(scoreMatch[1]) : 3;

      return { content, score };
    } catch (error) {
      console.error('Error generating feedback:', error);
      return { 
        content: "Score: 3/5. Good response, could use more specific examples.", 
        score: 3 
      };
    }
  };

  const startVoiceRecording = () => {
    if (!isSupported) {
      toast({
        title: "Voice Recording Not Supported",
        description: "Your browser doesn't support voice recognition.",
        variant: "destructive",
      });
      return;
    }

    resetTranscript();
    setIsRecordingVoice(true);
    startListening();
    
    toast({
      title: "Voice Recording Started",
      description: "Speak clearly into your microphone",
    });
  };

  const stopVoiceRecording = () => {
    setIsRecordingVoice(false);
    stopListening();
    
    toast({
      title: "Voice Recording Stopped",
      description: "Your speech has been converted to text",
    });
  };

  const handleSendResponse = async () => {
    if (!currentResponse.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'response',
      content: currentResponse,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const responseText = currentResponse;
    setCurrentResponse('');
    resetTranscript();
    setIsLoading(true);

    try {
      // Get the last question
      const lastQuestion = messages.filter(m => m.type === 'question').pop();
      const questionText = lastQuestion?.content || "";

      // Generate feedback
      const { content: feedbackContent, score } = await generateFeedback(questionText, responseText);
      
      const feedbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'feedback',
        content: feedbackContent,
        timestamp: new Date(),
        score
      };

      setMessages(prev => [...prev, feedbackMessage]);
      setCurrentScore(score);

      // Update average score
      const responseMessages = messages.filter(m => m.type === 'feedback');
      const totalScore = responseMessages.reduce((sum, msg) => sum + (msg.score || 0), 0) + score;
      const newAverage = totalScore / (responseMessages.length + 1);
      setAverageScore(newAverage);

      // Generate next question after a short delay
      setTimeout(() => {
        const nextQuestion = getNextQuestion();
        const questionMessage: Message = {
          id: (Date.now() + 2).toString(),
          type: 'question',
          content: nextQuestion,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, questionMessage]);
        setQuestionCount(prev => prev + 1);
        setIsLoading(false);
      }, 1500);

    } catch (error) {
      console.error('Error processing response:', error);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendResponse();
    }
  };

  return (
    <div className="min-h-screen bg-off-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-primary">AI Interview Chat</h1>
          <Button variant="outline" onClick={onEndSession}>
            <StopCircle className="w-4 h-4 mr-2" />
            End Session
          </Button>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Chat Section */}
          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center">
                  <Bot className="w-5 h-5 mr-2 text-accent" />
                  Interview Chat
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.type === 'response' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-4 ${
                        message.type === 'question' 
                          ? 'bg-accent text-white' 
                          : message.type === 'response'
                          ? 'bg-primary text-white'
                          : 'bg-blue-50 text-blue-900 border border-blue-200'
                      }`}>
                        <div className="flex items-start space-x-2">
                          {message.type === 'question' && <Bot className="w-4 h-4 mt-1 flex-shrink-0" />}
                          {message.type === 'response' && <User className="w-4 h-4 mt-1 flex-shrink-0" />}
                          {message.type === 'feedback' && <Star className="w-4 h-4 mt-1 flex-shrink-0" />}
                          <div className="flex-1">
                            <p className="text-sm leading-relaxed">{message.content}</p>
                            <p className="text-xs opacity-70 mt-2">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-light-gray rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <Bot className="w-4 h-4 text-accent" />
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Section */}
                <div className="space-y-3">
                  {/* Voice Recording Status */}
                  {isRecordingVoice && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-red-600 font-medium">Recording... Speak clearly</span>
                      </div>
                      {transcript && (
                        <div className="mt-2 p-2 bg-white rounded border">
                          <p className="text-sm text-gray-600">Live Transcript:</p>
                          <p className="text-sm">{transcript}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Voice Controls */}
                  <div className="flex items-center space-x-2">
                    {!isRecordingVoice ? (
                      <Button
                        onClick={startVoiceRecording}
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                      >
                        <Mic className="w-4 h-4 mr-2" />
                        Record Voice
                      </Button>
                    ) : (
                      <Button
                        onClick={stopVoiceRecording}
                        variant="outline"
                        size="sm"
                        className="border-red-500 text-red-500 hover:bg-red-50"
                      >
                        <MicOff className="w-4 h-4 mr-2" />
                        Stop Recording
                      </Button>
                    )}
                    <span className="text-xs text-gray-500">
                      {isSupported ? 'Voice-to-text available' : 'Voice not supported'}
                    </span>
                  </div>

                  {/* Text Input */}
                  <div className="flex space-x-2">
                    <Textarea
                      placeholder="Type your response here or use voice recording..."
                      value={currentResponse}
                      onChange={(e) => setCurrentResponse(e.target.value)}
                      onKeyPress={handleKeyPress}
                      rows={3}
                      className="resize-none"
                      disabled={isLoading || isRecordingVoice}
                    />
                    <Button 
                      onClick={handleSendResponse}
                      disabled={!currentResponse.trim() || isLoading || isRecordingVoice}
                      className="bg-accent hover:bg-accent/90"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Score Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Star className="w-5 h-5 mr-2 text-yellow-500" />
                  Live Scoring
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Score */}
                {currentScore !== null && (
                  <div className="text-center">
                    <p className="text-sm text-medium-gray mb-2">Latest Response</p>
                    <div className="flex items-center justify-center space-x-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-6 h-6 ${
                              star <= Math.round(currentScore)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xl font-bold text-primary">{currentScore.toFixed(1)}</span>
                    </div>
                  </div>
                )}

                {/* Average Score */}
                <div className="text-center border-t pt-4">
                  <p className="text-sm text-medium-gray mb-2">Overall Average</p>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= Math.round(averageScore)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-lg font-bold text-primary">{averageScore.toFixed(1)}</span>
                  </div>
                </div>

                {/* Session Stats */}
                <div className="space-y-3 border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-medium-gray">Questions:</span>
                    <Badge variant="outline">{questionCount}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-medium-gray">Responses:</span>
                    <Badge variant="outline">{messages.filter(m => m.type === 'response').length}</Badge>
                  </div>
                </div>

                {/* Performance Indicator */}
                <div className="text-center">
                  <p className="text-xs text-medium-gray mb-2">Performance Level</p>
                  <Badge className={`${
                    averageScore >= 4 ? 'bg-green-500' :
                    averageScore >= 3 ? 'bg-yellow-500' :
                    'bg-red-500'
                  } text-white`}>
                    {averageScore >= 4 ? 'Excellent' :
                     averageScore >= 3 ? 'Good' : 'Needs Improvement'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterviewSession;
