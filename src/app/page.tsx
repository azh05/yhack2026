'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import LeftPanel from '@/components/LeftPanel';
import RightPanel from '@/components/RightPanel';
import TimelineBar from '@/components/TimelineBar';
import ConflictDetail from '@/components/ConflictDetail';
import type { ConflictZone } from '@/data/conflicts';
import {
  PanelLeft,
  Layers,
} from 'lucide-react';

// Dynamic import for MapGlobe to avoid SSR issues with Mapbox
const MapGlobe = dynamic(() => import('@/components/MapGlobe'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-surface" style={{ top: '56px' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-accent/20 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-t-accent border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        </div>
        <span className="text-sm font-display text-white/60">Loading Globe...</span>
      </div>
    </div>
  ),
});

export default function Home() {
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<ConflictZone | null>(null);
  const [timelineDate, setTimelineDate] = useState(new Date());

  const handleConflictSelect = useCallback((zone: ConflictZone | null) => {
    setSelectedConflict(zone);
    if (zone && !leftPanelOpen) {
      setLeftPanelOpen(true);
    }
  }, [leftPanelOpen]);

  const handleDateChange = useCallback((date: Date) => {
    setTimelineDate(date);
  }, []);

  return (
    <main className="h-screen w-screen overflow-hidden bg-surface relative">
      {/* Navbar */}
      <Navbar />

      {/* Map (base layer) */}
      <MapGlobe
        onConflictSelect={handleConflictSelect}
        selectedConflict={selectedConflict}
        timelineDate={timelineDate}
      />

      {/* Left Panel */}
      <LeftPanel
        isOpen={leftPanelOpen}
        onToggle={() => setLeftPanelOpen(false)}
        onConflictSelect={(zone) => handleConflictSelect(zone)}
        selectedConflict={selectedConflict}
      />

      {/* Conflict Detail (slides in next to left panel) */}
      {selectedConflict && leftPanelOpen && (
        <ConflictDetail
          zone={selectedConflict}
          onClose={() => setSelectedConflict(null)}
        />
      )}

      {/* Right Panel */}
      <RightPanel
        isOpen={rightPanelOpen}
        onToggle={() => setRightPanelOpen(false)}
      />

      {/* Floating toggle buttons when panels are closed */}
      {!leftPanelOpen && (
        <button
          onClick={() => setLeftPanelOpen(true)}
          className="fixed left-4 top-20 z-20 flex items-center gap-2 px-3 py-2 rounded-lg glass glass-hover transition-all"
        >
          <PanelLeft className="w-4 h-4 text-accent-glow/70" />
          <span className="text-xs text-white/70">Conflicts</span>
        </button>
      )}

      {!rightPanelOpen && (
        <button
          onClick={() => setRightPanelOpen(true)}
          className="fixed right-4 top-20 z-20 flex items-center gap-2 px-3 py-2 rounded-lg glass glass-hover transition-all"
        >
          <Layers className="w-4 h-4 text-accent-glow/70" />
          <span className="text-xs text-white/70">Layers</span>
        </button>
      )}

      {/* Timeline Bar */}
      <TimelineBar onDateChange={handleDateChange} />

      {/* Ambient corner gradients */}
      <div className="fixed bottom-16 left-0 w-96 h-96 pointer-events-none z-[1] opacity-30"
        style={{ background: 'radial-gradient(ellipse at bottom left, rgba(59,130,246,0.06), transparent 70%)' }}
      />
      <div className="fixed top-14 right-0 w-96 h-96 pointer-events-none z-[1] opacity-20"
        style={{ background: 'radial-gradient(ellipse at top right, rgba(239,68,68,0.04), transparent 70%)' }}
      />
    </main>
  );
}
