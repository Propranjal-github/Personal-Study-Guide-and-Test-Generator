
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogIn, Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <div className="rounded-full bg-primary p-1">
              <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">JA</div>
            </div>
            <span className="font-semibold tracking-tight text-xl">JEE Ace</span>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">Dashboard</Link>
          <Link to="/mock-tests" className="text-sm font-medium hover:text-primary transition-colors">Mock Tests</Link>
          <Link to="/question-bank" className="text-sm font-medium hover:text-primary transition-colors">Question Bank</Link>
          <Link to="/notes" className="text-sm font-medium hover:text-primary transition-colors">Quick Notes</Link>
          <Link to="/leaderboard" className="text-sm font-medium hover:text-primary transition-colors">Leaderboard</Link>
        </nav>
        
        <div className="hidden md:flex items-center gap-4">
          <Link to="/login">
            <Button variant="outline" size="sm" className="gap-2">
              <LogIn className="h-4 w-4" />
              <span>Login</span>
            </Button>
          </Link>
          <Link to="/signup">
            <Button size="sm">Sign Up</Button>
          </Link>
        </div>
        
        {/* Mobile Menu Button */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2"
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      
      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden py-4 px-6 border-t">
          <nav className="flex flex-col space-y-4">
            <Link to="/dashboard" className="text-sm font-medium hover:text-primary" onClick={() => setIsMenuOpen(false)}>
              Dashboard
            </Link>
            <Link to="/mock-tests" className="text-sm font-medium hover:text-primary" onClick={() => setIsMenuOpen(false)}>
              Mock Tests
            </Link>
            <Link to="/question-bank" className="text-sm font-medium hover:text-primary" onClick={() => setIsMenuOpen(false)}>
              Question Bank
            </Link>
            <Link to="/notes" className="text-sm font-medium hover:text-primary" onClick={() => setIsMenuOpen(false)}>
              Quick Notes
            </Link>
            <Link to="/leaderboard" className="text-sm font-medium hover:text-primary" onClick={() => setIsMenuOpen(false)}>
              Leaderboard
            </Link>
            <div className="pt-2 flex flex-col gap-2">
              <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                <Button variant="outline" className="w-full gap-2">
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </Button>
              </Link>
              <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full">Sign Up</Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
