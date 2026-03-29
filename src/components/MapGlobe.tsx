'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { CONFLICT_ZONES, getSeverityColor, type ConflictZone } from '@/data/conflicts';
import { getConflictsAtDate } from '@/data/timeline';
import type { MapFilters } from '@/data/filters';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN_HERE';

interface MapGlobeProps {
  onConflictSelect: (zone: ConflictZone | null) => void;
  selectedConflict: ConflictZone | null;
  timelineDate: Date;
  filters: MapFilters;
  rightPanelOpen?: boolean;
}

function buildGeoJSON(zones: ConflictZone[]) {
  return {
    type: 'FeatureCollection' as const,
    features: zones.map(zone => ({
      type: 'Feature' as const,
      properties: {
        id: zone.id,
        name: zone.name,
        severity: zone.severity,
        fatalities30d: zone.fatalities30d,
        eventCount: zone.eventCount,
        country: zone.country,
        trend: zone.trend,
        region: zone.region,
        primaryType: zone.primaryType,
        eventType: zone.eventType,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [zone.longitude, zone.latitude],
      },
    })),
  };
}

function matchesEventType(zone: ConflictZone, activeTypes: Set<string>): boolean {
  return activeTypes.has(zone.eventType);
}

export default function MapGlobe({ onConflictSelect, selectedConflict, timelineDate, filters, rightPanelOpen = false }: MapGlobeProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);
  const selectedIdRef = useRef<string | null>(null);

  useEffect(() => {
    selectedIdRef.current = selectedConflict?.id ?? null;
  }, [selectedConflict]);

  const handleZoomIn = useCallback(() => { map.current?.zoomIn({ duration: 300 }); }, []);
  const handleZoomOut = useCallback(() => { map.current?.zoomOut({ duration: 300 }); }, []);
  const handleResetBearing = useCallback(() => {
    map.current?.easeTo({ bearing: 0, pitch: 0, duration: 500 });
  }, []);

  // Compute time-adjusted + filtered zones
  const visibleZones = useMemo(() => {
    const timeZones = getConflictsAtDate(timelineDate);
    return timeZones.filter(zone => {
      // Region filter
      if (filters.selectedRegion !== 'All Regions' && zone.region !== filters.selectedRegion) return false;
      // Severity filter
      if (zone.severity < filters.severityRange[0] || zone.severity > filters.severityRange[1]) return false;
      // Event type filter
      if (!matchesEventType(zone, filters.activeTypes)) return false;
      return true;
    });
  }, [timelineDate, filters]);

  const createMarkerEl = useCallback((zone: ConflictZone) => {
    const el = document.createElement('div');
    const size = Math.max(16, Math.min(44, 12 + zone.severity * 3.2));
    const color = getSeverityColor(zone.severity);

    el.innerHTML = `
      <div style="position:relative; width:${size}px; height:${size}px; cursor:pointer;" class="conflict-marker-group">
        <div style="
          position:absolute; inset:-6px; border-radius:50%;
          background:${color}15;
          animation: markerPulse ${2.2 + Math.random() * 0.8}s ease-in-out infinite;
        "></div>
        <div style="
          position:absolute; inset:-3px; border-radius:50%;
          background:${color}25;
          box-shadow: 0 0 ${size}px ${color}35;
        "></div>
        <div style="
          position:absolute; inset:0; border-radius:50%;
          background: radial-gradient(circle at 35% 35%, ${color}ee, ${color}88);
          border: 1.5px solid ${color}bb;
          box-shadow: 0 0 ${size * 0.5}px ${color}50;
        "></div>
        ${zone.severity >= 6 ? `
          <div style="
            position:absolute; top:${size + 6}px; left:50%; transform:translateX(-50%);
            white-space:nowrap; font-size:9px; font-family:'JetBrains Mono',monospace;
            color:${color}dd; text-shadow: 0 1px 4px rgba(0,0,0,0.9);
            letter-spacing:0.05em; font-weight:500;
          ">${zone.fatalities30d.toLocaleString()}</div>
        ` : ''}
      </div>
    `;

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      onConflictSelect(zone);
    });

    el.addEventListener('mouseenter', () => {
      el.title = `${zone.name} — Severity ${zone.severity.toFixed(1)}`;
    });

    return el;
  }, [onConflictSelect]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const m = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [30, 15],
      zoom: 2.2,
      projection: 'globe',
      antialias: true,
      fadeDuration: 0,
      maxPitch: 85,
      pitch: 15,
    });

    m.on('style.load', () => {
      m.setFog({
        color: 'rgb(8, 12, 22)',
        'high-color': 'rgb(18, 24, 44)',
        'horizon-blend': 0.06,
        'space-color': 'rgb(4, 6, 12)',
        'star-intensity': 0.5,
      });
    });

    m.on('load', () => {
      setMapLoaded(true);

      m.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });
      m.setTerrain({ source: 'mapbox-dem', exaggeration: 1.2 });

      if (m.getLayer('water')) {
        m.setPaintProperty('water', 'fill-color', '#060a12');
      }
      ['land', 'landcover', 'landuse'].forEach(layer => {
        if (m.getLayer(layer)) {
          try { m.setPaintProperty(layer, 'fill-color', '#0c1018'); } catch {}
        }
      });

      if (m.getLayer('admin-0-boundary')) {
        m.setPaintProperty('admin-0-boundary', 'line-color', '#2a4a6f');
        m.setPaintProperty('admin-0-boundary', 'line-opacity', 0.6);
        m.setPaintProperty('admin-0-boundary', 'line-width', 1);
      }
      if (m.getLayer('admin-0-boundary-disputed')) {
        m.setPaintProperty('admin-0-boundary-disputed', 'line-color', '#2a4a6f');
        m.setPaintProperty('admin-0-boundary-disputed', 'line-opacity', 0.4);
      }
      if (m.getLayer('admin-1-boundary')) {
        m.setPaintProperty('admin-1-boundary', 'line-color', '#1e3650');
        m.setPaintProperty('admin-1-boundary', 'line-opacity', 0.3);
      }

      m.getStyle().layers.forEach(layer => {
        if (layer.type === 'symbol') {
          const id = layer.id;
          try {
            if (id.includes('country-label')) {
              m.setPaintProperty(id, 'text-color', '#c8d6e5');
              m.setPaintProperty(id, 'text-halo-color', '#0a0e17');
              m.setPaintProperty(id, 'text-halo-width', 2);
              m.setPaintProperty(id, 'text-halo-blur', 1);
            } else if (id.includes('state-label') || id.includes('settlement-major')) {
              m.setPaintProperty(id, 'text-color', '#9bb3cc');
              m.setPaintProperty(id, 'text-halo-color', '#0a0e17');
              m.setPaintProperty(id, 'text-halo-width', 1.5);
              m.setPaintProperty(id, 'text-halo-blur', 0.5);
            } else if (id.includes('settlement') || id.includes('place-label')) {
              m.setPaintProperty(id, 'text-color', '#7a96b0');
              m.setPaintProperty(id, 'text-halo-color', '#0a0e17');
              m.setPaintProperty(id, 'text-halo-width', 1.5);
            } else if (id.includes('label')) {
              m.setPaintProperty(id, 'text-color', '#5a7a94');
              m.setPaintProperty(id, 'text-halo-color', '#0a0e17');
              m.setPaintProperty(id, 'text-halo-width', 1);
            }
          } catch {}
        }
      });

      // === HEATMAP LAYER ===
      m.addSource('conflict-heat', {
        type: 'geojson',
        data: buildGeoJSON(CONFLICT_ZONES),
      });

      m.addLayer({
        id: 'conflict-heatmap',
        type: 'heatmap',
        source: 'conflict-heat',
        maxzoom: 8,
        paint: {
          'heatmap-weight': [
            'interpolate', ['linear'], ['get', 'severity'],
            1, 0.1, 5, 0.4, 8, 0.7, 10, 1,
          ],
          'heatmap-intensity': [
            'interpolate', ['linear'], ['zoom'],
            0, 0.6, 4, 1, 8, 1.5,
          ],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(0,0,0,0)',
            0.1, 'rgba(250,204,21,0.08)',
            0.3, 'rgba(249,115,22,0.15)',
            0.5, 'rgba(239,68,68,0.25)',
            0.7, 'rgba(220,38,38,0.35)',
            0.9, 'rgba(153,27,27,0.45)',
            1, 'rgba(127,29,29,0.55)',
          ],
          'heatmap-radius': [
            'interpolate', ['linear'], ['zoom'],
            0, 30, 3, 50, 6, 70, 9, 90,
          ],
          'heatmap-opacity': [
            'interpolate', ['linear'], ['zoom'],
            0, 0.7, 6, 0.5, 9, 0.2,
          ],
        },
      });

      // === CLUSTERED SOURCE ===
      m.addSource('conflicts-clustered', {
        type: 'geojson',
        data: buildGeoJSON(CONFLICT_ZONES),
        cluster: true,
        clusterMaxZoom: 5,
        clusterRadius: 80,
        clusterProperties: {
          maxSeverity: ['max', ['get', 'severity']],
          totalFatalities: ['+', ['get', 'fatalities30d']],
          totalEvents: ['+', ['get', 'eventCount']],
        },
      });

      m.addLayer({
        id: 'cluster-glow',
        type: 'circle',
        source: 'conflicts-clustered',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'interpolate', ['linear'], ['get', 'maxSeverity'],
            3, '#facc15', 5, '#f97316', 7, '#ef4444', 9, '#991b1b',
          ],
          'circle-radius': ['step', ['get', 'point_count'], 28, 4, 36, 8, 44],
          'circle-opacity': 0.12,
          'circle-blur': 0.8,
        },
      });

      m.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'conflicts-clustered',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'interpolate', ['linear'], ['get', 'maxSeverity'],
            3, '#facc15', 5, '#f97316', 7, '#ef4444', 9, '#991b1b',
          ],
          'circle-radius': ['step', ['get', 'point_count'], 18, 4, 24, 8, 30],
          'circle-opacity': 0.65,
          'circle-stroke-width': 2,
          'circle-stroke-color': 'rgba(255,255,255,0.15)',
        },
      });

      m.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'conflicts-clustered',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
          'text-size': 13,
          'text-allow-overlap': true,
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': 'rgba(0,0,0,0.5)',
          'text-halo-width': 1,
        },
      });

      // === ADMIN BORDERS LAYER (for "Conflict Borders" overlay) ===
      m.addLayer({
        id: 'conflict-borders',
        type: 'circle',
        source: 'conflicts-clustered',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'interpolate', ['linear'], ['get', 'severity'],
            3, 'rgba(250,204,21,0.15)', 5, 'rgba(249,115,22,0.2)', 7, 'rgba(239,68,68,0.25)', 9, 'rgba(153,27,27,0.3)',
          ],
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            0, 40, 3, 60, 6, 100, 9, 150,
          ],
          'circle-blur': 0.7,
          'circle-opacity': 0,
        },
      });

      m.on('click', 'clusters', (e) => {
        const features = m.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        if (!features.length) return;
        const clusterId = features[0].properties?.cluster_id;
        const source = m.getSource('conflicts-clustered') as mapboxgl.GeoJSONSource;
        source.getClusterExpansionZoom(clusterId, ((err: any, zoom: any) => {
          if (err || zoom == null) return;
          const coords = (features[0].geometry as GeoJSON.Point).coordinates;
          m.easeTo({
            center: coords as [number, number],
            zoom: zoom + 0.5,
            duration: 800,
          });
        }) as any);
      });

      m.on('mouseenter', 'clusters', () => { m.getCanvas().style.cursor = 'pointer'; });
      m.on('mouseleave', 'clusters', () => { m.getCanvas().style.cursor = ''; });

      m.on('zoom', () => {
        const zoom = m.getZoom();
        markersRef.current.forEach((marker) => {
          const el = marker.getElement();
          if (zoom < 3) {
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
          } else if (zoom < 4.5) {
            el.style.opacity = '0.6';
            el.style.pointerEvents = 'auto';
          } else {
            el.style.opacity = '1';
            el.style.pointerEvents = 'auto';
          }
        });
      });
    });

    // Custom zoom controls rendered via React instead of Mapbox's NavigationControl
    // to avoid Mapbox's aggressive style overrides that prevent repositioning

    map.current = m;

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      m.remove();
      map.current = null;
    };
  }, []);

  // Update markers + GeoJSON sources when visibleZones change
  useEffect(() => {
    const m = map.current;
    if (!m || !mapLoaded) return;

    const geoJSON = buildGeoJSON(visibleZones);

    // Update heatmap source
    const heatSource = m.getSource('conflict-heat') as mapboxgl.GeoJSONSource | undefined;
    if (heatSource) heatSource.setData(geoJSON);

    // Update cluster source
    const clusterSource = m.getSource('conflicts-clustered') as mapboxgl.GeoJSONSource | undefined;
    if (clusterSource) clusterSource.setData(geoJSON);

    // Sync DOM markers
    const visibleIds = new Set(visibleZones.map(z => z.id));

    // Remove markers that are no longer visible
    markersRef.current.forEach((marker, id) => {
      if (!visibleIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add or update markers
    visibleZones.forEach(zone => {
      const existing = markersRef.current.get(zone.id);
      if (existing) {
        // Update position (doesn't change, but update the marker element for severity changes)
        const el = existing.getElement();
        const size = Math.max(16, Math.min(44, 12 + zone.severity * 3.2));
        const color = getSeverityColor(zone.severity);
        // Update the core circle color
        const core = el.querySelector('.conflict-marker-group > div:nth-child(3)') as HTMLElement;
        if (core) {
          core.style.background = `radial-gradient(circle at 35% 35%, ${color}ee, ${color}88)`;
          core.style.borderColor = `${color}bb`;
          core.style.boxShadow = `0 0 ${size * 0.5}px ${color}50`;
        }
        // Update aura
        const aura = el.querySelector('.conflict-marker-group > div:nth-child(2)') as HTMLElement;
        if (aura) {
          aura.style.background = `${color}25`;
          aura.style.boxShadow = `0 0 ${size}px ${color}35`;
        }
      } else {
        // Create new marker
        const el = createMarkerEl(zone);
        const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([zone.longitude, zone.latitude])
          .addTo(m);
        markersRef.current.set(zone.id, marker);
      }
    });
  }, [visibleZones, mapLoaded, createMarkerEl]);

  // Toggle overlay visibility based on filters
  useEffect(() => {
    const m = map.current;
    if (!m || !mapLoaded) return;

    // Heatmap
    if (m.getLayer('conflict-heatmap')) {
      m.setLayoutProperty('conflict-heatmap', 'visibility', filters.overlays.heatmap ? 'visible' : 'none');
    }

    // Clusters
    ['cluster-glow', 'clusters', 'cluster-count'].forEach(layerId => {
      if (m.getLayer(layerId)) {
        m.setLayoutProperty(layerId, 'visibility', filters.overlays.clusters ? 'visible' : 'none');
      }
    });

    // Conflict borders overlay — soft radial zones around each conflict point
    if (m.getLayer('conflict-borders')) {
      m.setPaintProperty('conflict-borders', 'circle-opacity', filters.overlays.borders ? 0.6 : 0);
    }
  }, [filters.overlays, mapLoaded]);

  // Fly to selected conflict
  useEffect(() => {
    if (!map.current || !selectedConflict) return;
    map.current.flyTo({
      center: [selectedConflict.longitude, selectedConflict.latitude],
      zoom: 5.5,
      pitch: 45,
      bearing: -10,
      duration: 2000,
      essential: true,
    });
  }, [selectedConflict]);

  return (
    <div className="absolute inset-0" style={{ top: '56px' }}>
      <div ref={mapContainer} className="w-full h-full" />

      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface z-10">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-2 border-accent/20 animate-ping" />
              <div className="absolute inset-2 rounded-full border-2 border-t-accent border-r-transparent border-b-transparent border-l-transparent animate-spin" />
              <div className="absolute inset-4 rounded-full bg-accent/10" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm font-display font-medium text-white/80">Initializing Globe</span>
              <span className="text-2xs font-mono text-muted/60 tracking-wide">LOADING CONFLICT DATA...</span>
            </div>
          </div>
        </div>
      )}

      {/* Custom Zoom / Compass Controls */}
      {mapLoaded && (
        <div
          className="z-10 flex flex-col gap-0 rounded-lg overflow-hidden glass border border-white/[0.06]"
          style={{
            position: 'absolute',
            top: 12,
            right: rightPanelOpen ? 274 : 14,
          }}
        >
          <button
            onClick={handleZoomIn}
            className="w-[34px] h-[34px] flex items-center justify-center text-white/70 hover:text-white hover:bg-accent/10 transition-colors border-b border-white/[0.06]"
            title="Zoom in"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
          <button
            onClick={handleZoomOut}
            className="w-[34px] h-[34px] flex items-center justify-center text-white/70 hover:text-white hover:bg-accent/10 transition-colors border-b border-white/[0.06]"
            title="Zoom out"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
          <button
            onClick={handleResetBearing}
            className="w-[34px] h-[34px] flex items-center justify-center text-white/70 hover:text-white hover:bg-accent/10 transition-colors"
            title="Reset bearing"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2l2.5 5.5L8 6.5 5.5 7.5 8 2z" fill="#ef4444" opacity="0.8"/><path d="M8 14l-2.5-5.5L8 9.5l2.5-1L8 14z" fill="currentColor" opacity="0.5"/></svg>
          </button>
        </div>
      )}

      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(6,8,16,0.4) 100%)' }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-20 pointer-events-none z-[1]"
        style={{ background: 'linear-gradient(to bottom, rgba(10,14,23,0.5) 0%, transparent 100%)' }}
      />
    </div>
  );
}
