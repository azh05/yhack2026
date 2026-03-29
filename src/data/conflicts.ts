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
  trend: "escalating" | "persistent" | "de-escalating";
  primaryType: string;
  eventType:
    | "battles"
    | "violence_civilians"
    | "explosions"
    | "protests"
    | "riots"
    | "strategic";
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

export const CONFLICT_ZONES: ConflictZone[] = [
  {
    id: "gaza-1",
    name: "Gaza Conflict",
    country: "Palestine",
    region: "Middle East & North Africa",
    latitude: 31.3547,
    longitude: 34.3088,
    severity: 9.5,
    eventCount: 287,
    fatalities30d: 3210,
    trend: "persistent",
    primaryType: "Armed Conflict",
    eventType: "violence_civilians",
    description:
      "Devastating military operation with extreme civilian toll and humanitarian crisis.",
    aiAnalysis: {
      background:
        "The ongoing conflict in Gaza escalated dramatically following the October 2023 attacks. Since then, continuous military operations have resulted in unprecedented destruction of civilian infrastructure, including hospitals, schools, and residential buildings across the Strip.",
      currentSituation:
        "Intense military operations continue across the Gaza Strip with daily airstrikes and ground incursions. The northern regions have experienced the heaviest bombardment, while southern areas face increasing pressure from expanding operations. Humanitarian corridors remain inconsistent and unreliable.",
      humanitarianImpact:
        "Over 2.2 million people face acute food insecurity. Medical infrastructure has been severely degraded with most hospitals non-functional. An estimated 1.9 million people are internally displaced, many multiple times.",
      outlook:
        "International ceasefire negotiations continue but face significant obstacles. The humanitarian situation is expected to deteriorate further without sustained aid access and a cessation of hostilities.",
      keyActors: [
        "Israel Defense Forces (IDF)",
        "Hamas",
        "Palestinian Islamic Jihad",
        "UNRWA",
        "Egyptian Mediators",
      ],
    },
    newsSources: [
      {
        outlet: "Al Jazeera",
        headline:
          "Gaza health ministry reports rising casualty toll amid ongoing operations",
        time: "1h ago",
        url: "#",
      },
      {
        outlet: "Reuters",
        headline:
          "UN warns of famine conditions as aid deliveries remain blocked",
        time: "3h ago",
        url: "#",
      },
      {
        outlet: "BBC World",
        headline:
          "Ceasefire talks resume in Cairo with mediators citing cautious optimism",
        time: "5h ago",
        url: "#",
      },
      {
        outlet: "AP News",
        headline:
          "Hospitals in northern Gaza report critical shortage of medical supplies",
        time: "7h ago",
        url: "#",
      },
    ],
    events: [],
  },
  {
    id: "sudan-1",
    name: "Sudan Civil War",
    country: "Sudan",
    region: "Sub-Saharan Africa",
    latitude: 15.5007,
    longitude: 32.5599,
    severity: 9.2,
    eventCount: 342,
    fatalities30d: 1847,
    trend: "escalating",
    primaryType: "Armed Conflict",
    eventType: "battles",
    description:
      "Ongoing civil war between SAF and RSF forces with widespread civilian casualties and mass displacement.",
    aiAnalysis: {
      background:
        "The conflict between the Sudanese Armed Forces (SAF) and the Rapid Support Forces (RSF) erupted in April 2023 after months of tensions over the planned integration of the RSF into the regular military. What began as a power struggle between two military leaders has devolved into a devastating civil war.",
      currentSituation:
        "Fighting has intensified in Khartoum, Darfur, and Kordofan states. The RSF controls large swaths of western Sudan while the SAF maintains strongholds in the east and Port Sudan. Both sides have been accused of targeting civilian areas and using siege tactics that restrict food and aid delivery.",
      humanitarianImpact:
        "Over 10 million people have been displaced, making this one of the largest displacement crises globally. Famine conditions exist in multiple regions, particularly in Darfur and Kordofan. Reports of ethnically targeted violence in West Darfur have raised concerns of genocide.",
      outlook:
        "Escalation is expected to continue through 2026 with neither side showing willingness to negotiate meaningfully. External actors providing arms and support to both sides are prolonging the conflict.",
      keyActors: [
        "Sudanese Armed Forces (SAF)",
        "Rapid Support Forces (RSF)",
        "SLM/A",
        "JEM",
        "UAE (external support)",
      ],
    },
    newsSources: [
      {
        outlet: "Africa News",
        headline:
          "SAF launches counter-offensive in Omdurman as RSF tightens grip on Darfur",
        time: "2h ago",
        url: "#",
      },
      {
        outlet: "Reuters",
        headline:
          "UN Security Council debates new resolution on Sudan arms embargo",
        time: "4h ago",
        url: "#",
      },
      {
        outlet: "Al Jazeera",
        headline:
          "Millions face starvation as aid agencies lose access to conflict zones",
        time: "6h ago",
        url: "#",
      },
      {
        outlet: "The Guardian",
        headline:
          "Eyewitness accounts reveal systematic destruction in West Darfur",
        time: "8h ago",
        url: "#",
      },
    ],
    events: [],
  },
  {
    id: "ukraine-1",
    name: "Russia-Ukraine War",
    country: "Ukraine",
    region: "Eastern Europe",
    latitude: 48.3794,
    longitude: 31.1656,
    severity: 8.8,
    eventCount: 518,
    fatalities30d: 2340,
    trend: "persistent",
    primaryType: "Interstate War",
    eventType: "explosions",
    description:
      "Full-scale interstate war with active frontlines across eastern and southern Ukraine.",
    aiAnalysis: {
      background:
        "Russia launched a full-scale invasion of Ukraine in February 2022, expanding from the limited conflict in Donbas that began in 2014. The war has become the largest conventional military conflict in Europe since World War II, involving hundreds of thousands of troops on both sides.",
      currentSituation:
        "Active frontlines extend across Donetsk, Luhansk, Zaporizhzhia, and Kherson oblasts. Russia continues to launch daily missile and drone strikes against Ukrainian infrastructure. Ukraine maintains defensive positions while conducting localized counter-offensives. Both sides report significant daily casualties.",
      humanitarianImpact:
        "An estimated 6.3 million Ukrainians remain internally displaced, with 6.5 million refugees abroad. Continuous attacks on energy infrastructure have disrupted heating and electricity for millions. Civilian casualties from missile strikes on urban areas continue to mount.",
      outlook:
        "Diplomatic efforts remain stalled. The conflict is likely to remain a war of attrition through 2026, with neither side capable of achieving a decisive breakthrough. Western military support to Ukraine continues but faces political uncertainty.",
      keyActors: [
        "Ukrainian Armed Forces",
        "Russian Armed Forces",
        "Wagner Group remnants",
        "NATO (support)",
        "Belarus (logistics)",
      ],
    },
    newsSources: [
      {
        outlet: "Kyiv Independent",
        headline:
          "Ukrainian forces repel Russian assault near Pokrovsk as fighting intensifies",
        time: "1h ago",
        url: "#",
      },
      {
        outlet: "BBC World",
        headline:
          "Russia launches largest drone attack on Ukrainian energy grid this month",
        time: "3h ago",
        url: "#",
      },
      {
        outlet: "Reuters",
        headline:
          "Zelensky calls for additional air defense systems at EU summit",
        time: "5h ago",
        url: "#",
      },
      {
        outlet: "AP News",
        headline:
          "Frontline update: Both sides report heavy losses in Donetsk region",
        time: "7h ago",
        url: "#",
      },
    ],
    events: [],
  },
  {
    id: "myanmar-1",
    name: "Myanmar Civil War",
    country: "Myanmar",
    region: "Southeast Asia",
    latitude: 19.7633,
    longitude: 96.0785,
    severity: 8.1,
    eventCount: 189,
    fatalities30d: 623,
    trend: "escalating",
    primaryType: "Civil War",
    eventType: "battles",
    description:
      "Multi-front civil war with ethnic armed organizations and resistance forces opposing military junta.",
    aiAnalysis: {
      background:
        "Following the February 2021 military coup that overthrew the elected government, Myanmar descended into a multi-front civil war. Ethnic armed organizations (EAOs) that had fought the military for decades were joined by newly formed People's Defence Forces (PDFs) organized under the National Unity Government.",
      currentSituation:
        "The military junta has lost control of significant territory, particularly in Shan, Chin, Kayah, and Karenni states. The Three Brotherhood Alliance offensive in northern Shan State dealt major blows to the military. Urban resistance continues in major cities with bombings and targeted assassinations.",
      humanitarianImpact:
        "Over 2.7 million people are internally displaced. The military has used airstrikes on civilian areas, burned villages, and imposed movement restrictions that limit humanitarian access. The healthcare system has collapsed in many conflict-affected areas.",
      outlook:
        "The junta is losing ground militarily but shows no signs of negotiating. A prolonged conflict with gradual territorial fragmentation is the most likely scenario. International engagement remains limited beyond ASEAN diplomatic efforts.",
      keyActors: [
        "Tatmadaw (Military)",
        "National Unity Government",
        "People's Defence Forces",
        "Three Brotherhood Alliance",
        "Karen National Union",
      ],
    },
    newsSources: [
      {
        outlet: "Myanmar Now",
        headline: "Resistance forces capture major military base in Shan State",
        time: "2h ago",
        url: "#",
      },
      {
        outlet: "The Irrawaddy",
        headline: "Junta airstrikes on Sagaing region kill dozens of civilians",
        time: "4h ago",
        url: "#",
      },
      {
        outlet: "Reuters",
        headline:
          "ASEAN envoy calls for humanitarian access as displacement crisis worsens",
        time: "6h ago",
        url: "#",
      },
      {
        outlet: "Al Jazeera",
        headline:
          "Analysis: How resistance forces are reshaping Myanmar's political map",
        time: "9h ago",
        url: "#",
      },
    ],
    events: [],
  },
  {
    id: "sahel-1",
    name: "Sahel Insurgency",
    country: "Burkina Faso",
    region: "Sub-Saharan Africa",
    latitude: 12.3714,
    longitude: -1.5197,
    severity: 7.8,
    eventCount: 167,
    fatalities30d: 534,
    trend: "escalating",
    primaryType: "Jihadist Insurgency",
    eventType: "explosions",
    description:
      "JNIM and ISGS forces attacking communities and military across Burkina Faso, Mali, and Niger.",
    aiAnalysis: {
      background:
        "The Sahel insurgency, driven primarily by JNIM (linked to al-Qaeda) and the Islamic State in the Greater Sahara (ISGS), has expanded dramatically since 2019. Military coups in Mali, Burkina Faso, and Niger have disrupted counter-terrorism cooperation, and the withdrawal of French forces created security vacuums.",
      currentSituation:
        "Burkina Faso faces the most severe threat, with armed groups controlling an estimated 40% of national territory. Attacks on villages, military outposts, and supply convoys are near-daily occurrences. The ruling juntas have turned to Russian Wagner/Africa Corps mercenaries for support, with mixed results.",
      humanitarianImpact:
        "Over 4 million people are displaced across the three countries. Communities besieged by armed groups face severe food shortages. Schools and health facilities have been forced to close in conflict-affected areas, affecting millions of children.",
      outlook:
        "The security situation is expected to deteriorate further as armed groups exploit governance gaps and ethnic tensions. The shift away from Western security partnerships has not yielded improved outcomes.",
      keyActors: [
        "JNIM (al-Qaeda affiliate)",
        "ISGS (Islamic State)",
        "Burkina Faso Military",
        "Wagner/Africa Corps",
        "Local Self-Defense Militias",
      ],
    },
    newsSources: [
      {
        outlet: "Africa News",
        headline: "Dozens killed in attack on northern Burkina Faso village",
        time: "3h ago",
        url: "#",
      },
      {
        outlet: "France 24",
        headline:
          "Sahel alliance faces growing insurgent threat despite military rule",
        time: "5h ago",
        url: "#",
      },
      {
        outlet: "Reuters",
        headline:
          "UN reports record displacement in Burkina Faso as conflict intensifies",
        time: "8h ago",
        url: "#",
      },
      {
        outlet: "The Guardian",
        headline:
          "How Russian mercenaries are reshaping the Sahel security landscape",
        time: "12h ago",
        url: "#",
      },
    ],
    events: [],
  },
  {
    id: "drc-1",
    name: "Eastern DRC Conflict",
    country: "DR Congo",
    region: "Sub-Saharan Africa",
    latitude: -1.68,
    longitude: 29.22,
    severity: 7.6,
    eventCount: 156,
    fatalities30d: 412,
    trend: "escalating",
    primaryType: "Armed Conflict",
    eventType: "battles",
    description:
      "M23 and allied armed groups clashing with government forces in North Kivu and Ituri.",
    aiAnalysis: {
      background:
        "Eastern DRC has experienced decades of armed conflict involving over 100 armed groups. The resurgence of the M23 movement, widely believed to be backed by Rwanda, has escalated tensions since late 2021. The region's vast mineral wealth fuels conflict financing and competition among armed groups.",
      currentSituation:
        "M23 controls significant territory in North Kivu province, including areas around Goma. FARDC forces, supported by regional peacekeepers, are attempting to contain the advance. Inter-communal violence and attacks by ADF (ISIS-linked) in Ituri province compound the crisis.",
      humanitarianImpact:
        "Over 7 million people are displaced in eastern DRC, the largest internal displacement crisis in Africa. Cholera outbreaks and malnutrition are widespread in displacement camps. Sexual violence is used systematically as a weapon of war.",
      outlook:
        "Regional diplomatic efforts through the Nairobi and Luanda processes have yielded limited results. The conflict is likely to persist given the involvement of external actors and competition over mineral resources.",
      keyActors: [
        "M23 Rebels",
        "FARDC (Congolese Army)",
        "ADF/ISIS-DRC",
        "Mai-Mai Militias",
        "Rwanda (alleged support to M23)",
      ],
    },
    newsSources: [
      {
        outlet: "Al Jazeera",
        headline: "M23 advances toward strategic mining areas in North Kivu",
        time: "2h ago",
        url: "#",
      },
      {
        outlet: "Reuters",
        headline: "DRC accuses Rwanda of supporting rebel offensive near Goma",
        time: "5h ago",
        url: "#",
      },
      {
        outlet: "BBC Africa",
        headline:
          "Humanitarian crisis deepens as displacement numbers reach new highs",
        time: "7h ago",
        url: "#",
      },
      {
        outlet: "France 24",
        headline: "East African force struggles to contain spreading violence",
        time: "10h ago",
        url: "#",
      },
    ],
    events: [],
  },
  {
    id: "ethiopia-1",
    name: "Ethiopia \u2013 Amhara & Oromia",
    country: "Ethiopia",
    region: "Sub-Saharan Africa",
    latitude: 9.145,
    longitude: 40.4897,
    severity: 7.0,
    eventCount: 134,
    fatalities30d: 298,
    trend: "escalating",
    primaryType: "Insurgency",
    eventType: "violence_civilians",
    description:
      "Fano militia in Amhara and OLA in Oromia fighting federal forces across multiple fronts.",
    aiAnalysis: {
      background:
        "While the Tigray war ended with the Pretoria Agreement in November 2022, new fronts have opened in Amhara and Oromia regions. Fano militias in Amhara, initially allied with federal forces during the Tigray conflict, turned against the government after the disarmament of regional forces. The Oromo Liberation Army (OLA) continues its insurgency in Oromia.",
      currentSituation:
        "Fano forces have captured multiple towns in Amhara region and maintain control of rural areas. The Ethiopian National Defense Force (ENDF) has conducted airstrikes and ground offensives to retake territory. In Oromia, OLA attacks on government installations and ethnic-targeted violence continue.",
      humanitarianImpact:
        "An estimated 4.5 million people are displaced across Amhara and Oromia. Communication blackouts imposed by the government limit reporting. Food aid has been disrupted in conflict-affected areas.",
      outlook:
        "Multiple simultaneous insurgencies are straining federal military capacity. Negotiations with Fano leadership have not materialized, and the OLA remains committed to armed struggle.",
      keyActors: [
        "Ethiopian National Defense Force",
        "Fano Militia",
        "Oromo Liberation Army (OLA)",
        "Amhara Regional Forces",
        "Eritrean Forces (border areas)",
      ],
    },
    newsSources: [
      {
        outlet: "Ethiopia Insight",
        headline: "Fano fighters capture key town in South Gondar zone",
        time: "3h ago",
        url: "#",
      },
      {
        outlet: "Reuters",
        headline:
          "Ethiopia internet shutdown extends to Amhara amid military operations",
        time: "6h ago",
        url: "#",
      },
      {
        outlet: "Al Jazeera",
        headline:
          "Civilians caught between federal forces and Fano militia in Amhara",
        time: "8h ago",
        url: "#",
      },
      {
        outlet: "VOA Africa",
        headline:
          "Humanitarian agencies warn of growing food crisis in conflict zones",
        time: "11h ago",
        url: "#",
      },
    ],
    events: [],
  },
  {
    id: "yemen-1",
    name: "Yemen War",
    country: "Yemen",
    region: "Middle East & North Africa",
    latitude: 15.3694,
    longitude: 44.191,
    severity: 6.8,
    eventCount: 112,
    fatalities30d: 243,
    trend: "persistent",
    primaryType: "Civil War",
    eventType: "explosions",
    description:
      "Houthi-government conflict with ongoing military operations and humanitarian emergency.",
    aiAnalysis: {
      background:
        "Yemen's civil war has been ongoing since 2014 when Houthi forces captured Sanaa. The Saudi-led coalition intervened in 2015. While a UN-brokered truce in 2022 significantly reduced hostilities, the underlying conflict remains unresolved. Houthi attacks on Red Sea shipping since late 2023 have added an international dimension.",
      currentSituation:
        "Ground fighting remains at low levels following the extended truce, but sporadic clashes occur along frontlines in Marib and Taiz. Houthi maritime operations in the Red Sea have drawn US and UK military strikes on Houthi positions. Internal governance remains split between Houthi and government-controlled areas.",
      humanitarianImpact:
        "Yemen remains the world's worst humanitarian crisis with 21.6 million people needing assistance. Malnutrition rates among children are among the highest globally. Economic collapse has left most of the population dependent on aid.",
      outlook:
        "A comprehensive peace deal remains elusive despite Saudi-Houthi talks. The Red Sea crisis adds complexity to negotiations. Economic conditions will continue to drive humanitarian needs.",
      keyActors: [
        "Ansar Allah (Houthis)",
        "Yemeni Government",
        "Saudi-led Coalition",
        "Southern Transitional Council",
        "US Military (Red Sea operations)",
      ],
    },
    newsSources: [
      {
        outlet: "Al Jazeera",
        headline:
          "Houthis launch new wave of attacks on commercial shipping in Red Sea",
        time: "2h ago",
        url: "#",
      },
      {
        outlet: "Reuters",
        headline:
          "US strikes Houthi missile storage facilities in western Yemen",
        time: "5h ago",
        url: "#",
      },
      {
        outlet: "BBC World",
        headline: "Yemen peace talks stall over power-sharing disagreements",
        time: "8h ago",
        url: "#",
      },
      {
        outlet: "Middle East Eye",
        headline:
          "Yemeni civilians bear brunt of economic collapse and currency crisis",
        time: "12h ago",
        url: "#",
      },
    ],
    events: [],
  },
  {
    id: "somalia-1",
    name: "Somalia \u2013 Al-Shabaab",
    country: "Somalia",
    region: "Sub-Saharan Africa",
    latitude: 2.0469,
    longitude: 45.3182,
    severity: 6.5,
    eventCount: 98,
    fatalities30d: 178,
    trend: "persistent",
    primaryType: "Counterterrorism",
    eventType: "battles",
    description:
      "Ongoing operations against al-Shabaab in southern and central regions.",
    aiAnalysis: {
      background:
        "Al-Shabaab, an al-Qaeda-affiliated group, has waged an insurgency in Somalia since 2006. Despite losing control of major cities, the group maintains significant rural territory and conducts regular attacks. The Somali government launched a major offensive in 2022 to reclaim territory.",
      currentSituation:
        "Government forces, supported by clan militias and African Union (ATMIS) troops, have made territorial gains but face persistent asymmetric attacks. Al-Shabaab continues to conduct car bombings in Mogadishu and ambushes on military convoys. The group remains capable of large-scale attacks.",
      humanitarianImpact:
        "Over 3.8 million Somalis are internally displaced. Drought and conflict have created food insecurity affecting 4.3 million people. Al-Shabaab taxation and blockades exacerbate civilian suffering in areas under their influence.",
      outlook:
        "Military gains against al-Shabaab are fragile without sustained clan cooperation and governance improvements. The planned ATMIS drawdown raises concerns about security capacity.",
      keyActors: [
        "Somali National Army",
        "Al-Shabaab",
        "ATMIS (African Union)",
        "Clan Militias (Ma'awisley)",
        "US Africa Command (airstrikes)",
      ],
    },
    newsSources: [
      {
        outlet: "Garowe Online",
        headline:
          "Somali forces recapture town in Middle Shabelle after al-Shabaab retreat",
        time: "4h ago",
        url: "#",
      },
      {
        outlet: "Reuters",
        headline:
          "Car bomb in Mogadishu kills at least 12 near government compound",
        time: "6h ago",
        url: "#",
      },
      {
        outlet: "BBC Africa",
        headline:
          "ATMIS troop withdrawal raises security concerns in liberated areas",
        time: "9h ago",
        url: "#",
      },
      {
        outlet: "VOA Africa",
        headline:
          "US conducts airstrike against al-Shabaab commanders in southern Somalia",
        time: "14h ago",
        url: "#",
      },
    ],
    events: [],
  },
  {
    id: "syria-1",
    name: "Syria Transition",
    country: "Syria",
    region: "Middle East & North Africa",
    latitude: 35.0,
    longitude: 38.0,
    severity: 6.2,
    eventCount: 94,
    fatalities30d: 187,
    trend: "de-escalating",
    primaryType: "Post-Conflict Transition",
    eventType: "strategic",
    description:
      "Transitional government established post-Assad. Sporadic clashes between factions.",
    aiAnalysis: {
      background:
        "After the fall of the Assad regime in late 2024, Syria entered a complex transitional period. Multiple armed factions that cooperated to overthrow Assad now compete for influence in the new political order. The country remains divided between various control zones.",
      currentSituation:
        "The transitional government in Damascus is working to consolidate authority but faces resistance from remnant regime loyalists and inter-factional disputes. Turkish-backed forces and Kurdish SDF forces maintain separate zones of control. ISIS remnants continue low-level attacks in the eastern desert.",
      humanitarianImpact:
        "While some refugees have begun returning, 6.8 million Syrians remain internally displaced and 5.5 million are refugees abroad. Reconstruction needs are massive, estimated at over $400 billion. Unexploded ordnance poses ongoing risks.",
      outlook:
        "The de-escalation trend is cautious. Success depends on inclusive governance, disarmament negotiations, and international reconstruction support. Spoiler actors could reignite conflict.",
      keyActors: [
        "Transitional Government",
        "HTS (Hay'at Tahrir al-Sham)",
        "Syrian Democratic Forces (SDF)",
        "Turkish-backed SNA",
        "ISIS remnants",
      ],
    },
    newsSources: [
      {
        outlet: "Syria Direct",
        headline:
          "Transitional council announces new timeline for constitutional process",
        time: "3h ago",
        url: "#",
      },
      {
        outlet: "Al Jazeera",
        headline:
          "Sporadic clashes between SDF and Turkish-backed forces in northeast Syria",
        time: "6h ago",
        url: "#",
      },
      {
        outlet: "Reuters",
        headline:
          "Syrian refugees weigh uncertain return as transitional government takes shape",
        time: "9h ago",
        url: "#",
      },
      {
        outlet: "BBC World",
        headline:
          "International donors pledge reconstruction aid at Brussels conference",
        time: "14h ago",
        url: "#",
      },
    ],
    events: [],
  },
  {
    id: "haiti-1",
    name: "Haiti Gang Violence",
    country: "Haiti",
    region: "Central America & Caribbean",
    latitude: 18.5944,
    longitude: -72.3074,
    severity: 6.0,
    eventCount: 76,
    fatalities30d: 112,
    trend: "persistent",
    primaryType: "Gang Violence",
    eventType: "riots",
    description:
      "Armed gangs controlling large sections of Port-au-Prince with extortion and kidnapping.",
    aiAnalysis: {
      background:
        "Haiti has experienced a dramatic escalation of gang violence since the assassination of President Mo\u00efse in 2021. Armed gangs, which expanded during years of political instability, now control an estimated 80% of Port-au-Prince. The deployment of the Kenya-led Multinational Security Support (MSS) mission in 2024 has had limited impact.",
      currentSituation:
        "Gang coalitions including Viv Ansanm and G-P\u00e8p continue to exert control over key neighborhoods. Kidnapping for ransom, extortion, and sexual violence are endemic. The MSS mission operates with limited mandate and resources. Government institutions are largely non-functional in gang-controlled areas.",
      humanitarianImpact:
        "Over 700,000 people have been displaced by gang violence. Food insecurity affects 5.4 million Haitians. Healthcare facilities in Port-au-Prince have been forced to close or operate at minimal capacity.",
      outlook:
        "Stabilization depends on expanded international security support and restoration of state institutions. Without addressing root causes of poverty and political dysfunction, gang control is likely to persist.",
      keyActors: [
        "Viv Ansanm Alliance",
        "G-P\u00e8p Coalition",
        "Haitian National Police",
        "Kenya-led MSS Mission",
        "UN Agencies",
      ],
    },
    newsSources: [
      {
        outlet: "Miami Herald",
        headline:
          "Kenyan-led security force faces mounting challenges in Port-au-Prince",
        time: "4h ago",
        url: "#",
      },
      {
        outlet: "Reuters",
        headline:
          "Gang violence displaces thousands more from Haiti capital neighborhoods",
        time: "7h ago",
        url: "#",
      },
      {
        outlet: "AP News",
        headline:
          "UN reports alarming rise in sexual violence by armed gangs in Haiti",
        time: "10h ago",
        url: "#",
      },
      {
        outlet: "Al Jazeera",
        headline:
          "Haiti's humanitarian crisis deepens as gang warfare intensifies",
        time: "15h ago",
        url: "#",
      },
    ],
    events: [],
  },
  {
    id: "iraq-1",
    name: "Iraq \u2013 Militia Activity",
    country: "Iraq",
    region: "Middle East & North Africa",
    latitude: 33.3152,
    longitude: 44.3661,
    severity: 5.8,
    eventCount: 52,
    fatalities30d: 64,
    trend: "escalating",
    primaryType: "Militia Activity",
    eventType: "explosions",
    description:
      "Iranian-backed militia attacks on US bases and renewed ISIS activity in rural areas.",
    aiAnalysis: {
      background:
        "Iraq faces a dual security challenge from Iranian-backed militias conducting attacks on US-led coalition bases and a low-level ISIS insurgency in rural areas. The broader regional tensions following the Gaza conflict have intensified militia activity.",
      currentSituation:
        "Iranian-backed groups have escalated drone and rocket attacks on US military installations. ISIS sleeper cells continue assassinations and ambushes in Diyala, Kirkuk, and Saladin provinces. Iraqi security forces conduct periodic counter-terrorism operations but struggle to maintain control in remote areas.",
      humanitarianImpact:
        "While humanitarian conditions have improved since the peak of the ISIS conflict, 1.1 million people remain displaced. Communities in formerly ISIS-held areas face slow reconstruction and limited public services.",
      outlook:
        "Militia activity is closely tied to regional dynamics, particularly tensions between the US and Iran. ISIS remains degraded but capable of regeneration if security lapses.",
      keyActors: [
        "Iraqi Security Forces",
        "Popular Mobilization Forces (PMF)",
        "ISIS remnants",
        "Kata'ib Hezbollah",
        "US-led Coalition",
      ],
    },
    newsSources: [
      {
        outlet: "Al-Monitor",
        headline:
          "Drone attack targets US base in western Iraq amid regional tensions",
        time: "3h ago",
        url: "#",
      },
      {
        outlet: "Reuters",
        headline: "ISIS militants ambush Iraqi army patrol in Diyala province",
        time: "6h ago",
        url: "#",
      },
      {
        outlet: "BBC World",
        headline:
          "Iraqi PM calls for restraint as militia attacks threaten stability",
        time: "10h ago",
        url: "#",
      },
      {
        outlet: "AP News",
        headline:
          "Coalition forces conduct joint counter-ISIS operation in Kirkuk",
        time: "14h ago",
        url: "#",
      },
    ],
    events: [],
  },
  {
    id: "mexico-1",
    name: "Mexico \u2013 Cartel Violence",
    country: "Mexico",
    region: "Central America & Caribbean",
    latitude: 23.6345,
    longitude: -102.5528,
    severity: 5.8,
    eventCount: 145,
    fatalities30d: 267,
    trend: "persistent",
    primaryType: "Organized Crime",
    eventType: "violence_civilians",
    description:
      "Cartel territorial warfare concentrated in Sinaloa, Michoac\u00e1n, and Chiapas.",
    aiAnalysis: {
      background:
        "Mexico's drug cartel violence has intensified following the capture of Sinaloa cartel leaders and the resulting power vacuum. The Jalisco New Generation Cartel (CJNG) continues to expand aggressively, while fragmented Sinaloa factions fight for control. Chiapas has emerged as a new conflict hotspot.",
      currentSituation:
        "Cartel territorial disputes are causing record homicide rates in Sinaloa, Guerrero, and Chiapas states. Armed confrontations between rival groups include use of armored vehicles and military-grade weapons. Migrant routes have become contested territory, with cartels controlling human smuggling operations.",
      humanitarianImpact:
        "Communities in conflict zones face forced displacement, extortion, and recruitment of minors. Over 110,000 people remain disappeared. Journalists and human rights defenders face extreme risk.",
      outlook:
        "Violence is likely to persist at current levels. Government security strategy has shown limited effectiveness in reducing cartel power. The migration corridor through Chiapas adds complexity to the security landscape.",
      keyActors: [
        "Sinaloa Cartel (factions)",
        "CJNG",
        "Mexican Armed Forces",
        "National Guard",
        "Local Self-Defense Groups",
      ],
    },
    newsSources: [
      {
        outlet: "El Universal",
        headline:
          "Cartel gunfight in Sinaloa leaves 15 dead amid factional warfare",
        time: "2h ago",
        url: "#",
      },
      {
        outlet: "Reuters",
        headline:
          "Mexico deploys additional troops to Chiapas as cartel violence surges",
        time: "5h ago",
        url: "#",
      },
      {
        outlet: "AP News",
        headline:
          "Record homicides reported in Guerrero state amid cartel expansion",
        time: "8h ago",
        url: "#",
      },
      {
        outlet: "BBC World",
        headline:
          "Mexican communities form self-defense groups against cartel extortion",
        time: "12h ago",
        url: "#",
      },
    ],
    events: [],
  },
  {
    id: "pakistan-1",
    name: "Pakistan \u2013 Balochistan & KP",
    country: "Pakistan",
    region: "South Asia",
    latitude: 30.3753,
    longitude: 69.3451,
    severity: 5.5,
    eventCount: 71,
    fatalities30d: 104,
    trend: "escalating",
    primaryType: "Insurgency",
    eventType: "protests",
    description:
      "TTP and Baloch separatist attacks targeting security forces in western provinces.",
    aiAnalysis: {
      background:
        "Pakistan faces a resurgent Tehrik-i-Taliban Pakistan (TTP) insurgency in Khyber Pakhtunkhwa province and a growing Baloch separatist movement in Balochistan. The TTP regrouped following the Taliban's return to power in Afghanistan, which provided safe havens across the border.",
      currentSituation:
        "TTP attacks on military and police targets have increased by 60% compared to the previous year. The Balochistan Liberation Army (BLA) has conducted sophisticated attacks including suicide bombings targeting Chinese interests and military convoys. Security forces are conducting operations in both provinces.",
      humanitarianImpact:
        "Millions in affected areas face disrupted public services and economic hardship. Displacement from military operations adds to existing vulnerabilities. Cross-border tensions with Afghanistan complicate refugee management.",
      outlook:
        "The security situation is expected to remain challenging. Afghanistan's inability or unwillingness to act against TTP sanctuaries limits Pakistan's counter-terrorism options.",
      keyActors: [
        "Pakistan Armed Forces",
        "TTP (Tehrik-i-Taliban Pakistan)",
        "BLA (Balochistan Liberation Army)",
        "BLF (Baloch Liberation Front)",
        "Afghan Taliban (border dynamics)",
      ],
    },
    newsSources: [
      {
        outlet: "Dawn",
        headline:
          "TTP claims responsibility for attack on security checkpoint in North Waziristan",
        time: "3h ago",
        url: "#",
      },
      {
        outlet: "Reuters",
        headline: "BLA suicide bomber targets Chinese-funded project in Gwadar",
        time: "6h ago",
        url: "#",
      },
      {
        outlet: "Al Jazeera",
        headline:
          "Pakistan military launches operation against TTP in Khyber Pakhtunkhwa",
        time: "9h ago",
        url: "#",
      },
      {
        outlet: "BBC World",
        headline: "Escalating militancy strains Pakistan-Afghanistan relations",
        time: "13h ago",
        url: "#",
      },
    ],
    events: [],
  },
  {
    id: "colombia-1",
    name: "Colombia \u2013 Armed Groups",
    country: "Colombia",
    region: "South America",
    latitude: 4.5709,
    longitude: -74.2973,
    severity: 5.2,
    eventCount: 63,
    fatalities30d: 87,
    trend: "persistent",
    primaryType: "Armed Conflict",
    eventType: "strategic",
    description:
      "ELN, FARC dissidents, and other armed groups active in border regions and Pacific coast.",
    aiAnalysis: {
      background:
        'Despite the 2016 peace accord with FARC, Colombia continues to face armed violence from the ELN guerrillas, FARC dissident groups (EMC and Segunda Marquetalia), and criminal organizations. President Petro\'s "Total Peace" policy of simultaneous negotiations with multiple groups has shown mixed results.',
      currentSituation:
        "The ELN ceasefire collapsed, leading to renewed attacks in Arauca and Norte de Santander. FARC dissident factions control coca-growing regions and illegal mining operations. Violence along the Pacific coast (Choc\u00f3, Nari\u00f1o) has forced mass confinements of Afro-Colombian and indigenous communities.",
      humanitarianImpact:
        "Over 6.9 million registered conflict victims. Community confinements restrict access to food, healthcare, and education for thousands. Anti-personnel mines continue to cause civilian casualties.",
      outlook:
        'Fragmented armed groups and competing economic interests make comprehensive peace elusive. The "Total Peace" approach faces political opposition and implementation challenges.',
      keyActors: [
        "ELN",
        "EMC (FARC dissidents)",
        "Segunda Marquetalia",
        "Clan del Golfo",
        "Colombian Armed Forces",
      ],
    },
    newsSources: [
      {
        outlet: "El Espectador",
        headline: "ELN attacks resume in Arauca after ceasefire collapse",
        time: "4h ago",
        url: "#",
      },
      {
        outlet: "Reuters",
        headline:
          "Colombia's Total Peace strategy faces new setbacks with FARC dissidents",
        time: "7h ago",
        url: "#",
      },
      {
        outlet: "AP News",
        headline:
          "Indigenous communities in Choco confined by armed group clashes",
        time: "10h ago",
        url: "#",
      },
      {
        outlet: "BBC World",
        headline:
          "Colombia coca production reaches new highs despite peace efforts",
        time: "15h ago",
        url: "#",
      },
    ],
    events: [],
  },
  {
    id: "lebanon-1",
    name: "Lebanon \u2013 Border Tensions",
    country: "Lebanon",
    region: "Middle East & North Africa",
    latitude: 33.8547,
    longitude: 35.8623,
    severity: 5.0,
    eventCount: 38,
    fatalities30d: 42,
    trend: "de-escalating",
    primaryType: "Cross-border Shelling",
    eventType: "explosions",
    description:
      "Reduced cross-border exchanges after ceasefire, but tensions remain along the Blue Line.",
    aiAnalysis: {
      background:
        "Southern Lebanon experienced its most intense conflict since 2006 following the October 2023 Gaza escalation, with Hezbollah and Israel exchanging daily cross-border fire. A ceasefire agreement in late 2024 has reduced hostilities, but violations continue.",
      currentSituation:
        "The ceasefire largely holds but sporadic violations from both sides keep tensions elevated. Israeli forces have withdrawn from most occupied positions in southern Lebanon. The Lebanese Armed Forces are deploying to border areas as part of the agreement. Reconstruction in devastated border towns has barely begun.",
      humanitarianImpact:
        "Over 100,000 Lebanese remain displaced from border areas. Extensive infrastructure damage in southern Lebanon includes homes, agricultural land, and public services. Unexploded ordnance, including cluster munitions, poses ongoing risks.",
      outlook:
        "The ceasefire has reduced immediate risks but remains fragile. Full implementation depends on political will from all parties and sustained international monitoring.",
      keyActors: [
        "Hezbollah",
        "Lebanese Armed Forces",
        "Israel Defense Forces",
        "UNIFIL",
        "US Mediators",
      ],
    },
    newsSources: [
      {
        outlet: "L'Orient Today",
        headline:
          "Lebanese army completes deployment to additional border positions",
        time: "4h ago",
        url: "#",
      },
      {
        outlet: "Al Jazeera",
        headline:
          "Ceasefire violations reported as Israel conducts reconnaissance flights",
        time: "7h ago",
        url: "#",
      },
      {
        outlet: "Reuters",
        headline: "Southern Lebanon residents return to find homes destroyed",
        time: "10h ago",
        url: "#",
      },
      {
        outlet: "BBC World",
        headline:
          "UNIFIL increases patrols amid fragile ceasefire along Blue Line",
        time: "14h ago",
        url: "#",
      },
    ],
    events: [],
  },
  {
    id: "nigeria-1",
    name: "Nigeria \u2013 Multi-Front Crisis",
    country: "Nigeria",
    region: "Sub-Saharan Africa",
    latitude: 9.082,
    longitude: 8.6753,
    severity: 6.8,
    eventCount: 121,
    fatalities30d: 234,
    trend: "escalating",
    primaryType: "Multi-Front Conflict",
    eventType: "riots",
    description:
      "Boko Haram/ISWAP in the northeast, banditry in the northwest, and separatist tensions in the southeast.",
    aiAnalysis: {
      background:
        "Nigeria faces concurrent security crises across multiple regions. The Boko Haram/ISWAP insurgency in the northeast has persisted since 2009. Armed banditry and cattle-rustling have devastated northwestern states. Separatist agitation by IPOB in the southeast adds another dimension.",
      currentSituation:
        "ISWAP dominates the Lake Chad basin while bandit groups in Zamfara, Katsina, and Niger states conduct mass kidnappings and village raids. The Nigerian military is stretched across multiple theaters. In the southeast, sit-at-home orders enforced by IPOB disrupt economic activity.",
      humanitarianImpact:
        "Over 3.3 million people are displaced in the northeast alone. Mass kidnappings in the northwest have traumatized communities and disrupted education. Food insecurity affects 26.5 million Nigerians.",
      outlook:
        "The multi-front nature of the crisis strains military resources. Without addressing underlying governance and economic failures, security conditions are unlikely to improve substantially.",
      keyActors: [
        "Nigerian Armed Forces",
        "ISWAP",
        "Boko Haram (JAS faction)",
        "Armed Bandits",
        "IPOB/ESN",
      ],
    },
    newsSources: [
      {
        outlet: "Premium Times",
        headline: "Bandits abduct over 100 villagers in Zamfara State raid",
        time: "2h ago",
        url: "#",
      },
      {
        outlet: "Reuters",
        headline: "ISWAP fighters overrun military base in Borno State",
        time: "5h ago",
        url: "#",
      },
      {
        outlet: "Al Jazeera",
        headline:
          "Nigeria deploys additional troops to northwest amid kidnapping surge",
        time: "8h ago",
        url: "#",
      },
      {
        outlet: "BBC Africa",
        headline:
          "Millions face hunger as insecurity disrupts farming in northern Nigeria",
        time: "12h ago",
        url: "#",
      },
    ],
    events: [],
  },
];

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
