
import React, { useState, useMemo } from 'react';
import type { Attendee } from '../types';
import { generateSummary } from '../services/geminiService';
import { UserGroupIcon, LoginIcon, FoodIcon, SparklesIcon } from './icons';

interface DashboardProps {
  attendees: Attendee[];
}

const StatCard: React.FC<{ title: string, value: number | string, icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex items-center space-x-4">
        <div className="bg-indigo-500 p-3 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);


const Dashboard: React.FC<DashboardProps> = ({ attendees }) => {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const stats = useMemo(() => {
    const todayStr = new Date().toDateString();
    let entranceToday = 0;
    let lunchToday = 0;
    
    attendees.forEach(attendee => {
      attendee.scans.forEach(scan => {
        if (new Date(scan.timestamp).toDateString() === todayStr) {
          if (scan.type === 'entrance') entranceToday++;
          if (scan.type === 'lunch') lunchToday++;
        }
      });
    });

    return {
      totalAttendees: attendees.length,
      entranceToday,
      lunchToday,
    };
  }, [attendees]);

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setError('');
    setSummary('');
    try {
      const result = await generateSummary(stats);
      setSummary(result);
    } catch (err) {
      setError('Failed to generate summary. Please check the console for details.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold tracking-tight text-white">Event Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Attendees" value={stats.totalAttendees} icon={<UserGroupIcon />} />
        <StatCard title="Entrances Today" value={stats.entranceToday} icon={<LoginIcon />} />
        <StatCard title="Lunches Served Today" value={stats.lunchToday} icon={<FoodIcon />} />
      </div>
      
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <SparklesIcon /> AI-Powered Daily Summary
          </h3>
          <p className="text-gray-400 mb-4">
            Generate a brief summary of today's event activity using Gemini.
          </p>
          <button
            onClick={handleGenerateSummary}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
          >
            {isLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                </>
            ) : "Generate Summary"}
          </button>
          
          {error && <p className="mt-4 text-red-400">{error}</p>}
          
          {summary && (
              <div className="mt-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
                  <p className="text-gray-300 whitespace-pre-wrap font-mono">{summary}</p>
              </div>
          )}
      </div>
    </div>
  );
};

export default Dashboard;
