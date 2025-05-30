
import React from 'react';

const testimonials = [
  {
    quote: "The AI-powered mock tests helped me identify my weak areas in physical chemistry and coordinate geometry. After focusing on those topics, my scores improved by 20%.",
    author: "Rahul Kumar",
    title: "JEE 2023 - AIR 1245",
    avatar: "RK"
  },
  {
    quote: "The last-minute notes and formula sheets were lifesavers! I could quickly review key concepts right before the exam, which helped me solve problems faster.",
    author: "Priya Sharma",
    title: "JEE 2023 - AIR 2367",
    avatar: "PS"
  },
  {
    quote: "The question tagging system helped me focus on high-difficulty problems. The detailed step-by-step solutions were incredibly helpful for complex concepts.",
    author: "Arjun Singh",
    title: "JEE 2023 - AIR 879",
    avatar: "AS"
  }
];

const TestimonialSection = () => {
  return (
    <section className="py-16 md:py-24 bg-muted/50">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Success Stories from <span className="text-primary">JEE Toppers</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Hear from students who transformed their JEE preparation with our platform
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="bg-card p-6 rounded-lg border shadow-sm flex flex-col h-full"
            >
              <div className="mb-4">
                <svg className="h-6 w-6 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>
              <p className="text-md mb-6 flex-grow">{testimonial.quote}</p>
              <div className="flex items-center mt-4">
                <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-medium">
                  {testimonial.avatar}
                </div>
                <div className="ml-3">
                  <p className="font-medium">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;
