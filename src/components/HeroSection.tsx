
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-white py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-5 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="lg:col-span-3 space-y-8">
            <div className="space-y-6">
              <h1 className="text-hero text-primary leading-tight">
                Master Your Interview Skills with{' '}
                <span className="text-accent">AI</span>
              </h1>
              <p className="text-body-lg text-medium-gray max-w-2xl">
                Get personalized feedback and practice with our AI interviewer. 
                Build confidence, improve your responses, and land your dream job 
                with intelligent coaching tailored to your goals.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-dark-gray text-white font-medium px-8 py-4 text-lg h-auto"
                onClick={() => navigate('/interview')}
              >
                Start Free Trial
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-primary text-primary hover:bg-off-white font-medium px-8 py-4 text-lg h-auto"
              >
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="pt-8 space-y-4">
              <p className="text-caption text-medium-gray uppercase tracking-wider">
                Trusted by job seekers at
              </p>
              <div className="flex items-center space-x-8 opacity-60">
                <div className="text-dark-gray font-semibold">Microsoft</div>
                <div className="text-dark-gray font-semibold">Google</div>
                <div className="text-dark-gray font-semibold">Amazon</div>
                <div className="text-dark-gray font-semibold">Apple</div>
              </div>
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="lg:col-span-2">
            <div className="relative">
              {/* AI Interview Mockup */}
              <div className="bg-charcoal rounded-2xl p-8 shadow-card-hover">
                <div className="space-y-6">
                  {/* AI Avatar */}
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center">
                      <div className="w-8 h-8 bg-white rounded-full"></div>
                    </div>
                    <div>
                      <div className="text-white font-semibold">AI Interviewer</div>
                      <div className="text-light-gray text-sm">Professional Coach</div>
                    </div>
                  </div>

                  {/* Question Display */}
                  <div className="bg-dark-gray rounded-lg p-6">
                    <p className="text-white text-body leading-relaxed">
                      "Tell me about a challenging project you worked on and how you overcame the obstacles."
                    </p>
                  </div>

                  {/* Response Indicators */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-light-gray text-sm">Listening for your response...</span>
                    </div>
                    <div className="flex space-x-2">
                      <div className="flex-1 bg-dark-gray h-2 rounded-full overflow-hidden">
                        <div className="bg-accent h-full w-3/4 rounded-full"></div>
                      </div>
                      <span className="text-light-gray text-xs">75%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-white p-4 rounded-lg shadow-card animate-fade-in">
                <div className="text-caption text-medium-gray">Confidence Score</div>
                <div className="text-card-title text-primary font-bold">92%</div>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-white p-4 rounded-lg shadow-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="text-caption text-medium-gray">Sessions Completed</div>
                <div className="text-card-title text-primary font-bold">24</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
