'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Clock,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Calendar,
  Rewind,
  FastForward,
} from 'lucide-react';

interface TimelineBarProps {
  onDateChange: (date: Date) => void;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const SPEED_OPTIONS = [
  { label: '1×', value: 1 },
  { label: '2×', value: 2 },
  { label: '4×', value: 4 },
  { label: '8×', value: 8 },
];

const TIMELAPSE_MODES = [
  { id: '24h', label: '24h' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
];

export default function TimelineBar({ onDateChange }: TimelineBarProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(92); // percentage (0-100)
  const [speed, setSpeed] = useState(1);
  const [timelapseMode, setTimelapseMode] = useState('month');
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>();

  // Generate tick marks for the timeline
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2026-03-28');
  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  const getCurrentDate = useCallback(() => {
    const dayOffset = Math.floor((progress / 100) * totalDays);
    const date = new Date(startDate);
    date.setDate(date.getDate() + dayOffset);
    return date;
  }, [progress, totalDays]);

  const currentDate = getCurrentDate();

  // Generate month markers
  const monthMarkers = [];
  const d = new Date(startDate);
  while (d <= endDate) {
    const daysSinceStart = Math.floor((d.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const pct = (daysSinceStart / totalDays) * 100;
    if (pct >= 0 && pct <= 100) {
      monthMarkers.push({
        label: `${MONTHS[d.getMonth()]} ${d.getFullYear() % 100}`,
        pct,
        isYear: d.getMonth() === 0,
      });
    }
    d.setMonth(d.getMonth() + 1);
    d.setDate(1);
  }

  // Playback animation
  useEffect(() => {
    if (!isPlaying) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    let lastTime = performance.now();
    const step = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;
      // Move ~0.5% per second at 1x speed
      const increment = (dt / 1000) * 0.5 * speed;
      setProgress(prev => {
        const next = prev + increment;
        if (next >= 100) {
          setIsPlaying(false);
          return 100;
        }
        return next;
      });
      animRef.current = requestAnimationFrame(step);
    };

    animRef.current = requestAnimationFrame(step);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, speed]);

  // Update parent on progress change
  useEffect(() => {
    onDateChange(getCurrentDate());
  }, [progress, getCurrentDate, onDateChange]);

  // Drag handling
  const handleSliderClick = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    setProgress(pct);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleSliderClick(e);
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => {
      if (!sliderRef.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      setProgress(pct);
    };
    const handleUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging]);

  const goToNow = () => setProgress(92);
  const stepBack = () => setProgress(prev => Math.max(0, prev - 2));
  const stepForward = () => setProgress(prev => Math.min(100, prev + 2));

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-white/[0.04]">
      {/* Timeline slider area */}
      <div className="px-4 pt-2">
        <div
          ref={sliderRef}
          className="relative h-10 cursor-pointer group"
          onMouseDown={handleMouseDown}
        >
          {/* Track background */}
          <div className="absolute top-4 left-0 right-0 h-[3px] rounded-full bg-surface-300/80" />

          {/* Severity intensity visualization along timeline */}
          <div
            className="absolute top-4 left-0 h-[3px] rounded-full"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(to right, #facc15, #f97316, #ef4444, #ef4444, #dc2626)',
              boxShadow: '0 0 8px rgba(239, 68, 68, 0.3)',
            }}
          />

          {/* Future projection zone */}
          <div
            className="absolute top-4 h-[3px] rounded-full"
            style={{
              left: '92%',
              right: '0',
              background: 'repeating-linear-gradient(90deg, #3b82f620 0px, #3b82f620 4px, transparent 4px, transparent 8px)',
            }}
          />

          {/* Month tick marks */}
          {monthMarkers.map((m, i) => (
            <div key={i} className="absolute top-0" style={{ left: `${m.pct}%` }}>
              <div
                className={`w-px ${m.isYear ? 'h-3 bg-white/20' : 'h-2 bg-white/[0.06]'}`}
              />
              {(m.isYear || i % 3 === 0) && (
                <span className={`absolute top-[26px] left-1/2 -translate-x-1/2 whitespace-nowrap text-2xs font-mono ${m.isYear ? 'text-white/30 font-medium' : 'text-white/15'}`}>
                  {m.label}
                </span>
              )}
            </div>
          ))}

          {/* Playhead */}
          <div
            className="absolute top-2 -translate-x-1/2 transition-none"
            style={{ left: `${progress}%` }}
          >
            <div className="relative">
              {/* Date tooltip */}
              <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-md bg-surface-100 border border-accent/20 transition-opacity ${isDragging || isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <span className="text-2xs font-mono text-accent-glow whitespace-nowrap">
                  {currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              {/* Handle */}
              <div className="w-3.5 h-3.5 rounded-full bg-accent border-2 border-white shadow-lg shadow-accent/30 transition-transform hover:scale-125" />
              {/* Vertical line */}
              <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-px h-2 bg-accent/40" />
            </div>
          </div>

          {/* "NOW" marker */}
          <div className="absolute top-2" style={{ left: '92%' }}>
            <div className="w-px h-5 bg-emerald-400/50" />
            <span className="absolute top-[26px] left-1/2 -translate-x-1/2 text-2xs font-mono text-emerald-400/50">
              Now
            </span>
          </div>

          {/* "PROJECTED" label */}
          <div className="absolute top-0" style={{ left: '95%' }}>
            <span className="text-2xs font-mono text-accent/30 italic">
              Forecast →
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left: Playback */}
        <div className="flex items-center gap-1">
          <button
            onClick={stepBack}
            className="p-1.5 rounded-md text-muted hover:text-white hover:bg-surface-300/50 transition-colors"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/80 hover:bg-accent text-white transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <button
            onClick={stepForward}
            className="p-1.5 rounded-md text-muted hover:text-white hover:bg-surface-300/50 transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Speed */}
          <div className="flex items-center ml-2 gap-0.5">
            {SPEED_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSpeed(opt.value)}
                className={`px-1.5 py-0.5 rounded text-2xs font-mono transition-colors ${
                  speed === opt.value
                    ? 'bg-accent/20 text-accent-glow border border-accent/20'
                    : 'text-muted/40 hover:text-muted-light'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Current date display */}
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-muted/40" />
          <span className="text-xs font-mono text-white/70">
            {currentDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <button
            onClick={goToNow}
            className="px-2 py-0.5 rounded-md bg-emerald-400/10 text-emerald-400/80 text-2xs font-mono border border-emerald-400/20 hover:bg-emerald-400/20 transition-colors ml-1"
          >
            NOW
          </button>
        </div>

        {/* Right: Timelapse modes */}
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-muted/30 mr-1" />
          {TIMELAPSE_MODES.map(mode => (
            <button
              key={mode.id}
              onClick={() => setTimelapseMode(mode.id)}
              className={`px-2 py-1 rounded-md text-2xs font-mono transition-colors ${
                timelapseMode === mode.id
                  ? 'bg-surface-300/60 text-white/80 border border-white/[0.08]'
                  : 'text-muted/40 hover:text-muted-light hover:bg-surface-300/30'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
