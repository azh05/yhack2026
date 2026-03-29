"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Globe2,
  ArrowLeft,
  Skull,
  MapPin,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Newspaper,
  ExternalLink,
  Loader2,
  Share2,
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  ChevronDown,
} from "lucide-react";

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

function CountryOutline({ country }: { country: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pathData, setPathData] = useState<string[]>([]);

  useEffect(() => {
    // Fetch country GeoJSON from a free API
    fetch(
      `https://nominatim.openstreetmap.org/search?country=${encodeURIComponent(country)}&polygon_geojson=1&format=json&limit=1`,
      {
        headers: { "User-Agent": "LoveOverWar/1.0" },
      },
    )
      .then((res) => res.json())
      .then((data) => {
        if (!data?.[0]?.geojson) return;
        const geo = data[0].geojson;
        const bbox = data[0].boundingbox;
        // Convert GeoJSON coords to SVG path
        const paths = geoToSvgPaths(geo, bbox);
        setPathData(paths);
      })
      .catch(() => {});
  }, [country]);

  if (pathData.length === 0) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-[0.12]">
      <svg
        ref={svgRef}
        viewBox="0 0 800 600"
        className="w-[2000px] h-[1500px]"
        fill="white"
        fillOpacity="0.04"
        stroke="white"
        strokeWidth="0.8"
      >
        {pathData.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </svg>
    </div>
  );
}

// Convert GeoJSON coordinates to SVG path strings
function geoToSvgPaths(geojson: any, bbox: string[]): string[] {
  const [minLat, maxLat, minLng, maxLng] = bbox.map(Number);
  const width = 800;
  const height = 600;
  const padding = 40;

  const project = (lng: number, lat: number): [number, number] => {
    const x =
      padding + ((lng - minLng) / (maxLng - minLng)) * (width - padding * 2);
    const y =
      padding + ((maxLat - lat) / (maxLat - minLat)) * (height - padding * 2);
    return [x, y];
  };

  const ringToPath = (ring: number[][]) => {
    return (
      ring
        .map((coord, i) => {
          const [x, y] = project(coord[0], coord[1]);
          return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ") + " Z"
    );
  };

  const paths: string[] = [];
  if (geojson.type === "Polygon") {
    paths.push(ringToPath(geojson.coordinates[0]));
  } else if (geojson.type === "MultiPolygon") {
    for (const polygon of geojson.coordinates) {
      paths.push(ringToPath(polygon[0]));
    }
  }
  return paths;
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
      .then((res) => res.json())
      .then((data) => {
        if (data.briefing) setBriefing(data.briefing);
      })
      .catch(() => {})
      .finally(() => setBriefingLoading(false));

    fetch(
      `/api/news?country=${encodeURIComponent(country)}&keyword=conflict&limit=8`,
    )
      .then((res) => res.json())
      .then((data) => {
        const articles = (data.articles ?? []).map((a: any) => ({
          title: a.title,
          url: a.url,
          source_country: a.source || "",
          seendate: a.pubDate || a.pub_date || "",
        }));
        setNews(articles);
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
    <div className="min-h-screen bg-[#08090d] text-white font-body relative">
      <CountryOutline country={country} />

      {/* Header */}
      <header className="border-b border-white/[0.04] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push("/app")}
            className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Map
          </button>
          <div className="flex items-center gap-2 text-white/30">
            <Globe2 className="w-4 h-4" />
            <span className="text-xs font-medium">Love Over War</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold">{country}</h1>
          <p className="text-sm text-white/40 mt-1">
            Conflict Intelligence Briefing
          </p>
        </div>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 mb-8 rounded-lg bg-surface-200/50 border border-white/[0.06] text-xs text-white/60 hover:text-white hover:bg-surface-200/80 transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          {copied ? "Link copied!" : "Share this briefing"}
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
            <Section
              title="Current Situation"
              icon={<AlertTriangle className="w-4 h-4" />}
            >
              {briefing.current_situation}
            </Section>
            {briefing.key_actors.length > 0 && (
              <Section title="Key Actors" icon={<MapPin className="w-4 h-4" />}>
                <div className="flex flex-wrap gap-2 mt-2">
                  {briefing.key_actors.map((actor, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-surface-200/50 border border-white/[0.06] text-xs text-white/70"
                    >
                      {actor}
                    </span>
                  ))}
                </div>
              </Section>
            )}
            <Section
              title="Humanitarian Impact"
              icon={<Skull className="w-4 h-4" />}
            >
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
                      {article.source_country} ·{" "}
                      {article.seendate?.slice(0, 10) || ""}
                    </p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 shrink-0 mt-1" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* AI Chat */}
        <BriefingChat country={country} briefing={briefing} />

        {/* Footer */}
        <div className="border-t border-white/[0.04] mt-10 pt-6 text-center">
          <p className="text-xs text-white/20 font-mono">
            Generated by Love Over War · ACLED data · Powered by Gemini AI
          </p>
        </div>
      </main>
    </div>
  );
}

function BriefingChat({
  country,
  briefing,
}: {
  country: string;
  briefing: Briefing | null;
}) {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([
    {
      role: "assistant",
      text: `Ask me anything about the conflict in ${country}. I can go deeper on any section of the briefing, explain key actors, historical context, or humanitarian implications.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `[Context: User is reading the conflict briefing for ${country}. Briefing summary: ${briefing ? `Background: ${briefing.background?.slice(0, 200)}. Situation: ${briefing.current_situation?.slice(0, 200)}` : "Not yet loaded."}]\n\n${userMessage}`,
          history: messages.slice(-10),
        }),
      });

      const data = await res.json();
      if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: `Error: ${data.error}` },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: data.response },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Failed to connect. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border-t border-white/[0.04] pt-8">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-display font-semibold mb-4 group cursor-pointer"
      >
        <Bot className="w-4 h-4 text-accent-glow" />
        Ask AI — Go Deeper
        <ChevronDown
          className={`w-3.5 h-3.5 text-white/30 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="rounded-xl bg-surface-200/30 border border-white/[0.06] overflow-hidden">
          {/* Messages */}
          <div className="max-h-[400px] overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-accent/20 text-white/90 border border-accent/20"
                      : "bg-surface-200/80 text-white/70 border border-white/[0.04]"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="w-3 h-3 text-accent-glow/60" />
                      <span className="text-2xs font-mono text-accent-glow/50">
                        MARS
                      </span>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-surface-200/80 border border-white/[0.04] rounded-xl px-3.5 py-2.5">
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Analyzing...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/[0.04]">
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface-200/80 border border-white/[0.06] focus-within:border-accent/30 transition-colors">
              <MessageSquare className="w-4 h-4 text-white/20 shrink-0" />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={`Ask about ${country}...`}
                className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/25 outline-none font-body"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-1.5 rounded-lg bg-accent/80 text-white hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-xs font-mono text-white/40 uppercase tracking-wider mb-2">
        {icon}
        {title}
      </h3>
      <div className="text-sm text-white/70 leading-relaxed">{children}</div>
    </div>
  );
}
