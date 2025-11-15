"use client";
import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../lib/firebase-config";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import Navbar from "../components/navbar";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    resetMessages();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/mockTests");
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setError("No user found with this email.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else {
        setError("Login failed. Please try again.");
      }
    }
  };

  const handleGoogleLogin = async () => {
    resetMessages();
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push("/mockTests");
    } catch {
      setError("Google login failed. Please try again.");
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    resetMessages();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setSuccess("Account created successfully! You can now log in.");
      setEmail("");
      setPassword("");
      setIsLogin(true);
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please log in.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else {
        setError("Sign up failed. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-white font-poppins">
      <Navbar />
      <div className="flex flex-col lg:flex-row min-h-screen">
        <div className="flex-1 bg-white flex items-center justify-center px-8 py-16 lg:py-24">
          <div className="max-w-2xl text-center lg:text-left">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Master Your
              <span className="bg-gradient-to-r from-[#FA812F] to-[#F3C623] bg-clip-text text-transparent"> JEE Journey</span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Your Ultimate Destination for IIT JEE Preparation
            </p>

            <div className="space-y-4 text-gray-700">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#FA812F] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p>Comprehensive mock tests for Physics, Chemistry & Mathematics</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#F3C623] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p>Detailed performance analysis and rank predictions</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#FA812F] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p>Expert solutions and personalized study recommendations</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="lg:w-1/2 bg-yellow-300/20 flex items-center justify-center p-10">
          <div className="w-full max-w-md space-y-6">
            <h2 className="text-3xl font-bold text-[#FA812F]">
              {isLogin ? "Login to Your Account" : "Create a New Account"}
            </h2>
            {error && <p className="text-red-300 text-sm">{error}</p>}
            {success && <p className="text-green-300 text-sm">{success}</p>}

            <form
              onSubmit={isLogin ? handleEmailLogin : handleSignUp}
              className="space-y-4"
            >
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-yellow-600 bg-yellow-50 focus:ring-2 focus:ring-[#FA812F] focus:outline-none placeholder-gray-600"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-yellow-600 bg-yellow-50 focus:ring-2 focus:ring-[#FA812F] focus:outline-none placeholder-gray-600"
              />
              <button
                type="submit"
                className={`w-full py-3 rounded-xl font-semibold transition ${isLogin
                    ? "bg-[#FA812F] hover:bg-orange-600 text-white"
                    : "bg-[#F3C623] hover:bg-yellow-500 text-gray-800"
                  }`}
              >
                {isLogin ? "Login" : "Sign Up"}
              </button>
            </form>

            <div className="flex items-center justify-center gap-4">
              <div className="flex-1 h-px bg-yellow-600" />
              <span className="text-[#FA812F] text-sm">OR</span>
              <div className="flex-1 h-px bg-yellow-600" />
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full py-3 flex items-center justify-center rounded-xl border border-yellow-600 bg-white hover:bg-yellow-50 transition text-gray-800"
            >
              <FcGoogle className="text-xl mr-3" />
              Continue with Google
            </button>

            <p className="text-center text-sm text-[#FA812F]">
              {isLogin ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    onClick={() => {
                      resetMessages();
                      setIsLogin(false);
                    }}
                    className="text-[#F3C623] font-semibold hover:underline"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => {
                      resetMessages();
                      setIsLogin(true);
                    }}
                    className="text-[#F3C623] font-semibold hover:underline"
                  >
                    Log In
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}