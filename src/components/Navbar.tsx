'use client';

import { useState } from 'react';
import {
  Globe2,
  Bell,
  Search,
  User,
  Zap,
  Radio,
  ChevronDown,
} from 'lucide-react';

export default function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 glass border-b border-white/[0.04]">
      <div className="flex items-center justify-between h-full px-4">
        {/* Left: Logo + Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8">
            <Globe2 className="w-6 h-6 text-accent-glow" strokeWidth={1.5} />
            <div className="absolute inset-0 rounded-full bg-accent/10 animate-pulse-slow" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[15px] font-bold tracking-tight text-white">
              ConflictLens
            </span>
            <span className="text-2xs font-mono text-accent-glow/70 tracking-wider uppercase">
              Beta
            </span>
          </div>
        </div>

        {/* Center: Live Status */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-200/50 border border-white/[0.04]">
            <div className="relative">
              <Radio className="w-3 h-3 text-emerald-400" />
              <div className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" />
            </div>
            <span className="text-2xs font-mono text-emerald-400/90 tracking-wide">
              LIVE DATA
            </span>
          </div>

          <div className="flex items-center gap-4 text-2xs font-mono text-muted-light/50">
            <span>
              <span className="text-white/80 font-medium">46</span> active conflicts
            </span>
            <span className="text-white/10">|</span>
            <span>
              <span className="text-severity-high/80 font-medium">16</span> escalating
            </span>
            <span className="text-white/10">|</span>
            <span>
              <span className="text-white/80 font-medium">76</span> countries
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {/* Search */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-light hover:text-white hover:bg-surface-300/50 transition-all"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Notifications */}
          <button className="relative flex items-center justify-center w-9 h-9 rounded-lg text-muted-light hover:text-white hover:bg-surface-300/50 transition-all">
            <Bell className="w-4 h-4" />
            <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-severity-high border border-surface" />
          </button>

          {/* Separator */}
          <div className="w-px h-6 bg-white/[0.06] mx-1" />

          {/* User / Sign in */}
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-accent-glow/90 hover:bg-accent/10 transition-all border border-accent/20 hover:border-accent/40">
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs">Sign In</span>
          </button>
        </div>
      </div>

      {/* Search Bar - Expandable */}
      {searchOpen && (
        <div className="absolute top-full left-0 right-0 glass border-b border-white/[0.04] animate-slide-up">
          <div className="max-w-xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-surface-200/80 border border-white/[0.06] focus-within:border-accent/30 transition-colors">
              <Search className="w-4 h-4 text-muted shrink-0" />
              <input
                type="text"
                placeholder="Search conflicts, countries, or regions..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-muted/60 outline-none font-body"
                autoFocus
              />
              <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-surface-300/80 text-2xs font-mono text-muted/60">
                ESC
              </kbd>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
