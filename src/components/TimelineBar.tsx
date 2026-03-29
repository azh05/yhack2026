"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Clock,
  Calendar,
} from "lucide-react";

interface TimelineBarProps {
  onDateChange: (date: Date) => void;
  eventCount?: number;
  earliestDate?: string;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const SPEED_OPTIONS = [
  { label: "1×", value: 1 },
  { label: "2×", value: 2 },
  { label: "4×", value: 4 },
  { label: "8×", value: 8 },
];

// Each mode defines how much time one "step" covers and playback rate
const TIMELAPSE_MODES = [
  { id: "24h", label: "24h", days: 1, playbackPctPerSec: 2.0 },
  { id: "week", label: "Week", days: 7, playbackPctPerSec: 1.2 },
  { id: "month", label: "Month", days: 30, playbackPctPerSec: 0.6 },
  { id: "year", label: "Year", days: 365, playbackPctPerSec: 0.3 },
];

const DEFAULT_START = "2025-09-01";
const END_DATE = new Date("2026-03-28");

export default function TimelineBar({
  onDateChange,
  eventCount,
  earliestDate,
}: TimelineBarProps) {
  const START_DATE = useMemo(
    () => new Date(earliestDate || DEFAULT_START),
    [earliestDate],
  );
  const TOTAL_DAYS = useMemo(
    () =>
      Math.max(
        1,
        Math.floor(
          (END_DATE.getTime() - START_DATE.getTime()) / (1000 * 60 * 60 * 24),
        ),
      ),
    [START_DATE],
  );
  const NOW_PCT = 100;
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(100);
  const [speed, setSpeed] = useState(1);
  const [timelapseMode, setTimelapseMode] = useState("week");
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>();

  const currentMode =
    TIMELAPSE_MODES.find((m) => m.id === timelapseMode) || TIMELAPSE_MODES[2];

  const getCurrentDate = useCallback(
    (pct: number) => {
      const dayOffset = Math.floor((pct / 100) * TOTAL_DAYS);
      const date = new Date(START_DATE);
      date.setDate(date.getDate() + dayOffset);
      return date;
    },
    [TOTAL_DAYS, START_DATE],
  );

  const currentDate = useMemo(
    () => getCurrentDate(progress),
    [getCurrentDate, progress],
  );

  // Convert days to percentage of timeline
  const daysToPct = (days: number) => (days / TOTAL_DAYS) * 100;

  // Generate week tick marks
  const tickMarkers: { label: string; pct: number; isMonth: boolean }[] = [];
  const d = new Date(START_DATE);
  while (d <= END_DATE) {
    const daysSinceStart = Math.floor(
      (d.getTime() - START_DATE.getTime()) / (1000 * 60 * 60 * 24),
    );
    const pct = (daysSinceStart / TOTAL_DAYS) * 100;
    if (pct >= 0 && pct <= 100) {
      const isFirstOfMonth = d.getDate() <= 7;
      tickMarkers.push({
        label: `${MONTHS[d.getMonth()]} ${d.getFullYear() % 100}`,
        pct,
        isMonth: d.getDate() === 1,
      });
    }
    // Step by week
    d.setDate(d.getDate() + 7);
  }

  // Month labels (only show month starts)
  const monthLabels = tickMarkers.filter((t) => t.isMonth);

  // Track whether playback should stop (progress hit 100)
  const shouldStopRef = useRef(false);

  // Playback animation — speed varies by timelapse mode
  useEffect(() => {
    if (!isPlaying) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    const mode =
      TIMELAPSE_MODES.find((m) => m.id === timelapseMode) || TIMELAPSE_MODES[2];
    let lastTime = performance.now();
    shouldStopRef.current = false;

    const step = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;
      const increment = (dt / 1000) * mode.playbackPctPerSec * speed;
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          shouldStopRef.current = true;
          return 100;
        }
        return next;
      });

      if (shouldStopRef.current) {
        setIsPlaying(false);
        return;
      }

      animRef.current = requestAnimationFrame(step);
    };

    animRef.current = requestAnimationFrame(step);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, speed, timelapseMode]);

  // Stable ref for onDateChange to avoid re-triggering the effect
  const onDateChangeRef = useRef(onDateChange);
  useEffect(() => {
    onDateChangeRef.current = onDateChange;
  }, [onDateChange]);

  // Update parent on date change
  useEffect(() => {
    onDateChangeRef.current(currentDate);
  }, [currentDate]);

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

  // Skip forward/back by the mode's step size
  const stepBack = () =>
    setProgress((prev) => Math.max(0, prev - daysToPct(currentMode.days)));
  const stepForward = () =>
    setProgress((prev) => Math.min(100, prev + daysToPct(currentMode.days)));

  // Reset to beginning when mode changes
  const handleModeChange = (modeId: string) => {
    setTimelapseMode(modeId);
    setIsPlaying(false);
  };

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

          {/* Week tick marks */}
          {tickMarkers.map((m, i) => (
            <div
              key={i}
              className="absolute top-0"
              style={{ left: `${m.pct}%` }}
            >
              <div
                className={`w-px ${m.isMonth ? "h-3 bg-white/20" : "h-1.5 bg-white/[0.06]"}`}
              />
            </div>
          ))}

          {/* Month labels */}
          {monthLabels.map((m, i) => (
            <div
              key={`label-${i}`}
              className="absolute top-0"
              style={{ left: `${m.pct}%` }}
            >
              <span className="absolute top-[26px] left-1/2 -translate-x-1/2 whitespace-nowrap text-2xs font-mono text-white/25">
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
              {/* Handle */}
              <div className="w-3.5 h-3.5 rounded-full bg-accent border-2 border-white shadow-lg shadow-accent/30 transition-transform hover:scale-125" />
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
            title={`Back ${currentMode.id}`}
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/80 hover:bg-accent text-white transition-colors"
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
            title={`Forward ${currentMode.id}`}
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

        {/* Right: Timelapse modes */}
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-muted/30 mr-1" />
          {TIMELAPSE_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleModeChange(mode.id)}
              className={`px-2 py-1 rounded-md text-2xs font-mono transition-colors ${
                timelapseMode === mode.id
                  ? "bg-surface-300/60 text-white/80 border border-white/[0.08]"
                  : "text-muted/40 hover:text-muted-light hover:bg-surface-300/30"
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
