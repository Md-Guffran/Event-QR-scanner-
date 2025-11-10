import React, { useState, useEffect } from 'react';
import type { View } from './types';
import { useAttendees } from './hooks/useAttendees';
import Dashboard from './components/Dashboard';
import AttendeeManager from './components/AttendeeManager';
import Scanner from './components/Scanner';
import Setup from './components/Setup';
import { QrCodeIcon, UserGroupIcon, ChartBarIcon } from './components/icons';

const App: React.FC = () => {
  const [view, setView] = useState<View>('dashboard');
  const [dbUrl, setDbUrl] = useState<string | null>(null);
  const [isUrlInitialized, setIsUrlInitialized] = useState(false);
  const attendeesHook = useAttendees(dbUrl);

  useEffect(() => {
    const storedUrl = localStorage.getItem('DB_URL');
    if (storedUrl) {
      setDbUrl(storedUrl);
    }
    setIsUrlInitialized(true);
  }, []);

  const handleSaveUrl = (newUrl: string) => {
    localStorage.setItem('DB_URL', newUrl);
    setDbUrl(newUrl);
  };

  const handleClearUrl = () => {
    localStorage.removeItem('DB_URL');
    setDbUrl(null);
  };

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard attendees={attendeesHook.attendees} />;
      case 'attendees':
        return <AttendeeManager {...attendeesHook} />;
      case 'scanner':
        return <Scanner {...attendeesHook} />;
      default:
        return <Dashboard attendees={attendeesHook.attendees} />;
    }
  };

  const NavButton: React.FC<{
    targetView: View;
    label: string;
    icon: React.ReactNode;
  }> = ({ targetView, label, icon }) => {
    const isActive = view === targetView;
    return (
      <button
        onClick={() => setView(targetView)}
        className={`flex flex-col sm:flex-row items-center justify-center gap-2 flex-1 py-3 px-2 text-sm font-medium transition-colors rounded-lg ${
          isActive
            ? 'bg-indigo-600 text-white shadow-md'
            : 'text-gray-400 hover:bg-gray-700 hover:text-white'
        }`}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  };
  
  if (!isUrlInitialized) {
      return (
          <div className="min-h-screen bg-gray-900" /> // Blank screen during initial auth check
      );
  }

  if (!dbUrl) {
      return <Setup onSave={handleSaveUrl} />;
  }
  
  if (attendeesHook.isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-lg font-semibold">Connecting to event database...</p>
      </div>
    );
  }

  if (attendeesHook.error) {
     return (
      <div className="min-h-screen bg-gray-900 text-red-400 flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-2xl font-bold">Connection Error</h2>
        <p className="mt-2 max-w-md">{attendeesHook.error} Please check your connection or the configured database URL.</p>
        <div className="flex gap-4 mt-6">
            <button onClick={() => window.location.reload()} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg">
                Try Again
            </button>
            <button onClick={handleClearUrl} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">
                Change Database URL
            </button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <header className="bg-gray-800 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-white tracking-wider">Event QR Check-in System</h1>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        {renderView()}
      </main>

      <footer className="sticky bottom-0 bg-gray-800 border-t border-gray-700 z-50">
        <nav className="max-w-7xl mx-auto flex justify-around items-center p-2 gap-2">
          <NavButton targetView="dashboard" label="Dashboard" icon={<ChartBarIcon />} />
          <NavButton targetView="attendees" label="Attendees" icon={<UserGroupIcon />} />
          <NavButton targetView="scanner" label="Scan QR" icon={<QrCodeIcon />} />
        </nav>
      </footer>
    </div>
  );
};

export default App;