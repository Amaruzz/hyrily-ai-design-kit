
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, MessageSquare, ArrowLeft, Code2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import VideoInterviewSession from '@/components/VideoInterviewSession';
import ChatInterviewSession from '@/components/ChatInterviewSession';
import AuthWrapper from '@/components/AuthWrapper';

const Interview = () => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState<'text' | 'video'>('video');
  const { toast } = useToast();
  const navigate = useNavigate();

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
        title: "Frontend Engineer Interview Started",
        description: `Your ${type} interview session for Frontend Engineer position has begun!`,
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
        description: "Your Frontend Engineer session has been saved. Check your dashboard for feedback!",
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
          {/* Back Button */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-primary hover:text-primary/80"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Button>
          </div>

          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Code2 className="w-10 h-10 text-primary" />
              <h1 className="text-4xl font-bold text-primary">
                Frontend Engineer Interview
              </h1>
            </div>
            <p className="text-lg text-medium-gray">
              Practice technical interviews for Frontend Engineer positions with our AI interviewer
            </p>
            <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
              Specialized for Frontend Engineering Roles
            </div>
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
                  Experience a fully immersive video interview with live AI interaction focused on Frontend Engineering skills and challenges.
                </p>
                <div className="space-y-2 text-sm text-medium-gray">
                  <div>✓ Live video with AI interviewer</div>
                  <div>✓ Frontend-specific technical questions</div>
                  <div>✓ React, JavaScript, CSS focus</div>
                  <div>✓ Adaptive question progression</div>
                  <div>✓ 2-minute technical assessment</div>
                  <div>✓ Performance & architecture topics</div>
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
                  Practice with interactive chat-based interviews focusing on Frontend Engineering concepts and problem-solving.
                </p>
                <div className="space-y-2 text-sm text-medium-gray">
                  <div>✓ Real-time chat interaction</div>
                  <div>✓ Voice recording to text</div>
                  <div>✓ Frontend coding discussions</div>
                  <div>✓ Live scoring (out of 5)</div>
                  <div>✓ Technical deep-dive questions</div>
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

          {/* Additional Info */}
          <div className="mt-12 bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-primary mb-4">What to Expect in Your Frontend Engineer Interview</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Technical Skills</h4>
                <p className="text-sm text-medium-gray">Questions about JavaScript, React, CSS, HTML, and modern frontend frameworks.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Problem Solving</h4>
                <p className="text-sm text-medium-gray">Real-world scenarios about performance optimization, debugging, and architecture decisions.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Best Practices</h4>
                <p className="text-sm text-medium-gray">Testing methodologies, accessibility, responsive design, and code quality discussions.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthWrapper>
  );
};

export default Interview;
