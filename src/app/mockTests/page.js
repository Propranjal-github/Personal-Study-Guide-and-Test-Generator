"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/navbar";
import { auth } from "../lib/firebase-config";
import { onAuthStateChanged } from "firebase/auth";
import clsx from "clsx";

const subjects = {
  Physics: [
    "Units and Measurements",
    "Kinematics",
    "Laws of Motion",
    "Work, Energy and Power",
    "Rotational Motion",
    "Gravitation",
    "Properties of Solids and Liquids",
    "Thermodynamics",
    "Kinetic Theory of Gases",
    "Oscillations and Waves",
    "Electrostatics",
    "Current Electricity",
    "Magnetic Effects of Current and Magnetism",
    "Electromagnetic Induction and Alternating Currents",
    "Electromagnetic Waves",
    "Optics",
    "Dual Nature of Matter and Radiation",
    "Atoms and Nuclei",
    "Electronic Devices",
    "Experimental Skills",
  ],
  Chemistry: [
    "Some Basic Concepts in Chemistry",
    "Atomic Structure",
    "Chemical Bonding and Molecular Structure",
    "Chemical Thermodynamics",
    "Solutions",
    "Equilibrium",
    "Redox Reactions and Electrochemistry",
    "Chemical Kinetics",
    "Classification of Elements and Periodicity",
    "The p-Block Elements",
    "The d- and f-Block Elements",
    "Coordination Compounds",
    "Purification and Characterisation of Organic Compounds",
    "Some Basic Principles of Organic Chemistry",
    "Hydrocarbons",
    "Organic Compounds Containing Halogens",
    "Organic Compounds Containing Oxygen",
    "Organic Compounds Containing Nitrogen",
    "Biomolecules",
    "Principles Related to Practical Chemistry",
  ],
  Mathematics: [
    "Sets, Relations and Functions",
    "Complex Numbers and Quadratic Equations",
    "Matrices and Determinants",
    "Permutations and Combinations",
    "Binomial Theorem and Its Simple Applications",
    "Sequence and Series",
    "Limit, Continuity and Differentiability",
    "Integral Calculus",
    "Differential Equations",
    "Coordinate Geometry",
    "Three Dimensional Geometry",
    "Vector Algebra",
    "Statistics and Probability",
    "Trigonometry",
  ],
};


export default function CreateMockTest() {
  const [testType, setTestType] = useState("full");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState({});
  const [customTime, setCustomTime] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [testCreated, setTestCreated] = useState(false);
  const [testData, setTestData] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [testHistory, setTestHistory] = useState([]);
  const [testId, setTestId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showTopics, setShowTopics] = useState({});
  const router = useRouter();

  const handleSubjectToggle = (subject) => {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== subject));
      const updatedTopics = { ...selectedTopics };
      delete updatedTopics[subject];
      setSelectedTopics(updatedTopics);
    } else {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        try {
          const response = await fetch("http://localhost:5000/api/test-history", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId: user.uid }),
          });
          const data = await response.json();
          if (response.ok) {
            setTestHistory(data.tests || []);
          } else {
            console.error("Failed to fetch test history:", data.error);
          }
        } catch (error) {
          console.error("Error fetching test history:", error);
        }
      } else {
        setIsAuthenticated(false);
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const toggleTopicsView = (subject) => {
    setShowTopics(prev => ({ ...prev, [subject]: !prev[subject] }));
  };

  const handleTopicToggle = (subject, topic) => {
    const subjectTopics = selectedTopics[subject] || [];
    if (subjectTopics.includes(topic)) {
      setSelectedTopics({
        ...selectedTopics,
        [subject]: subjectTopics.filter((t) => t !== topic),
      });
    } else {
      setSelectedTopics({
        ...selectedTopics,
        [subject]: [...subjectTopics, topic],
      });
    }
  };

  const generateQuestionsForSubject = async (subject, topics, count) => {
    try {
      const response = await fetch("http://localhost:5000/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: subject,
          count: count,
          topics: topics || [],
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate questions for ${subject}`);
      }

      const data = await response.json();
      return data.questions || [];
    } catch (error) {
      console.error(`Error generating questions for ${subject}:`, error);
      return [];
    }
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (testType === "custom" && (!customTime || customTime < 10 || customTime > 180)) {
        alert("Please enter a valid duration between 10 and 180 minutes.");
        setIsLoading(false);
        return;
      }

      let allQuestions = [];
      let timeLimit = 180;

      if (testType === "full") {
        const physicsQuestions = await generateQuestionsForSubject("Physics", [], 25);
        const chemistryQuestions = await generateQuestionsForSubject("Chemistry", [], 25);
        const mathQuestions = await generateQuestionsForSubject("Mathematics", [], 25);

        allQuestions = [
          ...physicsQuestions.map((q) => ({ ...q, subject: "Physics" })),
          ...chemistryQuestions.map((q) => ({ ...q, subject: "Chemistry" })),
          ...mathQuestions.map((q) => ({ ...q, subject: "Mathematics" })),
        ];
      } else {
        timeLimit = parseInt(customTime);
        const questionsPerSubject = Math.ceil(25 / selectedSubjects.length);

        for (const subject of selectedSubjects) {
          const topicsForSubject = selectedTopics[subject] || [];
          const questions = await generateQuestionsForSubject(subject, topicsForSubject, questionsPerSubject);
          allQuestions = [...allQuestions, ...questions.map((q) => ({ ...q, subject }))];
        }
      }

      const testConfig = {
        questions: allQuestions,
        timeLimit: timeLimit,
        testType: testType,
        subjects: testType === "full" ? ["Physics", "Chemistry", "Mathematics"] : selectedSubjects,
        totalQuestions: allQuestions.length,
      };

      const user = auth.currentUser;
      if (user) {
        const response = await fetch("http://localhost:5000/api/save-test", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.uid,
            testConfig,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setTestId(data.testId);
          setTestHistory([
            {
              testId: data.testId,
              testType: testConfig.testType,
              subjects: testConfig.subjects,
              totalQuestions: testConfig.totalQuestions,
              timeLimit: testConfig.timeLimit,
              questions: testConfig.questions,
              createdAt: new Date().toISOString(),
            },
            ...testHistory,
          ]);
        } else {
          console.error("Failed to save test:", await response.json());
        }
      }

      setTestData(testConfig);
      setTestCreated(true);
    } catch (error) {
      console.error("Error creating test:", error);
      alert("Failed to create test. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [testType, customTime, selectedSubjects, selectedTopics, testHistory]);

  const handleTakeTest = () => {
    localStorage.setItem("currentTest", JSON.stringify({ ...testData, testId }));
    router.push("/takeTest");
  };

  const handleRetakeTest = (test) => {
    const testData = {
      testId: test.testId,
      questions: test.questions,
      timeLimit: test.timeLimit,
      testType: test.testType,
      subjects: test.subjects,
      totalQuestions: test.totalQuestions,
    };
    localStorage.setItem("currentTest", JSON.stringify(testData));
    router.push("/takeTest");
  };

  const filteredTests = testHistory.filter(test => {
    const matchesSearch = test.subjects.some(subject => 
      subject.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesFilter = filterType === "all" || test.testType === filterType;
    return matchesSearch && matchesFilter;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-black text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (testCreated && testData) {
    return (
      <div>
        <Navbar />
        <div className="min-h-screen bg-white p-6">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-[#FA812F] rounded-full mx-auto mb-4 flex items-center justify-center animate-bounce">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-[#FA812F] mb-2">Test Created!</h1>
              <p className="text-black">Your mock test is ready</p>
            </div>

            <div className="bg-white border border-[#FA812F]/20 rounded-xl p-6 mb-8 shadow-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-black/60">Type:</span>
                  <p className="font-semibold text-black">{testType === "full" ? "Full Test" : "Custom Test"}</p>
                </div>
                <div>
                  <span className="text-black/60">Questions:</span>
                  <p className="font-semibold text-black">{testData.totalQuestions}</p>
                </div>
                <div>
                  <span className="text-black/60">Duration:</span>
                  <p className="font-semibold text-black">{testData.timeLimit} min</p>
                </div>
                <div>
                  <span className="text-black/60">Subjects:</span>
                  <p className="font-semibold text-black">{testData.subjects.join(", ")}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleTakeTest}
                className="w-full px-6 py-3 bg-[#FA812F] hover:bg-[#e8741e] text-white font-semibold rounded-lg transition-colors"
              >
                Start Test
              </button>
              <button
                onClick={() => {
                  setTestCreated(false);
                  setTestData(null);
                  setTestId(null);
                }}
                className="px-6 py-2 text-[#FA812F] hover:bg-[#FA812F]/10 rounded-lg transition-colors"
              >
                Create Another Test
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-[#FA812F] mb-2">Create Mock Test</h1>
            <p className="text-black/70">Build your personalized practice test</p>
          </div>

          {/* Test Type Selection */}
          <div className="flex justify-center gap-2 mb-8">
            {["full", "custom"].map((type) => (
              <button
                key={type}
                onClick={() => setTestType(type)}
                className={clsx(
                  "px-6 py-2 rounded-lg font-medium transition-colors",
                  testType === type
                    ? "bg-[#FA812F] text-white"
                    : "bg-white border border-[#FA812F]/20 text-black hover:bg-[#FA812F]/10"
                )}
              >
                {type === "full" ? "Full Test" : "Custom Test"}
              </button>
            ))}
          </div>

          <div className="bg-white border border-[#FA812F]/20 rounded-xl p-6 shadow-lg mb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {testType === "full" ? (
                <div className="text-center py-8">
                  <div className="bg-[#FA812F]/5 rounded-xl p-6">
                    <h3 className="text-xl font-semibold mb-4 text-black">Complete JEE Mock Test</h3>
                    <div className="grid grid-cols-3 gap-4 text-center text-sm">
                      <div className="bg-white rounded-lg p-4 border border-[#FA812F]/10">
                        <div className="text-2xl font-bold text-[#FA812F]">25</div>
                        <div className="text-black/60">Physics</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-[#FA812F]/10">
                        <div className="text-2xl font-bold text-[#FA812F]">25</div>
                        <div className="text-black/60">Chemistry</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-[#FA812F]/10">
                        <div className="text-2xl font-bold text-[#FA812F]">25</div>
                        <div className="text-black/60">Mathematics</div>
                      </div>
                    </div>
                    <div className="mt-4 text-black">
                      <span className="text-[#FA812F] font-semibold">Duration: 180 minutes</span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-black">Select Subjects</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {Object.keys(subjects).map((subject) => (
                        <label
                          key={subject}
                          className={clsx(
                            "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors",
                            selectedSubjects.includes(subject)
                              ? "bg-[#FA812F]/10 border-[#FA812F] text-black"
                              : "bg-white border-[#FA812F]/20 hover:bg-[#FA812F]/5 text-black"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={selectedSubjects.includes(subject)}
                            onChange={() => handleSubjectToggle(subject)}
                            className="w-4 h-4 accent-[#FA812F]"
                          />
                          <span className="font-medium">{subject}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {selectedSubjects.map((subject) => (
                    <div key={subject}>
                      <button
                        type="button"
                        onClick={() => toggleTopicsView(subject)}
                        className="flex items-center justify-between w-full p-3 bg-[#FA812F]/5 rounded-lg text-left hover:bg-[#FA812F]/10 transition-colors"
                      >
                        <span className="font-medium text-black">Topics for {subject}</span>
                        <svg
                          className={clsx(
                            "w-5 h-5 text-[#FA812F] transition-transform",
                            showTopics[subject] ? "rotate-180" : ""
                          )}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {showTopics[subject] && subjects[subject].length > 0 && (
                        <div className="mt-2 grid grid-cols-2 gap-2 p-3 bg-white border border-[#FA812F]/10 rounded-lg">
                          {subjects[subject].map((topic) => (
                            <label
                              key={topic}
                              className="flex items-center gap-2 text-sm hover:bg-[#FA812F]/5 p-2 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedTopics[subject]?.includes(topic) || false}
                                onChange={() => handleTopicToggle(subject, topic)}
                                className="w-4 h-4 accent-[#FA812F]"
                              />
                              <span className="text-black">{topic}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  <div>
                    <label className="block text-lg font-semibold mb-2 text-black">Test Duration</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className="w-24 px-3 py-2 border border-[#FA812F]/20 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-[#FA812F]/50"
                        min="10"
                        max="180"
                      />
                      <span className="text-black">minutes (10-180)</span>
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isLoading || (testType === "custom" && selectedSubjects.length === 0)}
                className={clsx(
                  "w-full px-6 py-3 rounded-lg font-semibold transition-colors",
                  isLoading || (testType === "custom" && selectedSubjects.length === 0)
                    ? "bg-black/10 text-black/40 cursor-not-allowed"
                    : "bg-[#FA812F] hover:bg-[#e8741e] text-white"
                )}
              >
                {isLoading ? "Creating Test..." : "Create Test"}
              </button>
              
              {testType === "custom" && selectedSubjects.length === 0 && (
                <p className="text-center text-black/60 text-sm">Select at least one subject</p>
              )}
            </form>
          </div>

          {/* Previous Tests */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-[#FA812F]">Previous Tests</h2>
            
            {testHistory.length > 0 && (
              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Search by subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-3 py-2 border border-[#FA812F]/20 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-[#FA812F]/50"
                />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-[#FA812F]/20 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-[#FA812F]/50"
                >
                  <option value="all">All Tests</option>
                  <option value="full">Full Tests</option>
                  <option value="custom">Custom Tests</option>
                </select>
              </div>
            )}

            {filteredTests.length === 0 ? (
              <div className="text-center py-12 text-black/60">
                {testHistory.length === 0 ? "No tests created yet" : "No tests match your search"}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTests.map((test) => (
                  <div
                    key={test.testId}
                    className="bg-white border border-[#FA812F]/20 rounded-lg p-4 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={clsx(
                        "px-2 py-1 rounded text-xs font-medium",
                        test.testType === "full" 
                          ? "bg-[#FA812F]/10 text-[#FA812F]" 
                          : "bg-black/10 text-black"
                      )}>
                        {test.testType === "full" ? "Full" : "Custom"}
                      </span>
                      <span className="text-xs text-black/60">
                        {new Date(test.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm text-black mb-3">
                      <p><span className="text-black/60">Subjects:</span> {test.subjects.join(", ")}</p>
                      <p><span className="text-black/60">Questions:</span> {test.totalQuestions}</p>
                      <p><span className="text-black/60">Duration:</span> {test.timeLimit} min</p>
                      {test.score !== undefined && (
                        <p><span className="text-black/60">Score:</span> {test.score}/{test.total}</p>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleRetakeTest(test)}
                      className="w-full px-4 py-2 bg-[#FA812F] hover:bg-[#e8741e] text-white rounded-lg transition-colors"
                    >
                      Retake
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}