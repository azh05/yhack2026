export interface ConflictEvent {
  id: string;
  event_date: string;
  event_type: string;
  country: string;
  region: string;
  admin1: string;
  location: string;
  latitude: number;
  longitude: number;
  fatalities: number;
  severity: number;
  notes: string;
  source: string;
  actors: string[];
}

export interface NewsSource {
  outlet: string;
  headline: string;
  time: string;
  url: string;
}

export interface AIAnalysis {
  background: string;
  currentSituation: string;
  humanitarianImpact: string;
  outlook: string;
  keyActors: string[];
}

export interface ConflictZone {
  id: string;
  name: string;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
  severity: number;
  eventCount: number;
  fatalities30d: number;
  trend: "escalating" | "stable" | "de-escalating";
  primaryType: string;
  description: string;
  aiAnalysis: AIAnalysis;
  newsSources: NewsSource[];
  events: ConflictEvent[];
}

export const SEVERITY_COLORS: Record<string, string> = {
  "1": "#facc15",
  "2": "#facc15",
  "3": "#f59e0b",
  "4": "#f97316",
  "5": "#f97316",
  "6": "#ef4444",
  "7": "#ef4444",
  "8": "#dc2626",
  "9": "#991b1b",
  "10": "#7f1d1d",
};

export function getSeverityColor(severity: number): string {
  return (
    SEVERITY_COLORS[String(Math.min(10, Math.max(1, Math.round(severity))))] ||
    "#facc15"
  );
}

export function getSeverityLabel(severity: number): string {
  if (severity <= 2) return "Low";
  if (severity <= 4) return "Moderate";
  if (severity <= 6) return "High";
  if (severity <= 8) return "Severe";
  return "Extreme";
}

export const EVENT_TYPES = [
  { id: "battles", label: "Battles", color: "#ef4444" },
  {
    id: "violence_civilians",
    label: "Violence against civilians",
    color: "#dc2626",
  },
  { id: "explosions", label: "Explosions / Remote violence", color: "#f97316" },
  { id: "protests", label: "Protests", color: "#3b82f6" },
  { id: "riots", label: "Riots", color: "#8b5cf6" },
  { id: "strategic", label: "Strategic developments", color: "#64748b" },
];

export const REGIONS = [
  "All Regions",
  "Middle East & North Africa",
  "Sub-Saharan Africa",
  "Eastern Europe",
  "South Asia",
  "Southeast Asia",
  "Central America & Caribbean",
  "South America",
];
