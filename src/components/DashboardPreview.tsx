
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Play, ChartBar, Gear } from 'lucide-react';

const DashboardPreview = () => {
  return (
    <section className="bg-white py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-section text-primary mb-6">
            Your Personal Interview{' '}
            <span className="text-accent">Command Center</span>
          </h2>
          <p className="text-body-lg text-medium-gray">
            Track your progress, analyze performance, and access personalized coaching 
            recommendations all from one intuitive dashboard.
          </p>
        </div>

        {/* Dashboard Mockup */}
        <div className="bg-off-white p-4 lg:p-8 rounded-2xl shadow-card-hover">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <div className="lg:w-64 bg-white rounded-xl p-6 shadow-card">
              <div className="space-y-6">
                {/* Profile Section */}
                <div className="flex items-center space-x-3 pb-6 border-b border-light-gray">
                  <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">JD</span>
                  </div>
                  <div>
                    <div className="font-semibold text-primary">John Doe</div>
                    <div className="text-body-sm text-medium-gray">Software Engineer</div>
                  </div>
                </div>

                {/* Navigation Items */}
                <nav className="space-y-2">
                  {[
                    { icon: Home, label: 'Dashboard', active: true },
                    { icon: Play, label: 'Practice Sessions', active: false },
                    { icon: ChartBar, label: 'Analytics', active: false },
                    { icon: Gear, label: 'Settings', active: false },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        item.active 
                          ? 'bg-off-white text-primary' 
                          : 'text-medium-gray hover:text-primary hover:bg-off-white'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-subsection text-primary">Welcome back, John!</h3>
                  <p className="text-body text-medium-gray">Ready for your next practice session?</p>
                </div>
                <Button className="bg-primary hover:bg-dark-gray text-white px-6">
                  Start New Session
                </Button>
              </div>

              {/* Stats Cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: 'Sessions Completed', value: '24', change: '+3 this week' },
                  { label: 'Average Score', value: '8.7/10', change: '+0.5 improvement' },
                  { label: 'Time Practiced', value: '12.5h', change: '+2h this week' },
                ].map((stat, index) => (
                  <Card key={index} className="bg-white border-0 shadow-card">
                    <CardContent className="p-6">
                      <div className="space-y-2">
                        <p className="text-body-sm text-medium-gray">{stat.label}</p>
                        <p className="text-card-title font-bold text-primary">{stat.value}</p>
                        <p className="text-caption text-accent">{stat.change}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Recent Activity */}
              <Card className="bg-white border-0 shadow-card">
                <CardHeader>
                  <CardTitle className="text-card-title text-primary">Recent Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { type: 'Technical Interview', score: 9.2, date: '2 hours ago' },
                      { type: 'Behavioral Questions', score: 8.5, date: 'Yesterday' },
                      { type: 'System Design', score: 7.8, date: '3 days ago' },
                    ].map((session, index) => (
                      <div key={index} className="flex items-center justify-between py-3 border-b border-light-gray last:border-b-0">
                        <div>
                          <p className="font-medium text-primary">{session.type}</p>
                          <p className="text-body-sm text-medium-gray">{session.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-accent">{session.score}/10</p>
                          <p className="text-body-sm text-medium-gray">Score</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardPreview;
