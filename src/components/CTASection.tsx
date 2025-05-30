
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const CTASection = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center">
          <div className="space-y-4 max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Ready to Transform Your JEE Preparation?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of students who are preparing smarter, not harder. 
              Start your journey toward JEE success today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Link to="/signup">
                <Button size="lg">Create Free Account</Button>
              </Link>
              <Link to="/mock-tests">
                <Button variant="outline" size="lg">Try a Sample Test</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
