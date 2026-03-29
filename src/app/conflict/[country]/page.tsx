'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Globe2, ArrowLeft, Skull, MapPin, AlertTriangle,
  TrendingUp, TrendingDown, Minus, Newspaper, ExternalLink, Loader2, Share2,
} from 'lucide-react';

interface Briefing {
  country: string;
  background: string;
  current_situation: string;
  humanitarian_impact: string;
  outlook: string;
  key_actors: string[];
}

interface NewsArticle {
  title: string;
  url: string;
  source_country: string;
  seendate: string;
}

export default function ConflictPage() {
  const params = useParams();
  const router = useRouter();
  const country = decodeURIComponent(params.country as string);

  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [briefingLoading, setBriefingLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/briefing?country=${encodeURIComponent(country)}`)
      .then(res => res.json())
      .then(data => {
        if (data.briefing) setBriefing(data.briefing);
      })
      .catch(() => {})
      .finally(() => setBriefingLoading(false));

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://127.0.0.1:8000';
    fetch(`${backendUrl}/api/news?country=${encodeURIComponent(country)}`)
      .then(res => res.json())
      .then(data => {
        const articles = (data.articles ?? []) as NewsArticle[];
        // English first
        const isEng = (a: NewsArticle) => /^[\x20-\x7E]{10,}/.test(a.title);
        articles.sort((a, b) => (isEng(a) ? 0 : 1) - (isEng(b) ? 0 : 1));
        setNews(articles.slice(0, 8));
      })
      .catch(() => {})
      .finally(() => setNewsLoading(false));
  }, [country]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#08090d] text-white font-body">
      {/* Header */}
      <header className="border-b border-white/[0.04] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/app')}
            className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Map
          </button>
          <div className="flex items-center gap-2 text-white/30">
            <Globe2 className="w-4 h-4" />
            <span className="text-xs font-medium">ConflictLens</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold">{country}</h1>
          <p className="text-sm text-white/40 mt-1">Conflict Intelligence Briefing</p>
        </div>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 mb-8 rounded-lg bg-surface-200/50 border border-white/[0.06] text-xs text-white/60 hover:text-white hover:bg-surface-200/80 transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          {copied ? 'Link copied!' : 'Share this briefing'}
        </button>

        {/* AI Briefing */}
        {briefingLoading ? (
          <div className="flex items-center gap-2 text-white/40 mb-10">
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating intelligence briefing...
          </div>
        ) : briefing ? (
          <div className="space-y-6 mb-10">
            <Section title="Background" icon={<Globe2 className="w-4 h-4" />}>
              {briefing.background}
            </Section>
            <Section title="Current Situation" icon={<AlertTriangle className="w-4 h-4" />}>
              {briefing.current_situation}
            </Section>
            {briefing.key_actors.length > 0 && (
              <Section title="Key Actors" icon={<MapPin className="w-4 h-4" />}>
                <div className="flex flex-wrap gap-2 mt-2">
                  {briefing.key_actors.map((actor, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-surface-200/50 border border-white/[0.06] text-xs text-white/70">
                      {actor}
                    </span>
                  ))}
                </div>
              </Section>
            )}
            <Section title="Humanitarian Impact" icon={<Skull className="w-4 h-4" />}>
              {briefing.humanitarian_impact}
            </Section>
            <Section title="Outlook" icon={<TrendingUp className="w-4 h-4" />}>
              {briefing.outlook}
            </Section>
          </div>
        ) : (
          <p className="text-white/30 mb-10">No briefing available.</p>
        )}

        {/* News */}
        <div className="border-t border-white/[0.04] pt-8">
          <h2 className="flex items-center gap-2 text-sm font-display font-semibold mb-4">
            <Newspaper className="w-4 h-4 text-white/40" />
            Latest News
          </h2>
          {newsLoading ? (
            <div className="flex items-center gap-2 text-white/40">
              <Loader2 className="w-4 h-4 animate-spin" />
              Fetching news...
            </div>
          ) : news.length === 0 ? (
            <p className="text-white/30 text-sm">No recent articles found.</p>
          ) : (
            <div className="space-y-3">
              {news.map((article, i) => (
                <a
                  key={i}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3 rounded-lg bg-surface-200/30 border border-white/[0.04] hover:bg-surface-200/60 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 group-hover:text-white transition-colors line-clamp-2">
                      {article.title}
                    </p>
                    <p className="text-xs text-white/30 mt-1">
                      {article.source_country} · {article.seendate?.slice(0, 10) || ''}
                    </p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 shrink-0 mt-1" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.04] mt-10 pt-6 text-center">
          <p className="text-xs text-white/20 font-mono">
            Generated by ConflictLens · ACLED + GDELT data · Powered by Gemini AI
          </p>
        </div>
      </main>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-xs font-mono text-white/40 uppercase tracking-wider mb-2">
        {icon}
        {title}
      </h3>
      <div className="text-sm text-white/70 leading-relaxed">
        {children}
      </div>
    </div>
  );
}
