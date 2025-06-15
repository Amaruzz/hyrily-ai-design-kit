
import React from 'react';
import { Button } from '@/components/ui/button';

const Footer = () => {
  return (
    <footer className="bg-charcoal text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="text-2xl font-bold">Hyrily</div>
            <p className="text-light-gray text-body">
              Master your interview skills with AI-powered coaching and personalized feedback.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="sm" className="text-light-gray hover:text-white p-2">
                <div className="w-5 h-5 bg-current rounded"></div>
              </Button>
              <Button variant="ghost" size="sm" className="text-light-gray hover:text-white p-2">
                <div className="w-5 h-5 bg-current rounded"></div>
              </Button>
              <Button variant="ghost" size="sm" className="text-light-gray hover:text-white p-2">
                <div className="w-5 h-5 bg-current rounded"></div>
              </Button>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Product</h4>
            <div className="space-y-2">
              <a href="#" className="block text-light-gray hover:text-white transition-colors">Features</a>
              <a href="#" className="block text-light-gray hover:text-white transition-colors">Pricing</a>
              <a href="#" className="block text-light-gray hover:text-white transition-colors">Enterprise</a>
              <a href="#" className="block text-light-gray hover:text-white transition-colors">API</a>
            </div>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Company</h4>
            <div className="space-y-2">
              <a href="#" className="block text-light-gray hover:text-white transition-colors">About</a>
              <a href="#" className="block text-light-gray hover:text-white transition-colors">Careers</a>
              <a href="#" className="block text-light-gray hover:text-white transition-colors">Press</a>
              <a href="#" className="block text-light-gray hover:text-white transition-colors">Contact</a>
            </div>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Support</h4>
            <div className="space-y-2">
              <a href="#" className="block text-light-gray hover:text-white transition-colors">Help Center</a>
              <a href="#" className="block text-light-gray hover:text-white transition-colors">Documentation</a>
              <a href="#" className="block text-light-gray hover:text-white transition-colors">Community</a>
              <a href="#" className="block text-light-gray hover:text-white transition-colors">Status</a>
            </div>
          </div>
        </div>

        <div className="border-t border-dark-gray mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-light-gray text-body-sm">
            © 2024 Hyrily. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-light-gray hover:text-white text-body-sm transition-colors">Privacy Policy</a>
            <a href="#" className="text-light-gray hover:text-white text-body-sm transition-colors">Terms of Service</a>
            <a href="#" className="text-light-gray hover:text-white text-body-sm transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
