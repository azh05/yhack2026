"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Play, Pause, SkipForward, SkipBack, Calendar } from "lucide-react";

interface TimelineBarProps {
  onDateChange: (date: Date) => void;
  eventCount?: number;
  earliestDate?: string;
}

const SPEED_OPTIONS = [
  { label: "1x", value: 1 },
  { label: "2x", value: 2 },
  { label: "4x", value: 4 },
  { label: "8x", value: 8 },
];

const DEFAULT_START = "2023-01-01";
const STEP_DAYS = 7; // fixed step size for skip forward/back
const PLAYBACK_PCT_PER_SEC = 1.0; // fixed playback speed (percentage of timeline per second)

export default function TimelineBar({
  onDateChange,
  eventCount,
  earliestDate,
}: TimelineBarProps) {
  const END_DATE = new Date(); // today
  // Ensure start date is at least 2 years before today
  const rawStart = new Date(earliestDate || DEFAULT_START);
  const twoYearsAgo = new Date(END_DATE);
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  const START_DATE = rawStart < twoYearsAgo ? rawStart : twoYearsAgo;
  const TOTAL_DAYS = Math.max(
    1,
    Math.floor(
      (END_DATE.getTime() - START_DATE.getTime()) / (1000 * 60 * 60 * 24),
    ),
  );
  const NOW_PCT = 100;
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(100);
  const [speed, setSpeed] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>();

  const getCurrentDate = useCallback(() => {
    const dayOffset = Math.floor((progress / 100) * TOTAL_DAYS);
    const date = new Date(START_DATE);
    date.setDate(date.getDate() + dayOffset);
    return date;
  }, [progress]);

  const currentDate = getCurrentDate();

  // Convert days to percentage of timeline
  const daysToPct = (days: number) => (days / TOTAL_DAYS) * 100;

  // Generate month tick marks (small) and year markers (tall + labeled)
  const monthTicks: { pct: number }[] = [];
  const yearMarkers: { pct: number; label: string }[] = [];

  // Iterate month by month from START_DATE to END_DATE
  const startYear = START_DATE.getFullYear();
  const startMonth = START_DATE.getMonth();
  const endYear = END_DATE.getFullYear();
  const endMonth = END_DATE.getMonth();

  for (let y = startYear; y <= endYear; y++) {
    const mStart = y === startYear ? startMonth : 0;
    const mEnd = y === endYear ? endMonth : 11;
    for (let m = mStart; m <= mEnd; m++) {
      const monthDate = new Date(y, m, 1);
      const daysSinceStart = Math.floor(
        (monthDate.getTime() - START_DATE.getTime()) / (1000 * 60 * 60 * 24),
      );
      const pct = (daysSinceStart / TOTAL_DAYS) * 100;
      if (pct > 0 && pct <= 100) {
        if (m === 0) {
          // January 1st = year marker
          yearMarkers.push({ pct, label: String(y) });
        } else {
          monthTicks.push({ pct });
        }
      }
    }
  }

  // Stable ref for onDateChange to avoid re-render loops
  const onDateChangeRef = useRef(onDateChange);
  onDateChangeRef.current = onDateChange;

  // Playback animation
  useEffect(() => {
    if (!isPlaying) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    let lastTime = performance.now();
    let stopped = false;
    const step = (now: number) => {
      if (stopped) return;
      const dt = Math.min(now - lastTime, 100); // Cap dt to avoid huge jumps
      lastTime = now;
      const increment = (dt / 1000) * PLAYBACK_PCT_PER_SEC * speed;
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          stopped = true;
          // Defer stopping playback to avoid setState-in-setState
          queueMicrotask(() => setIsPlaying(false));
          return 100;
        }
        return next;
      });
      if (!stopped) {
        animRef.current = requestAnimationFrame(step);
      }
    };

    animRef.current = requestAnimationFrame(step);
    return () => {
      stopped = true;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, speed]);

  // Update parent on progress change — use ref to break dependency cycle
  useEffect(() => {
    onDateChangeRef.current(getCurrentDate());
  }, [progress, getCurrentDate]);

  // Drag handling
  const handleSliderClick = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const pct = Math.max(
      0,
      Math.min(100, ((e.clientX - rect.left) / rect.width) * 100),
    );
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
      const pct = Math.max(
        0,
        Math.min(100, ((e.clientX - rect.left) / rect.width) * 100),
      );
      setProgress(pct);
    };
    const handleUp = () => setIsDragging(false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isDragging]);

  const goToNow = () => setProgress(100);

  // Skip forward/back by a fixed step size
  const stepBack = () =>
    setProgress((prev) => Math.max(0, prev - daysToPct(STEP_DAYS)));
  const stepForward = () =>
    setProgress((prev) => Math.min(100, prev + daysToPct(STEP_DAYS)));

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
              background:
                "linear-gradient(to right, #facc15, #f97316, #ef4444, #ef4444, #dc2626)",
              boxShadow: "0 0 8px rgba(239, 68, 68, 0.3)",
            }}
          />

          {/* Month tick marks (small) */}
          {monthTicks.map((m, i) => (
            <div
              key={`month-${i}`}
              className="absolute top-0"
              style={{ left: `${m.pct}%` }}
            >
              <div className="w-px h-1.5 bg-white/[0.08]" />
            </div>
          ))}

          {/* Year markers (tall tick + label) */}
          {yearMarkers.map((m, i) => (
            <div
              key={`year-${i}`}
              className="absolute top-0"
              style={{ left: `${m.pct}%` }}
            >
              <div className="w-px h-4 bg-white/25" />
              <span className="absolute top-[26px] left-1/2 -translate-x-1/2 whitespace-nowrap text-2xs font-mono text-white/30">
                {m.label}
              </span>
            </div>
          ))}

          {/* Playhead */}
          <div
            className="absolute top-2 -translate-x-1/2 transition-none"
            style={{ left: `${progress}%` }}
          >
            <div className="relative">
              {/* Date tooltip */}
              <div
                className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-md bg-surface-100 border border-accent/20 transition-opacity ${isDragging || isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
              >
                <span className="text-2xs font-mono text-accent-glow whitespace-nowrap">
                  {currentDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              {/* Handle with glow trail */}
              <div
                className={`w-3.5 h-3.5 rounded-full bg-accent border-2 border-white shadow-lg transition-transform hover:scale-125 ${isPlaying ? "shadow-accent/60 animate-glow" : "shadow-accent/30"}`}
              />
              {/* Vertical line */}
              <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-px h-2 bg-accent/40" />
            </div>
          </div>

          {/* "NOW" marker */}
          <div className="absolute top-2" style={{ left: `${NOW_PCT}%` }}>
            <div className="w-px h-5 bg-emerald-400/50" />
            <span className="absolute top-[26px] left-1/2 -translate-x-1/2 text-2xs font-mono text-emerald-400/50">
              Now
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
            title="Back 1 week"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center justify-center w-8 h-8 rounded-lg bg-accent/80 hover:bg-accent text-white transition-all ${isPlaying ? "shadow-lg shadow-accent/40 animate-glow" : ""}`}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>
          <button
            onClick={stepForward}
            className="p-1.5 rounded-md text-muted hover:text-white hover:bg-surface-300/50 transition-colors"
            title="Forward 1 week"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Speed */}
          <div className="flex items-center ml-2 gap-0.5">
            {SPEED_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSpeed(opt.value)}
                className={`px-1.5 py-0.5 rounded text-2xs font-mono transition-colors ${
                  speed === opt.value
                    ? "bg-accent/20 text-accent-glow border border-accent/20"
                    : "text-muted/40 hover:text-muted-light"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Current date + event count */}
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-muted/40" />
          <span className="text-xs font-mono text-white/70">
            {currentDate.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          {eventCount !== undefined && (
            <span className="px-1.5 py-0.5 rounded bg-severity-high/10 text-severity-high/80 text-2xs font-mono border border-severity-high/20">
              {eventCount} events
            </span>
          )}
          <button
            onClick={goToNow}
            className="px-2 py-0.5 rounded-md bg-emerald-400/10 text-emerald-400/80 text-2xs font-mono border border-emerald-400/20 hover:bg-emerald-400/20 transition-colors ml-1"
          >
            NOW
          </button>
        </div>

        {/* Right: empty spacer for layout balance */}
        <div className="w-[120px]" />
      </div>
    </div>
  );
}
