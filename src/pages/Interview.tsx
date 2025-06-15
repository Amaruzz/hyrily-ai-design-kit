
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Play, Pause, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import InterviewSession from '@/components/InterviewSession';
import AuthWrapper from '@/components/AuthWrapper';

const Interview = () => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState<'voice' | 'text'>('voice');
  const { toast } = useToast();

  const startSession = async (type: 'voice' | 'text') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to start an interview session.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: user.id,
          session_type: type,
          status: 'active',
          questions_asked: [],
          responses: {},
          scores: {},
          feedback: {}
        })
        .select()
        .single();

      if (error) throw error;

      setSessionId(data.id);
      setSessionType(type);
      setIsSessionActive(true);
      
      toast({
        title: "Interview Started",
        description: `Your ${type} interview session has begun!`,
      });
    } catch (error) {
      console.error('Error starting session:', error);
      toast({
        title: "Error",
        description: "Failed to start interview session.",
        variant: "destructive",
      });
    }
  };

  const endSession = async () => {
    if (!sessionId) return;

    try {
      await supabase
        .from('user_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      setIsSessionActive(false);
      setSessionId(null);
      
      toast({
        title: "Interview Completed",
        description: "Your session has been saved. Check your dashboard for feedback!",
      });
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  if (isSessionActive && sessionId) {
    return (
      <AuthWrapper>
        <InterviewSession 
          sessionId={sessionId}
          sessionType={sessionType}
          onEndSession={endSession}
        />
      </AuthWrapper>
    );
  }

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-off-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-4">
              AI Interview Practice
            </h1>
            <p className="text-lg text-medium-gray">
              Choose your interview format and start practicing with our AI interviewer
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Voice Interview */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mic className="w-8 h-8 text-accent" />
                </div>
                <CardTitle className="text-xl">Voice Interview</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-medium-gray">
                  Practice with real-time voice conversations. Get immediate feedback on your speaking pace, clarity, and confidence.
                </p>
                <div className="space-y-2 text-sm text-medium-gray">
                  <div>✓ Real-time voice interaction</div>
                  <div>✓ Speech analysis & feedback</div>
                  <div>✓ Natural conversation flow</div>
                </div>
                <Button 
                  onClick={() => startSession('voice')}
                  className="w-full bg-accent hover:bg-accent/90"
                >
                  Start Voice Interview
                </Button>
              </CardContent>
            </Card>

            {/* Text Interview */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Text Interview</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-medium-gray">
                  Practice with text-based questions. Perfect for preparing your thoughts and structuring responses.
                </p>
                <div className="space-y-2 text-sm text-medium-gray">
                  <div>✓ Structured question format</div>
                  <div>✓ Time to think & respond</div>
                  <div>✓ Detailed written feedback</div>
                </div>
                <Button 
                  onClick={() => startSession('text')}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Start Text Interview
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthWrapper>
  );
};

export default Interview;
