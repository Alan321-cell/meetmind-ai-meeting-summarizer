import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { MeetingDetail } from './pages/MeetingDetail';
import { api } from './api/client';
import { Bot, Sparkles, Heart } from 'lucide-react';

export const App: React.FC = () => {
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  // Sync hash routing for shareable URLs (e.g. #/meeting/uuid)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/meeting/')) {
        const id = hash.replace('#/meeting/', '');
        setSelectedMeetingId(id);
      } else {
        setSelectedMeetingId(null);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectMeeting = (id: string) => {
    window.location.hash = `#/meeting/${id}`;
    setSelectedMeetingId(id);
  };

  const handleBackToDashboard = () => {
    window.location.hash = '';
    setSelectedMeetingId(null);
  };

  const handleCreateDemo = async () => {
    setIsDemoLoading(true);
    try {
      const demoMeeting = await api.createDemoMeeting();
      handleSelectMeeting(demoMeeting.id);
    } catch (err) {
      console.error('Failed to create demo meeting:', err);
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-brand-500/30 selection:text-brand-200">
      {/* Navigation Header */}
      <Navbar
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenDemo={handleCreateDemo}
        isDemoLoading={isDemoLoading}
      />

      {/* Main Content Body */}
      <main className="flex-1">
        {selectedMeetingId ? (
          <MeetingDetail
            meetingId={selectedMeetingId}
            onBack={handleBackToDashboard}
          />
        ) : (
          <Dashboard
            onSelectMeeting={handleSelectMeeting}
            isUploadOpen={isUploadOpen}
            setIsUploadOpen={setIsUploadOpen}
            onDemoCreate={handleCreateDemo}
            isDemoLoading={isDemoLoading}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/60 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-brand-400" />
            <span className="font-semibold text-slate-300">MeetMind AI</span>
            <span>— Production-Grade Meeting Summarizer</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>FastAPI Backend</span>
            <span>•</span>
            <span>OpenAI / Groq Whisper ASR</span>
            <span>•</span>
            <span>Structured LLM Intelligence</span>
            <span>•</span>
            <span>React + Vite</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
