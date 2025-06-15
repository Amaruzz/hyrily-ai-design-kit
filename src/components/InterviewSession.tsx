
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Send, StopCircle, Volume2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import VoiceRecorder from '@/components/VoiceRecorder';

interface InterviewSessionProps {
  sessionId: string;
  sessionType: 'voice' | 'text';
  onEndSession: () => void;
}

interface Question {
  id: string;
  question_text: string;
  difficulty_level: number;
  question_type: string;
  tags: string[];
}

const InterviewSession = ({ sessionId, sessionType, onEndSession }: InterviewSessionProps) => {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [response, setResponse] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('interview_questions')
        .select('*')
        .limit(5)
        .order('difficulty_level');

      if (error) throw error;

      setQuestions(data || []);
      if (data && data.length > 0) {
        setCurrentQuestion(data[0]);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      toast({
        title: "Error",
        description: "Failed to load interview questions.",
        variant: "destructive",
      });
    }
  };

  const saveResponse = async () => {
    if (!currentQuestion || !response.trim()) return;

    try {
      const newResponses = { ...responses, [currentQuestion.id]: response };
      setResponses(newResponses);

      // Update session with new response
      const questionsAsked = questions.slice(0, currentIndex + 1).map(q => q.id);
      
      await supabase
        .from('user_sessions')
        .update({
          questions_asked: questionsAsked,
          responses: newResponses
        })
        .eq('id', sessionId);

      // Generate AI feedback (simplified for now)
      const feedback = generateFeedback(response);
      
      setResponse('');
      
      // Move to next question
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setCurrentQuestion(questions[currentIndex + 1]);
      } else {
        // Interview complete
        toast({
          title: "Interview Complete!",
          description: "You've answered all questions. Great job!",
        });
        onEndSession();
      }
    } catch (error) {
      console.error('Error saving response:', error);
      toast({
        title: "Error",
        description: "Failed to save your response.",
        variant: "destructive",
      });
    }
  };

  const generateFeedback = (responseText: string) => {
    // Simple feedback generation - in production, this would use AI
    const wordCount = responseText.split(' ').length;
    const hasSTAR = responseText.toLowerCase().includes('situation') || 
                   responseText.toLowerCase().includes('task') ||
                   responseText.toLowerCase().includes('action') ||
                   responseText.toLowerCase().includes('result');
    
    return {
      score: wordCount > 50 ? (hasSTAR ? 4.5 : 3.5) : 2.5,
      feedback: wordCount > 50 
        ? "Good detailed response!" 
        : "Try to provide more specific examples and details.",
      suggestions: hasSTAR 
        ? ["Great use of structured approach!"] 
        : ["Consider using the STAR method (Situation, Task, Action, Result)"]
    };
  };

  const handleVoiceResponse = (audioBlob: Blob) => {
    // Handle voice response - would transcribe audio in production
    setResponse("Voice response recorded - transcription would happen here");
  };

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-medium-gray">Loading interview questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-off-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-primary">
              {sessionType === 'voice' ? 'Voice' : 'Text'} Interview Session
            </h1>
            <Button variant="outline" onClick={onEndSession}>
              <StopCircle className="w-4 h-4 mr-2" />
              End Session
            </Button>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-medium-gray">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <div className="flex-1 bg-light-gray rounded-full h-2">
              <div 
                className="bg-accent h-2 rounded-full transition-all"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Interview Question</CardTitle>
              <div className="flex space-x-2">
                <Badge variant="secondary">
                  {currentQuestion.question_type}
                </Badge>
                <Badge variant="outline">
                  Level {currentQuestion.difficulty_level}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-dark-gray mb-4">
              {currentQuestion.question_text}
            </p>
            <div className="flex flex-wrap gap-2">
              {currentQuestion.tags?.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Response Section */}
        <Card>
          <CardHeader>
            <CardTitle>Your Response</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sessionType === 'voice' ? (
              <VoiceRecorder 
                onAudioReady={handleVoiceResponse}
                isRecording={isRecording}
                setIsRecording={setIsRecording}
              />
            ) : (
              <Textarea
                placeholder="Type your response here..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={6}
                className="resize-none"
              />
            )}
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-medium-gray">
                {response.length > 0 && (
                  <span>{response.split(' ').length} words</span>
                )}
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setResponse('')}>
                  Clear
                </Button>
                <Button 
                  onClick={saveResponse}
                  disabled={!response.trim()}
                  className="bg-accent hover:bg-accent/90"
                >
                  {sessionType === 'voice' ? (
                    <>
                      <Volume2 className="w-4 h-4 mr-2" />
                      Submit Response
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Response
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InterviewSession;
