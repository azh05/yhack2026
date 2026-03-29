"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import LeftPanel from "@/components/LeftPanel";
import RightPanel from "@/components/RightPanel";
import ChatPanel from "@/components/ChatPanel";
import TimelineBar from "@/components/TimelineBar";
import ConflictDetail from "@/components/ConflictDetail";
import { type ConflictZone } from "@/data/conflicts";
import { useConflictEvents, filterEventsByDate } from "@/lib/useConflictEvents";
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

export default function Home() {
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedConflict, setSelectedConflict] =
    useState<ConflictZone | null>(null);
  const [timelineDate, setTimelineDate] = useState(new Date());
  const [conflictZones, setConflictZones] = useState<ConflictZone[]>([]);
  const [zonesLoading, setZonesLoading] = useState(false);
  const { events: dbEvents } = useConflictEvents();
  const [flyToTarget, setFlyToTarget] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const handleMapCommand = useCallback(
    (cmd: { action: string; country: string; lat: number; lng: number }) => {
      if (cmd.action === "flyTo") {
        setFlyToTarget({ lat: cmd.lat, lng: cmd.lng });
      }
    },
    [],
  );

  const fetchZones = useCallback(async () => {
    setZonesLoading(true);
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000";
    try {
      const res = await fetch(`${backendUrl}/api/conflict-zones`);
      if (!res.ok) throw new Error(`API responded ${res.status}`);
      const data = await res.json();
      const zones: ConflictZone[] = data.map(
        (
          item: Omit<ConflictZone, "aiAnalysis" | "newsSources" | "events">,
        ) => ({
          ...item,
          aiAnalysis: {
            background: "",
            currentSituation: "",
            humanitarianImpact: "",
            outlook: "",
            keyActors: [],
          },
          newsSources: [],
          events: [],
        }),
      );
      setConflictZones(zones);
    } catch (err) {
      console.error("[fetchZones]", err);
      setConflictZones([]);
    } finally {
      setZonesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchZones();
  }, []);

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

  return (
    <main className="h-screen w-screen overflow-hidden bg-surface relative">
      <Navbar conflictZones={conflictZones} isLoading={zonesLoading} />

      <MapGlobe
        onConflictSelect={handleConflictSelect}
        selectedConflict={selectedConflict}
        timelineDate={timelineDate}
        conflictZones={conflictZones}
        dbEvents={dbEvents}
        flyToTarget={flyToTarget}
      />

      <LeftPanel
        isOpen={leftPanelOpen}
        onToggle={() => setLeftPanelOpen(false)}
        onConflictSelect={(zone) => handleConflictSelect(zone)}
        selectedConflict={selectedConflict}
        conflictZones={conflictZones}
        isLoading={zonesLoading}
      />

      {selectedConflict && leftPanelOpen && (
        <ConflictDetail
          zone={selectedConflict}
          onClose={() => setSelectedConflict(null)}
        />
      )}

      <RightPanel
        isOpen={rightPanelOpen}
        onToggle={() => setRightPanelOpen(false)}
      />

      <ChatPanel
        isOpen={chatOpen}
        onToggle={() => setChatOpen(false)}
        onMapCommand={handleMapCommand}
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
        <div className="fixed right-4 top-20 z-20 flex flex-col gap-2">
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
            <span className="text-xs text-white/70">War AI</span>
          </button>
        </div>
      )}

      <TimelineBar
        onDateChange={handleDateChange}
        eventCount={filterEventsByDate(dbEvents, timelineDate).length}
        earliestDate={
          dbEvents.length > 0
            ? dbEvents.reduce(
                (min, e) => (e.event_date < min ? e.event_date : min),
                dbEvents[0].event_date,
              )
            : undefined
        }
      />

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
