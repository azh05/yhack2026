'use client';

import { useState } from 'react';
import {
  X,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Minus,
  Skull,
  MapPin,
  Calendar,
  Sparkles,
  Users,
  Globe2,
  Newspaper,
  Share2,
  BookmarkPlus,
  AlertTriangle,
  Heart,
  Eye,
  ChevronDown,
  ChevronUp,
  Shield,
  Activity,
} from 'lucide-react';
import { getSeverityColor, getSeverityLabel, type ConflictZone } from '@/data/conflicts';

interface ConflictDetailProps {
  zone: ConflictZone;
  onClose: () => void;
}

function SeverityMeter({ severity }: { severity: number }) {
  const color = getSeverityColor(severity);
  const pct = (severity / 10) * 100;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-2xs font-mono text-muted/50 uppercase tracking-wider">Severity Index</span>
        <span className="text-sm font-mono font-bold" style={{ color }}>
          {severity.toFixed(1)}<span className="text-2xs text-muted/40">/10</span>
        </span>
      </div>
      <div className="relative h-2 rounded-full overflow-hidden bg-surface-300/60">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, #facc15, #f97316, ${color})`,
            boxShadow: `0 0 12px ${color}40`,
          }}
        />
      </div>
      <div className="flex justify-between mt-1 text-2xs font-mono text-muted/30">
        <span>Low</span>
        <span>Moderate</span>
        <span>High</span>
        <span>Extreme</span>
      </div>
    </div>
  );
}

function AnalysisSection({
  icon,
  title,
  children,
  defaultOpen = true,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/[0.04] last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-surface-300/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-2xs font-mono text-muted/60 uppercase tracking-wider">{title}</span>
        </div>
        {open ? (
          <ChevronUp className="w-3 h-3 text-muted/40" />
        ) : (
          <ChevronDown className="w-3 h-3 text-muted/40" />
        )}
      </button>
      {open && <div className="px-5 pb-4">{children}</div>}
    </div>
  );
}

export default function ConflictDetail({ zone, onClose }: ConflictDetailProps) {
  const color = getSeverityColor(zone.severity);
  const label = getSeverityLabel(zone.severity);

  return (
    <div className="fixed left-[340px] top-14 bottom-[88px] w-[400px] z-30 flex flex-col glass border-r border-white/[0.04] animate-slide-up overflow-hidden">
      {/* Header with severity accent */}
      <div
        className="relative px-5 pt-5 pb-4 border-b border-white/[0.04] overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${color}12 0%, transparent 60%)`,
        }}
      >
        {/* Shimmer overlay */}
        <div className="absolute inset-0 shimmer pointer-events-none" />
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-muted hover:text-white hover:bg-surface-300/50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-start gap-3 pr-8">
          <div className="mt-1.5 shrink-0">
            <div
              className="w-3.5 h-3.5 rounded-full"
              style={{ backgroundColor: color, boxShadow: `0 0 14px ${color}50` }}
            />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold text-white leading-tight">
              {zone.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-light/60">{zone.country}</span>
              <span className="text-white/10">·</span>
              <span className="text-xs text-muted-light/50">{zone.region}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-mono border"
                style={{ borderColor: color + '30', backgroundColor: color + '10', color: color + 'dd' }}
              >
                {zone.primaryType}
              </span>
            </div>
          </div>
        </div>

        {/* Severity Meter */}
        <div className="mt-4">
          <SeverityMeter severity={zone.severity} />
        </div>

        {/* Quick stats row */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-2xs font-mono text-muted/60">
            <Skull className="w-3 h-3" />
            <span className="text-white/70 font-medium">{zone.fatalities30d.toLocaleString()}</span>
            <span>fatalities (30d)</span>
          </div>
          <span className="text-white/10">|</span>
          <div className="flex items-center gap-1.5 text-2xs font-mono text-muted/60">
            <Activity className="w-3 h-3" />
            <span className="text-white/70 font-medium">{zone.eventCount}</span>
            <span>events</span>
          </div>
        </div>

        {/* Trend indicator */}
        <div className="mt-2.5">
          {zone.trend === 'escalating' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-severity-high/10 border border-severity-high/20 text-2xs font-mono text-severity-high">
              <TrendingUp className="w-3 h-3" /> Escalating — severity increasing week-over-week
            </span>
          )}
          {zone.trend === 'de-escalating' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-400/10 border border-emerald-400/20 text-2xs font-mono text-emerald-400">
              <TrendingDown className="w-3 h-3" /> De-escalating — reduced event frequency
            </span>
          )}
          {zone.trend === 'stable' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-300/50 border border-white/[0.06] text-2xs font-mono text-muted-light">
              <Minus className="w-3 h-3" /> Stable — no significant change in intensity
            </span>
          )}
        </div>
      </div>

      {/* Scrollable content — Structured AI Analysis */}
      <div className="flex-1 overflow-y-auto">
        {/* AI Analysis header */}
        <div className="flex items-center gap-2 px-5 pt-4 pb-2">
          <Sparkles className="w-4 h-4 text-accent-glow/70" />
          <span className="text-xs font-display font-semibold text-accent-glow/80">AI Intelligence Briefing</span>
          <span className="ml-auto text-2xs font-mono text-muted/30">Powered by Claude</span>
        </div>

        {/* Background */}
        <AnalysisSection
          icon={<Eye className="w-3.5 h-3.5 text-accent-glow/50" />}
          title="Background"
          defaultOpen={true}
        >
          <p className="text-[13px] leading-relaxed text-white/70 font-body">
            {zone.aiAnalysis.background}
          </p>
        </AnalysisSection>

        {/* Current Situation */}
        <AnalysisSection
          icon={<AlertTriangle className="w-3.5 h-3.5 text-severity-moderate/60" />}
          title="Current Situation"
          defaultOpen={true}
        >
          <p className="text-[13px] leading-relaxed text-white/70 font-body">
            {zone.aiAnalysis.currentSituation}
          </p>
        </AnalysisSection>

        {/* Key Actors */}
        <AnalysisSection
          icon={<Users className="w-3.5 h-3.5 text-muted-light/50" />}
          title="Key Actors"
          defaultOpen={true}
        >
          <div className="flex flex-wrap gap-1.5">
            {zone.aiAnalysis.keyActors.map(actor => (
              <span key={actor} className="px-2.5 py-1 rounded-md bg-surface-300/50 text-2xs text-muted-light/80 border border-white/[0.06] font-mono">
                {actor}
              </span>
            ))}
          </div>
        </AnalysisSection>

        {/* Humanitarian Impact */}
        <AnalysisSection
          icon={<Heart className="w-3.5 h-3.5 text-severity-high/50" />}
          title="Humanitarian Impact"
          defaultOpen={true}
        >
          <p className="text-[13px] leading-relaxed text-white/70 font-body">
            {zone.aiAnalysis.humanitarianImpact}
          </p>
        </AnalysisSection>

        {/* Outlook */}
        <AnalysisSection
          icon={<Shield className="w-3.5 h-3.5 text-accent/50" />}
          title="Outlook"
          defaultOpen={false}
        >
          <p className="text-[13px] leading-relaxed text-white/70 font-body">
            {zone.aiAnalysis.outlook}
          </p>
        </AnalysisSection>

        {/* Data Attribution */}
        <div className="px-5 py-2">
          <p className="text-2xs text-muted/30 font-mono">
            Generated from ACLED + GDELT data sources · Analysis updated 15 min ago
          </p>
        </div>

        {/* News Sources */}
        <div className="px-5 pt-3 pb-4 border-t border-white/[0.04]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-accent-glow/60" />
              <span className="text-xs font-display font-semibold text-white/80">News Sources</span>
            </div>
            <span className="text-2xs font-mono text-muted/40">via GDELT</span>
          </div>
          <div className="space-y-2">
            {zone.newsSources.map((source, i) => (
              <a
                key={i}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-surface-200/60 border border-white/[0.04] hover:border-accent/20 hover:bg-surface-300/40 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-surface-300/60 border border-white/[0.06] flex items-center justify-center shrink-0 mt-0.5 group-hover:border-accent/20 transition-colors">
                  <Globe2 className="w-4 h-4 text-muted/50 group-hover:text-accent-glow/60 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-white/80 group-hover:text-white transition-colors leading-snug line-clamp-2">
                    {source.headline}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xs font-mono font-medium text-accent-glow/60">{source.outlet}</span>
                    <span className="text-white/10">·</span>
                    <span className="text-2xs font-mono text-muted/40">{source.time}</span>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted/20 group-hover:text-accent-glow/50 transition-colors shrink-0 mt-1" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="flex items-center gap-2 px-5 py-3 border-t border-white/[0.04] bg-surface-50/50">
        <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-accent/80 hover:bg-accent text-white text-xs font-display font-semibold transition-colors shadow-lg shadow-accent/20">
          <BookmarkPlus className="w-4 h-4" />
          Watch Zone
        </button>
        <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-300/50 hover:bg-surface-300/80 text-muted-light text-xs font-display font-medium transition-colors border border-white/[0.06]">
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>
    </div>
  );
}
