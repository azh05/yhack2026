'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

export interface DBEvent {
  id: number;
  event_date: string;
  event_type: string;
  sub_event_type?: string | null;
  actor1?: string | null;
  actor2?: string | null;
  country: string;
  admin1: string | null;
  admin2?: string | null;
  latitude: number;
  longitude: number;
  fatalities: number;
  notes?: string | null;
  source?: string | null;
  severity_score: number | null;
  created_at?: string;
}

export function useConflictEvents(timelineDate: Date, includeAll: boolean = false) {
  const [allEvents, setAllEvents] = useState<DBEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [earliestDate, setEarliestDate] = useState<string | undefined>();
  const loadedRef = useRef<string>('');

  useEffect(() => {
    const key = includeAll ? 'all' : 'conflict';
    if (loadedRef.current === 'all' || loadedRef.current === key) return;
    loadedRef.current = key;

    setLoading(true);
    let cancelled = false;

    // Stream pages progressively — show data as each page arrives
    async function loadPages() {
      const pageSize = 1000;
      let page = 0;
      let accumulated: DBEvent[] = [];
      const types = includeAll ? '' : '&event_type_filter=conflict';

      while (!cancelled) {
        try {
          const res = await fetch(`/api/events-light?page=${page}&page_size=${pageSize}${includeAll ? '&include_all=true' : ''}`);
          const data = await res.json();
          if (data.error || !data.events?.length) break;

          accumulated = [...accumulated, ...data.events];
          setAllEvents(accumulated);

          // Set earliest from first batch
          if (page === 0 && accumulated.length > 0) {
            setLoading(false);
          }

          if (data.events.length < pageSize) break;
          page++;
        } catch {
          break;
        }
      }

      if (accumulated.length > 0) {
        const earliest = accumulated.reduce(
          (min: string, e: DBEvent) => e.event_date < min ? e.event_date : min,
          accumulated[0].event_date
        );
        setEarliestDate(earliest);
      }
      setLoading(false);
    }

    loadPages();
    return () => { cancelled = true; };
  }, [includeAll]);

  // Filter to 60-day window around timeline date — pure client-side, instant
  const events = useMemo(() => {
    const endStr = timelineDate.toISOString().split('T')[0];
    const windowStart = new Date(timelineDate);
    windowStart.setDate(windowStart.getDate() - 60);
    const startStr = windowStart.toISOString().split('T')[0];
    return allEvents.filter(e => e.event_date >= startStr && e.event_date <= endStr);
  }, [allEvents, timelineDate]);

  return { events, loading, error, earliestDate };
}

const EXCLUDED_TYPES = new Set(['Protests', 'Strategic developments']);

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

      const lat = evts.reduce((s, e) => s + e.latitude, 0) / evts.length;
      const lng = evts.reduce((s, e) => s + e.longitude, 0) / evts.length;

      const typeCounts: Record<string, number> = {};
      for (const e of evts) {
        typeCounts[e.event_type] = (typeCounts[e.event_type] || 0) + 1;
      }
      const primaryType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

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

// Seeded random jitter so same event always gets same offset
function jitter(id: number): [number, number] {
  const seed = id * 2654435761 >>> 0;
  const lngOffset = ((seed % 1000) / 1000 - 0.5) * 0.2;
  const latOffset = (((seed >> 10) % 1000) / 1000 - 0.5) * 0.2;
  return [lngOffset, latOffset];
}

// Build GeoJSON from DB events
export function buildGeoJSONFromEvents(events: DBEvent[]) {
  return {
    type: 'FeatureCollection' as const,
    features: events.map(e => {
      const [lngJ, latJ] = jitter(e.id);
      return {
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
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [e.longitude + lngJ, e.latitude + latJ],
        },
      };
    }),
  };
}
