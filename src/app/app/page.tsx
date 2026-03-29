"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import LeftPanel from "@/components/LeftPanel";
import RightPanel from "@/components/RightPanel";
import ChatPanel from "@/components/ChatPanel";
import TimelineBar from "@/components/TimelineBar";
import ConflictDetail from "@/components/ConflictDetail";
import ShaderBackground from "@/components/ShaderBackground";
import type { ConflictZone } from "@/data/conflicts";
import type { MapFilters } from "@/data/filters";
import { useConflictEvents } from "@/lib/useConflictEvents";
import { buildZonesFromEvents } from "@/lib/buildZonesFromEvents";
import { useAuth } from "@/lib/useAuth";
import { useWatchlist } from "@/lib/useWatchlist";
import AuthModal from "@/components/AuthModal";
import { PanelLeft, Layers, Bot } from "lucide-react";

const MapGlobe = dynamic(() => import("@/components/MapGlobe"), {
  ssr: false,
  loading: () => (
    <div
      className="absolute inset-0 flex items-center justify-center bg-surface"
      style={{ top: "56px" }}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-accent/20 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-t-accent border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        </div>
        <span className="text-sm font-display text-white/60">
          Loading Globe...
        </span>
      </div>
    </div>
  ),
});

export default function AppPage() {
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<ConflictZone | null>(
    null,
  );
  const [timelineDate, setTimelineDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");

  // Filter state lifted to app level so RightPanel controls flow to MapGlobe
  const [filters, setFilters] = useState<MapFilters>({
    activeTypes: new Set([
      "battles",
      "violence_civilians",
      "explosions",
      "riots",
    ]),
    selectedRegion: "All Regions",
    severityRange: [1, 10],
    overlays: {
      heatmap: true,
      clusters: false,
      borders: false,
    },
  });

  const needsAllTypes =
    filters.activeTypes.has("protests") || filters.activeTypes.has("strategic");
  const {
    events: dbEvents,
    earliestDate,
    loading: eventsLoading,
  } = useConflictEvents(timelineDate, needsAllTypes);
  const conflictZones = useMemo(
    () => buildZonesFromEvents(dbEvents),
    [dbEvents],
  );
  const { user, signUp, signIn, signOut } = useAuth();
  const { watchlist, isWatching, addCountry, removeCountry } = useWatchlist(
    user?.id,
  );
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [flyToTarget, setFlyToTarget] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [pendingChatMessage, setPendingChatMessage] = useState<string | null>(
    null,
  );

  const handleMapCommand = useCallback(
    (cmd: { action: string; country: string; lat: number; lng: number }) => {
      if (cmd.action === "flyTo") {
        setFlyToTarget({ lat: cmd.lat, lng: cmd.lng });
      }
    },
    [],
  );

  const handleConflictSelect = useCallback(
    (zone: ConflictZone | null) => {
      setSelectedConflict(zone);
      if (zone && !leftPanelOpen) {
        setLeftPanelOpen(true);
      }
    },
    [leftPanelOpen],
  );

  const handleDateChange = useCallback((date: Date) => {
    setTimelineDate(date);
  }, []);

  const handleFiltersChange = useCallback((newFilters: MapFilters) => {
    setFilters(newFilters);
  }, []);

  const handleAuth = useCallback(
    async (
      email: string,
      password: string,
      isSignUp: boolean,
      name?: string,
    ) => {
      if (isSignUp) {
        await signUp(email, password, name);
      } else {
        await signIn(email, password);
      }
    },
    [signUp, signIn],
  );

  return (
    <main className="h-screen w-screen overflow-hidden bg-surface relative">
      {/* Subtle shader background behind everything */}
      <ShaderBackground />

      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        conflictZones={conflictZones}
        isLoading={eventsLoading}
        user={user}
        onSignInClick={() => setAuthModalOpen(true)}
        onSignOut={signOut}
        onConflictSelect={(zone) => {
          handleConflictSelect(zone);
          setFlyToTarget({ lat: zone.latitude, lng: zone.longitude });
        }}
        dbEventCount={dbEvents.length}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuth={handleAuth}
      />

      <MapGlobe
        onConflictSelect={handleConflictSelect}
        selectedConflict={selectedConflict}
        timelineDate={timelineDate}
        filters={filters}
        rightPanelOpen={rightPanelOpen}
        conflictZones={conflictZones}
        dbEvents={dbEvents}
        flyToTarget={flyToTarget}
      />

      <LeftPanel
        isOpen={leftPanelOpen}
        onToggle={() => setLeftPanelOpen(false)}
        onConflictSelect={(zone) => handleConflictSelect(zone)}
        selectedConflict={selectedConflict}
        timelineDate={timelineDate}
        filters={filters}
        searchQuery={searchQuery}
        conflictZones={conflictZones}
        isLoading={eventsLoading}
        watchlist={watchlist}
        isLoggedIn={!!user}
      />

      {selectedConflict && leftPanelOpen && (
        <ConflictDetail
          zone={selectedConflict}
          onClose={() => setSelectedConflict(null)}
          timelineDate={timelineDate}
          isWatching={isWatching(selectedConflict.country)}
          onToggleWatch={(country) => {
            if (!user) {
              setAuthModalOpen(true);
              return;
            }
            if (isWatching(country)) {
              removeCountry(country);
            } else {
              addCountry(country);
            }
          }}
          onAskAI={(message) => {
            setChatOpen(true);
            setPendingChatMessage(message);
          }}
        />
      )}

      <RightPanel
        isOpen={rightPanelOpen}
        onToggle={() => setRightPanelOpen(false)}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      <ChatPanel
        isOpen={chatOpen}
        onToggle={() => setChatOpen(false)}
        onMapCommand={handleMapCommand}
        pendingMessage={pendingChatMessage}
        onPendingMessageHandled={() => setPendingChatMessage(null)}
      />

      {!leftPanelOpen && (
        <button
          onClick={() => setLeftPanelOpen(true)}
          className="fixed left-4 top-20 z-20 flex items-center gap-2 px-3 py-2 rounded-lg glass glass-hover transition-all"
        >
          <PanelLeft className="w-4 h-4 text-accent-glow/70" />
          <span className="text-xs text-white/70">Conflicts</span>
        </button>
      )}

      {!rightPanelOpen && !chatOpen && (
        <div className="fixed right-4 top-44 z-20 flex flex-col gap-2">
          <button
            onClick={() => setRightPanelOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg glass glass-hover transition-all"
          >
            <Layers className="w-4 h-4 text-accent-glow/70" />
            <span className="text-xs text-white/70">Layers</span>
          </button>
          <button
            onClick={() => setChatOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg glass glass-hover transition-all"
          >
            <Bot className="w-4 h-4 text-accent-glow/70" />
            <span className="text-xs text-white/70">Mars</span>
          </button>
        </div>
      )}

      <TimelineBar
        onDateChange={handleDateChange}
        eventCount={dbEvents.length}
        earliestDate={earliestDate}
      />

      {/* Ambient corner gradients */}
      <div
        className="fixed bottom-16 left-0 w-96 h-96 pointer-events-none z-[1] opacity-30"
        style={{
          background:
            "radial-gradient(ellipse at bottom left, rgba(59,130,246,0.06), transparent 70%)",
        }}
      />
      <div
        className="fixed top-14 right-0 w-96 h-96 pointer-events-none z-[1] opacity-20"
        style={{
          background:
            "radial-gradient(ellipse at top right, rgba(239,68,68,0.04), transparent 70%)",
        }}
      />
    </main>
  );
}
