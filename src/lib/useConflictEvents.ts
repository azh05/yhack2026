'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface DBEvent {
  id: number;
  event_date: string;
  event_type: string;
  sub_event_type: string | null;
  actor1: string | null;
  actor2: string | null;
  country: string;
  admin1: string | null;
  admin2: string | null;
  latitude: number;
  longitude: number;
  fatalities: number;
  notes: string | null;
  source: string | null;
  severity_score: number | null;
  created_at: string;
}

export function useConflictEvents(timelineDate: Date) {
  const [events, setEvents] = useState<DBEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [earliestDate, setEarliestDate] = useState<string | undefined>();
  const lastFetchedWindow = useRef<string>('');

  const fetchEvents = useCallback(async (date: Date) => {
    const endStr = date.toISOString().split('T')[0];
    const windowStart = new Date(date);
    windowStart.setDate(windowStart.getDate() - 60);
    const startStr = windowStart.toISOString().split('T')[0];

    // Don't refetch if we're in the same window (rounded to week)
    const windowKey = `${startStr.slice(0, 7)}-${endStr.slice(0, 7)}`;
    if (windowKey === lastFetchedWindow.current) return;
    lastFetchedWindow.current = windowKey;

    try {
      setLoading(true);
      // Fast first load: only events with fatalities (much smaller set, renders instantly)
      const fastRes = await fetch(`/api/events?start_date=${startStr}&end_date=${endStr}&min_fatalities=1&limit=10000`);
      const fastData = await fastRes.json();
      if (!fastData.error) {
        setEvents(fastData.events || []);
        setLoading(false);
      }

      // Then backfill all events (including 0-fatality) in background
      const fullRes = await fetch(`/api/events?start_date=${startStr}&end_date=${endStr}&limit=50000`);
      const fullData = await fullRes.json();
      if (!fullData.error) {
        setEvents(fullData.events || []);
      }
    } catch {
      setError('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, []);

  // Set earliest date to match our data
  useEffect(() => {
    setEarliestDate('2024-01-06');
  }, []);

  useEffect(() => {
    fetchEvents(timelineDate);
  }, [timelineDate, fetchEvents]);

  return { events, loading, error, earliestDate };
}

// No-op filter since we fetch the window server-side now
export function filterEventsByDate(events: DBEvent[]): DBEvent[] {
  return events;
}

// Aggregate DB events into country-level zones for the left panel & navbar
export function aggregateEventsToZones(events: DBEvent[]): {
  id: string;
  name: string;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
  severity: number;
  eventCount: number;
  fatalities30d: number;
  trend: 'escalating' | 'stable' | 'de-escalating';
  primaryType: string;
  description: string;
}[] {
  const EXCLUDED_TYPES = new Set(['Protests', 'Strategic developments']);
  const filtered = events.filter(e => !EXCLUDED_TYPES.has(e.event_type));

  const byCountry: Record<string, DBEvent[]> = {};
  for (const e of filtered) {
    if (!byCountry[e.country]) byCountry[e.country] = [];
    byCountry[e.country].push(e);
  }

  return Object.entries(byCountry)
    .map(([country, evts]) => {
      const totalFatalities = evts.reduce((s, e) => s + e.fatalities, 0);
      const avgSeverity = evts.reduce((s, e) => s + (e.severity_score || 1), 0) / evts.length;
      const maxSeverity = Math.max(...evts.map(e => e.severity_score || 1));
      const severity = Math.round(Math.min(10, (avgSeverity * 0.4 + maxSeverity * 0.6)) * 10) / 10;

      // Centroid
      const lat = evts.reduce((s, e) => s + e.latitude, 0) / evts.length;
      const lng = evts.reduce((s, e) => s + e.longitude, 0) / evts.length;

      // Most common event type
      const typeCounts: Record<string, number> = {};
      for (const e of evts) {
        typeCounts[e.event_type] = (typeCounts[e.event_type] || 0) + 1;
      }
      const primaryType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

      // Simple trend: compare first half vs second half event counts
      const sorted = [...evts].sort((a, b) => a.event_date.localeCompare(b.event_date));
      const mid = Math.floor(sorted.length / 2);
      const firstHalf = sorted.slice(0, mid).length;
      const secondHalf = sorted.slice(mid).length;
      let trend: 'escalating' | 'stable' | 'de-escalating' = 'stable';
      if (secondHalf > firstHalf * 1.2) trend = 'escalating';
      else if (secondHalf < firstHalf * 0.8) trend = 'de-escalating';

      return {
        id: country.toLowerCase().replace(/\s+/g, '-'),
        name: country,
        country,
        region: '',
        latitude: lat,
        longitude: lng,
        severity,
        eventCount: evts.length,
        fatalities30d: totalFatalities,
        trend,
        primaryType,
        description: `${evts.length} events, ${totalFatalities} fatalities`,
      };
    })
    .sort((a, b) => b.severity - a.severity);
}

// Build GeoJSON from DB events
export function buildGeoJSONFromEvents(events: DBEvent[]) {
  return {
    type: 'FeatureCollection' as const,
    features: events.map(e => ({
      type: 'Feature' as const,
      properties: {
        id: String(e.id),
        name: `${e.event_type} — ${e.admin1 || e.country}`,
        severity: e.severity_score || 5,
        fatalities30d: e.fatalities,
        eventCount: 1,
        country: e.country,
        trend: 'stable',
        event_date: e.event_date,
        event_type: e.event_type,
        notes: e.notes,
        actor1: e.actor1,
        actor2: e.actor2,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [e.longitude, e.latitude],
      },
    })),
  };
}
