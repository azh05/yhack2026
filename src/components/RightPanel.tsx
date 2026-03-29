'use client';

import {
  Layers,
  Eye,
  EyeOff,
  X,
  Crosshair,
  Flame,
  Shield,
  Bomb,
  Megaphone,
  Landmark,
  ChevronDown,
  BarChart3,
  Thermometer,
} from 'lucide-react';
import { EVENT_TYPES, REGIONS } from '@/data/conflicts';
import type { MapFilters } from '@/data/filters';

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

const OVERLAY_META = [
  { id: 'heatmap' as const, label: 'Severity Heatmap', icon: <Thermometer className="w-3.5 h-3.5" /> },
  { id: 'clusters' as const, label: 'Event Clusters', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { id: 'borders' as const, label: 'Conflict Borders', icon: <Landmark className="w-3.5 h-3.5" /> },
];

export default function RightPanel({ isOpen, onToggle, filters, onFiltersChange }: RightPanelProps) {
  const toggleType = (id: string) => {
    const next = new Set(filters.activeTypes);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onFiltersChange({ ...filters, activeTypes: next });
  };

  const setRegion = (region: string) => {
    onFiltersChange({ ...filters, selectedRegion: region });
  };

  const toggleOverlay = (id: 'heatmap' | 'clusters' | 'borders') => {
    onFiltersChange({
      ...filters,
      overlays: { ...filters.overlays, [id]: !filters.overlays[id] },
    });
  };

  const setSeverityMin = (val: number) => {
    onFiltersChange({ ...filters, severityRange: [val, filters.severityRange[1]] });
  };

  const setSeverityMax = (val: number) => {
    onFiltersChange({ ...filters, severityRange: [filters.severityRange[0], val] });
  };

  if (!isOpen) return null;

  return (
    <aside className="fixed right-0 top-14 bottom-[88px] w-[260px] z-30 flex flex-col glass border-l border-white/[0.04] animate-slide-left overflow-hidden">
      {/* Top accent glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-glow/30 to-transparent animate-pulse-slow" />
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-accent-glow/70" />
          <h2 className="text-sm font-display font-semibold text-white">Layers & Filters</h2>
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
              onChange={(e) => setRegion(e.target.value)}
              className="w-full appearance-none px-3 py-2 rounded-lg bg-surface-200 border border-white/[0.06] text-xs text-white/80 outline-none focus:border-accent/30 transition-colors cursor-pointer"
            >
              {REGIONS.map(r => (
                <option key={r} value={r} className="bg-[#161e2e] text-white/90">{r}</option>
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
            {EVENT_TYPES.map(type => {
              const isActive = filters.activeTypes.has(type.id);
              return (
                <button
                  key={type.id}
                  onClick={() => toggleType(type.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all duration-200 ${
                    isActive
                      ? 'bg-surface-300/40 text-white/90'
                      : 'text-muted/50 hover:text-muted-light hover:bg-surface-300/20'
                  }`}
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0 transition-opacity"
                    style={{
                      backgroundColor: type.color,
                      opacity: isActive ? 1 : 0.3,
                      boxShadow: isActive ? `0 0 6px ${type.color}50` : 'none',
                    }}
                  />
                  <span className="flex items-center gap-1.5" style={{ color: isActive ? type.color + 'cc' : undefined }}>
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
            <div className="h-2 rounded-full overflow-hidden mb-3"
              style={{
                background: 'linear-gradient(to right, #facc15, #f97316, #ef4444, #991b1b, #7f1d1d)',
              }}
            />
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-2xs font-mono text-muted/40 mb-1 block">Min</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={filters.severityRange[0]}
                  onChange={(e) => setSeverityMin(Number(e.target.value))}
                  className="w-full accent-orange-500 h-1 bg-surface-300/60 rounded-full appearance-none cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <label className="text-2xs font-mono text-muted/40 mb-1 block">Max</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={filters.severityRange[1]}
                  onChange={(e) => setSeverityMax(Number(e.target.value))}
                  className="w-full accent-red-500 h-1 bg-surface-300/60 rounded-full appearance-none cursor-pointer"
                />
              </div>
            </div>
            <div className="flex justify-between text-2xs font-mono text-muted/50 mt-1">
              <span>{filters.severityRange[0]}</span>
              <span>{filters.severityRange[1]}</span>
            </div>
          </div>
        </div>

        {/* Map Overlays */}
        <div className="px-4 py-3">
          <label className="text-2xs font-mono text-muted/60 uppercase tracking-wider mb-2.5 block">
            Overlays
          </label>
          <div className="space-y-1">
            {OVERLAY_META.map(overlay => {
              const active = filters.overlays[overlay.id];
              return (
                <button
                  key={overlay.id}
                  onClick={() => toggleOverlay(overlay.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all duration-200 ${
                    active
                      ? 'bg-accent/10 text-accent-glow/90 border border-accent/15'
                      : 'text-muted/50 hover:text-muted-light hover:bg-surface-300/20 border border-transparent'
                  }`}
                >
                  {overlay.icon}
                  <span>{overlay.label}</span>
                  <div className="ml-auto">
                    {active ? (
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
          Data: ACLED &middot; GDELT &middot; CAST<br />
          Updated: 15 min ago
        </p>
      </div>
    </aside>
  );
}
