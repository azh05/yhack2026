"use client";

import { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Skull,
  MapPin,
  ChevronRight,
  X,
} from 'lucide-react';
import {
  getSeverityColor,
  type ConflictZone,
} from '@/data/conflicts';
import { getConflictsAtDate } from '@/data/timeline';
import type { MapFilters } from '@/data/filters';

interface LeftPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onConflictSelect: (zone: ConflictZone) => void;
  selectedConflict: ConflictZone | null;
  timelineDate: Date;
  filters: MapFilters;
  searchQuery?: string;
  conflictZones: ConflictZone[];
  isLoading?: boolean;
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "escalating")
    return <TrendingUp className="w-3 h-3 text-severity-high" />;
  if (trend === "de-escalating")
    return <TrendingDown className="w-3 h-3 text-emerald-400" />;
  return <Minus className="w-3 h-3 text-muted" />;
}

function TrendBadge({ trend }: { trend: string }) {
  const colors = {
    escalating:
      "text-severity-high bg-severity-high/10 border-severity-high/20",
    stable: "text-muted-light bg-surface-300/50 border-white/[0.06]",
    "de-escalating": "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-2xs font-mono border ${colors[trend as keyof typeof colors]}`}
    >
      <TrendIcon trend={trend} />
      {trend}
    </span>
  );
}

export default function LeftPanel({ isOpen, onToggle, onConflictSelect, selectedConflict, timelineDate, filters, searchQuery = '', conflictZones, isLoading = false }: LeftPanelProps) {

  // Use backend conflictZones if available, otherwise fall back to local data
  const sortedZones = useMemo(() => {
    const zones = conflictZones.length > 0 ? conflictZones : getConflictsAtDate(timelineDate);
    const q = searchQuery.toLowerCase().trim();
    return zones
      .filter(zone => {
        if (filters.selectedRegion !== 'All Regions' && zone.region !== filters.selectedRegion) return false;
        if (zone.severity < filters.severityRange[0] || zone.severity > filters.severityRange[1]) return false;
        // Check event type filter — use eventType if available (local data), fall back to primaryType mapping
        const typeId = zone.eventType ?? ({
          'Battles': 'battles',
          'Violence against civilians': 'violence_civilians',
          'Explosions/Remote violence': 'explosions',
          'Protests': 'protests',
          'Riots': 'riots',
          'Strategic developments': 'strategic',
        } as Record<string, string>)[zone.primaryType];
        if (typeId && !filters.activeTypes.has(typeId)) return false;
        if (q) {
          const haystack = `${zone.name} ${zone.country} ${zone.region} ${zone.primaryType}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.severity - a.severity);
  }, [timelineDate, filters, searchQuery, conflictZones]);

  if (!isOpen) return null;

  return (
    <aside className="fixed left-0 top-14 bottom-[88px] w-[340px] z-30 flex flex-col glass border-r border-white/[0.04] animate-slide-up">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-severity-moderate" />
          <h2 className="text-sm font-display font-semibold text-white">
            Active Conflicts
          </h2>
          <span className="px-1.5 py-0.5 rounded bg-severity-high/10 text-severity-high text-2xs font-mono">
            {sortedZones.length}
          </span>
        </div>
        <button
          onClick={onToggle}
          className="p-1 rounded-md text-muted hover:text-white hover:bg-surface-300/50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {isLoading ? (
            <>
              <div className="animate-pulse bg-surface-300/30 rounded-lg h-12" />
              <div className="animate-pulse bg-surface-300/30 rounded-lg h-12" />
              <div className="animate-pulse bg-surface-300/30 rounded-lg h-12" />
            </>
          ) : (
            sortedZones.map((zone) => {
              const isSelected = selectedConflict?.id === zone.id;
              const color = getSeverityColor(zone.severity);

            return (
              <button
                key={zone.id}
                onClick={() => onConflictSelect(zone)}
                className={`w-full group text-left px-3 py-2.5 rounded-lg transition-all duration-200 relative overflow-hidden ${
                  isSelected
                    ? 'bg-accent/10 border border-accent/20'
                    : 'hover:bg-surface-300/40 border border-transparent'
                }`}
              >
                {/* Severity left bar */}
                <div
                  className={`absolute left-0 top-1 bottom-1 rounded-r transition-all duration-300 ${
                    isSelected ? 'w-[3px] opacity-100' : 'w-[2px] opacity-0 group-hover:opacity-70'
                  }`}
                  style={{ backgroundColor: color, boxShadow: isSelected ? `0 0 8px ${color}60` : 'none' }}
                />
                <div className="flex items-start gap-2.5">
                  <div className="mt-1 shrink-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor: color,
                        boxShadow: `0 0 8px ${color}60`,
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-medium text-white/90 truncate group-hover:text-white transition-colors">
                        {zone.name}
                      </span>
                      <span
                        className="shrink-0 text-2xs font-mono font-bold"
                        style={{ color }}
                      >
                        {zone.severity.toFixed(1)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xs text-muted/70">{zone.country}</span>
                      <span className="text-white/10">&middot;</span>
                      <span className="text-2xs text-muted/50">{zone.region}</span>
                    </div>
                    <div className="mt-1">
                      <TrendBadge trend={zone.trend} />
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 text-2xs font-mono text-muted/50">
                      <span className="flex items-center gap-1">
                        <Skull className="w-2.5 h-2.5" />
                        {zone.fatalities30d.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />
                        {zone.eventCount} events
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-3.5 h-3.5 text-muted/30 group-hover:text-muted/60 mt-1 shrink-0 transition-colors" />
                </div>
              </button>
            );
          })
          )}
          {!isLoading && sortedZones.length === 0 && (
            <div className="text-center py-8 text-muted/40 text-xs">
              No conflicts match current filters
            </div>
          )}
        </div>
      </div>

    </aside>
  );
}
