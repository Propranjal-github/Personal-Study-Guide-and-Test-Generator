
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-primary-700 via-primary-600 to-primary-500 py-20 md:py-32 text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent"></div>
        <div className="h-full w-full bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      </div>
      
      <div className="container relative z-10 px-4 md:px-6">
        <div className="grid gap-12 md:grid-cols-2 md:gap-8 items-center">
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Ace Your JEE with <br />
              <span className="text-accent">AI-Powered</span> Prep
            </h1>
            <p className="text-lg md:text-xl text-primary-100 max-w-[600px]">
              Personalized test preparation with adaptive learning, detailed analytics, 
              and comprehensive study materials to maximize your JEE score.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <Link to="/signup">
                <Button size="lg" className="bg-white text-primary hover:bg-primary-50">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/mock-tests">
                <Button size="lg" variant="outline" className="border-white text-primary">
                  Explore Mock Tests
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-primary-100">
              Join 10,000+ JEE aspirants already preparing smarter
            </p>
          </div>
          <div className="relative mx-auto max-w-sm md:max-w-none">
            <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="font-medium">Physics Mock Test</div>
                  <div className="text-xs px-2 py-1 bg-accent rounded-full">Live</div>
                </div>
                <div className="space-y-3">
                  <div className="h-10 bg-white/20 rounded-md"></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-6 bg-white/20 rounded-md"></div>
                    <div className="h-6 bg-white/20 rounded-md"></div>
                    <div className="h-6 bg-white/20 rounded-md"></div>
                    <div className="h-6 bg-white/20 rounded-md"></div>
                  </div>
                  <div className="h-24 bg-white/20 rounded-md"></div>
                  <div className="flex justify-between">
                    <div className="w-24 h-8 bg-white/20 rounded-md"></div>
                    <div className="w-24 h-8 bg-accent/80 rounded-md"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 h-40 w-40 blur-3xl rounded-full bg-secondary-500/30"></div>
            <div className="absolute -top-4 -left-4 h-40 w-40 blur-3xl rounded-full bg-accent/30"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
