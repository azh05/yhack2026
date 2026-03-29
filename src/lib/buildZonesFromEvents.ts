import type { ConflictZone } from '@/data/conflicts';
import type { DBEvent } from '@/lib/useConflictEvents';

// Map ACLED event_type strings to filter IDs
const EVENT_TYPE_MAP: Record<string, ConflictZone['eventType']> = {
  'Battles': 'battles',
  'Violence against civilians': 'violence_civilians',
  'Explosions/Remote violence': 'explosions',
  'Protests': 'protests',
  'Riots': 'riots',
  'Strategic developments': 'strategic',
};

// Country → region mapping for ACLED countries
const COUNTRY_REGION: Record<string, string> = {
  Palestine: 'Middle East & North Africa', Syria: 'Middle East & North Africa',
  Yemen: 'Middle East & North Africa', Iraq: 'Middle East & North Africa',
  Iran: 'Middle East & North Africa', Israel: 'Middle East & North Africa',
  Lebanon: 'Middle East & North Africa', Jordan: 'Middle East & North Africa',
  Egypt: 'Middle East & North Africa', Libya: 'Middle East & North Africa',
  Tunisia: 'Middle East & North Africa', Algeria: 'Middle East & North Africa',
  Morocco: 'Middle East & North Africa', Turkey: 'Middle East & North Africa',
  'Saudi Arabia': 'Middle East & North Africa', Kuwait: 'Middle East & North Africa',
  Bahrain: 'Middle East & North Africa', Qatar: 'Middle East & North Africa',
  'United Arab Emirates': 'Middle East & North Africa', Oman: 'Middle East & North Africa',
  Ethiopia: 'Sub-Saharan Africa', Sudan: 'Sub-Saharan Africa',
  'South Sudan': 'Sub-Saharan Africa', Somalia: 'Sub-Saharan Africa',
  Nigeria: 'Sub-Saharan Africa', Mali: 'Sub-Saharan Africa',
  'Democratic Republic of Congo': 'Sub-Saharan Africa',
  'Republic of Congo': 'Sub-Saharan Africa',
  'Central African Republic': 'Sub-Saharan Africa',
  Cameroon: 'Sub-Saharan Africa', Chad: 'Sub-Saharan Africa',
  Niger: 'Sub-Saharan Africa', 'Burkina Faso': 'Sub-Saharan Africa',
  Ghana: 'Sub-Saharan Africa', 'Ivory Coast': 'Sub-Saharan Africa',
  Senegal: 'Sub-Saharan Africa', Guinea: 'Sub-Saharan Africa',
  'Guinea-Bissau': 'Sub-Saharan Africa', 'Sierra Leone': 'Sub-Saharan Africa',
  Liberia: 'Sub-Saharan Africa', Togo: 'Sub-Saharan Africa',
  Benin: 'Sub-Saharan Africa', Gambia: 'Sub-Saharan Africa',
  Mauritania: 'Sub-Saharan Africa', Eritrea: 'Sub-Saharan Africa',
  Djibouti: 'Sub-Saharan Africa', Kenya: 'Sub-Saharan Africa',
  Uganda: 'Sub-Saharan Africa', Rwanda: 'Sub-Saharan Africa',
  Burundi: 'Sub-Saharan Africa', Tanzania: 'Sub-Saharan Africa',
  Mozambique: 'Sub-Saharan Africa', Malawi: 'Sub-Saharan Africa',
  Zambia: 'Sub-Saharan Africa', Zimbabwe: 'Sub-Saharan Africa',
  Botswana: 'Sub-Saharan Africa', Namibia: 'Sub-Saharan Africa',
  'South Africa': 'Sub-Saharan Africa', Lesotho: 'Sub-Saharan Africa',
  eSwatini: 'Sub-Saharan Africa', Madagascar: 'Sub-Saharan Africa',
  Angola: 'Sub-Saharan Africa', Gabon: 'Sub-Saharan Africa',
  'Equatorial Guinea': 'Sub-Saharan Africa', Comoros: 'Sub-Saharan Africa',
  'Cape Verde': 'Sub-Saharan Africa', 'Sao Tome and Principe': 'Sub-Saharan Africa',
  Mauritius: 'Sub-Saharan Africa', Seychelles: 'Sub-Saharan Africa',
  Mayotte: 'Sub-Saharan Africa', Reunion: 'Sub-Saharan Africa',
  Ukraine: 'Eastern Europe', Moldova: 'Eastern Europe',
  Georgia: 'Eastern Europe', Azerbaijan: 'Eastern Europe', Russia: 'Eastern Europe',
  Afghanistan: 'South Asia', Pakistan: 'South Asia',
  India: 'South Asia', Nepal: 'South Asia',
  Bangladesh: 'South Asia', 'Sri Lanka': 'South Asia',
  Bhutan: 'South Asia', Maldives: 'South Asia',
  Myanmar: 'Southeast Asia', Thailand: 'Southeast Asia',
  Cambodia: 'Southeast Asia', Laos: 'Southeast Asia',
  Vietnam: 'Southeast Asia', Philippines: 'Southeast Asia',
  Indonesia: 'Southeast Asia', Malaysia: 'Southeast Asia',
  Singapore: 'Southeast Asia', 'East Timor': 'Southeast Asia',
  'Papua New Guinea': 'Southeast Asia', Fiji: 'Southeast Asia',
  Haiti: 'Central America & Caribbean', Mexico: 'Central America & Caribbean',
  Guatemala: 'Central America & Caribbean', Honduras: 'Central America & Caribbean',
  'El Salvador': 'Central America & Caribbean', Nicaragua: 'Central America & Caribbean',
  'Costa Rica': 'Central America & Caribbean', Panama: 'Central America & Caribbean',
  Cuba: 'Central America & Caribbean', Jamaica: 'Central America & Caribbean',
  'Dominican Republic': 'Central America & Caribbean', Dominica: 'Central America & Caribbean',
  'Puerto Rico': 'Central America & Caribbean', Belize: 'Central America & Caribbean',
  'Trinidad and Tobago': 'Central America & Caribbean',
  Barbados: 'Central America & Caribbean', Grenada: 'Central America & Caribbean',
  'Saint Lucia': 'Central America & Caribbean',
  'Saint Vincent and the Grenadines': 'Central America & Caribbean',
  'Saint Kitts and Nevis': 'Central America & Caribbean',
  'Antigua and Barbuda': 'Central America & Caribbean',
  Bahamas: 'Central America & Caribbean', Aruba: 'Central America & Caribbean',
  Guadeloupe: 'Central America & Caribbean', Martinique: 'Central America & Caribbean',
  Colombia: 'South America', Venezuela: 'South America',
  Brazil: 'South America', Peru: 'South America',
  Ecuador: 'South America', Bolivia: 'South America',
  Chile: 'South America', Argentina: 'South America',
  Paraguay: 'South America', Uruguay: 'South America',
  Guyana: 'South America', Suriname: 'South America',
  'French Guiana': 'South America',
};

export function getCountryRegion(country: string): string {
  return COUNTRY_REGION[country] ?? 'Other';
}

/**
 * Build ConflictZone objects from raw DB events, grouped by country.
 * This replaces the hardcoded backend list with dynamic data.
 */
export function buildZonesFromEvents(events: DBEvent[]): ConflictZone[] {
  const byCountry = new Map<string, DBEvent[]>();
  for (const e of events) {
    const list = byCountry.get(e.country);
    if (list) list.push(e);
    else byCountry.set(e.country, [e]);
  }

  const zones: ConflictZone[] = [];
  for (const [country, countryEvents] of byCountry) {
    const fatalities = countryEvents.reduce((sum, e) => sum + e.fatalities, 0);
    const eventCount = countryEvents.length;

    // Severity: composite score from fatalities, event count, and fatality rate
    // Uses log scale so high-conflict zones score proportionally higher
    const fatalityScore = Math.min(10, Math.log10(fatalities + 1) * 2.5);      // 0-10, log scaled
    const eventScore = Math.min(10, Math.log10(eventCount + 1) * 3);            // 0-10, log scaled
    const fatalityRate = eventCount > 0 ? fatalities / eventCount : 0;
    const rateScore = Math.min(10, fatalityRate * 2);                            // lethality per event
    const severity = Math.round((fatalityScore * 0.45 + eventScore * 0.3 + rateScore * 0.25) * 10) / 10;

    // Centroid
    const lat = countryEvents.reduce((s, e) => s + e.latitude, 0) / countryEvents.length;
    const lng = countryEvents.reduce((s, e) => s + e.longitude, 0) / countryEvents.length;

    // Most common event type
    const typeCounts = new Map<string, number>();
    for (const e of countryEvents) {
      typeCounts.set(e.event_type, (typeCounts.get(e.event_type) ?? 0) + 1);
    }
    let primaryType = 'Battles';
    let maxCount = 0;
    for (const [t, c] of typeCounts) {
      if (c > maxCount) { maxCount = c; primaryType = t; }
    }

    const region = getCountryRegion(country);
    const eventType = EVENT_TYPE_MAP[primaryType] ?? 'battles';

    // Trend: compare first 30 days vs last 30 days of the window
    const sorted = [...countryEvents].sort((a, b) => a.event_date.localeCompare(b.event_date));
    const mid = Math.floor(sorted.length / 2);
    const firstHalfFat = sorted.slice(0, mid).reduce((s, e) => s + e.fatalities, 0);
    const secondHalfFat = sorted.slice(mid).reduce((s, e) => s + e.fatalities, 0);
    const firstHalfCount = mid;
    const secondHalfCount = sorted.length - mid;

    // Weighted: 60% fatality change, 40% event count change
    const fatChange = firstHalfFat > 0 ? (secondHalfFat - firstHalfFat) / firstHalfFat : (secondHalfFat > 0 ? 1 : 0);
    const countChange = firstHalfCount > 0 ? (secondHalfCount - firstHalfCount) / firstHalfCount : 0;
    const trendScore = fatChange * 0.6 + countChange * 0.4;

    let trend: 'escalating' | 'stable' | 'de-escalating' = 'stable';
    if (trendScore > 0.15) trend = 'escalating';
    else if (trendScore < -0.15) trend = 'de-escalating';

    zones.push({
      id: country.toLowerCase().replace(/\s+/g, '-'),
      name: country,
      country,
      region,
      latitude: lat,
      longitude: lng,
      severity,
      eventCount,
      fatalities30d: fatalities,
      trend,
      primaryType,
      eventType,
      description: `${countryEvents.length} events with ${fatalities} fatalities — ${trend === 'escalating' ? 'severity increasing' : trend === 'de-escalating' ? 'severity decreasing' : 'no significant change in intensity'}`,
      aiAnalysis: { background: '', currentSituation: '', humanitarianImpact: '', outlook: '', keyActors: [] },
      newsSources: [],
      events: [],
    });
  }

  return zones.sort((a, b) => b.severity - a.severity);
}
