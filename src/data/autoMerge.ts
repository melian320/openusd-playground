// Reads from src/data/auto/*.json (populated daily by GitHub Actions)
// and merges factual fields into curated/editorial data.

import type { HotTopic } from '../types/community';
import type { StoryTag } from '../types/story';
import { ArxivPaper, detectNvidiaTerms, detectTopics } from '../lib/arxiv';
import autoGitHub from './auto/github.json';
import autoGlobalSources from './auto/global-sources.json';
import autoVideos from './auto/videos.json';
import autoPapers from './auto/papers.json';
import autoHotTopics from './auto/hot-topics.json';
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

export const autoGlobalSourcesData: GlobalSourceRecord[] = rawGlobalSources.length > 0
  ? rawGlobalSources
  : GLOBAL_SOURCE_SEEDS.map(seed => ({
    ...seed,
    status: 'unchecked',
    confidence: 0,
    lastVerified: '',
    evidence: [],
  }));

export function hasAutoGlobalSources(): boolean {
  return rawGlobalSources.length > 0;
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
  trend: 'rising' | 'stable' | 'falling' | 'cooling';
  sources: string[];
}

export const autoHotTopicsData: HotTopic[] = ((autoHotTopics as AutoHotTopic[]) ?? []).map((t, index) => ({
  id: `auto-topic-${index + 1}-${t.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`,
  topic: t.topic,
  description: t.description,
  buzzScore: t.buzzScore,
  trend: t.trend === 'cooling' ? 'falling' : t.trend,
  sources: t.sources,
}));

export function mergeHotTopics(curated: HotTopic[]): HotTopic[] {
  if (autoHotTopicsData.length === 0) return curated;
  const curatedByTopic = new Map(curated.map(topic => [topic.topic.toLowerCase(), topic]));
  const autoFirst = autoHotTopicsData.map(topic => ({
    ...curatedByTopic.get(topic.topic.toLowerCase()),
    ...topic,
  }));
  const autoKeys = new Set(autoFirst.map(topic => topic.topic.toLowerCase()));
  return [
    ...autoFirst,
    ...curated.filter(topic => !autoKeys.has(topic.topic.toLowerCase())),
  ];
}
