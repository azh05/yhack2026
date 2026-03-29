"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Heart,
  ArrowRight,
  Shield,
  Radio,
  BarChart3,
  Crosshair,
  Eye,
  Globe2,
} from "lucide-react";

const CobeGlobe = dynamic(() => import("@/components/ui/cobe-globe"), {
  ssr: false,
});

const FEATURES = [
  {
    icon: <Globe2 className="w-5 h-5" />,
    title: "3D Globe",
    desc: "Interactive Mapbox globe with heatmaps and clustering",
  },
  {
    icon: <Radio className="w-5 h-5" />,
    title: "Live Feeds",
    desc: "Real-time ACLED data and Google News ingestion",
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: "Timeline",
    desc: "Scrub through months of conflict history",
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: "AI Briefings",
    desc: "Claude-powered intelligence analysis",
  },
  {
    icon: <Crosshair className="w-5 h-5" />,
    title: "Filters",
    desc: "Region, severity, and event type controls",
  },
  {
    icon: <Eye className="w-5 h-5" />,
    title: "Forecast",
    desc: "Projected conflict trajectories",
  },
];

function AnimatedCount({ target }: { target: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (target <= 0) return;
    const duration = 1800;
    const startTime = performance.now();

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [target]);

  return (
    <span ref={ref} className="inline-flex overflow-hidden">
      {String(display)
        .split("")
        .map((digit, i) => (
          <span
            key={i}
            className="inline-block animate-[flipIn_0.4s_ease-out]"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {digit}
          </span>
        ))}
    </span>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [conflictCount, setConflictCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/events-light?page=0&page_size=5000")
      .then((res) => res.json())
      .then((data) => {
        if (data.total_countries) setConflictCount(data.total_countries);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#08090d] text-white font-body">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto w-full px-6 lg:px-12 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — Copy */}
          <div className="relative z-10 py-20 lg:py-0">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                <span className="text-[10px] font-mono font-semibold text-red-400 tracking-wider uppercase">
                  Live
                </span>
              </div>
              <span className="text-xs font-mono text-white/40 tracking-widest uppercase">
                Tracking{" "}
                <span className="text-white/70 font-semibold tabular-nums">
                  {conflictCount != null ? (
                    <AnimatedCount target={conflictCount} />
                  ) : (
                    "..."
                  )}
                </span>{" "}
                active conflicts
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.05] tracking-tight">
              <span className="text-white">See the world</span>
              <br />
              <span className="text-white/50">as it happens.</span>
            </h1>

            <p className="mt-6 text-lg text-white/35 max-w-md leading-relaxed">
              Track armed conflicts, humanitarian crises, and geopolitical
              shifts on an interactive 3D globe — powered by AI.
            </p>

            <div className="flex items-center gap-4 mt-10">
              <button
                onClick={() => router.push("/app")}
                className="group flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-medium text-sm transition-all hover:bg-white/90"
              >
                Open Map
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() =>
                  document
                    .getElementById("features")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="px-6 py-3 text-white/50 hover:text-white/80 text-sm font-medium transition-colors"
              >
                Learn more
              </button>
            </div>

            <div className="flex items-center gap-6 mt-16 text-xs font-mono text-white/25">
              <span>ACLED</span>
              <span className="w-px h-3 bg-white/10" />
              <span>Google News</span>
              <span className="w-px h-3 bg-white/10" />
              <span>Gemini AI</span>
            </div>
          </div>

          {/* Right — Globe */}
          <div className="relative flex items-center justify-center">
            <div className="w-full max-w-[520px] aspect-square relative">
              {/* Subtle glow behind globe */}
              <div className="absolute inset-0 rounded-full bg-red-900/[0.06] blur-[60px] scale-90" />
              <CobeGlobe className="relative z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="py-24 px-6 lg:px-12 border-t border-white/[0.04]"
      >
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.04] rounded-xl overflow-hidden">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="bg-[#08090d] p-8 hover:bg-white/[0.02] transition-colors"
              >
                <div className="text-white/30 mb-3">{f.icon}</div>
                <h3 className="text-sm font-display font-bold text-white/80 mb-1">
                  {f.title}
                </h3>
                <p className="text-xs text-white/30 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <button
          onClick={() => router.push("/app")}
          className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-black rounded-lg font-medium transition-all hover:bg-white/90"
        >
          Launch Love Over War
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/30">
            <Heart className="w-4 h-4 text-red-500/60" />
            <span className="text-xs font-medium">Love Over War</span>
          </div>
          <p className="text-xs text-white/15 font-mono">YHack 2026</p>
        </div>
      </footer>
    </div>
  );
}
