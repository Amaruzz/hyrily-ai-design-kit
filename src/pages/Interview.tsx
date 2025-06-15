
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import VideoInterviewSession from '@/components/VideoInterviewSession';
import ChatInterviewSession from '@/components/ChatInterviewSession';
import AuthWrapper from '@/components/AuthWrapper';

const Interview = () => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState<'text' | 'video'>('video');
  const { toast } = useToast();

  const startSession = async (type: 'text' | 'video') => {
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
        {sessionType === 'text' ? (
          <ChatInterviewSession 
            sessionId={sessionId}
            onEndSession={endSession}
          />
        ) : (
          <VideoInterviewSession 
            sessionId={sessionId}
            onEndSession={endSession}
          />
        )}
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

          <div className="grid md:grid-cols-2 gap-8">
            {/* Video Interview */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="w-10 h-10 text-purple-500" />
                </div>
                <CardTitle className="text-2xl">Video Interview</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-medium-gray">
                  Experience a fully immersive video interview with live AI interaction, camera, and real-time voice responses.
                </p>
                <div className="space-y-2 text-sm text-medium-gray">
                  <div>✓ Live video with AI interviewer</div>
                  <div>✓ Camera and microphone enabled</div>
                  <div>✓ Real-time speech interaction</div>
                  <div>✓ Adaptive question progression</div>
                  <div>✓ 60-minute session duration</div>
                  <div>✓ Professional interview simulation</div>
                </div>
                <Button 
                  onClick={() => startSession('video')}
                  className="w-full bg-purple-500 hover:bg-purple-600"
                  size="lg"
                >
                  Start Video Interview
                </Button>
              </CardContent>
            </Card>

            {/* Text Interview */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-10 h-10 text-primary" />
                </div>
                <CardTitle className="text-2xl">Text Interview</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-medium-gray">
                  Practice with interactive chat-based interviews. Includes voice recording for text input and real-time scoring.
                </p>
                <div className="space-y-2 text-sm text-medium-gray">
                  <div>✓ Real-time chat interaction</div>
                  <div>✓ Voice recording to text</div>
                  <div>✓ Live scoring (out of 5)</div>
                  <div>✓ Instant feedback</div>
                  <div>✓ Varied question progression</div>
                  <div>✓ Self-paced interaction</div>
                </div>
                <Button 
                  onClick={() => startSession('text')}
                  className="w-full bg-primary hover:bg-primary/90"
                  size="lg"
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
