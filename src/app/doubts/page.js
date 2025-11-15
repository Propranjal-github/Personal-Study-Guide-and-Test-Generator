'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader, Trash2, Play, Calendar, User as UserIcon } from 'lucide-react';
import Navbar from '../components/navbar';


export default function QuestionSolver() {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [doubt, setDoubt] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!question.trim() || !doubt.trim()) {
      alert('Please fill in both question and doubt fields');
      return;
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      question: question.trim(),
      doubt: doubt.trim(),
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    const apiUrls = [
      'http://localhost:3002/solve',
      'http://127.0.0.1:3002/solve',
      '/api/solve'
    ];

    let lastError = null;

    for (const url of apiUrls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: question.trim(),
            doubt: doubt.trim()
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          throw new Error(`Expected JSON but received: ${contentType}`);
        }

        const data = await response.json();

        if (data.success) {
          const botMessage = {
            id: Date.now() + 1,
            type: 'bot',
            solution: data.solution,
            videos: data.videos || [],
            timestamp: new Date().toLocaleTimeString()
          };
          setMessages(prev => [...prev, botMessage]);
          setLoading(false);
          setQuestion('');
          setDoubt('');
          return;
        } else {
          throw new Error(data.error || 'Failed to get solution');
        }
      } catch (error) {
        lastError = error;
        if (error.name === 'AbortError') {
          lastError = new Error('Request timeout - server took too long to respond');
        }
        continue;
      }
    }

    const errorMessage = {
      id: Date.now() + 1,
      type: 'error',
      message: `Connection failed. Please ensure Flask server is running on port 3002. Last error: ${lastError.message}`,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, errorMessage]);
    setLoading(false);
  };

  const clearChat = () => {
    setMessages([]);
    setSelectedVideo(null);
    setShowVideoPlayer(false);
  };

  const formatMarkdown = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#FA812F] font-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-gray-800 italic">$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-[#FEF3E2] text-[#FA812F] px-2 py-1 rounded text-sm font-mono border">$1</code>')
      .replace(/###\s(.*)/g, '<h3 class="text-lg font-bold text-[#FA812F] mt-4 mb-2 border-l-4 border-[#FFB22C] pl-3">$1</h3>')
      .replace(/##\s(.*)/g, '<h2 class="text-xl font-bold text-[#FA812F] mt-4 mb-2 border-l-4 border-[#F3C623] pl-3">$1</h2>')
      .replace(/\n\n/g, '</p><p class="mb-3 text-gray-800 leading-relaxed">')
      .replace(/\n/g, '<br/>');
  };

  const handleVideoClick = (video) => {
    setSelectedVideo(video);
    setShowVideoPlayer(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEF3E2] to-white">
      <Navbar/>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-[#FA812F] mb-4">
            JEE Ace <span className="text-[#F3C623]">Question Solver</span>
          </h1>
          <p className="text-lg text-[#FA812F]/80 max-w-2xl mx-auto">
            Get comprehensive solutions with formulas, concepts, and relevant video tutorials
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#FA812F]">Ask a Question</h2>
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    className="p-2 text-gray-500 hover:text-[#FA812F] hover:bg-gray-100 rounded-full transition-colors"
                    title="Clear chat"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Question
                  </label>
                  <textarea
                    ref={textareaRef}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Enter your question here..."
                    className="w-full p-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#FA812F] focus:border-[#FA812F] resize-none bg-gray-50 text-gray-900 placeholder-gray-500"
                    rows="4"
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Doubt
                  </label>
                  <textarea
                    value={doubt}
                    onChange={(e) => setDoubt(e.target.value)}
                    placeholder="What specifically are you confused about?"
                    className="w-full p-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#FA812F] focus:border-[#FA812F] resize-none bg-gray-50 text-gray-900 placeholder-gray-500"
                    rows="3"
                    disabled={loading}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading || !question.trim() || !doubt.trim()}
                  className="w-full bg-[#FA812F] text-white py-3 px-6 rounded-xl font-semibold hover:bg-[#FFB22C] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      Solving...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Get Solution
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Chat Section */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg h-[600px] flex flex-col">
                <div className="bg-gradient-to-r from-[#FA812F] to-[#FFB22C] text-white p-4 rounded-t-2xl">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Bot size={24} />
                    Solution Chat
                  </h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <Bot size={48} className="mx-auto mb-4 text-[#FA812F]/30" />
                        <p className="text-lg">Ask a question to get started!</p>
                        <p className="text-sm mt-2">I'll provide detailed solutions with formulas, concepts, and video tutorials</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.type !== 'user' && (
                          <div className="flex-shrink-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              message.type === 'error' ? 'bg-red-500' : 'bg-[#FA812F]'
                            }`}>
                              <Bot size={16} className="text-white" />
                            </div>
                          </div>
                        )}
                        
                        <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : ''}`}>
                          {message.type === 'user' ? (
                            <div className="bg-[#FA812F] text-white p-4 rounded-2xl rounded-tr-sm">
                              <div className="mb-2">
                                <div className="font-semibold text-sm opacity-90">Question:</div>
                                <div className="mt-1">{message.question}</div>
                              </div>
                              <div>
                                <div className="font-semibold text-sm opacity-90">Doubt:</div>
                                <div className="mt-1">{message.doubt}</div>
                              </div>
                              <div className="text-xs opacity-70 mt-2">{message.timestamp}</div>
                            </div>
                          ) : message.type === 'error' ? (
                            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl rounded-tl-sm">
                              <div className="font-semibold mb-1">Error:</div>
                              <div>{message.message}</div>
                              <div className="text-xs opacity-70 mt-2">{message.timestamp}</div>
                            </div>
                          ) : (
                            <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl rounded-tl-sm">
                              <div 
                                className="prose prose-sm max-w-none text-gray-800"
                                dangerouslySetInnerHTML={{
                                  __html: `<p class="mb-3 text-gray-800 leading-relaxed">${formatMarkdown(message.solution)}</p>`
                                }}
                              />
                              <div className="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-200">
                                {message.timestamp}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {message.type === 'user' && (
                          <div className="flex-shrink-0 order-1">
                            <div className="w-8 h-8 bg-[#F3C623] rounded-full flex items-center justify-center">
                              <User size={16} className="text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  
                  {loading && (
                    <div className="flex gap-3 justify-start">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-[#FA812F] rounded-full flex items-center justify-center">
                          <Bot size={16} className="text-white" />
                        </div>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl rounded-tl-sm">
                        <div className="flex items-center gap-2 text-[#FA812F]">
                          <Loader className="animate-spin" size={16} />
                          Analyzing your question and finding relevant videos...
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Video Section */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg h-[600px] flex flex-col">
                <div className="bg-gradient-to-r from-[#F3C623] to-[#FFB22C] text-white p-4 rounded-t-2xl">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Play size={24} />
                    Related Videos
                  </h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  {showVideoPlayer && selectedVideo ? (
                    <div className="space-y-4">
                      <div className="aspect-video w-full">
                        <iframe
                          src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`}
                          title={selectedVideo.title}
                          className="w-full h-full rounded-xl border"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <h4 className="font-bold text-[#FA812F] mb-2">{selectedVideo.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{selectedVideo.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <UserIcon size={12} />
                            {selectedVideo.channel}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            {formatDate(selectedVideo.publishedAt)}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setShowVideoPlayer(false);
                          setSelectedVideo(null);
                        }}
                        className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                      >
                        Back to Video List
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          <div className="text-center">
                            <Play size={48} className="mx-auto mb-4 text-[#F3C623]/30" />
                            <p className="text-lg">Relevant videos will appear here</p>
                            <p className="text-sm mt-2">Ask a question to see tutorial videos</p>
                          </div>
                        </div>
                      ) : (
                        (() => {
                          const latestBotMessage = messages.filter(m => m.type === 'bot').pop();
                          const videos = latestBotMessage?.videos || [];
                          
                          if (videos.length === 0) {
                            return (
                              <div className="flex items-center justify-center h-full text-gray-500">
                                <div className="text-center">
                                  <Play size={48} className="mx-auto mb-4 text-[#F3C623]/30" />
                                  <p className="text-lg">No videos found</p>
                                  <p className="text-sm mt-2">Try asking a different question</p>
                                </div>
                              </div>
                            );
                          }
                          
                          return videos.map((video, index) => (
                            <div
                              key={video.id}
                              className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200 hover:border-[#FA812F]"
                              onClick={() => handleVideoClick(video)}
                            >
                              <div className="flex gap-3">
                                <div className="relative flex-shrink-0">
                                  <img
                                    src={video.thumbnail}
                                    alt={video.title}
                                    className="w-24 h-18 object-cover rounded-lg"
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                    <Play size={20} className="text-white" />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-[#FA812F] text-sm mb-1 line-clamp-2 leading-tight">
                                    {video.title}
                                  </h4>
                                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                    {video.description}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <UserIcon size={10} />
                                      <span className="truncate max-w-20">{video.channel}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Calendar size={10} />
                                      {formatDate(video.publishedAt)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ));
                        })()
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
          <h3 className="text-xl font-bold text-[#FA812F] mb-4">How it works</h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#FA812F] text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                1
              </div>
              <h4 className="font-semibold text-[#FA812F] mb-2">Enter Question</h4>
              <p className="text-sm text-gray-600">Type your academic question in the question field</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[#FFB22C] text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                2
              </div>
              <h4 className="font-semibold text-[#FA812F] mb-2">Describe Doubt</h4>
              <p className="text-sm text-gray-600">Explain what specifically you're confused about</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[#F3C623] text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                3
              </div>
              <h4 className="font-semibold text-[#FA812F] mb-2">Get Solution</h4>
              <p className="text-sm text-gray-600">Receive detailed solution with formulas and concepts</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[#FA812F]/80 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                4
              </div>
              <h4 className="font-semibold text-[#FA812F] mb-2">Watch Videos</h4>
              <p className="text-sm text-gray-600">Watch relevant tutorial videos to clear your doubts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}