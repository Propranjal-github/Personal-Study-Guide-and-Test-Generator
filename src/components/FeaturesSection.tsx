
import React from 'react';
import { Book, Calendar, Layout, FileText, GraduationCap, Star } from 'lucide-react';

const features = [
  {
    title: "Adaptive Mock Tests",
    description: "Full-length JEE-style tests with intelligent question selection based on your performance.",
    icon: Calendar,
  },
  {
    title: "Personalized Dashboard",
    description: "Track your progress, identify strengths and weaknesses, and get AI-generated study plans.",
    icon: Layout,
  },
  {
    title: "Comprehensive Question Bank",
    description: "Thousands of JEE questions with detailed solutions and difficulty ratings.",
    icon: Book,
  },
  {
    title: "Last-Minute Notes",
    description: "Concise revision notes and formula sheets for quick review before exams.",
    icon: FileText,
  },
  {
    title: "Performance Analytics",
    description: "Detailed insights into your performance by subject, topic, and difficulty level.",
    icon: GraduationCap,
  },
  {
    title: "Peer Comparison",
    description: "See how you rank against other JEE aspirants and track your improvements.",
    icon: Star,
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Everything You Need to <span className="text-primary">Crack JEE</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Our platform combines comprehensive study materials with advanced analytics and AI-driven 
            recommendations to give you the edge in your JEE preparation.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="feature-card bg-card"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
