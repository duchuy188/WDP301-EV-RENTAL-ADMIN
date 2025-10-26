import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './hooks/useTheme';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Fleet } from './pages/Fleet';
import { Stations } from './pages/Stations';
import { Customers } from './pages/Customers';
import { Staff } from './pages/Staff';
import { Analytics } from './pages/Analytics';
import RiskyCustomers from './pages/RiskyCustomers';
import Assignment from './pages/Assignment';
import Payments from './pages/Payments';
import { FeedbackPage } from './pages/Feedback';
import { MyRentalsPage } from './pages/MyRentals';
import { MaintenancePage } from './pages/Maintenance';
import { Chatbot } from './components/Chatbot';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-gray-900 font-inter">
      <Sidebar 
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
        isMobile={isMobile}
      />
      <div 
        className={`transition-all duration-300 ${
          sidebarCollapsed 
            ? isMobile ? 'ml-0' : 'ml-20' 
            : isMobile ? 'ml-0' : 'ml-72'
        }`}
      >
        <Header 
          onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          isMobile={isMobile}
        />
        <main className="min-h-[calc(100vh-73px)] overflow-x-hidden">
          <div className="w-full">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/fleet" element={<Fleet />} />
                <Route path="/fleet/stations" element={<Stations />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/customers/risky" element={<RiskyCustomers />} />
                <Route path="/staff" element={<Staff />} />
                <Route path="/staff/assignment" element={<Assignment />} />
                <Route path="/staff/rentals" element={<MyRentalsPage />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/feedback" element={<FeedbackPage />} />
                <Route path="/maintenance" element={<MaintenancePage />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          </div>
        </main>
        
        {/* Chatbot - Available on all pages */}
        <Chatbot />
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;