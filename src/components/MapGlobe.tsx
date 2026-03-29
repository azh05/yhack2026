"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { CONFLICT_ZONES, type ConflictZone } from "@/data/conflicts";
import { getConflictsAtDate } from "@/data/timeline";
import type { MapFilters } from "@/data/filters";
import { type DBEvent, buildGeoJSONFromEvents } from "@/lib/useConflictEvents";
import { getCountryRegion } from "@/lib/buildZonesFromEvents";

mapboxgl.accessToken =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "YOUR_MAPBOX_TOKEN_HERE";

interface MapGlobeProps {
  onConflictSelect: (zone: ConflictZone | null) => void;
  selectedConflict: ConflictZone | null;
  timelineDate: Date;
  filters: MapFilters;
  rightPanelOpen?: boolean;
  conflictZones: ConflictZone[];
  dbEvents?: DBEvent[];
  flyToTarget?: { lat: number; lng: number } | null;
}

function buildGeoJSON(zones: ConflictZone[]) {
  return {
    type: "FeatureCollection" as const,
    features: zones.map((zone) => ({
      type: "Feature" as const,
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
        type: "Point" as const,
        coordinates: [zone.longitude, zone.latitude],
      },
    })),
  };
}

function matchesEventType(
  zone: ConflictZone,
  activeTypes: Set<string>,
): boolean {
  return activeTypes.has(zone.eventType);
}

export default function MapGlobe({
  onConflictSelect,
  selectedConflict,
  timelineDate,
  filters,
  rightPanelOpen = false,
  conflictZones,
  dbEvents = [],
  flyToTarget,
}: MapGlobeProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const selectedIdRef = useRef<string | null>(null);

  useEffect(() => {
    selectedIdRef.current = selectedConflict?.id ?? null;
  }, [selectedConflict]);

  const handleZoomIn = useCallback(() => {
    map.current?.zoomIn({ duration: 300 });
  }, []);
  const handleZoomOut = useCallback(() => {
    map.current?.zoomOut({ duration: 300 });
  }, []);
  const handleResetBearing = useCallback(() => {
    map.current?.easeTo({ bearing: 0, pitch: 0, duration: 500 });
  }, []);

  // Use backend conflictZones if available, otherwise fall back to local data with filters
  const visibleZones = useMemo(() => {
    const zones =
      conflictZones.length > 0
        ? conflictZones
        : getConflictsAtDate(timelineDate);
    return zones.filter((zone) => {
      if (
        filters.selectedRegion !== "All Regions" &&
        zone.region !== filters.selectedRegion
      )
        return false;
      if (
        zone.severity < filters.severityRange[0] ||
        zone.severity > filters.severityRange[1]
      )
        return false;
      if (!matchesEventType(zone, filters.activeTypes)) return false;
      return true;
    });
  }, [timelineDate, filters, conflictZones]);

  const conflictZonesRef = useRef(conflictZones);
  const visibleZonesRef = useRef(visibleZones);
  const onConflictSelectRef = useRef(onConflictSelect);

  useEffect(() => { conflictZonesRef.current = conflictZones; }, [conflictZones]);
  useEffect(() => { visibleZonesRef.current = visibleZones; }, [visibleZones]);
  useEffect(() => { onConflictSelectRef.current = onConflictSelect; }, [onConflictSelect]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const m = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [30, 15],
      zoom: 2.2,
      projection: "globe",
      antialias: true,
      fadeDuration: 0,
      maxPitch: 85,
      pitch: 15,
    });

    m.on("style.load", () => {
      m.setFog({
        color: "rgb(8, 12, 22)",
        "high-color": "rgb(18, 24, 44)",
        "horizon-blend": 0.06,
        "space-color": "rgb(4, 6, 12)",
        "star-intensity": 0.5,
      });
    });

    m.on("load", () => {
      setMapLoaded(true);

      m.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.mapbox-terrain-dem-v1",
        tileSize: 512,
        maxzoom: 14,
      });
      m.setTerrain({ source: "mapbox-dem", exaggeration: 1.2 });

      if (m.getLayer("water")) {
        m.setPaintProperty("water", "fill-color", "#060a12");
      }
      ["land", "landcover", "landuse"].forEach((layer) => {
        if (m.getLayer(layer)) {
          try {
            m.setPaintProperty(layer, "fill-color", "#0c1018");
          } catch {}
        }
      });

      if (m.getLayer("admin-0-boundary")) {
        m.setPaintProperty("admin-0-boundary", "line-color", "#2a4a6f");
        m.setPaintProperty("admin-0-boundary", "line-opacity", 0.6);
        m.setPaintProperty("admin-0-boundary", "line-width", 1);
      }
      if (m.getLayer("admin-0-boundary-disputed")) {
        m.setPaintProperty(
          "admin-0-boundary-disputed",
          "line-color",
          "#2a4a6f",
        );
        m.setPaintProperty("admin-0-boundary-disputed", "line-opacity", 0.4);
      }
      if (m.getLayer("admin-1-boundary")) {
        m.setPaintProperty("admin-1-boundary", "line-color", "#1e3650");
        m.setPaintProperty("admin-1-boundary", "line-opacity", 0.3);
      }

      m.getStyle().layers.forEach((layer) => {
        if (layer.type === "symbol") {
          const id = layer.id;
          try {
            if (id.includes("country-label")) {
              m.setPaintProperty(id, "text-color", "#c8d6e5");
              m.setPaintProperty(id, "text-halo-color", "#0a0e17");
              m.setPaintProperty(id, "text-halo-width", 2);
              m.setPaintProperty(id, "text-halo-blur", 1);
            } else if (
              id.includes("state-label") ||
              id.includes("settlement-major")
            ) {
              m.setPaintProperty(id, "text-color", "#9bb3cc");
              m.setPaintProperty(id, "text-halo-color", "#0a0e17");
              m.setPaintProperty(id, "text-halo-width", 1.5);
              m.setPaintProperty(id, "text-halo-blur", 0.5);
            } else if (
              id.includes("settlement") ||
              id.includes("place-label")
            ) {
              m.setPaintProperty(id, "text-color", "#7a96b0");
              m.setPaintProperty(id, "text-halo-color", "#0a0e17");
              m.setPaintProperty(id, "text-halo-width", 1.5);
            } else if (id.includes("label")) {
              m.setPaintProperty(id, "text-color", "#5a7a94");
              m.setPaintProperty(id, "text-halo-color", "#0a0e17");
              m.setPaintProperty(id, "text-halo-width", 1);
            }
          } catch {}
        }
      });

      // === HEATMAP LAYER ===
      m.addSource("conflict-heat", {
        type: "geojson",
        data: buildGeoJSON(visibleZones),
      });

      m.addLayer({
        id: "conflict-heatmap",
        type: "heatmap",
        source: "conflict-heat",
        maxzoom: 8,
        paint: {
          "heatmap-weight": [
            "interpolate",
            ["linear"],
            ["get", "severity"],
            1,
            0.1,
            5,
            0.4,
            8,
            0.7,
            10,
            1,
          ],
          "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            0.6,
            4,
            1,
            8,
            1.5,
          ],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(0,0,0,0)",
            0.1,
            "rgba(250,204,21,0.08)",
            0.3,
            "rgba(249,115,22,0.15)",
            0.5,
            "rgba(239,68,68,0.25)",
            0.7,
            "rgba(220,38,38,0.35)",
            0.9,
            "rgba(153,27,27,0.45)",
            1,
            "rgba(127,29,29,0.55)",
          ],
          "heatmap-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            30,
            3,
            50,
            6,
            70,
            9,
            90,
          ],
          "heatmap-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            0.7,
            6,
            0.5,
            9,
            0.2,
          ],
        },
      });

      // === DB EVENTS (timeline-filtered, GPU-rendered) ===
      m.addSource("db-events-heat", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      m.addLayer({
        id: "db-events-heatmap",
        type: "heatmap",
        source: "db-events-heat",
        maxzoom: 8,
        paint: {
          "heatmap-weight": [
            "interpolate",
            ["linear"],
            ["get", "severity"],
            1,
            0.1,
            5,
            0.4,
            8,
            0.7,
            10,
            1,
          ],
          "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            0.8,
            4,
            1.2,
            8,
            1.8,
          ],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(0,0,0,0)",
            0.1,
            "rgba(250,204,21,0.1)",
            0.3,
            "rgba(249,115,22,0.2)",
            0.5,
            "rgba(239,68,68,0.3)",
            0.7,
            "rgba(220,38,38,0.4)",
            0.9,
            "rgba(153,27,27,0.5)",
            1,
            "rgba(127,29,29,0.6)",
          ],
          "heatmap-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            25,
            3,
            45,
            6,
            65,
            9,
            85,
          ],
          "heatmap-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            0.7,
            6,
            0.5,
            9,
            0.2,
          ],
        },
      });

      m.addSource("db-events-circles", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        cluster: true,
        clusterMaxZoom: 8,
        clusterRadius: 50,
        clusterProperties: {
          maxSeverity: ["max", ["get", "severity"]],
          totalFatalities: ["+", ["get", "fatalities30d"]],
        },
      });

      m.addLayer({
        id: "db-clusters",
        type: "circle",
        source: "db-events-circles",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "maxSeverity"],
            3,
            "#facc15",
            5,
            "#f97316",
            7,
            "#ef4444",
            9,
            "#991b1b",
          ],
          "circle-radius": [
            "step",
            ["get", "point_count"],
            14,
            5,
            20,
            20,
            28,
            50,
            36,
          ],
          "circle-opacity": 0.7,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "rgba(255,255,255,0.15)",
        },
      });

      m.addLayer({
        id: "db-cluster-count",
        type: "symbol",
        source: "db-events-circles",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
          "text-size": 11,
          "text-allow-overlap": true,
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "rgba(0,0,0,0.5)",
          "text-halo-width": 1,
        },
      });

      m.addLayer({
        id: "db-events-glow",
        type: "circle",
        source: "db-events-circles",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "severity"],
            1,
            "#facc15",
            5,
            "#f97316",
            7,
            "#ef4444",
            9,
            "#991b1b",
          ],
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "severity"],
            1,
            10,
            5,
            16,
            8,
            22,
            10,
            30,
          ],
          "circle-opacity": 0.15,
          "circle-blur": 1,
        },
      });

      m.addLayer({
        id: "db-events-points",
        type: "circle",
        source: "db-events-circles",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "severity"],
            1,
            "#facc15",
            3,
            "#f59e0b",
            5,
            "#f97316",
            7,
            "#ef4444",
            9,
            "#991b1b",
          ],
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "severity"],
            1,
            5,
            5,
            8,
            8,
            11,
            10,
            15,
          ],
          "circle-opacity": 0.9,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "rgba(255,255,255,0.25)",
        },
      });

      const dbPopup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 12,
      });
      m.on("mouseenter", "db-events-points", (e) => {
        m.getCanvas().style.cursor = "pointer";
        if (e.features && e.features[0]) {
          const props = e.features[0].properties!;
          const coords = (
            e.features[0].geometry as GeoJSON.Point
          ).coordinates.slice() as [number, number];
          dbPopup
            .setLngLat(coords)
            .setHTML(
              `<div style="font-size:11px;color:#e5e5e5;max-width:200px;"><strong>${props.name}</strong><br/><span style="color:#999;">${props.event_date}</span><br/>Fatalities: ${props.fatalities30d} · Severity: ${(props.severity as number).toFixed(1)}</div>`,
            )
            .addTo(m);
        }
      });
      m.on("mouseleave", "db-events-points", () => {
        m.getCanvas().style.cursor = "";
        dbPopup.remove();
      });

      // Click a dot → zoom in and open briefing for that country
      m.on("click", "db-events-points", (e) => {
        if (!e.features || !e.features[0]) return;
        const props = e.features[0].properties!;
        const country = props.country as string;
        if (!country) return;
        const coords = (e.features[0].geometry as GeoJSON.Point).coordinates as [number, number];
        m.flyTo({
          center: coords,
          zoom: 5.5,
          pitch: 45,
          bearing: -10,
          duration: 1500,
          essential: true,
        });
        // Find and select the matching conflict zone
        const zones = conflictZonesRef.current.length > 0 ? conflictZonesRef.current : visibleZonesRef.current;
        const zone = zones.find((z) => z.country === country);
        if (zone) {
          onConflictSelectRef.current(zone);
        }
      });

      m.on("click", "db-clusters", (e) => {
        const features = m.queryRenderedFeatures(e.point, {
          layers: ["db-clusters"],
        });
        if (!features.length) return;
        const clusterId = features[0].properties?.cluster_id;
        const source = m.getSource(
          "db-events-circles",
        ) as mapboxgl.GeoJSONSource;
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
      m.on("mouseenter", "db-clusters", () => {
        m.getCanvas().style.cursor = "pointer";
      });
      m.on("mouseleave", "db-clusters", () => {
        m.getCanvas().style.cursor = "";
      });

      // === CLUSTERED SOURCE ===
      m.addSource("conflicts-clustered", {
        type: "geojson",
        data: buildGeoJSON(visibleZones),
        cluster: true,
        clusterMaxZoom: 5,
        clusterRadius: 80,
        clusterProperties: {
          maxSeverity: ["max", ["get", "severity"]],
          totalFatalities: ["+", ["get", "fatalities30d"]],
          totalEvents: ["+", ["get", "eventCount"]],
        },
      });

      m.addLayer({
        id: "cluster-glow",
        type: "circle",
        source: "conflicts-clustered",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "maxSeverity"],
            3,
            "#facc15",
            5,
            "#f97316",
            7,
            "#ef4444",
            9,
            "#991b1b",
          ],
          "circle-radius": ["step", ["get", "point_count"], 28, 4, 36, 8, 44],
          "circle-opacity": 0.12,
          "circle-blur": 0.8,
        },
      });

      m.addLayer({
        id: "clusters",
        type: "circle",
        source: "conflicts-clustered",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "maxSeverity"],
            3,
            "#facc15",
            5,
            "#f97316",
            7,
            "#ef4444",
            9,
            "#991b1b",
          ],
          "circle-radius": ["step", ["get", "point_count"], 18, 4, 24, 8, 30],
          "circle-opacity": 0.65,
          "circle-stroke-width": 2,
          "circle-stroke-color": "rgba(255,255,255,0.15)",
        },
      });

      m.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "conflicts-clustered",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
          "text-size": 13,
          "text-allow-overlap": true,
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "rgba(0,0,0,0.5)",
          "text-halo-width": 1,
        },
      });

      // === ADMIN BORDERS LAYER (for "Conflict Borders" overlay) ===
      m.addLayer({
        id: "conflict-borders",
        type: "circle",
        source: "conflicts-clustered",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "severity"],
            3,
            "rgba(250,204,21,0.15)",
            5,
            "rgba(249,115,22,0.2)",
            7,
            "rgba(239,68,68,0.25)",
            9,
            "rgba(153,27,27,0.3)",
          ],
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            40,
            3,
            60,
            6,
            100,
            9,
            150,
          ],
          "circle-blur": 0.7,
          "circle-opacity": 0,
        },
      });

      m.on("click", "clusters", (e) => {
        const features = m.queryRenderedFeatures(e.point, {
          layers: ["clusters"],
        });
        if (!features.length) return;
        const clusterId = features[0].properties?.cluster_id;
        const source = m.getSource(
          "conflicts-clustered",
        ) as mapboxgl.GeoJSONSource;
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

      m.on("mouseenter", "clusters", () => {
        m.getCanvas().style.cursor = "pointer";
      });
      m.on("mouseleave", "clusters", () => {
        m.getCanvas().style.cursor = "";
      });
    });

    map.current = m;

    // Idle auto-rotate — starts after 15s of no interaction
    let idleTimer: ReturnType<typeof setTimeout>;
    let spinInterval: ReturnType<typeof setInterval>;
    let isSpinning = false;

    const startSpin = () => {
      if (isSpinning) return;
      isSpinning = true;
      spinInterval = setInterval(() => {
        if (!map.current) return;
        const center = map.current.getCenter();
        map.current.setCenter([center.lng + 0.03, center.lat]);
      }, 16);
    };

    const stopSpin = () => {
      isSpinning = false;
      clearInterval(spinInterval);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(startSpin, 15000);
    };

    // Start idle timer
    idleTimer = setTimeout(startSpin, 15000);

    // Stop on any interaction
    m.on("mousedown", stopSpin);
    m.on("touchstart", stopSpin);
    m.on("wheel", stopSpin);
    m.on("movestart", () => {
      if (!isSpinning) stopSpin();
    });

    return () => {
      clearTimeout(idleTimer);
      clearInterval(spinInterval);
      m.remove();
      map.current = null;
    };
  }, []);

  // Update GeoJSON sources when visibleZones change
  useEffect(() => {
    const m = map.current;
    if (!m || !mapLoaded) return;

    const geoJSON = buildGeoJSON(visibleZones);

    const heatSource = m.getSource("conflict-heat") as
      | mapboxgl.GeoJSONSource
      | undefined;
    if (heatSource) heatSource.setData(geoJSON);

    const clusterSource = m.getSource("conflicts-clustered") as
      | mapboxgl.GeoJSONSource
      | undefined;
    if (clusterSource) clusterSource.setData(geoJSON);
  }, [visibleZones, mapLoaded]);

  // Toggle overlay visibility based on filters
  useEffect(() => {
    const m = map.current;
    if (!m || !mapLoaded) return;

    // Heatmap
    if (m.getLayer("conflict-heatmap")) {
      m.setLayoutProperty(
        "conflict-heatmap",
        "visibility",
        filters.overlays.heatmap ? "visible" : "none",
      );
    }

    // Clusters
    ["cluster-glow", "clusters", "cluster-count", "db-clusters", "db-cluster-count"].forEach((layerId) => {
      if (m.getLayer(layerId)) {
        m.setLayoutProperty(
          layerId,
          "visibility",
          filters.overlays.clusters ? "visible" : "none",
        );
      }
    });

    // Conflict borders overlay
    if (m.getLayer("conflict-borders")) {
      m.setPaintProperty(
        "conflict-borders",
        "circle-opacity",
        filters.overlays.borders ? 0.6 : 0,
      );
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

  // Map ACLED event_type to filter IDs
  const EVENT_TYPE_MAP: Record<string, string> = {
    Battles: "battles",
    "Violence against civilians": "violence_civilians",
    "Explosions/Remote violence": "explosions",
    Protests: "protests",
    Riots: "riots",
    "Strategic developments": "strategic",
  };

  // Update DB events on timeline change, applying filters
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const m = map.current;

    // Apply all filters: event type, region, and severity
    const filtered = dbEvents.filter((e) => {
      // Event type filter
      const typeId = EVENT_TYPE_MAP[e.event_type];
      if (typeId && !filters.activeTypes.has(typeId)) return false;

      // Region filter
      if (filters.selectedRegion !== "All Regions") {
        const eventRegion = getCountryRegion(e.country);
        if (eventRegion !== filters.selectedRegion) return false;
      }

      // Severity filter
      const severity = e.severity_score ?? 5;
      if (
        severity < filters.severityRange[0] ||
        severity > filters.severityRange[1]
      )
        return false;

      return true;
    });

    const geojson = buildGeoJSONFromEvents(filtered);

    const heatSource = m.getSource("db-events-heat") as mapboxgl.GeoJSONSource;
    if (heatSource) heatSource.setData(geojson);

    const circleSource = m.getSource(
      "db-events-circles",
    ) as mapboxgl.GeoJSONSource;
    if (circleSource) circleSource.setData(geojson);
  }, [dbEvents, timelineDate, mapLoaded, filters]);

  // Fly to chat target
  useEffect(() => {
    if (!map.current || !flyToTarget) return;
    map.current.flyTo({
      center: [flyToTarget.lng, flyToTarget.lat],
      zoom: 5,
      pitch: 40,
      duration: 2000,
      essential: true,
    });
  }, [flyToTarget]);

  return (
    <div className="absolute inset-0" style={{ top: "56px" }}>
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
              <span className="text-sm font-display font-medium text-white/80">
                Initializing Globe
              </span>
              <span className="text-2xs font-mono text-muted/60 tracking-wide">
                LOADING CONFLICT DATA...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Custom Zoom / Compass Controls */}
      {mapLoaded && (
        <div
          className="z-10 flex flex-col gap-0 rounded-lg overflow-hidden glass border border-white/[0.06]"
          style={{
            position: "absolute",
            top: 12,
            right: rightPanelOpen ? 274 : 14,
          }}
        >
          <button
            onClick={handleZoomIn}
            className="w-[34px] h-[34px] flex items-center justify-center text-white/70 hover:text-white hover:bg-accent/10 transition-colors border-b border-white/[0.06]"
            title="Zoom in"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 3v10M3 8h10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            onClick={handleZoomOut}
            className="w-[34px] h-[34px] flex items-center justify-center text-white/70 hover:text-white hover:bg-accent/10 transition-colors border-b border-white/[0.06]"
            title="Zoom out"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8h10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            onClick={handleResetBearing}
            className="w-[34px] h-[34px] flex items-center justify-center text-white/70 hover:text-white hover:bg-accent/10 transition-colors"
            title="Reset bearing"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 2l2.5 5.5L8 6.5 5.5 7.5 8 2z"
                fill="#ef4444"
                opacity="0.8"
              />
              <path
                d="M8 14l-2.5-5.5L8 9.5l2.5-1L8 14z"
                fill="currentColor"
                opacity="0.5"
              />
            </svg>
          </button>
        </div>
      )}

      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(6,8,16,0.4) 100%)",
        }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-20 pointer-events-none z-[1]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(10,14,23,0.5) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}
