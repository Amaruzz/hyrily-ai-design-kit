
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, StopCircle, Bot, User, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

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

const ChatInterviewSession = ({ sessionId, onEndSession }: ChatInterviewSessionProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [averageScore, setAverageScore] = useState<number>(0);
  const [questionCount, setQuestionCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    startInterview();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startInterview = async () => {
    const welcomeMessage: Message = {
      id: '1',
      type: 'question',
      content: "Hello! I'm your AI interviewer. Let's start with a simple question: Can you tell me about yourself and what type of role you're preparing for?",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    setQuestionCount(1);
  };

  const generateNextQuestion = async (responseText: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          prompt: `As an AI interviewer, based on the candidate's previous response: "${responseText}", generate the next appropriate interview question. Make it relevant to their background and progressively more challenging. Keep it conversational and professional.`,
          type: 'next_question'
        }
      });

      if (error) throw error;

      return data?.content || "Tell me about a challenging project you worked on and how you overcame any obstacles.";
    } catch (error) {
      console.error('Error generating question:', error);
      return "Tell me about a challenging project you worked on and how you overcame any obstacles.";
    }
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

  const handleSendResponse = async () => {
    if (!currentResponse.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'response',
      content: currentResponse,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentResponse('');
    setIsLoading(true);

    try {
      // Get the last question
      const lastQuestion = messages.filter(m => m.type === 'question').pop();
      const questionText = lastQuestion?.content || "";

      // Generate feedback
      const { content: feedbackContent, score } = await generateFeedback(questionText, currentResponse);
      
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
      setTimeout(async () => {
        const nextQuestion = await generateNextQuestion(currentResponse);
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

                {/* Input */}
                <div className="flex space-x-2">
                  <Textarea
                    placeholder="Type your response here..."
                    value={currentResponse}
                    onChange={(e) => setCurrentResponse(e.target.value)}
                    onKeyPress={handleKeyPress}
                    rows={3}
                    className="resize-none"
                    disabled={isLoading}
                  />
                  <Button 
                    onClick={handleSendResponse}
                    disabled={!currentResponse.trim() || isLoading}
                    className="bg-accent hover:bg-accent/90"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
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
