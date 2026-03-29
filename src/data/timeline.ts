import { CONFLICT_ZONES, type ConflictZone } from './conflicts';

/**
 * Simulates conflict evolution over time.
 * Each zone has a deterministic trajectory based on its base data and the date,
 * so scrubbing the timeline back and forth is consistent.
 */

const TIMELINE_START = new Date('2024-01-01').getTime();
const TIMELINE_END = new Date('2026-03-28').getTime();
const TOTAL_MS = TIMELINE_END - TIMELINE_START;

// Deterministic pseudo-random from a seed
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// Each zone gets a unique evolution curve
interface ZoneTrajectory {
  // Phase offsets for oscillation (unique per zone)
  phaseOffset: number;
  // Peak severity multiplier (some zones get worse, some improve)
  peakTime: number; // 0-1 within timeline
  peakDelta: number; // -3 to +3 severity shift at peak
  // Trend shift thresholds
  escalationStart: number; // 0-1
  deescalationStart: number; // 0-1
}

const trajectories = new Map<string, ZoneTrajectory>();

function getTrajectory(zone: ConflictZone): ZoneTrajectory {
  if (trajectories.has(zone.id)) return trajectories.get(zone.id)!;

  // Generate deterministic trajectory from zone id hash
  const hash = zone.id.split('').reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0);

  const trajectory: ZoneTrajectory = {
    phaseOffset: seededRandom(hash) * Math.PI * 2,
    peakTime: 0.3 + seededRandom(hash + 1) * 0.5, // peak between 30-80% of timeline
    peakDelta: (seededRandom(hash + 2) - 0.35) * 5, // slight bias toward escalation
    escalationStart: 0.1 + seededRandom(hash + 3) * 0.4,
    deescalationStart: 0.6 + seededRandom(hash + 4) * 0.3,
  };

  trajectories.set(zone.id, trajectory);
  return trajectory;
}

export function getConflictAtDate(zone: ConflictZone, date: Date): ConflictZone {
  const t = Math.max(0, Math.min(1, (date.getTime() - TIMELINE_START) / TOTAL_MS));
  const traj = getTrajectory(zone);

  // Severity oscillates with a long-period wave + a spike around peakTime
  const waveComponent = Math.sin(t * Math.PI * 4 + traj.phaseOffset) * 0.8;
  const peakDistance = Math.abs(t - traj.peakTime);
  const peakComponent = traj.peakDelta * Math.exp(-peakDistance * peakDistance * 20);
  // Gradual drift component
  const drift = (t - 0.5) * (traj.peakDelta > 0 ? 0.5 : -0.3);

  const severityShift = waveComponent + peakComponent + drift;
  const newSeverity = Math.max(1, Math.min(10, zone.severity + severityShift));

  // Fatalities scale with severity
  const severityRatio = newSeverity / zone.severity;
  const fatalityNoise = 1 + (seededRandom(zone.id.length * 100 + Math.floor(t * 50)) - 0.5) * 0.4;
  const newFatalities = Math.max(0, Math.round(zone.fatalities30d * severityRatio * fatalityNoise));

  // Event count varies
  const eventNoise = 1 + (seededRandom(zone.id.length * 200 + Math.floor(t * 50)) - 0.5) * 0.5;
  const newEventCount = Math.max(1, Math.round(zone.eventCount * severityRatio * eventNoise));

  // Trend determined by local derivative
  const tPrev = Math.max(0, t - 0.02);
  const prevWave = Math.sin(tPrev * Math.PI * 4 + traj.phaseOffset) * 0.8;
  const prevPeakDist = Math.abs(tPrev - traj.peakTime);
  const prevPeak = traj.peakDelta * Math.exp(-prevPeakDist * prevPeakDist * 20);
  const prevSeverity = zone.severity + prevWave + prevPeak + (tPrev - 0.5) * (traj.peakDelta > 0 ? 0.5 : -0.3);
  const derivative = newSeverity - prevSeverity;

  let trend: 'escalating' | 'stable' | 'de-escalating';
  if (derivative > 0.15) trend = 'escalating';
  else if (derivative < -0.15) trend = 'de-escalating';
  else trend = 'stable';

  return {
    ...zone,
    severity: Math.round(newSeverity * 10) / 10,
    fatalities30d: newFatalities,
    eventCount: newEventCount,
    trend,
  };
}

export function getConflictsAtDate(date: Date): ConflictZone[] {
  return CONFLICT_ZONES.map(zone => getConflictAtDate(zone, date));
}
