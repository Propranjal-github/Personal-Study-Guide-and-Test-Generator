
// import { Toaster } from "@/components/ui/toaster";
// import { Toaster as Sonner } from "@/components/ui/sonner";
// import { TooltipProvider } from "@/components/ui/tooltip";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import Index from "./pages/Index";
// import Dashboard from "./pages/Dashboard";
// import MockTests from "./pages/MockTests";
// import QuestionBank from "./pages/QuestionBank";
// import Notes from "./pages/Notes";
// import Leaderboard from "./pages/Leaderboard";
// import TakeMockTest from "./pages/TakeMockTest";
// import MockTestResult from "./pages/MockTestResult";
// import DashboardLayout from "./components/dashboard/DashboardLayout";
// import NotFound from "./pages/NotFound";
// import AIQuestionGenerator from "./pages/AIQuestionGenerator";

// const queryClient = new QueryClient();

// const App = () => (
//   <QueryClientProvider client={queryClient}>
//     <TooltipProvider>
//       <Toaster />
//       <Sonner />
//       <BrowserRouter>
//         <Routes>
//           <Route path="/" element={<Index />} />
//           <Route element={<DashboardLayout />}>
//             <Route path="/dashboard" element={<Dashboard />} />
//             <Route path="/mock-tests" element={<MockTests />} />
//             <Route path="/mock-tests/:id" element={<TakeMockTest />} />
//             <Route path="/mock-test/:id" element={<TakeMockTest />} />
//             <Route path="/mock-test-result/:id" element={<MockTestResult />} />
//             <Route path="/question-bank" element={<QuestionBank />} />
//             <Route path="/notes" element={<Notes />} />
//             <Route path="/leaderboard" element={<Leaderboard />} />
//             <Route path="/ai-question-generator" element={<AIQuestionGenerator />} />
//           </Route>
//           {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
//           <Route path="*" element={<NotFound />} />
//         </Routes>
//       </BrowserRouter>
//     </TooltipProvider>
//   </QueryClientProvider>
// );

// export default App;
