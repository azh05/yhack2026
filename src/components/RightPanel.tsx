"use client";

import { useState, useEffect } from "react";
import {
  Layers,
  Eye,
  EyeOff,
  Filter,
  X,
  Crosshair,
  Flame,
  Shield,
  Bomb,
  Users,
  Megaphone,
  Landmark,
  ChevronDown,
  BarChart3,
  Thermometer,
} from "lucide-react";
import { EVENT_TYPES, REGIONS } from "@/data/conflicts";

export interface MapFilters {
  activeEventTypes: Set<string>;
  selectedRegion: string;
  overlays: Record<string, boolean>;
}

interface RightPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  filters: MapFilters;
  onFiltersChange: (filters: MapFilters) => void;
}

const LAYER_ICONS: Record<string, React.ReactNode> = {
  battles: <Crosshair className="w-3.5 h-3.5" />,
  violence_civilians: <Shield className="w-3.5 h-3.5" />,
  explosions: <Bomb className="w-3.5 h-3.5" />,
  protests: <Megaphone className="w-3.5 h-3.5" />,
  riots: <Flame className="w-3.5 h-3.5" />,
  strategic: <Landmark className="w-3.5 h-3.5" />,
};

const OVERLAY_DEFS = [
  {
    id: "heatmap",
    label: "Severity Heatmap",
    icon: <Thermometer className="w-3.5 h-3.5" />,
  },
  {
    id: "clusters",
    label: "Event Clusters",
    icon: <BarChart3 className="w-3.5 h-3.5" />,
  },
  {
    id: "borders",
    label: "Conflict Borders",
    icon: <Landmark className="w-3.5 h-3.5" />,
  },
];

export default function RightPanel({ isOpen, onToggle, filters, onFiltersChange }: RightPanelProps) {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    setLastUpdated(new Date());
  }, []);

  const toggleType = (id: string) => {
    const next = new Set(filters.activeEventTypes);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onFiltersChange({ ...filters, activeEventTypes: next });
  };

  const toggleOverlay = (id: string) => {
    onFiltersChange({
      ...filters,
      overlays: { ...filters.overlays, [id]: !filters.overlays[id] },
    });
  };

  if (!isOpen) return null;

  return (
    <aside className="fixed right-0 top-14 bottom-[88px] w-[260px] z-30 flex flex-col glass border-l border-white/[0.04] animate-slide-left">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-accent-glow/70" />
          <h2 className="text-sm font-display font-semibold text-white">
            Layers & Filters
          </h2>
        </div>
        <button
          onClick={onToggle}
          className="p-1 rounded-md text-muted hover:text-white hover:bg-surface-300/50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Region Filter */}
        <div className="px-4 py-3 border-b border-white/[0.04]">
          <label className="text-2xs font-mono text-muted/60 uppercase tracking-wider mb-2 block">
            Region
          </label>
          <div className="relative">
            <select
              value={filters.selectedRegion}
              onChange={(e) => onFiltersChange({ ...filters, selectedRegion: e.target.value })}
              className="w-full appearance-none px-3 py-2 rounded-lg bg-surface-200/80 border border-white/[0.06] text-xs text-white/80 outline-none focus:border-accent/30 transition-colors cursor-pointer"
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted/50 pointer-events-none" />
          </div>
        </div>

        {/* Event Type Toggles */}
        <div className="px-4 py-3 border-b border-white/[0.04]">
          <label className="text-2xs font-mono text-muted/60 uppercase tracking-wider mb-2.5 block">
            Event Types
          </label>
          <div className="space-y-1">
            {EVENT_TYPES.map((type) => {
              const isActive = filters.activeEventTypes.has(type.id);
              return (
                <button
                  key={type.id}
                  onClick={() => toggleType(type.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all duration-200 ${
                    isActive
                      ? "bg-surface-300/40 text-white/90"
                      : "text-muted/50 hover:text-muted-light hover:bg-surface-300/20"
                  }`}
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0 transition-opacity"
                    style={{
                      backgroundColor: type.color,
                      opacity: isActive ? 1 : 0.3,
                      boxShadow: isActive ? `0 0 6px ${type.color}50` : "none",
                    }}
                  />
                  <span
                    className="flex items-center gap-1.5"
                    style={{ color: isActive ? type.color + "cc" : undefined }}
                  >
                    {LAYER_ICONS[type.id]}
                    {type.label}
                  </span>
                  <div className="ml-auto">
                    {isActive ? (
                      <Eye className="w-3 h-3 text-muted/40" />
                    ) : (
                      <EyeOff className="w-3 h-3 text-muted/20" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Severity Range */}
        <div className="px-4 py-3 border-b border-white/[0.04]">
          <label className="text-2xs font-mono text-muted/60 uppercase tracking-wider mb-2.5 block">
            Severity Range
          </label>
          <div className="px-1">
            {/* Severity gradient bar */}
            <div
              className="h-2 rounded-full overflow-hidden mb-2"
              style={{
                background:
                  "linear-gradient(to right, #facc15, #f97316, #ef4444, #991b1b, #7f1d1d)",
              }}
            />
            <div className="flex justify-between text-2xs font-mono text-muted/40">
              <span>1 Low</span>
              <span>5 High</span>
              <span>10 Extreme</span>
            </div>
          </div>
        </div>

        {/* Map Overlays */}
        <div className="px-4 py-3">
          <label className="text-2xs font-mono text-muted/60 uppercase tracking-wider mb-2.5 block">
            Overlays
          </label>
          <div className="space-y-1">
            {OVERLAY_DEFS.map((overlay) => {
              const isActive = filters.overlays[overlay.id] ?? false;
              return (
                <button
                  key={overlay.id}
                  onClick={() => toggleOverlay(overlay.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all duration-200 ${
                    isActive
                      ? "bg-accent/10 text-accent-glow/90 border border-accent/15"
                      : "text-muted/50 hover:text-muted-light hover:bg-surface-300/20 border border-transparent"
                  }`}
                >
                  {overlay.icon}
                  <span>{overlay.label}</span>
                  <div className="ml-auto">
                    {isActive ? (
                      <Eye className="w-3 h-3 text-accent-glow/40" />
                    ) : (
                      <EyeOff className="w-3 h-3 text-muted/20" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Data Source Attribution */}
      <div className="px-4 py-2.5 border-t border-white/[0.04]">
        <p className="text-2xs text-muted/30 font-mono leading-relaxed">
          Data: ACLED · GDELT · CAST
          <br />
          Updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : "..."}
        </p>
      </div>
    </aside>
  );
}
