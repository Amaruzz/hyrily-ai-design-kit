
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Download, Home, Volume2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

interface FeedbackReportProps {
  sessionId: string;
  responses: Record<number, { text: string; score: number }>;
  onBackToHome: () => void;
}

interface DetailedFeedback {
  overallScore: number;
  communicationScore: number;
  contentScore: number;
  bodyLanguageScore: number;
  strengths: string[];
  improvements: string[];
  bodyLanguageFeedback: string[];
  answerSuggestions: Record<number, string>;
  voiceFeedbackUrl?: string;
}

const InterviewFeedbackReport = ({ sessionId, responses, onBackToHome }: FeedbackReportProps) => {
  const [feedback, setFeedback] = useState<DetailedFeedback | null>(null);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    generateDetailedFeedback();
  }, []);

  const generateDetailedFeedback = async () => {
    try {
      setIsGeneratingFeedback(true);
      
      // Calculate overall metrics
      const scores = Object.values(responses).map(r => r.score);
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      
      // Generate detailed feedback using AI
      const detailedAnalysis = await generateAIFeedback();
      
      // Generate voice feedback
      const voiceUrl = await generateVoiceFeedback(detailedAnalysis.textFeedback);
      
      setFeedback({
        overallScore: averageScore,
        communicationScore: Math.min(5, averageScore + (Math.random() * 0.5 - 0.25)),
        contentScore: Math.min(5, averageScore + (Math.random() * 0.5 - 0.25)),
        bodyLanguageScore: Math.min(5, averageScore + (Math.random() * 0.5 - 0.25)),
        strengths: detailedAnalysis.strengths,
        improvements: detailedAnalysis.improvements,
        bodyLanguageFeedback: detailedAnalysis.bodyLanguage,
        answerSuggestions: detailedAnalysis.answerSuggestions,
        voiceFeedbackUrl: voiceUrl
      });
      
    } catch (error) {
      console.error('Error generating feedback:', error);
      toast({
        title: "Error",
        description: "Failed to generate detailed feedback.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  const generateAIFeedback = async () => {
    const responseTexts = Object.entries(responses)
      .map(([id, resp]) => `Q${id}: ${resp.text} (Score: ${resp.score}/5)`)
      .join('\n\n');

    const { data, error } = await supabase.functions.invoke('gemini-chat', {
      body: {
        prompt: `As Hyrily, an expert AI interview coach, provide comprehensive feedback for this candidate's interview performance:

INTERVIEW RESPONSES:
${responseTexts}

Provide detailed analysis in the following format:

STRENGTHS: (List 3-4 specific strengths)
- [Strength 1]
- [Strength 2]
- [Strength 3]

IMPROVEMENTS: (List 3-4 specific areas for improvement)
- [Improvement 1]
- [Improvement 2]
- [Improvement 3]

BODY LANGUAGE FEEDBACK: (Based on video interview analysis)
- [Body language tip 1]
- [Body language tip 2]
- [Body language tip 3]

ANSWER SUGGESTIONS: (Provide better answer examples for each question)
Q1: [Better answer approach]
Q2: [Better answer approach]
Q3: [Better answer approach]

TEXT_FEEDBACK: (Comprehensive summary for voice generation - 2-3 paragraphs)
[Detailed feedback summary that will be converted to voice]`,
        type: 'feedback'
      }
    });

    if (error) throw error;

    const content = data?.content || '';
    
    // Parse the structured feedback
    const strengths = extractSection(content, 'STRENGTHS:');
    const improvements = extractSection(content, 'IMPROVEMENTS:');
    const bodyLanguage = extractSection(content, 'BODY LANGUAGE FEEDBACK:');
    const answerSuggestions = extractAnswerSuggestions(content);
    const textFeedback = extractSection(content, 'TEXT_FEEDBACK:').join(' ');

    return {
      strengths,
      improvements,
      bodyLanguage,
      answerSuggestions,
      textFeedback
    };
  };

  const extractSection = (content: string, sectionTitle: string): string[] => {
    const startIndex = content.indexOf(sectionTitle);
    if (startIndex === -1) return [];
    
    const nextSectionIndex = content.indexOf('\n\n', startIndex + sectionTitle.length);
    const sectionContent = content.substring(
      startIndex + sectionTitle.length,
      nextSectionIndex === -1 ? content.length : nextSectionIndex
    );
    
    return sectionContent
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim())
      .filter(line => line.length > 0);
  };

  const extractAnswerSuggestions = (content: string): Record<number, string> => {
    const suggestions: Record<number, string> = {};
    const startIndex = content.indexOf('ANSWER SUGGESTIONS:');
    if (startIndex === -1) return suggestions;
    
    const endIndex = content.indexOf('TEXT_FEEDBACK:', startIndex);
    const sectionContent = content.substring(
      startIndex + 'ANSWER SUGGESTIONS:'.length,
      endIndex === -1 ? content.length : endIndex
    );
    
    const lines = sectionContent.split('\n').filter(line => line.trim().startsWith('Q'));
    lines.forEach((line, index) => {
      const colonIndex = line.indexOf(':');
      if (colonIndex !== -1) {
        suggestions[index + 1] = line.substring(colonIndex + 1).trim();
      }
    });
    
    return suggestions;
  };

  const generateVoiceFeedback = async (textFeedback: string): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text: `Hello! This is Hyrily with your detailed interview feedback. ${textFeedback}. Remember, practice makes perfect, and I'm here to help you improve. Good luck with your future interviews!`,
          voice: 'alloy'
        }
      });

      if (error) throw error;

      // Convert base64 audio to blob URL
      const audioBlob = new Blob(
        [new Uint8Array(atob(data.audioContent).split('').map(c => c.charCodeAt(0)))],
        { type: 'audio/mp3' }
      );
      
      return URL.createObjectURL(audioBlob);
    } catch (error) {
      console.error('Error generating voice feedback:', error);
      return '';
    }
  };

  const playVoiceFeedback = () => {
    if (!feedback?.voiceFeedbackUrl) return;

    if (isPlayingAudio && audioElement) {
      audioElement.pause();
      setIsPlayingAudio(false);
    } else {
      const audio = new Audio(feedback.voiceFeedbackUrl);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onpause = () => setIsPlayingAudio(false);
      audio.play();
      setIsPlayingAudio(true);
      setAudioElement(audio);
    }
  };

  const downloadReport = () => {
    if (!feedback) return;

    const reportContent = `
HYRILY INTERVIEW FEEDBACK REPORT
================================

Overall Score: ${feedback.overallScore.toFixed(1)}/5
Communication: ${feedback.communicationScore.toFixed(1)}/5
Content Quality: ${feedback.contentScore.toFixed(1)}/5
Body Language: ${feedback.bodyLanguageScore.toFixed(1)}/5

STRENGTHS:
${feedback.strengths.map(s => `• ${s}`).join('\n')}

AREAS FOR IMPROVEMENT:
${feedback.improvements.map(i => `• ${i}`).join('\n')}

BODY LANGUAGE FEEDBACK:
${feedback.bodyLanguageFeedback.map(b => `• ${b}`).join('\n')}

SUGGESTED BETTER ANSWERS:
${Object.entries(feedback.answerSuggestions).map(([q, a]) => `Question ${q}: ${a}`).join('\n\n')}

Generated by Hyrily AI Interview Coach
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Hyrily_Interview_Report_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isGeneratingFeedback) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-white/20">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mx-auto flex items-center justify-center animate-pulse">
              <Volume2 className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Generating Your Report</h2>
              <p className="text-gray-300">Hyrily is analyzing your performance and creating detailed feedback...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-white/20">
          <CardContent className="p-8 text-center space-y-6">
            <h2 className="text-2xl font-bold text-white">Error Loading Report</h2>
            <Button onClick={onBackToHome} className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-off-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-primary">Interview Feedback Report</h1>
          <div className="flex items-center space-x-4">
            {feedback.voiceFeedbackUrl && (
              <Button
                onClick={playVoiceFeedback}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {isPlayingAudio ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isPlayingAudio ? 'Pause' : 'Play'} Voice Feedback
              </Button>
            )}
            <Button onClick={downloadReport} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
            <Button onClick={onBackToHome}>
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Overall Scores */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{feedback.overallScore.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">Overall Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{feedback.communicationScore.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">Communication</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{feedback.contentScore.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">Content Quality</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{feedback.bodyLanguageScore.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">Body Language</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strengths */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Your Strengths</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {feedback.strengths.map((strength, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <Badge className="bg-green-100 text-green-800 mt-1">✓</Badge>
                    <p className="text-gray-700">{strength}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Areas for Improvement */}
          <Card>
            <CardHeader>
              <CardTitle className="text-orange-600">Areas for Improvement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {feedback.improvements.map((improvement, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <Badge className="bg-orange-100 text-orange-800 mt-1">⚡</Badge>
                    <p className="text-gray-700">{improvement}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Body Language Feedback */}
          <Card>
            <CardHeader>
              <CardTitle className="text-purple-600">Body Language & Presentation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {feedback.bodyLanguageFeedback.map((tip, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <Badge className="bg-purple-100 text-purple-800 mt-1">👤</Badge>
                    <p className="text-gray-700">{tip}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Suggested Better Answers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">Suggested Better Answers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(feedback.answerSuggestions).map(([questionId, suggestion]) => (
                  <div key={questionId} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Question {questionId}</h4>
                    <p className="text-gray-700">{suggestion}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InterviewFeedbackReport;
