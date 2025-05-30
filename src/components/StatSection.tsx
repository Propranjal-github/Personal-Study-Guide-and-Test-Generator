
import React from 'react';

const StatSection = () => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-r from-primary-700 via-primary-600 to-primary-500 text-white">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Trusted by JEE Aspirants Nationwide
          </h2>
          <p className="text-lg text-primary-100 max-w-3xl mx-auto">
            Our platform is helping thousands of students achieve their dream of cracking JEE
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="p-6">
            <div className="text-4xl md:text-5xl font-bold mb-2">10K+</div>
            <p className="text-primary-100">Active Students</p>
          </div>
          <div className="p-6">
            <div className="text-4xl md:text-5xl font-bold mb-2">500+</div>
            <p className="text-primary-100">Mock Tests</p>
          </div>
          <div className="p-6">
            <div className="text-4xl md:text-5xl font-bold mb-2">15K+</div>
            <p className="text-primary-100">Questions</p>
          </div>
          <div className="p-6">
            <div className="text-4xl md:text-5xl font-bold mb-2">89%</div>
            <p className="text-primary-100">Success Rate</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatSection;
