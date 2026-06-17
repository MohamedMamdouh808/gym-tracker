import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import WeightTracker from './pages/WeightTracker';
import MealTracker from './pages/MealTracker';
import WorkoutPlanner from './pages/WorkoutPlanner';
import WorkoutLog from './pages/WorkoutLog';
import Progress from './pages/Progress';
import AICoach from './pages/AICoach';
import Profile from './pages/Profile';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProfileProvider, useProfile } from './context/ProfileContext';

import HealthCalculators from './pages/HealthCalculators';
import InBodyScan from './pages/InBodyScan';

const PAGES = {
  dashboard: Dashboard,
  weight: WeightTracker,
  meals: MealTracker,
  'workout-plan': WorkoutPlanner,
  'workout-log': WorkoutLog,
  progress: Progress,
  'ai-coach': AICoach,
  calculators: HealthCalculators,
  inbody: InBodyScan,
  profile: Profile,
};

function AppContent() {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pageKey, setPageKey] = useState(0);
  const { session } = useAuth();
  const { loadProfile } = useProfile();

  const PageComponent = PAGES[activePage] || Dashboard;

  function navigate(page) {
    setActivePage(page);
    setPageKey(k => k + 1);
    setSidebarOpen(false);
  }

  useEffect(() => {
    if (session) loadProfile();
  }, [session, loadProfile]);

  // Theme persistence
  useEffect(() => {
    const savedTheme = localStorage.getItem('gym-theme') || 'stone';
    document.body.className = `theme-${savedTheme}`;
  }, []);

  // Close sidebar on ESC
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setSidebarOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!session) {
    return <Login />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile hamburger */}
      <button
        className="hamburger"
        onClick={() => setSidebarOpen(o => !o)}
        aria-label="Toggle menu"
      >
        <span style={sidebarOpen ? { transform: 'rotate(45deg) translate(5px, 5px)' } : {}} />
        <span style={sidebarOpen ? { opacity: 0 } : {}} />
        <span style={sidebarOpen ? { transform: 'rotate(-45deg) translate(5px, -5px)' } : {}} />
      </button>

      {/* Overlay on mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar
        activePage={activePage}
        onNavigate={navigate}
        isOpen={sidebarOpen}
      />

      <main className="main-content">
        <div key={pageKey} className="page-enter">
          <PageComponent onNavigate={navigate} />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <AppContent />
      </ProfileProvider>
    </AuthProvider>
  );
}
