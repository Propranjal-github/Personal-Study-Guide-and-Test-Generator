"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../lib/firebase-config";
import { onAuthStateChanged } from "firebase/auth";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import Navbar from "../components/navbar";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState("all");
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (!currentUser) router.push('/login');
    });
    return () => unsubscribe();
  }, [router]);
  const fetchTestResults = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/api/user-test-results/${user.uid}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${await user.getIdToken()}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTestResults(data.results || []);
      }
    } catch (error) {
      console.error('Error fetching test results:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getFilteredResults = () => {
    if (selectedTimeRange === "all") return testResults;
    
    const now = new Date();
    const filterDate = new Date();
    const days = { "7days": 7, "30days": 30, "90days": 90 }[selectedTimeRange];
    filterDate.setDate(now.getDate() - days);
    
    return testResults.filter(result => new Date(result.completedAt) >= filterDate);
  };

  useEffect(() => {
    if (!authLoading && user) fetchTestResults();
  }, [fetchTestResults, authLoading, user]);

  
  const getStats = () => {
    const filtered = getFilteredResults();
    if (!filtered.length) return null;

    const totalTests = filtered.length;
    const totalQuestions = filtered.reduce((sum, test) => sum + test.totalQuestions, 0);
    const totalCorrect = filtered.reduce((sum, test) => sum + test.results.score, 0);
    const avgScore = ((totalCorrect / totalQuestions) * 100).toFixed(1);
    const avgTime = Math.round(filtered.reduce((sum, test) => sum + test.timeTaken, 0) / totalTests / 60);

    return { totalTests, avgScore, avgTime, totalQuestions };
  };

  const getChartData = () => {
    const filtered = getFilteredResults();
    
    // Performance trend
    const performanceTrend = filtered.map((test, index) => ({
      name: `T${index + 1}`,
      score: parseFloat(test.results.percentage),
    }));

    // Subject performance
    const subjectData = {};
    filtered.forEach(test => {
      if (test.results.subjectWiseResults) {
        Object.entries(test.results.subjectWiseResults).forEach(([subject, data]) => {
          if (!subjectData[subject]) subjectData[subject] = { total: 0, correct: 0 };
          subjectData[subject].total += data.total;
          subjectData[subject].correct += data.correct;
        });
      }
    });

    const subjectPerformance = Object.entries(subjectData).map(([subject, data]) => ({
      subject: subject.slice(0, 4), // Shortened for chart
      score: ((data.correct / data.total) * 100).toFixed(1),
    }));

    // Score distribution
    const scoreRanges = { "90-100": 0, "80-89": 0, "70-79": 0, "60-69": 0, "<60": 0 };
    filtered.forEach(test => {
      const score = parseFloat(test.results.percentage);
      if (score >= 90) scoreRanges["90-100"]++;
      else if (score >= 80) scoreRanges["80-89"]++;
      else if (score >= 70) scoreRanges["70-79"]++;
      else if (score >= 60) scoreRanges["60-69"]++;
      else scoreRanges["<60"]++;
    });

    const scoreDistribution = Object.entries(scoreRanges).map(([range, count]) => ({
      range, count, percentage: ((count / filtered.length) * 100).toFixed(0)
    }));

    return { performanceTrend, subjectPerformance, scoreDistribution };
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-yellow-700 border-t-[#FA812F] rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-black font-semibold">Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  if (testResults.length === 0) {
    return (
      <div>
        <Navbar />
        <div className="min-h-screen bg-white p-6">
          <div className="max-w-4xl mx-auto text-center pt-20">
            <div className="w-16 h-16 mx-auto mb-6 bg-[#FA812F] bg-opacity-10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-[#FA812F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-black mb-3">No Test Data</h1>
            <p className="text-gray-600 mb-8">Take tests to see your performance analytics</p>
            <button
              onClick={() => router.push('/mockTests')}
              className="px-6 py-3 bg-[#FA812F] hover:bg-[#e5731a] text-white rounded-lg font-medium transition-colors"
            >
              Take Your First Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = getStats();
  const chartData = getChartData();
  const COLORS = ['#FA812F', '#000000', '#666666', '#999999', '#cccccc'];

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="border-b border-gray-100 bg-white sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-black">Dashboard</h1>
                <p className="text-gray-600 text-sm mt-1">Track your test performance</p>
              </div>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FA812F] focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
              </select>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white border border-gray-100 rounded-xl p-6">
                <div className="text-3xl font-bold text-[#FA812F] mb-1">{stats.totalTests}</div>
                <div className="text-gray-600 text-sm">Tests</div>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-6">
                <div className="text-3xl font-bold text-black mb-1">{stats.avgScore}%</div>
                <div className="text-gray-600 text-sm">Avg Score</div>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-6">
                <div className="text-3xl font-bold text-[#FA812F] mb-1">{stats.totalQuestions}</div>
                <div className="text-gray-600 text-sm">Questions</div>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-6">
                <div className="text-3xl font-bold text-black mb-1">{stats.avgTime}m</div>
                <div className="text-gray-600 text-sm">Avg Time</div>
              </div>
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Performance Trend */}
            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-black mb-6">Performance Trend</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData.performanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#FA812F" 
                    strokeWidth={3}
                    dot={{ fill: '#FA812F', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Subject Performance */}
            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-black mb-6">Subject Performance</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData.subjectPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="subject" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                  <Bar dataKey="score" fill="#FA812F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Score Distribution */}
          <div className="bg-white border border-gray-100 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-black mb-6">Score Distribution</h3>
            <div className="flex justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.scoreDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="count"
                    label={({ range, percentage }) => `${range}%: ${percentage}%`}
                  >
                    {chartData.scoreDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Tests */}
          <div className="bg-white border border-gray-100 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-black mb-6">Recent Tests</h3>
            <div className="space-y-3">
              {getFilteredResults().slice(-5).reverse().map((test, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-black text-sm">{test.testName}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(test.completedAt).toLocaleDateString()} • {Math.round(test.timeTaken / 60)}m
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${
                    parseFloat(test.results.percentage) >= 80 ? 'text-[#FA812F]' : 'text-black'
                  }`}>
                    {test.results.percentage}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div className="text-center mt-8">
            <button
              onClick={() => router.push('/mockTests')}
              className="px-8 py-3 bg-[#FA812F] hover:bg-[#e5731a] text-white rounded-lg font-medium transition-colors"
            >
              Take New Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}