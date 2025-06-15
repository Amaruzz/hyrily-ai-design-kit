
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, ChartBar, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const FeatureSection = () => {
  const navigate = useNavigate();
  
  const features = [
    {
      icon: Play,
      title: "AI-Powered Mock Interviews",
      description: "Practice with our advanced AI interviewer that adapts to your industry and role. Get realistic interview scenarios tailored to your career goals.",
      stats: "10,000+ Questions"
    },
    {
      icon: ChartBar,
      title: "Performance Analytics",
      description: "Track your progress with detailed analytics. Identify strengths, weaknesses, and improvement areas with actionable insights.",
      stats: "Real-time Feedback"
    },
    {
      icon: Settings,
      title: "Personalized Coaching",
      description: "Receive customized coaching based on your performance. Our AI adapts to your learning style and provides targeted recommendations.",
      stats: "95% Success Rate"
    }
  ];

  return (
    <section id="features" className="bg-off-white py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-section text-primary mb-6">
            Everything You Need to{' '}
            <span className="text-accent">Succeed</span>
          </h2>
          <p className="text-body-lg text-medium-gray">
            Our comprehensive platform combines cutting-edge AI technology with proven 
            interview coaching methodologies to give you the competitive edge.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="bg-white border-0 shadow-card hover:shadow-card-hover transition-all duration-300 group cursor-pointer"
            >
              <CardHeader className="space-y-4">
                <div className="w-16 h-16 bg-off-white rounded-lg flex items-center justify-center group-hover:bg-accent transition-colors duration-300">
                  <feature.icon className="w-8 h-8 text-dark-gray group-hover:text-white transition-colors duration-300" />
                </div>
                <CardTitle className="text-card-title text-primary">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-body text-medium-gray leading-relaxed">
                  {feature.description}
                </p>
                <div className="pt-4 border-t border-light-gray">
                  <div className="flex items-center justify-between">
                    <span className="text-caption text-medium-gray uppercase tracking-wider">
                      Key Metric
                    </span>
                    <span className="text-body font-semibold text-accent">
                      {feature.stats}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-4 bg-white px-8 py-4 rounded-full shadow-card">
            <span className="text-body text-medium-gray">Ready to start practicing?</span>
            <div className="w-px h-6 bg-light-gray"></div>
            <Button 
              onClick={() => navigate('/interview')}
              className="text-body font-semibold bg-accent hover:bg-accent/90 text-white"
            >
              Get Started →
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
