export type PlatformType = 'discord' | 'reddit' | 'linkedin' | 'slack' | 'forum' | 'github' | 'youtube' | 'twitter';

export type PersonaFilter = 'all' | 'automotive' | 'vss' | 'world-foundation-models' | 'robotics' | 'openusd' | 'industrial-dt';
export type EventFormat = 'in-person' | 'virtual' | 'hybrid';
export type EventType = 'conference' | 'summit' | 'hackathon' | 'meetup' | 'workshop' | 'podcast' | 'webinar';
export type BuzzLevel = 'low' | 'medium' | 'high' | 'trending';
export type Region = 'americas' | 'emea' | 'apac' | 'global';

export interface RegionMeta {
  label: string;
  short: string;
  emoji: string;
  color: string;
}

export const REGION_META: Record<Region, RegionMeta> = {
  americas: { label: 'Americas',                    short: 'Americas', emoji: '🌎', color: 'bg-blue-100 text-blue-800' },
  emea:     { label: 'Europe · Middle East · Africa', short: 'EMEA',    emoji: '🌍', color: 'bg-emerald-100 text-emerald-800' },
  apac:     { label: 'Asia Pacific',                 short: 'APAC',     emoji: '🌏', color: 'bg-amber-100 text-amber-800' },
  global:   { label: 'Global / Online',              short: 'Global',   emoji: '🌐', color: 'bg-violet-100 text-violet-800' },
};

/** Physical AI verticals — used to filter all Landscape Intel tabs */
export type PhysicalAIDomain =
  | 'robotics'
  | 'autonomous-vehicles'
  | 'industrial'
  | 'healthcare'
  | 'aerospace'
  | 'simulation'
  | 'edge-ai'
  | 'infrastructure'
  | 'cae';

export interface DomainMeta {
  label: string;
  short: string;
  color: string;   // tailwind bg+text
  emoji: string;
}

export const DOMAIN_META: Record<PhysicalAIDomain, DomainMeta> = {
  'robotics':            { label: 'Robotics',                     short: 'Robotics',    color: 'bg-orange-100 text-orange-800', emoji: '🤖' },
  'autonomous-vehicles': { label: 'Autonomous Vehicles',          short: 'AV',          color: 'bg-blue-100 text-blue-800',    emoji: '🚗' },
  'industrial':          { label: 'Industrial Automation',        short: 'Industrial',  color: 'bg-slate-100 text-slate-800',  emoji: '🏭' },
  'healthcare':          { label: 'Healthcare',                   short: 'Healthcare',  color: 'bg-red-100 text-red-800',      emoji: '🏥' },
  'aerospace':           { label: 'Aerospace & Drones',           short: 'Aerospace',   color: 'bg-sky-100 text-sky-800',      emoji: '✈️' },
  'simulation':          { label: 'Simulation & Digital Twins',   short: 'Simulation',  color: 'bg-violet-100 text-violet-800', emoji: '🔬' },
  'edge-ai':             { label: 'Edge AI & IoT',                short: 'Edge AI',     color: 'bg-teal-100 text-teal-800',    emoji: '⚡' },
  'infrastructure':      { label: 'Smart Infrastructure',         short: 'Infra',       color: 'bg-amber-100 text-amber-800',  emoji: '🏗️' },
  'cae':                 { label: 'CAE / Engineering Simulation', short: 'CAE',         color: 'bg-cyan-100 text-cyan-800',    emoji: '⚙️' },
};

export interface Community {
  id: string;
  name: string;
  platform: PlatformType;
  url: string;
  members: number;
  description: string;
  topics: string[];
  buzzLevel: BuzzLevel;
  weeklyActivity: number; // posts/messages per week estimate
  lastActive: string; // ISO
  domains?: PhysicalAIDomain[];
  region?: Region;
}

export interface Conference {
  id: string;
  name: string;
  type: EventType;
  format: EventFormat;
  startDate: string;
  endDate?: string;
  location: string;
  url: string;
  description: string;
  topics: string[];
  expectedAttendance?: number;
  buzzLevel: BuzzLevel;
  notableSpeakers?: string[];
  cfpDeadline?: string;
  domains?: PhysicalAIDomain[];
  region?: Region;
  lumaUrl?: string;
  registrationUrl?: string;
  nvidiaTech?: boolean;
  nvidiaTechDetails?: string;
  sponsorRecommendation?: 'yes' | 'maybe' | 'no';
  sponsorReason?: string;
}

export interface Speaker {
  id: string;
  name: string;
  title: string;
  company: string;
  bio: string;
  topics: string[];
  linkedinUrl?: string;
  twitterHandle?: string;
  websiteUrl?: string;
  linkedinFollowers?: number;
  twitterFollowers?: number;
  kloutScore: number; // 0-100 computed: reach + speaking frequency + topic relevance
  recentAppearances: Appearance[];
  photoUrl?: string;
  domains?: PhysicalAIDomain[];
}

export interface Appearance {
  show: string;
  platform: PlatformType | 'podcast' | 'conference';
  date: string;
  title: string;
  url?: string;
}

export interface Show {
  id: string;
  name: string;
  host: string;
  platform: PlatformType | 'podcast';
  url: string;
  description: string;
  subscribers?: number;
  episodesPerMonth?: number;
  topics: string[];
  buzzLevel: BuzzLevel;
  recentGuests: string[];
  lastEpisodeDate: string;
  domains?: PhysicalAIDomain[];
}

export interface HotTopic {
  id: string;
  topic: string;
  description: string;
  buzzScore: number; // 0-100
  priorityScore?: number; // 0-100 strategic priority score
  priorityTier?: 'must-win' | 'move-now' | 'monitor' | 'archive';
  priorityReason?: string;
  influenceRisk?: string;
  sources: string[];
  trend: 'rising' | 'stable' | 'falling';
  relatedLinks?: string[];
  /** Recommended action for amplifying or capitalizing on this topic */
  recommendedAction?: string;
  listeningStatus?: 'auto' | 'curated';
  productTags?: string[];
  sectorTags?: string[];
  signalCount?: number;
  confidence?: number;
  topSignals?: {
    title: string;
    url: string;
    source: string;
    publishedAt: string;
    score?: number;
  }[];
  whatPeopleAreSaying?: string;
  whyItMatters?: string;
  nvidiaRelevance?: string;
  next7Days?: string;
  next30Days?: string;
}

export interface DiscordChannel {
  id: string;
  server: string;
  serverUrl: string;
  channel: string;
  topic: string;
  members: number;
  weeklyMessages: number;
  buzzLevel: BuzzLevel;
  recentTopics: string[];
  pinnedLinks?: string[];
  domains?: PhysicalAIDomain[];
}

export type LivestreamStatus = 'upcoming' | 'live' | 'recent' | 'past';

export interface Livestream {
  id: string;
  title: string;
  host: string;
  platform: 'youtube' | 'twitch' | 'nvidia';
  url: string;
  scheduledDate: string;
  status: LivestreamStatus;
  peakViewers?: number;
  topics: string[];
  description: string;
  durationMinutes?: number;
  recordingUrl?: string;
}

export interface InfluencerPost {
  text: string;
  date: string;
  likes: number;
  reposts?: number;
  platform: 'twitter' | 'linkedin';
  url?: string;
}

export interface Influencer {
  id: string;
  name: string;
  handle: string;                    // primary social handle e.g. "@DrAndrejKarpathy"
  twitterHandle?: string;            // without @
  linkedinUrl?: string;
  platform: 'twitter' | 'linkedin' | 'both';
  followers: number;                 // primary/combined follower count
  twitterFollowers?: number;
  linkedinFollowers?: number;
  title: string;                     // current role
  company: string;
  bio: string;
  topics: string[];
  recentPosts: InfluencerPost[];     // 2-3 sample posts
  kloutScore: number;                // 0-100
  domains?: PhysicalAIDomain[];
  shouldEngage: boolean;
  engageReason: string;             // 1 sentence on why/why not
}
