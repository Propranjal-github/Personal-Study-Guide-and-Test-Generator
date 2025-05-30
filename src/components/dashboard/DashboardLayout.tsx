
import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Calendar,
  Layout,
  BookOpen, 
  FileText, 
  Star, 
  LogOut, 
  Menu,
  X
} from 'lucide-react';

const Sidebar = ({ isMobileOpen, setIsMobileOpen }: { isMobileOpen: boolean, setIsMobileOpen: (open: boolean) => void }) => {
  const sidebarItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Layout },
    { name: 'Mock Tests', path: '/mock-tests', icon: Calendar },
    { name: 'Question Bank', path: '/question-bank', icon: BookOpen },
    { name: 'Quick Notes', path: '/notes', icon: FileText },
    { name: 'Leaderboard', path: '/leaderboard', icon: Star },
  ];

  const sidebarClassName = isMobileOpen
    ? "fixed inset-y-0 left-0 z-50 w-64 transform translate-x-0 transition-transform ease-in-out duration-300 bg-background border-r"
    : "fixed inset-y-0 left-0 z-50 w-64 transform -translate-x-full md:translate-x-0 transition-transform ease-in-out duration-300 bg-background border-r";

  return (
    <>
      <div className={sidebarClassName}>
        <div className="flex h-16 items-center border-b px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="rounded-full bg-primary p-1">
              <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">JA</div>
            </div>
            <span className="font-semibold tracking-tight text-xl">JEE Ace</span>
          </Link>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="ml-auto p-2 md:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="py-4">
          <nav className="px-2 space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className="flex items-center px-3 py-3 text-sm font-medium rounded-md hover:bg-muted group"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5 text-muted-foreground group-hover:text-primary" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="px-2 mt-8">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Need help?</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Contact our support team for assistance with your JEE preparation.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Contact Support
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 w-full border-t p-4">
          <Button variant="ghost" className="w-full flex items-center justify-start text-muted-foreground">
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </div>
      
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        ></div>
      )}
    </>
  );
};

const TopBar = ({ setIsMobileOpen }: { setIsMobileOpen: (open: boolean) => void }) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <button
        onClick={() => setIsMobileOpen(true)}
        className="inline-flex items-center justify-center md:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="h-6 w-6" />
      </button>
      <div className="flex-1">
        <h1 className="text-lg font-semibold md:text-xl">Dashboard</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-medium">
            US
          </div>
          <span className="hidden md:inline-block font-medium">User Name</span>
        </div>
      </div>
    </header>
  );
};

const DashboardLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      <div className="md:pl-64">
        <TopBar setIsMobileOpen={setIsMobileOpen} />
        <main className="container py-6 px-4 md:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
