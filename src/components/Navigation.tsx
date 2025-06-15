
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-light-gray shadow-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="text-2xl font-bold text-primary">
              Hyrily
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-dark-gray hover:text-primary transition-colors font-medium">
              Features
            </a>
            <a href="#pricing" className="text-dark-gray hover:text-primary transition-colors font-medium">
              Pricing
            </a>
            <a href="#about" className="text-dark-gray hover:text-primary transition-colors font-medium">
              About
            </a>
            <a href="#contact" className="text-dark-gray hover:text-primary transition-colors font-medium">
              Contact
            </a>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button 
              variant="ghost" 
              className="text-dark-gray hover:text-primary"
              onClick={() => navigate('/interview')}
            >
              Login
            </Button>
            <Button 
              className="bg-primary hover:bg-dark-gray text-white font-medium px-6"
              onClick={() => navigate('/interview')}
            >
              Start Free Trial
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={toggleMenu}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-light-gray bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="#features" className="block px-3 py-2 text-dark-gray hover:text-primary font-medium">
                Features
              </a>
              <a href="#pricing" className="block px-3 py-2 text-dark-gray hover:text-primary font-medium">
                Pricing
              </a>
              <a href="#about" className="block px-3 py-2 text-dark-gray hover:text-primary font-medium">
                About
              </a>
              <a href="#contact" className="block px-3 py-2 text-dark-gray hover:text-primary font-medium">
                Contact
              </a>
              <div className="pt-4 pb-2 space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-dark-gray"
                  onClick={() => navigate('/interview')}
                >
                  Login
                </Button>
                <Button 
                  className="w-full bg-primary hover:bg-dark-gray text-white"
                  onClick={() => navigate('/interview')}
                >
                  Start Free Trial
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
