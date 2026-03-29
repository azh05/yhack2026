"use client";

import { useState, useEffect, useRef } from "react";
import {
  Globe2,
  Bell,
  Search,
  Zap,
  Radio,
  X,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  User as UserIcon,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { ConflictZone } from "@/data/conflicts";
import type { User } from "@supabase/supabase-js";

interface NavbarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  conflictZones: ConflictZone[];
  isLoading?: boolean;
  user?: User | null;
  onSignInClick?: () => void;
  onSignOut?: () => void;
  onConflictSelect?: (zone: ConflictZone) => void;
  dbEventCount?: number;
}

export default function Navbar({
  searchQuery = "",
  onSearchChange,
  conflictZones,
  isLoading,
  user,
  onSignInClick,
  onSignOut,
  onConflictSelect,
  dbEventCount,
}: NavbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  const searchResults =
    searchQuery.trim().length > 0
      ? conflictZones
          .filter((z) => {
            const q = searchQuery.toLowerCase();
            return (
              z.name.toLowerCase().includes(q) ||
              z.country.toLowerCase().includes(q) ||
              z.region.toLowerCase().includes(q) ||
              z.primaryType.toLowerCase().includes(q)
            );
          })
          .slice(0, 8)
      : [];

  // Live clock
  const [timeStr, setTimeStr] = useState("");
  useEffect(() => {
    const update = () => {
      setTimeStr(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      );
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  const activeConflicts = conflictZones.length;
  const escalatingCount = conflictZones.filter(
    (z) => z.trend === "escalating",
  ).length;
  const countriesCount = new Set(conflictZones.map((z) => z.country)).size;
  const totalEvents = conflictZones.reduce((s, z) => s + z.eventCount, 0);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 glass border-b border-white/[0.04]">
      {/* Animated gradient bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px overflow-hidden">
        <div
          className="h-full w-[200%] animate-nav-border"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(249,115,22,0.3), rgba(59,130,246,0.2), transparent, rgba(249,115,22,0.2), transparent)",
          }}
        />
      </div>
      <div className="flex items-center justify-between h-full px-4">
        {/* Left: Logo */}
        <a href="/" className="flex items-center gap-3 group">
          <div className="relative flex items-center justify-center w-8 h-8">
            <Globe2
              className="w-6 h-6 text-orange-400 group-hover:text-orange-300 transition-colors"
              strokeWidth={1.5}
            />
            <div className="absolute inset-0 rounded-full bg-orange-400/10 animate-pulse-slow" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[15px] font-bold tracking-tight text-white">
              ConflictLens
            </span>
            <span className="text-2xs font-mono text-orange-400/70 tracking-wider uppercase">
              Beta
            </span>
          </div>
        </a>

        {/* Center: Live Status */}
        <div className="hidden md:flex items-center gap-5">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-200/50 border border-white/[0.04]">
            <div className="relative">
              <Radio className="w-3 h-3 text-emerald-400" />
              <div className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" />
            </div>
            <span className="text-2xs font-mono text-emerald-400/90 tracking-wide">
              LIVE
            </span>
            <span className="text-2xs font-mono text-white/30">
              {timeStr} UTC
            </span>
          </div>

          <div className="flex items-center gap-4 text-2xs font-mono text-muted-light/50">
            <span>
              <span className="text-white/80 font-medium tabular-nums">
                {isLoading ? "..." : countriesCount}
              </span>{" "}
              countries
            </span>
            <span className="text-white/[0.07]">|</span>
            <span>
              <span className="text-severity-high/80 font-medium tabular-nums">
                {isLoading ? "..." : escalatingCount}
              </span>{" "}
              escalating
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-light hover:text-white hover:bg-surface-300/50 transition-all"
            title={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={() => {
              const next = !searchOpen;
              setSearchOpen(next);
              if (!next) onSearchChange?.("");
            }}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-light hover:text-white hover:bg-surface-300/50 transition-all"
          >
            {searchOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </button>

          <button className="relative flex items-center justify-center w-9 h-9 rounded-lg text-muted-light hover:text-white hover:bg-surface-300/50 transition-all">
            <Bell className="w-4 h-4" />
            <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-severity-high border border-surface" />
          </button>

          <div className="w-px h-6 bg-white/[0.06] mx-1" />

          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-300/50 transition-all"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-accent/20 border border-accent/30">
                  <UserIcon className="w-3.5 h-3.5 text-accent-glow" />
                </div>
                <span className="text-xs text-white/80 hidden sm:inline">
                  Welcome,{" "}
                  <span className="font-medium text-white">{displayName}</span>
                </span>
                <ChevronDown className="w-3 h-3 text-muted-light/50" />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-56 glass border border-white/[0.08] rounded-xl p-1.5 animate-slide-up shadow-xl">
                  <div className="px-3 py-2 border-b border-white/[0.06] mb-1">
                    <p className="text-xs font-medium text-white/90 truncate">
                      {displayName}
                    </p>
                    <p className="text-2xs text-muted-light/50 truncate">
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onSignOut?.();
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-muted-light/70 hover:text-white hover:bg-surface-300/50 transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onSignInClick}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-orange-300/90 hover:bg-orange-500/10 transition-all border border-orange-400/20 hover:border-orange-400/40"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs">Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      {searchOpen && (
        <div className="absolute top-full left-0 right-0 glass border-b border-white/[0.04] animate-slide-up">
          <div className="max-w-xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-surface-200/80 border border-white/[0.06] focus-within:border-accent/30 transition-colors">
              <Search className="w-4 h-4 text-muted shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setSearchOpen(false);
                    onSearchChange?.("");
                  }
                }}
                placeholder="Search conflicts, countries, or regions..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-muted/60 outline-none font-body"
                autoFocus
              />
              <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-surface-300/80 text-2xs font-mono text-muted/60">
                ESC
              </kbd>
            </div>

            {/* Search Results */}
            {searchQuery.trim().length > 0 && (
              <div className="mt-2 rounded-xl bg-surface-200/90 border border-white/[0.06] overflow-hidden">
                {searchResults.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-muted/60">
                    No conflicts found for &ldquo;{searchQuery}&rdquo;
                  </div>
                ) : (
                  searchResults.map((zone) => (
                    <button
                      key={zone.id}
                      onClick={() => {
                        onConflictSelect?.(zone);
                        setSearchOpen(false);
                        onSearchChange?.("");
                      }}
                      className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-surface-300/50 transition-colors text-left"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-white/90 truncate">
                          {zone.name}
                        </p>
                        <p className="text-2xs text-muted-light/50">
                          {zone.country} &middot; {zone.region} &middot;{" "}
                          {zone.primaryType}
                        </p>
                      </div>
                      <span
                        className={`text-2xs font-mono px-1.5 py-0.5 rounded-full shrink-0 ml-3 ${
                          zone.trend === "escalating"
                            ? "bg-severity-high/10 text-severity-high/80"
                            : zone.trend === "de-escalating"
                              ? "bg-emerald-500/10 text-emerald-400/80"
                              : "bg-yellow-500/10 text-yellow-400/80"
                        }`}
                      >
                        {zone.trend}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
