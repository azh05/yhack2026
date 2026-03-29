'use client';

import { useState, useEffect, useCallback } from 'react';

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

export function useConflictEvents() {
  const [events, setEvents] = useState<DBEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/events?limit=5000');
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setEvents(data.events || []);
      }
    } catch (err) {
      setError('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, loading, error, refetch: fetchEvents };
}

// Filter events within a 60-day rolling window up to the current date
export function filterEventsByDate(events: DBEvent[], date: Date): DBEvent[] {
  const endStr = date.toISOString().split('T')[0];
  const windowStart = new Date(date);
  windowStart.setDate(windowStart.getDate() - 60);
  const startStr = windowStart.toISOString().split('T')[0];
  return events.filter(e => e.event_date >= startStr && e.event_date <= endStr);
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
