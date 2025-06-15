
-- Core tables for Hyrily interview system

-- Interview Questions Table
CREATE TABLE public.interview_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text TEXT NOT NULL,
    industry VARCHAR(100),
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    question_type VARCHAR(50), -- behavioral, technical, situational
    tags TEXT[], -- for filtering and search
    expected_answer_framework TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Sessions Table
CREATE TABLE public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_type VARCHAR(50), -- voice, text, video
    questions_asked UUID[],
    responses JSONB,
    scores JSONB,
    feedback JSONB,
    duration_minutes INTEGER,
    status VARCHAR(20) DEFAULT 'active', -- active, completed, paused
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Performance Analytics Table
CREATE TABLE public.user_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_category VARCHAR(100),
    current_score DECIMAL(5,2),
    improvement_rate DECIMAL(5,2),
    sessions_completed INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Feedback Templates
CREATE TABLE public.feedback_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(100),
    score_range VARCHAR(20), -- 1-2, 3-3.5, 4-5
    positive_feedback TEXT[],
    improvement_suggestions TEXT[],
    follow_up_questions TEXT[]
);

-- Enable Row Level Security
ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_sessions
CREATE POLICY "Users can view their own sessions" 
  ON public.user_sessions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions" 
  ON public.user_sessions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" 
  ON public.user_sessions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- RLS Policies for user_performance
CREATE POLICY "Users can view their own performance" 
  ON public.user_performance 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own performance" 
  ON public.user_performance 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Public read access for questions and feedback templates
CREATE POLICY "Anyone can read interview questions" 
  ON public.interview_questions 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can read feedback templates" 
  ON public.feedback_templates 
  FOR SELECT 
  USING (true);

-- Insert sample interview questions
INSERT INTO public.interview_questions (question_text, industry, difficulty_level, question_type, tags, expected_answer_framework) VALUES
('Tell me about yourself and your background.', 'general', 2, 'behavioral', ARRAY['introduction', 'background'], 'STAR'),
('Describe a challenging situation you faced at work and how you handled it.', 'general', 3, 'behavioral', ARRAY['problem-solving', 'leadership'], 'STAR'),
('Where do you see yourself in 5 years?', 'general', 2, 'behavioral', ARRAY['career-goals', 'planning'], 'Goal-oriented response'),
('Why are you interested in this position?', 'general', 2, 'behavioral', ARRAY['motivation', 'company-fit'], 'Research-based answer'),
('What is your greatest strength?', 'general', 2, 'behavioral', ARRAY['self-awareness', 'strengths'], 'Specific examples'),
('Describe a time when you had to work with a difficult team member.', 'general', 3, 'behavioral', ARRAY['teamwork', 'conflict-resolution'], 'STAR'),
('How do you handle stress and pressure?', 'general', 3, 'behavioral', ARRAY['stress-management', 'resilience'], 'Coping strategies'),
('Tell me about a project you led from start to finish.', 'general', 4, 'behavioral', ARRAY['leadership', 'project-management'], 'STAR'),
('What motivates you in your work?', 'general', 2, 'behavioral', ARRAY['motivation', 'values'], 'Personal drivers'),
('Describe a time when you failed and what you learned from it.', 'general', 4, 'behavioral', ARRAY['failure', 'learning', 'growth'], 'STAR');

-- Insert feedback templates
INSERT INTO public.feedback_templates (category, score_range, positive_feedback, improvement_suggestions, follow_up_questions) VALUES
('communication', '4-5', 
 ARRAY['Clear and articulate communication', 'Good eye contact and confidence', 'Well-structured responses'],
 ARRAY['Continue practicing storytelling', 'Work on conciseness'],
 ARRAY['Can you elaborate on that point?', 'What would you do differently?']),
('problem-solving', '3-4', 
 ARRAY['Logical approach to challenges', 'Good analytical thinking'],
 ARRAY['Provide more specific examples', 'Include measurable outcomes'],
 ARRAY['What tools did you use?', 'How did you measure success?']),
('leadership', '2-3', 
 ARRAY['Shows potential for leadership'],
 ARRAY['Develop more leadership examples', 'Focus on team impact', 'Quantify results'],
 ARRAY['How did you motivate your team?', 'What was the outcome?']);
