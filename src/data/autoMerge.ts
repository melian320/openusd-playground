// Reads from src/data/auto/*.json (populated daily by GitHub Actions)
// and merges factual fields into curated/editorial data.

import type { HotTopic, Region } from '../types/community';
import type { StoryTag } from '../types/story';
import { ArxivPaper, detectNvidiaTerms, detectTopics } from '../lib/arxiv';
import { scoreHotTopicPriority } from '../lib/hotTopicPriority';
import autoGitHub from './auto/github.json';
import autoGlobalSources from './auto/global-sources.json';
import autoVideos from './auto/videos.json';
import autoPapers from './auto/papers.json';
import autoHotTopics from './auto/hot-topics.json';
import autoHotTopicSignals from './auto/hot-topic-signals.json';
import autoHotTopicAnalysis from './auto/hot-topic-analysis.json';
import autoMeta from './auto/_meta.json';
import { GLOBAL_SOURCE_SEEDS, type GlobalSourceRecord } from './globalSourceRegistry';

interface AutoGitHubFacts {
  ownerRepo: string;
  stars: number;
  forks: number;
  openPRs: number;
  openIssues: number;
  contributors: number;
  lastCommit: string;
  weeklyCommits: number;
  starsGrowthPct: number;
  language: string;
}

const autoGitHubData = (autoGitHub as AutoGitHubFacts[]) ?? [];

interface RepoBase {
  ownerRepo: string;
  stars: number;
  forks: number;
  openPRs: number;
  openIssues: number;
  contributors: number;
  lastCommit: string;
  weeklyCommits: number;
  starsGrowthPct?: number;
  language?: string;
}

export function mergeAutoGitHubFacts<T extends RepoBase>(curated: T): T {
  const auto = autoGitHubData.find(a => a.ownerRepo === curated.ownerRepo);
  if (!auto) return curated;
  return {
    ...curated,
    stars: auto.stars,
    forks: auto.forks,
    openPRs: auto.openPRs,
    openIssues: auto.openIssues,
    contributors: auto.contributors,
    lastCommit: auto.lastCommit,
    weeklyCommits: auto.weeklyCommits,
    starsGrowthPct: auto.starsGrowthPct,
    language: auto.language || curated.language,
  };
}

export function hasAutoData(): boolean {
  return autoGitHubData.length > 0 && autoMeta.generatedAt !== null;
}

export function lastAutoRefresh(): string | null {
  return autoMeta.generatedAt;
}

const rawGlobalSources = (autoGlobalSources as GlobalSourceRecord[]) ?? [];

function normalizeGlobalSource(record: GlobalSourceRecord): GlobalSourceRecord {
  const status = record.status === 'unavailable' ? 'dead' : record.status;
  return {
    ...record,
    status,
    relevanceScore: record.relevanceScore ?? record.confidence,
    statusReason: record.statusReason ?? (
      status === 'verified' ? 'The page resolved during the latest refresh.' :
      status === 'candidate' ? 'The page resolved, but evidence needs review.' :
      status === 'stale' ? 'The page resolved, but appears stale.' :
      status === 'dead' ? 'The page failed the latest refresh.' :
      'Awaiting first automated verification.'
    ),
  };
}

const fallbackGlobalSources: GlobalSourceRecord[] = GLOBAL_SOURCE_SEEDS.map(seed => ({
    ...seed,
    status: 'unchecked',
    confidence: 0,
    relevanceScore: 0,
    statusReason: 'Awaiting first automated verification.',
    lastVerified: '',
    evidence: [],
  }));

const rawGlobalSourceIds = new Set(rawGlobalSources.map(source => source.id));
const missingFallbackSources = fallbackGlobalSources.filter(source => !rawGlobalSourceIds.has(source.id));

export const autoGlobalSourcesData: GlobalSourceRecord[] = [
  ...rawGlobalSources,
  ...missingFallbackSources,
].map(normalizeGlobalSource);

export function hasAutoGlobalSources(): boolean {
  return rawGlobalSources.length > 0;
}

export function isTrustedGlobalSource(source: GlobalSourceRecord): boolean {
  return source.status === 'verified' || source.status === 'candidate';
}

export function needsGlobalSourceValidation(source: GlobalSourceRecord): boolean {
  return source.status === 'unchecked';
}

export const verifiedGlobalSources = autoGlobalSourcesData.filter(source => source.status === 'verified');
export const candidateGlobalSources = autoGlobalSourcesData.filter(source => source.status === 'candidate');
export const newGlobalSources = autoGlobalSourcesData.filter(needsGlobalSourceValidation);
export const trustedGlobalSources = autoGlobalSourcesData.filter(isTrustedGlobalSource);

export function globalSourcesByRegion(sources: GlobalSourceRecord[] = trustedGlobalSources): Record<Region, GlobalSourceRecord[]> {
  return sources.reduce((acc, source) => {
    acc[source.region].push(source);
    return acc;
  }, {
    americas: [],
    emea: [],
    apac: [],
    global: [],
  } as Record<Region, GlobalSourceRecord[]>);
}

export function globalSourceCoverageSummary(sources: GlobalSourceRecord[] = trustedGlobalSources): Record<Region, number> {
  const grouped = globalSourcesByRegion(sources);
  return {
    americas: grouped.americas.length,
    emea: grouped.emea.length,
    apac: grouped.apac.length,
    global: grouped.global.length,
  };
}

export interface AutoVideo {
  youtubeId: string;
  title: string;
  channelId: string;
  channel: string;
  views: number;
  durationSec: number;
  publishedDate: string;
  description: string;
}

export const autoVideosData: AutoVideo[] = (autoVideos as AutoVideo[]) ?? [];

export function hasAutoVideos(): boolean {
  return autoVideosData.length > 0;
}

export function recentAutoVideos(n = 20): AutoVideo[] {
  return [...autoVideosData]
    .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime())
    .slice(0, n);
}

interface AutoArxivPaper {
  arxivId: string;
  title: string;
  authors: string[];
  abstract: string;
  published: string;
  category: string;
  url: string;
}

function inferPaperTags(title: string, abstract: string, category: string): StoryTag[] {
  const text = `${title} ${abstract} ${category}`.toLowerCase();
  const tags = new Set<StoryTag>(['research']);
  if (/robot|manipulat|locomotion|grasp|navigation|vla|embodied/.test(text)) tags.add('robotics');
  if (/humanoid|biped/.test(text)) tags.add('humanoids');
  if (/embodied|vision-language-action|\bvla\b|world model|foundation model/.test(text)) tags.add('embodied-ai');
  if (/sim-to-real|sim2real|simulation|simulator|physics|digital twin/.test(text)) tags.add('simulation');
  if (/digital twin|openusd|omniverse/.test(text)) tags.add('digital-twins');
  return [...tags];
}

export const autoPapersData: ArxivPaper[] = ((autoPapers as AutoArxivPaper[]) ?? []).map(p => {
  const nvidiaTerms = detectNvidiaTerms(p.title, p.abstract);
  const paperTopics = detectTopics(p.title, p.abstract);
  return {
    arxivId: p.arxivId,
    title: p.title,
    authors: p.authors,
    abstract: p.abstract,
    published: p.published,
    url: p.url,
    pdfUrl: p.arxivId ? `https://arxiv.org/pdf/${p.arxivId}` : undefined,
    categories: p.category ? [p.category] : [],
    tags: inferPaperTags(p.title, p.abstract, p.category),
    source: 'arxiv_rss',
    nvidiaTerms: nvidiaTerms.length > 0 ? nvidiaTerms : undefined,
    paperTopics: paperTopics.length > 0 ? paperTopics : undefined,
  };
});

export function hasAutoPapers(): boolean {
  return autoPapersData.length > 0;
}

interface AutoHotTopic {
  topic: string;
  description: string;
  buzzScore: number;
  priorityScore?: number;
  priorityTier?: 'must-win' | 'move-now' | 'monitor' | 'archive';
  priorityReason?: string;
  influenceRisk?: string;
  trend: 'rising' | 'stable' | 'falling' | 'cooling';
  sources: string[];
  productTags?: string[];
  sectorTags?: string[];
  signalCount?: number;
  confidence?: number;
  topSignals?: {
    title: string;
    url: string;
    sourceLabel?: string;
    source?: string;
    publishedAt: string;
    score?: number;
  }[];
  whatPeopleAreSaying?: string;
  whyItMatters?: string;
  nvidiaRelevance?: string;
  recommendedAction?: string;
  next7Days?: string;
  next30Days?: string;
}

function withHotTopicPriority(topic: HotTopic): HotTopic {
  const scored = scoreHotTopicPriority(topic);
  return {
    ...topic,
    priorityScore: topic.priorityScore ?? scored.priorityScore,
    priorityTier: topic.priorityTier ?? scored.priorityTier,
    priorityReason: topic.priorityReason ?? scored.priorityReason,
    influenceRisk: topic.influenceRisk ?? scored.influenceRisk,
  };
}

export const autoHotTopicsData: HotTopic[] = ((autoHotTopics as AutoHotTopic[]) ?? []).map((t, index) => withHotTopicPriority({
  id: `auto-topic-${index + 1}-${t.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`,
  topic: t.topic,
  description: t.description,
  buzzScore: t.buzzScore,
  priorityScore: t.priorityScore,
  priorityTier: t.priorityTier,
  priorityReason: t.priorityReason,
  influenceRisk: t.influenceRisk,
  trend: t.trend === 'cooling' ? 'falling' : t.trend,
  sources: t.sources,
  listeningStatus: 'auto',
  productTags: t.productTags,
  sectorTags: t.sectorTags,
  signalCount: t.signalCount,
  confidence: t.confidence,
  topSignals: t.topSignals?.map(signal => ({
    title: signal.title,
    url: signal.url,
    source: signal.sourceLabel ?? signal.source ?? 'Source',
    publishedAt: signal.publishedAt,
    score: signal.score,
  })),
  whatPeopleAreSaying: t.whatPeopleAreSaying,
  whyItMatters: t.whyItMatters,
  nvidiaRelevance: t.nvidiaRelevance,
  recommendedAction: t.recommendedAction,
  next7Days: t.next7Days,
  next30Days: t.next30Days,
}));

export function mergeHotTopics(curated: HotTopic[]): HotTopic[] {
  if (autoHotTopicsData.length === 0) return curated.map(withHotTopicPriority);
  const curatedByTopic = new Map(curated.map(topic => [topic.topic.toLowerCase(), topic]));
  const autoFirst = autoHotTopicsData.map(topic => ({
    ...curatedByTopic.get(topic.topic.toLowerCase()),
    ...topic,
  })).map(withHotTopicPriority);
  const autoKeys = new Set(autoFirst.map(topic => topic.topic.toLowerCase()));
  return [
    ...autoFirst,
    ...curated.filter(topic => !autoKeys.has(topic.topic.toLowerCase())).map(topic => ({
      ...topic,
      listeningStatus: 'curated' as const,
    })).map(withHotTopicPriority),
  ];
}

export interface AutoHotTopicSignal {
  source: string;
  sourceLabel?: string;
  signalType?: string;
  title: string;
  url: string;
  score: number;
  comments?: number;
  publishedAt: string;
  summary?: string;
  productTags?: string[];
  sectorTags?: string[];
  relevanceScore?: number;
}

export const autoHotTopicSignalsData: AutoHotTopicSignal[] = (autoHotTopicSignals as AutoHotTopicSignal[]) ?? [];

export interface HotTopicAnalysisData {
  generatedAt: string;
  summary: string;
  sourceCoverage: {
    source: string;
    signals: number;
    newestSignal?: string;
    oldestSignal?: string;
    notes: string;
  }[];
  topTrends: {
    topic: string;
    buzzScore: number;
    priorityScore?: number;
    priorityTier?: 'must-win' | 'move-now' | 'monitor' | 'archive';
    priorityReason?: string;
    influenceRisk?: string;
    trend: 'rising' | 'stable' | 'falling';
    whatPeopleAreSaying: string;
    whyItMatters: string;
    nvidiaRelevance: string;
    recommendedAction: string;
    next7Days: string;
    next30Days: string;
    sources: string[];
  }[];
  actionQueue: {
    priority: 'must-win' | 'move-now' | 'monitor' | 'archive' | 'high' | 'medium' | 'watch';
    action: string;
    owner: string;
    horizon: '7 days' | '30 days';
    relatedProducts: string[];
  }[];
  knownGaps: string[];
}

export const hotTopicAnalysisData: HotTopicAnalysisData = autoHotTopicAnalysis as HotTopicAnalysisData;
