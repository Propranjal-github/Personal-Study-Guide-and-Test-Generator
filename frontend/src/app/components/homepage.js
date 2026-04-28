'use client';

import { useEffect, useRef } from "react";
import Script from "next/script";
import Navbar from "./navbar";


export default function Homepage() {
  const vantaRef = useRef(null);

  useEffect(() => {
    const loadVanta = () => {
      if (
        typeof window.VANTA !== "undefined" &&
        typeof window.THREE !== "undefined" &&
        !window.vantaEffect &&
        vantaRef.current
      ) {
        window.vantaEffect = window.VANTA.GLOBE({
          el: vantaRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 1.0,
          scaleMobile: 1.0,
          color: 0xF3C623,
          color2: 0xFFB22C,
          backgroundColor: "white"
        });
      }
    };

    if (typeof window !== "undefined") {
      if (window.VANTA && window.THREE) {
        loadVanta();
      } else {
        // Load three.js first if not present
        if (!window.THREE) {
          const threeScript = document.createElement("script");
          threeScript.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js";
          threeScript.onload = () => {
            // Now load VANTA
            const vantaScript = document.createElement("script");
            vantaScript.src = "https://cdnjs.cloudflare.com/ajax/libs/vanta/0.5.24/vanta.globe.min.js";
            vantaScript.onload = loadVanta;
            document.body.appendChild(vantaScript);
          };
          document.body.appendChild(threeScript);
        } else {
          // Only load VANTA if three.js is already present
          const vantaScript = document.createElement("script");
          vantaScript.src = "https://cdnjs.cloudflare.com/ajax/libs/vanta/0.5.24/vanta.globe.min.js";
          vantaScript.onload = loadVanta;
          document.body.appendChild(vantaScript);
        }
      }
    }

    return () => {
      if (window.vantaEffect) {
        window.vantaEffect.destroy();
        window.vantaEffect = null;
      }
    };
  }, []);

  return (
    <>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js" strategy="beforeInteractive" />
      
      <div
        ref={vantaRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: -1,
          width: "100vw",
          height: "100vh",
        }}
      />
      
      <div style={{ position: "relative", zIndex: 1 }}>
        <Navbar />
        
        <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
          <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-[#FA812F] mb-6 leading-tight">
            Innovation Meets
            <span className="block text-[#F3C623]">Excellence</span>
          </h1>
          <p className="text-xl md:text-2xl text-[#FA812F]/80 mb-8 max-w-2xl mx-auto">
            Transform your digital presence with cutting-edge solutions that drive results and inspire growth
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-[#FA812F] text-[#FEF3E2] px-8 py-4 rounded-full text-lg font-semibold hover:bg-[#FFB22C] transition-all transform hover:scale-105">
              <a href="/mockTests">Start Your Journey</a>
            </button>
            
          </div>
        </div>
        </section>

        <section id="features" className="py-20 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-[#FA812F] mb-6">
                Master JEE with JEE Ace
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Create custom tests, practice extensively, and track your progress to ace JEE Main & Advanced
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:shadow-xl transition-all transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-[#FA812F] rounded-full flex items-center justify-center mb-6">
                  <div className="w-8 h-8 bg-white rounded"></div>
                </div>
                <h3 className="text-2xl font-bold text-[#FA812F] mb-4">Custom Test Creation</h3>
                <p className="text-gray-600 leading-relaxed">
                  Build personalized tests with questions from Physics, Chemistry, and Mathematics. Choose difficulty levels and topics that match your preparation needs.
                </p>
              </div>
              
              <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:shadow-xl transition-all transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-[#FFB22C] rounded-full flex items-center justify-center mb-6">
                  <div className="w-8 h-8 bg-white rounded-full"></div>
                </div>
                <h3 className="text-2xl font-bold text-[#FA812F] mb-4">Practice Tests</h3>
                <p className="text-gray-600 leading-relaxed">
                  Access thousands of JEE-pattern questions with detailed solutions. Practice with timed mock tests that simulate the actual exam environment.
                </p>
              </div>
              
              <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:shadow-xl transition-all transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-[#F3C623] rounded-full flex items-center justify-center mb-6">
                  <div className="w-8 h-8 bg-white rounded-full"></div>
                </div>
                <h3 className="text-2xl font-bold text-[#FA812F] mb-4">Performance Analytics</h3>
                <p className="text-gray-600 leading-relaxed">
                  Track your progress with detailed analytics, identify weak areas, and get personalized recommendations to improve your JEE preparation strategy.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="py-20 px-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-[#FA812F] mb-6">
                  Why Choose JEE Ace?
                </h2>
                <p className="text-xl text-gray-700 mb-6 leading-relaxed">
                  JEE Ace is designed by experts who understand the challenges of JEE preparation. 
                  Our platform combines the flexibility of custom test creation with comprehensive practice materials.
                </p>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  Whether you&apos;re starting your JEE journey or in the final stretch, our adaptive learning system 
                  helps you focus on what matters most for your success.
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#FA812F] mb-2">50,000+</div>
                    <div className="text-gray-600">Practice Questions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#FA812F] mb-2">15,000+</div>
                    <div className="text-gray-600">Students Enrolled</div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-[#FA812F] to-[#FFB22C] p-8 rounded-3xl shadow-2xl">
                  <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl">
                    <h3 className="text-2xl font-bold text-[#FA812F] mb-4">Start Your JEE Journey</h3>
                    <p className="text-gray-700 leading-relaxed mb-6">
                      Join thousands of students who have improved their JEE scores with our personalized approach to test preparation.
                    </p>
                    <button className="bg-[#FA812F] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#FFB22C] transition-colors w-full">
                      <a href="/mockTests">Get Started Today</a>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="bg-[#FA812F] text-white py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="text-2xl font-bold mb-4">JEE Ace</div>
                <p className="text-white/80 leading-relaxed">
                  Empowering JEE aspirants with personalized test preparation and comprehensive practice materials.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Features</h4>
                <ul className="space-y-2 text-white/80">
                  <li>Custom Tests</li>
                  <li>Practice Questions</li>
                  <li>Mock Exams</li>
                  <li>Performance Analytics</li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Subjects</h4>
                <ul className="space-y-2 text-white/80">
                  <li>Physics</li>
                  <li>Chemistry</li>
                  <li>Mathematics</li>
                  <li>All Topics</li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-white/80">
                  <li>Help Center</li>
                  <li>Study Tips</li>
                  <li>Contact Us</li>
                  <li>FAQ</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-white/20 mt-8 pt-8 text-center">
              <p className="text-white/60">
                © 2025 JEE Ace. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}