"use client";

import { useState, useEffect } from "react";
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
  BookmarkCheck,
  ClipboardCheck,
  AlertTriangle,
  Heart,
  Eye,
  ChevronDown,
  ChevronUp,
  Shield,
  Activity,
  Loader2,
  Plane,
  HandHeart,
  CircleAlert,
  CircleCheck,
  TriangleAlert,
  OctagonAlert,
} from "lucide-react";
import {
  getSeverityColor,
  getSeverityLabel,
  getDonateUrl,
  getTravelAdvisory,
  type ConflictZone,
  type NewsSource,
  type AIAnalysis,
} from "@/data/conflicts";
import type { TravelAdvisory as TravelAdvisoryType } from "@/data/conflicts";

interface ConflictDetailProps {
  zone: ConflictZone;
  onClose: () => void;
}

function formatGdeltDate(seendate: string): string {
  try {
    // GDELT format: "20250328T120000Z"
    const year = seendate.slice(0, 4);
    const month = seendate.slice(4, 6);
    const day = seendate.slice(6, 8);
    return `${year}-${month}-${day}`;
  } catch {
    return seendate;
  }
}

function SeverityMeter({ severity }: { severity: number }) {
  const color = getSeverityColor(severity);
  const pct = (severity / 10) * 100;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-2xs font-mono text-muted/50 uppercase tracking-wider">
          Severity Index
        </span>
        <span className="text-sm font-mono font-bold" style={{ color }}>
          {severity.toFixed(1)}
          <span className="text-2xs text-muted/40">/10</span>
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
          <span className="text-2xs font-mono text-muted/60 uppercase tracking-wider">
            {title}
          </span>
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

const RISK_ICONS: Record<string, React.ReactNode> = {
  'do-not-travel': <OctagonAlert className="w-4 h-4" />,
  'avoid': <TriangleAlert className="w-4 h-4" />,
  'reconsider': <CircleAlert className="w-4 h-4" />,
  'caution': <CircleCheck className="w-4 h-4" />,
};

function TravelAdvisoryCard({ zone }: { zone: ConflictZone }) {
  const advisory = getTravelAdvisory(zone);
  return (
    <div className="space-y-3">
      {/* Risk level badge */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg border"
        style={{
          borderColor: advisory.color + '30',
          backgroundColor: advisory.color + '0a',
          color: advisory.color,
        }}
      >
        {RISK_ICONS[advisory.level]}
        <span className="text-xs font-display font-bold tracking-wide">
          {advisory.label}
        </span>
      </div>

      {/* Summary */}
      <p className="text-[13px] leading-relaxed text-white/70 font-body">
        {advisory.summary}
      </p>

      {/* Tips for travelers */}
      <div className="space-y-1.5">
        <span className="text-2xs font-mono text-muted/50 uppercase tracking-wider">
          Advice for travelers
        </span>
        <ul className="space-y-1.5">
          {advisory.tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-2xs text-white/55 leading-relaxed">
              <span className="mt-1 w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: advisory.color + '80' }} />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function ConflictDetail({ zone, onClose }: ConflictDetailProps) {
  const color = getSeverityColor(zone.severity);
  const label = getSeverityLabel(zone.severity);

  const [newsSources, setNewsSources] = useState<NewsSource[]>(
    zone.newsSources ?? [],
  );
  const [newsLoading, setNewsLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis>(zone.aiAnalysis);
  const [aiLoading, setAiLoading] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [shareMsg, setShareMsg] = useState('');

  useEffect(() => {
    if (zone.aiAnalysis.background) {
      setAiAnalysis(zone.aiAnalysis);
      return;
    }
    let cancelled = false;
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000";
    setAiLoading(true);
    fetch(`${backendUrl}/api/news?country=${encodeURIComponent(zone.country)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const articles: { title: string; content?: string }[] =
          data.articles ?? [];
        const combinedText = articles
          .map((a) => a.title + (a.content ? "\n" + a.content : ""))
          .join("\n\n");
        return fetch("/api/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ news: combinedText }),
        });
      })
      .then((res) => (res ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.summary) return;
        const summary: string = data.summary;

        const extract = (label: string, nextLabels: string[]): string => {
          const start = summary.indexOf(`**${label}:**`);
          if (start === -1) return "";
          const contentStart = start + `**${label}:**`.length;
          let end = summary.length;
          for (const next of nextLabels) {
            const idx = summary.indexOf(`**${next}:**`, contentStart);
            if (idx !== -1 && idx < end) end = idx;
          }
          return summary.slice(contentStart, end).trim();
        };

        const allLabels = [
          "Background",
          "Current Situation",
          "Key Actors",
          "Humanitarian Impact",
          "Outlook",
        ];
        setAiAnalysis({
          background: extract("Background", allLabels.slice(1)),
          currentSituation: extract("Current Situation", allLabels.slice(2)),
          keyActors: [],
          humanitarianImpact: extract(
            "Humanitarian Impact",
            allLabels.slice(4),
          ),
          outlook: extract("Outlook", []),
        });
      })
      .catch((err) => {
        console.error("[fetchAiAnalysis]", err);
      })
      .finally(() => {
        if (!cancelled) setAiLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [zone.country, zone.aiAnalysis]);

  useEffect(() => {
    if (zone.newsSources && zone.newsSources.length > 0) {
      setNewsSources(zone.newsSources);
      return;
    }
    let cancelled = false;
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000";
    setNewsLoading(true);
    fetch(`${backendUrl}/api/news?country=${encodeURIComponent(zone.country)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const sources: NewsSource[] = (data.articles ?? []).map(
          (a: {
            title: string;
            url: string;
            source_country: string;
            seendate: string;
          }) => ({
            headline: a.title,
            url: a.url,
            outlet: a.source_country || "Unknown",
            time: a.seendate ? formatGdeltDate(a.seendate) : "",
          }),
        );
        setNewsSources(sources);
      })
      .catch((err) => {
        console.error("[fetchNews]", err);
        if (!cancelled) setNewsSources([]);
      })
      .finally(() => {
        if (!cancelled) setNewsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [zone.country, zone.newsSources]);

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
              style={{
                backgroundColor: color,
                boxShadow: `0 0 14px ${color}50`,
              }}
            />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold text-white leading-tight">
              {zone.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-light/60">
                {zone.country}
              </span>
              <span className="text-white/10">·</span>
              <span className="text-xs text-muted-light/50">{zone.region}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-mono border"
                style={{
                  borderColor: color + "30",
                  backgroundColor: color + "10",
                  color: color + "dd",
                }}
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
            <span className="text-white/70 font-medium">
              {zone.fatalities30d.toLocaleString()}
            </span>
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
          {zone.trend === "escalating" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-severity-high/10 border border-severity-high/20 text-2xs font-mono text-severity-high">
              <TrendingUp className="w-3 h-3" /> Escalating — severity
              increasing week-over-week
            </span>
          )}
          {zone.trend === "de-escalating" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-400/10 border border-emerald-400/20 text-2xs font-mono text-emerald-400">
              <TrendingDown className="w-3 h-3" /> De-escalating — reduced event
              frequency
            </span>
          )}
          {zone.trend === "stable" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-300/50 border border-white/[0.06] text-2xs font-mono text-muted-light">
              <Minus className="w-3 h-3" /> Stable — no significant change in
              intensity
            </span>
          )}
        </div>
      </div>

      {/* Scrollable content — Structured AI Analysis */}
      <div className="flex-1 overflow-y-auto">
        {/* AI Analysis header */}
        <div className="flex items-center gap-2 px-5 pt-4 pb-2">
          <Sparkles className="w-4 h-4 text-accent-glow/70" />
          <span className="text-xs font-display font-semibold text-accent-glow/80">
            AI Intelligence Briefing
          </span>
          <span className="ml-auto text-2xs font-mono text-muted/30">
            Powered by Claude
          </span>
        </div>

        {/* Background */}
        <AnalysisSection
          icon={<Eye className="w-3.5 h-3.5 text-accent-glow/50" />}
          title="Background"
          defaultOpen={true}
        >
          {aiLoading ? (
            <div className="flex items-center gap-2 py-2 text-muted/50">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="text-2xs font-mono">Generating analysis…</span>
            </div>
          ) : (
            <p className="text-[13px] leading-relaxed text-white/70 font-body">
              {aiAnalysis.background}
            </p>
          )}
        </AnalysisSection>

        {/* Current Situation */}
        <AnalysisSection
          icon={
            <AlertTriangle className="w-3.5 h-3.5 text-severity-moderate/60" />
          }
          title="Current Situation"
          defaultOpen={true}
        >
          {aiLoading ? (
            <div className="flex items-center gap-2 py-2 text-muted/50">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="text-2xs font-mono">Generating analysis…</span>
            </div>
          ) : (
            <p className="text-[13px] leading-relaxed text-white/70 font-body">
              {aiAnalysis.currentSituation}
            </p>
          )}
        </AnalysisSection>

        {/* Key Actors */}
        <AnalysisSection
          icon={<Users className="w-3.5 h-3.5 text-muted-light/50" />}
          title="Key Actors"
          defaultOpen={true}
        >
          {aiLoading ? (
            <div className="flex items-center gap-2 py-2 text-muted/50">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="text-2xs font-mono">Generating analysis…</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {aiAnalysis.keyActors.map((actor) => (
                <span
                  key={actor}
                  className="px-2.5 py-1 rounded-md bg-surface-300/50 text-2xs text-muted-light/80 border border-white/[0.06] font-mono"
                >
                  {actor}
                </span>
              ))}
            </div>
          )}
        </AnalysisSection>

        {/* Humanitarian Impact */}
        <AnalysisSection
          icon={<Heart className="w-3.5 h-3.5 text-severity-high/50" />}
          title="Humanitarian Impact"
          defaultOpen={true}
        >
          {aiLoading ? (
            <div className="flex items-center gap-2 py-2 text-muted/50">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="text-2xs font-mono">Generating analysis…</span>
            </div>
          ) : (
            <p className="text-[13px] leading-relaxed text-white/70 font-body">
              {aiAnalysis.humanitarianImpact}
            </p>
          )}
        </AnalysisSection>

        {/* Outlook */}
        <AnalysisSection
          icon={<Shield className="w-3.5 h-3.5 text-accent/50" />}
          title="Outlook"
          defaultOpen={false}
        >
          {aiLoading ? (
            <div className="flex items-center gap-2 py-2 text-muted/50">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="text-2xs font-mono">Generating analysis…</span>
            </div>
          ) : (
            <p className="text-[13px] leading-relaxed text-white/70 font-body">
              {aiAnalysis.outlook}
            </p>
          )}
        </AnalysisSection>

        {/* Travel Advisory */}
        <AnalysisSection
          icon={<Plane className="w-3.5 h-3.5 text-accent-glow/50" />}
          title="Travel Advisory"
          defaultOpen={true}
        >
          <TravelAdvisoryCard zone={zone} />
        </AnalysisSection>

        {/* Donate / Take Action */}
        <div className="px-5 py-4 border-b border-white/[0.04]">
          <div className="rounded-xl overflow-hidden border border-rose-500/20 bg-gradient-to-br from-rose-500/[0.06] to-transparent">
            <div className="px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <HandHeart className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-display font-semibold text-white/90">Take Action</span>
              </div>
              <p className="text-2xs text-white/50 leading-relaxed mb-3">
                People in {zone.country} need urgent humanitarian aid. Donate to verified organizations providing relief on the ground.
              </p>
              <a
                href={getDonateUrl(zone.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-rose-500/80 hover:bg-rose-500 text-white text-xs font-display font-semibold transition-colors shadow-lg shadow-rose-500/20"
              >
                <Heart className="w-4 h-4" />
                Donate to Help {zone.country}
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
              <p className="text-center text-2xs text-muted/30 font-mono mt-2">
                Opens verified humanitarian organization page
              </p>
            </div>
          </div>
        </div>

        {/* Data Attribution */}
        <div className="px-5 py-2">
          <p className="text-2xs text-muted/30 font-mono">
            Generated from ACLED + GDELT data sources · Powered by Claude AI
          </p>
        </div>

        {/* News Sources */}
        <div className="px-5 pt-3 pb-4 border-t border-white/[0.04]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-accent-glow/60" />
              <span className="text-xs font-display font-semibold text-white/80">
                News Sources
              </span>
            </div>
            <span className="text-2xs font-mono text-muted/40">via GDELT</span>
          </div>
          {newsLoading && (
            <div className="flex items-center gap-2 py-4 justify-center text-muted/50">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-2xs font-mono">
                Fetching news via GDELT...
              </span>
            </div>
          )}
          {!newsLoading && newsSources.length === 0 && (
            <p className="text-2xs font-mono text-muted/40 py-3 text-center">
              No news articles found
            </p>
          )}
          <div className="space-y-2">
            {newsSources.map((source, i) => (
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
                    <span className="text-2xs font-mono font-medium text-accent-glow/60">
                      {source.outlet}
                    </span>
                    <span className="text-white/10">·</span>
                    <span className="text-2xs font-mono text-muted/40">
                      {source.time}
                    </span>
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
        <button
          onClick={() => setIsWatching(prev => !prev)}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-display font-semibold transition-colors shadow-lg ${
            isWatching
              ? 'bg-emerald-500/80 hover:bg-emerald-500 text-white shadow-emerald-500/20'
              : 'bg-accent/80 hover:bg-accent text-white shadow-accent/20'
          }`}
        >
          {isWatching ? <BookmarkCheck className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
          {isWatching ? 'Watching' : 'Watch Zone'}
        </button>
        <button
          onClick={async () => {
            const url = `${window.location.origin}/app?zone=${encodeURIComponent(zone.id)}`;
            const text = `${zone.name} — ${zone.country} | Severity ${zone.severity}/10 | ConflictLens`;
            if (navigator.share) {
              try { await navigator.share({ title: zone.name, text, url }); } catch {}
            } else {
              await navigator.clipboard.writeText(url);
              setShareMsg('Copied!');
              setTimeout(() => setShareMsg(''), 2000);
            }
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-300/50 hover:bg-surface-300/80 text-muted-light text-xs font-display font-medium transition-colors border border-white/[0.06]"
        >
          {shareMsg ? <ClipboardCheck className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          {shareMsg || 'Share'}
        </button>
      </div>
    </div>
  );
}
