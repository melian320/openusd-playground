import type { GlobalSourceStatus, GlobalSourceType } from '../data/globalSourceRegistry';
import type { Region } from '../types/community';

export type GlobalSourcePriorityTier = 'must-attend' | 'activate' | 'monitor' | 'low-fit';

export interface GlobalSourcePriorityInput {
  name?: string;
  type?: GlobalSourceType;
  region?: Region;
  products?: string[];
  topics?: string[];
  description?: string;
  eventDate?: string;
  location?: string;
  focusArea?: string;
  eventTier?: string;
  activationTier?: string;
  status?: GlobalSourceStatus;
  confidence?: number;
  relevanceScore?: number;
  pageTitle?: string;
  pageDescription?: string;
  evidence?: string[];
  pageText?: string;
}

export interface GlobalSourcePriorityResult {
  priorityScore: number;
  priorityTier: GlobalSourcePriorityTier;
  priorityReason: string;
  influenceRisk: string;
  audienceSignals: string[];
  industryImportance: string;
}

const STRATEGIC_LANES = [
  {
    label: 'Cosmos / world models',
    weight: 28,
    terms: ['cosmos', 'world model', 'world foundation model', 'foundation model', 'synthetic data', 'physical reasoning', 'sim-to-real', 'gr00t', 'groot'],
  },
  {
    label: 'robotics',
    weight: 28,
    terms: ['robot', 'robotics', 'humanoid', 'manipulation', 'automation', 'isaac sim', 'isaac lab', 'isaac ros', 'jetson', 'newton', 'ros'],
  },
  {
    label: 'OpenUSD',
    weight: 24,
    terms: ['openusd', 'open usd', 'omniverse', 'usd', 'universal scene description', '3d standard', 'asset pipeline'],
  },
  {
    label: 'industrial digital twins',
    weight: 24,
    terms: ['industrial digital twin', 'digital twin', 'industrial', 'manufacturing', 'factory', 'warehouse', 'metropolis', 'smart city', 'plm', 'cae'],
  },
  {
    label: 'adjacent Physical AI sectors',
    weight: 14,
    terms: ['driveos', 'alpamayo', 'halos', 'autonomous vehicle', 'av', 'metropolis', 'vision ai', 'intelligent vision', 'cae', 'cfd', 'fea'],
  },
];

const AUDIENCE_SIGNAL_PATTERNS: { label: string; terms: string[] }[] = [
  { label: 'developers', terms: ['developer', 'engineer', 'technical audience', 'hands-on', 'workshop'] },
  { label: 'robotics companies', terms: ['robotics company', 'robotics companies', 'robotics leaders', 'robot manufacturers', 'automation companies'] },
  { label: 'industrial buyers', terms: ['manufacturer', 'manufacturing leaders', 'industrial leaders', 'factory', 'warehouse', 'supply chain', 'operations leaders'] },
  { label: 'research leaders', terms: ['researcher', 'academia', 'university', 'paper', 'technical program', 'ieee', 'acm'] },
  { label: 'executives / decision-makers', terms: ['executive', 'cxo', 'c-suite', 'decision-maker', 'decision maker', 'vp', 'founder', 'investor'] },
  { label: 'ecosystem partners', terms: ['partner', 'sponsor', 'exhibitor', 'alliance', 'ecosystem', 'startup'] },
  { label: 'standards / policy voices', terms: ['standard', 'consortium', 'association', 'government', 'policy', 'regulator'] },
];

const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function sourceText(source: GlobalSourcePriorityInput): string {
  return [
    source.name,
    source.type,
    source.region,
    source.products?.join(' '),
    source.topics?.join(' '),
    source.description,
    source.eventDate,
    source.location,
    source.focusArea,
    source.eventTier,
    source.activationTier,
    source.pageTitle,
    source.pageDescription,
    source.evidence?.join(' '),
    source.pageText,
  ].filter(Boolean).join(' ').toLowerCase();
}

function tierValue(label?: string, max = 12): number {
  const text = (label ?? '').toLowerCase();
  if (!text) return 0;
  if (text.includes('tier 1')) return max;
  if (text.includes('tier 2')) return Math.round(max * 0.75);
  if (text.includes('tier 3')) return Math.round(max * 0.45);
  if (text.includes('tier 4') || text.includes('no support')) return -3;
  if (text.includes('tbd') || text.includes('pending')) return 2;
  return 0;
}

function parseEventStart(label?: string): Date | null {
  if (!label) return null;
  const normalized = label.replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
  const year = Number(normalized.match(/\b(20\d{2})\b/)?.[1] ?? '');
  if (!year) return null;
  const match = normalized.match(/\b([A-Za-z]+)\s+(\d{1,2})/);
  if (!match) return null;
  const month = MONTH_INDEX[match[1].toLowerCase()] ?? MONTH_INDEX[match[1].toLowerCase().slice(0, 3)];
  if (month === undefined) return null;
  return new Date(year, month, Number(match[2]));
}

function urgencyScore(source: GlobalSourcePriorityInput): number {
  if (source.type !== 'event' && source.type !== 'meetup') return source.type === 'community' || source.type === 'regional-association' ? 6 : 3;
  const start = parseEventStart(source.eventDate);
  if (!start) return 4;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.ceil((start.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return 1;
  if (days <= 60) return 10;
  if (days <= 180) return 8;
  if (days <= 365) return 6;
  return 4;
}

export function scoreGlobalSourcePriority(source: GlobalSourcePriorityInput): GlobalSourcePriorityResult {
  const text = sourceText(source);
  const laneMatches = STRATEGIC_LANES
    .map(lane => ({ ...lane, hits: lane.terms.filter(term => text.includes(term)) }))
    .filter(lane => lane.hits.length > 0);
  const strategicFit = Math.min(35, laneMatches.reduce((sum, lane) => sum + Math.min(lane.weight, 10 + lane.hits.length * 4), 0));
  const sourceTypeFit = source.type === 'event' ? 9 :
    source.type === 'regional-association' ? 8 :
      source.type === 'community' ? 7 :
        source.type === 'meetup' ? 6 :
          3;
  const tierFit = Math.max(0, tierValue(source.eventTier, 12) + tierValue(source.activationTier, 12));
  const industryImportanceScore = Math.min(25, sourceTypeFit + tierFit + (text.includes('global') || text.includes('world') ? 3 : 0));
  const audienceSignals = AUDIENCE_SIGNAL_PATTERNS
    .filter(pattern => pattern.terms.some(term => text.includes(term)))
    .map(pattern => pattern.label);
  const audienceScore = Math.min(20, audienceSignals.length * 4 + (text.includes('leader') || text.includes('decision') ? 3 : 0));
  const validationScore = source.status === 'verified' ? 10 :
    source.status === 'candidate' ? 7 :
      source.status === 'unchecked' ? 3 :
        0;
  const sourceHealthPenalty = source.status === 'dead' || source.status === 'unavailable' ? -25 :
    source.status === 'stale' ? -15 :
      0;
  const evidenceScore = Math.min(5, Number(source.confidence ?? source.relevanceScore ?? 0) / 20);
  const priorityScore = clampScore(strategicFit + industryImportanceScore + audienceScore + urgencyScore(source) + validationScore + evidenceScore + sourceHealthPenalty);
  const priorityTier: GlobalSourcePriorityTier =
    priorityScore >= 85 ? 'must-attend' :
      priorityScore >= 70 ? 'activate' :
        priorityScore >= 50 ? 'monitor' :
          'low-fit';
  const laneLabels = laneMatches.map(lane => lane.label);
  const audienceText = audienceSignals.length > 0 ? audienceSignals.slice(0, 3).join(', ') : 'audience still needs validation';
  const industryImportance = [
    source.eventTier,
    source.activationTier,
    source.type ? `${source.type.replace('-', ' ')} source` : '',
  ].filter(Boolean).join(' · ') || 'Industry importance inferred from source type and topic fit.';
  const priorityReason = laneLabels.length > 0
    ? `Strongest fit: ${laneLabels.slice(0, 3).join(', ')}; audience signal: ${audienceText}.`
    : `Lower strategic fit; audience signal: ${audienceText}.`;
  const influenceRisk = priorityTier === 'must-attend'
    ? 'Missing this risks letting competitors own the room with developers, partners, or industry decision-makers in a priority Physical AI lane.'
    : priorityTier === 'activate'
      ? 'Worth targeted activation because the audience and topic fit can influence ecosystem preference.'
      : priorityTier === 'monitor'
        ? 'Keep on the radar and validate speakers, sponsors, or attendee mix before committing major support.'
        : 'Low current fit for priority-lane activation unless new audience or partner evidence appears.';

  return {
    priorityScore,
    priorityTier,
    priorityReason,
    influenceRisk,
    audienceSignals,
    industryImportance,
  };
}
