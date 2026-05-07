#!/usr/bin/env bun
/**
 * Daily data refresh script for Physical AI Community Hub.
 *
 * Pulls factual data from free APIs, optionally enriches with Claude,
 * writes JSON snapshot files to src/data/auto/, and prints a summary.
 *
 * Required env vars:
 *   GITHUB_PAT         — GitHub Personal Access Token (repo + workflow)
 *
 * Optional env vars (skipped silently if missing):
 *   YOUTUBE_API_KEY     — Google Cloud YouTube Data API v3 key
 *   ANTHROPIC_API_KEY   — Claude API key for editorial enrichment
 *   CLAUDE_MODEL        — defaults to "claude-haiku-4-5"
 *
 * Usage:
 *   bun run refresh-data
 *   bun run refresh-data -- --help
 *
 * Designed to run from a GitHub Action; see .github/workflows/refresh-data.yml.
 */

import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { GLOBAL_SOURCE_SEEDS, type GlobalSourceRecord, type GlobalSourceSeed } from '../src/data/globalSourceRegistry';

const ROOT = join(import.meta.dir, '..');
const AUTO_DIR = join(ROOT, 'src', 'data', 'auto');
const FETCH_TIMEOUT_MS = 20_000;
const FETCH_RETRIES = 2;
const HN_LOOKBACK_DAYS = 14;

// ─── Configuration ──────────────────────────────────────────────────────────

// All entries below verified via api.github.com — no 404s expected.
// NVIDIA + NVIDIA-aligned Physical AI repos only.
// To add a repo: paste 'owner/name' from any github.com URL.
// To verify a candidate before adding: visit https://api.github.com/repos/owner/name in your browser.
const GITHUB_REPOS = [
  'isaac-sim/IsaacLab',                  // NVIDIA-managed Isaac Lab
  'NVIDIA/Isaac-GR00T',                  // GR00T humanoid foundation model
  'NVIDIA/Cosmos',                       // Cosmos world foundation models (flagship)
  'nvidia-cosmos/cosmos-predict1',       // Cosmos prediction model
  'nvidia-cosmos/cosmos-transfer1',      // Cosmos transfer model
  'NVlabs/alpamayo',                     // NVIDIA Labs autonomous driving research
  'NVIDIA-Omniverse/LearnOpenUSD',       // Official OpenUSD learning resources
  'newton-physics/newton',               // Newton physics simulator (NVIDIA-backed)
  'NVIDIA/ncore',                        // NVIDIA core libraries
];

// YouTube channels to track. Use handles (the @username format) plus an
// expected title guard so renamed/spoofed/wrongly resolved channels are skipped.
//
// To add: visit youtube.com/@SOMETHING, copy the handle, then add an expected
// title or title substring from the public channel page.
interface YouTubeChannelConfig {
  handle: string;
  expectedTitle?: string;
  expectedTitleIncludes?: string[];
}

const YOUTUBE_CHANNELS: YouTubeChannelConfig[] = [
  // ── NVIDIA & official ─────────────────────────────────────────────
  { handle: '@NVIDIADeveloper', expectedTitleIncludes: ['NVIDIA Developer'] },
  { handle: '@NVIDIA', expectedTitle: 'NVIDIA' },
  { handle: '@NVIDIAOmniverse', expectedTitleIncludes: ['NVIDIA Omniverse'] },

  // ── University labs ───────────────────────────────────────────────
  { handle: '@ETHZurich', expectedTitleIncludes: ['ETH Zurich'] },
  { handle: '@LeggedRobotics', expectedTitleIncludes: ['Legged Robotics', 'Robotic Systems Lab'] },
  { handle: '@MITCSAIL', expectedTitleIncludes: ['MIT CSAIL'] },
  { handle: '@StanfordHAI', expectedTitleIncludes: ['Stanford HAI'] },

  // ── Robotics companies ────────────────────────────────────────────
  { handle: '@BostonDynamics', expectedTitleIncludes: ['Boston Dynamics'] },
  { handle: '@UnitreeRobotics', expectedTitleIncludes: ['Unitree'] },
  { handle: '@PollenRobotics', expectedTitleIncludes: ['Pollen Robotics'] },
  { handle: '@1x_technologies', expectedTitle: '1X' },

  // ── Open-source + community ───────────────────────────────────────
  { handle: '@HuggingFace', expectedTitleIncludes: ['Hugging Face'] },
  { handle: '@TheConstruct', expectedTitleIncludes: ['The Construct'] },

  // ── Educators ─────────────────────────────────────────────────────
  { handle: '@lexfridman', expectedTitleIncludes: ['Lex Fridman'] },
  { handle: '@TwoMinutePapers', expectedTitleIncludes: ['Two Minute Papers'] },
  { handle: '@YannicKilcher', expectedTitleIncludes: ['Yannic Kilcher'] },
];

const HOT_TOPIC_RSS_SOURCES = [
  {
    id: 'ros-discourse',
    label: 'ROS Discourse',
    url: 'https://discourse.ros.org/latest.rss',
    notes: 'Public ROS community discussion feed; useful for robotics middleware, Isaac ROS, Nav2, and Open-RMF signals.',
  },
  {
    id: 'nvidia-robotics-blog',
    label: 'NVIDIA Developer Blog - Robotics',
    url: 'https://developer.nvidia.com/blog/category/robotics/feed/',
    notes: 'Official NVIDIA robotics technical posts; useful for product-aligned signal and launch context.',
  },
  {
    id: 'openusd-github-releases',
    label: 'OpenUSD GitHub Releases',
    url: 'https://github.com/PixarAnimationStudios/OpenUSD/releases.atom',
    notes: 'Public OpenUSD release feed; useful for standards/tooling trend detection.',
  },
  {
    id: 'open-rmf-github-releases',
    label: 'Open-RMF GitHub Releases',
    url: 'https://github.com/open-rmf/rmf/releases.atom',
    notes: 'Public fleet-management release feed; useful for multi-robot operations signals.',
  },
];

const ARXIV_QUERY = [
  'all:"Physical AI"',
  'all:"GR00T"',
  'all:"OpenUSD"',
  'all:"foundation model" AND all:robot',
  'all:"diffusion policy"',
  'all:"sim-to-real"',
  'all:"world model" AND all:robot',
  'cat:cs.RO',
].join(' OR ');

// Reddit removed — their JSON endpoints now block server-side IPs from CI runners
// (HTTP 403). Hacker News + Claude continue to provide hot-topic signals.

// ─── Types ──────────────────────────────────────────────────────────────────

interface AutoSnapshot {
  generatedAt: string;
  globalSources: GlobalSourceRecord[];
  github: GitHubFacts[];
  papers: ArxivPaper[];
  videos: YouTubeVideo[];
  hotTopicSignals: HotTopicSignal[];
  hotTopics?: EnrichedHotTopic[];
  hotTopicAnalysis?: HotTopicAnalysis;
  meta: { errors: string[]; warnings?: string[]; sourceIssues?: string[]; sourcesUsed: string[] };
}

interface GitHubFacts {
  ownerRepo: string;
  stars: number;
  forks: number;
  openPRs: number;
  openIssues: number;
  contributors: number;
  lastCommit: string;
  weeklyCommits: number;
  starsGrowthPct: number;          // computed vs. previous snapshot
  language: string;
}

interface ArxivPaper {
  arxivId: string;
  title: string;
  authors: string[];
  abstract: string;
  published: string;
  category: string;
  url: string;
}

interface YouTubeVideo {
  youtubeId: string;
  title: string;
  channelId: string;
  channel: string;
  views: number;
  durationSec: number;
  publishedDate: string;
  description: string;
}

type HotTopicSignalSource = 'hackernews' | 'arxiv' | 'youtube' | 'github' | 'rss';
type HotTopicSignalKind = 'discussion' | 'paper' | 'video' | 'repo' | 'news';

interface HotTopicSignal {
  source: HotTopicSignalSource;
  sourceLabel: string;
  signalType: HotTopicSignalKind;
  title: string;
  url: string;
  score: number;
  comments: number;
  publishedAt: string;
  summary?: string;
  productTags: string[];
  sectorTags: string[];
  relevanceScore: number;
  subreddit?: string;
}

interface EnrichedHotTopic {
  topic: string;
  description: string;
  buzzScore: number;
  trend: 'rising' | 'stable' | 'falling';
  sources: string[];
  productTags?: string[];
  sectorTags?: string[];
  signalCount?: number;
  confidence?: number;
  topSignals?: Pick<HotTopicSignal, 'title' | 'url' | 'sourceLabel' | 'publishedAt' | 'score'>[];
  whatPeopleAreSaying?: string;
  whyItMatters?: string;
  nvidiaRelevance?: string;
  recommendedAction?: string;
  next7Days?: string;
  next30Days?: string;
}

interface HotTopicAnalysis {
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
    trend: EnrichedHotTopic['trend'];
    whatPeopleAreSaying: string;
    whyItMatters: string;
    nvidiaRelevance: string;
    recommendedAction: string;
    next7Days: string;
    next30Days: string;
    sources: string[];
  }[];
  actionQueue: {
    priority: 'high' | 'medium' | 'watch';
    action: string;
    owner: string;
    horizon: '7 days' | '30 days';
    relatedProducts: string[];
  }[];
  knownGaps: string[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const errors: string[] = [];
const warnings: string[] = [];
const sourceIssues: string[] = [];
const sourcesUsed: string[] = [];

function logSection(name: string) {
  console.log(`\n━━━ ${name} ━━━`);
}

function warn(message: string) {
  warnings.push(message);
  console.warn(`  ⚠ ${message}`);
}

function recordSource(source: string, count: number) {
  if (count > 0 && !sourcesUsed.includes(source)) {
    sourcesUsed.push(source);
  }
}

function recordFetchFailure(sourceName: string, message: string) {
  if (sourceName.startsWith('global:')) {
    sourceIssues.push(message);
  } else if (sourceName.startsWith('optional:')) {
    warnings.push(message);
  } else {
    errors.push(message);
  }
}

async function fetchWithRetry(url: string, init?: RequestInit, sourceName?: string): Promise<Response | null> {
  const name = sourceName ?? url;
  for (let attempt = 0; attempt <= FETCH_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) return res;
      if ((res.status === 202 || res.status === 429 || res.status >= 500) && attempt < FETCH_RETRIES) {
        warn(`${name}: HTTP ${res.status}, retrying (${attempt + 1}/${FETCH_RETRIES + 1})`);
        await new Promise(resolve => setTimeout(resolve, 750 * (attempt + 1)));
        continue;
      }
      const msg = `${name}: HTTP ${res.status}`;
      recordFetchFailure(name, msg);
      console.error(`  ✗ ${msg}`);
      return null;
    } catch (e) {
      clearTimeout(timeout);
      const msg = `${name}: ${e instanceof Error ? e.message : String(e)}`;
      if (attempt < FETCH_RETRIES) {
        warn(`${msg}, retrying (${attempt + 1}/${FETCH_RETRIES + 1})`);
        await new Promise(resolve => setTimeout(resolve, 750 * (attempt + 1)));
        continue;
      }
      recordFetchFailure(name, msg);
      console.error(`  ✗ ${msg}`);
      return null;
    }
  }
  return null;
}

async function safeFetch<T>(url: string, init?: RequestInit, sourceName?: string): Promise<T | null> {
  const res = await fetchWithRetry(url, init, sourceName);
  if (!res) return null;
  try {
    return await res.json() as T;
  } catch (e) {
    const msg = `${sourceName ?? url}: invalid JSON (${e instanceof Error ? e.message : String(e)})`;
    errors.push(msg);
    console.error(`  ✗ ${msg}`);
    return null;
  }
}

async function loadPreviousSnapshot(): Promise<AutoSnapshot | null> {
  const path = join(AUTO_DIR, 'snapshot.json');
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(await readFile(path, 'utf8')) as AutoSnapshot;
  } catch { return null; }
}

async function loadAutoFile<T>(filename: string, fallback: T): Promise<T> {
  const path = join(AUTO_DIR, filename);
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(await readFile(path, 'utf8')) as T;
  } catch {
    warn(`${filename}: could not read previous data, using empty fallback`);
    return fallback;
  }
}

function carryForwardOnEmpty<T>(
  sourceName: string,
  fresh: T[],
  previous: T[] | undefined,
  reason: string,
): T[] {
  if (fresh.length > 0) return fresh;
  if (previous && previous.length > 0) {
    warn(`${sourceName}: ${reason}; carried forward ${previous.length} previous records`);
    recordSource(`${sourceName}:cached`, previous.length);
    return previous;
  }
  return fresh;
}

function backfillMissingRepos(fresh: GitHubFacts[], previous: GitHubFacts[]): GitHubFacts[] {
  if (previous.length === 0) return fresh;
  const freshByRepo = new Map(fresh.map(repo => [repo.ownerRepo, repo]));
  const missing = GITHUB_REPOS
    .filter(ownerRepo => !freshByRepo.has(ownerRepo))
    .map(ownerRepo => previous.find(repo => repo.ownerRepo === ownerRepo))
    .filter((repo): repo is GitHubFacts => Boolean(repo));
  if (missing.length > 0) {
    warn(`github: carried forward ${missing.length} repo records that failed individually`);
  }
  return [...fresh, ...missing].sort((a, b) => GITHUB_REPOS.indexOf(a.ownerRepo) - GITHUB_REPOS.indexOf(b.ownerRepo));
}

function decodeXml(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

const GLOBAL_PRODUCT_ALIASES: Record<string, string[]> = {
  'DriveOS': ['driveos', 'drive os', 'nvidia drive os'],
  'Alpamayo': ['alpamayo'],
  'Halos': ['halos'],
  'NuRec': ['nurec', 'neural reconstruction'],
  'Cosmos': ['cosmos'],
  'DGX Spark': ['dgx spark'],
  'NVIDIA Omniverse': ['omniverse', 'nvidia omniverse'],
  'OpenUSD': ['openusd', 'open usd', 'universal scene description'],
  'Isaac Sim': ['isaac sim', 'isaacsim'],
  'Isaac Lab': ['isaac lab', 'isaaclab'],
  'Isaac ROS': ['isaac ros', 'isaacros'],
  'Newton': ['newton physics', 'newton simulator', 'newton'],
  'GR00T': ['gr00t', 'groot'],
  'NVIDIA Jetson': ['jetson', 'orin'],
  'Metropolis': ['metropolis'],
};

const HOT_TOPIC_SECTOR_ALIASES: Record<string, string[]> = {
  'Robotics': ['robot', 'robotics', 'humanoid', 'manipulation', 'locomotion', 'gripper', 'embodied', 'ros', 'amr'],
  'World Models': ['world model', 'foundation model', 'vla', 'vision-language-action', 'video model', 'physical reasoning'],
  'Simulation': ['simulation', 'sim-to-real', 'sim2real', 'synthetic data', 'digital twin', 'physics simulator', 'mujoco', 'gazebo'],
  'Autonomous Vehicles': ['autonomous driving', 'self-driving', 'av ', 'adas', 'carla', 'waymo', 'driveos', 'drive os'],
  'Industrial Digital Twins': ['industrial', 'factory', 'manufacturing', 'digital twin', 'warehouse', 'open-rmf'],
  'Intelligent Vision AI': ['vision', 'segmentation', 'detection', 'depth', 'gaussian splat', 'sam ', 'perception'],
  'Edge AI': ['edge ai', 'jetson', 'on-device', 'onnx', 'tflite', 'executorch', 'llama.cpp', 'mlc-llm'],
  'OpenUSD': ['openusd', 'open usd', 'usd', 'hydra', 'usdskel', 'universal scene description'],
  'CAE': ['cae', 'cfd', 'fea', 'physics-informed', 'differentiable simulation', 'ansys', 'simulia', 'openfoam'],
};

const HOT_TOPIC_NEGATIVE_PATTERNS = [
  /\bopenbsd\b/i,
  /\br00t\b/i,
  /\brootkit\b/i,
  /\bsymantec\b/i,
  /\bisaac asimov\b/i,
  /\barmory\.io\b/i,
  /\bfalcon 9 telemetry\b/i,
  /\bfull-disk encryption\b/i,
  /\bkernel vulnerability\b/i,
  /\bvirtual machine as a core android primitive\b/i,
];

function detectProductTags(text: string): string[] {
  const normalized = text.toLowerCase();
  return Object.entries(GLOBAL_PRODUCT_ALIASES)
    .filter(([product, aliases]) => {
      const productAlias = product.toLowerCase();
      return normalized.includes(productAlias) || aliases.some(alias => normalized.includes(alias));
    })
    .map(([product]) => product);
}

function detectSectorTags(text: string): string[] {
  const normalized = text.toLowerCase();
  return Object.entries(HOT_TOPIC_SECTOR_ALIASES)
    .filter(([, aliases]) => aliases.some(alias => normalized.includes(alias)))
    .map(([sector]) => sector);
}

function daysOld(date: string): number {
  const time = new Date(date).getTime();
  if (!Number.isFinite(time)) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.round((Date.now() - time) / (24 * 60 * 60 * 1000)));
}

function hotTopicRelevanceScore(title: string, summary = ''): number {
  const text = `${title} ${summary}`;
  if (HOT_TOPIC_NEGATIVE_PATTERNS.some(pattern => pattern.test(text))) return 0;
  const productTags = detectProductTags(text);
  const sectorTags = detectSectorTags(text);
  const normalized = text.toLowerCase();
  const keywordBonus = [
    'physical ai',
    'robot',
    'robotics',
    'humanoid',
    'embodied',
    'sim-to-real',
    'world model',
    'foundation model',
    'digital twin',
    'autonomous driving',
    'openusd',
    'isaac',
    'gr00t',
    'cosmos',
    'jetson',
    'omniverse',
    'newton',
    'cae',
  ].filter(keyword => normalized.includes(keyword)).length;
  return Math.min(100, productTags.length * 14 + sectorTags.length * 9 + keywordBonus * 6);
}

function makeHotTopicSignal(input: {
  source: HotTopicSignalSource;
  sourceLabel: string;
  signalType: HotTopicSignalKind;
  title: string;
  url: string;
  score: number;
  comments?: number;
  publishedAt: string;
  summary?: string;
}): HotTopicSignal | null {
  const relevanceScore = hotTopicRelevanceScore(input.title, input.summary);
  if (relevanceScore < 18) return null;
  const text = `${input.title} ${input.summary ?? ''}`;
  return {
    source: input.source,
    sourceLabel: input.sourceLabel,
    signalType: input.signalType,
    title: input.title.slice(0, 220),
    url: input.url,
    score: Math.max(0, Math.round(input.score)),
    comments: Math.max(0, Math.round(input.comments ?? 0)),
    publishedAt: input.publishedAt,
    summary: input.summary?.slice(0, 500),
    productTags: detectProductTags(text),
    sectorTags: detectSectorTags(text),
    relevanceScore,
  };
}

function signalSortScore(signal: HotTopicSignal): number {
  const recencyPenalty = Math.min(60, daysOld(signal.publishedAt) / 7);
  return signal.score + signal.comments * 2 + (signal.relevanceScore ?? hotTopicRelevanceScore(signal.title, signal.summary)) * 4 - recencyPenalty;
}

async function mapWithConcurrency<T, U>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<U>,
): Promise<U[]> {
  const results: U[] = [];
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await fn(items[current]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function stripHtml(html: string): string {
  return decodeXml(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTitle(html: string): string {
  return decodeXml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
}

function extractMetaDescription(html: string): string {
  const tags = html.match(/<meta\s+[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const isDescription = /(?:name|property)=["'](?:description|og:description)["']/i.test(tag);
    if (!isDescription) continue;
    const content = tag.match(/\scontent=["']([^"']+)["']/i)?.[1];
    if (content) return decodeXml(content).replace(/\s+/g, ' ').trim().slice(0, 280);
  }
  return '';
}

function sourceEvidence(seed: GlobalSourceSeed, pageText: string): string[] {
  const text = pageText.toLowerCase();
  const evidence = new Set<string>();
  for (const product of seed.products) {
    const aliases = [product.toLowerCase(), ...(GLOBAL_PRODUCT_ALIASES[product] ?? [])];
    if (aliases.some(alias => text.includes(alias))) evidence.add(product);
  }
  for (const topic of seed.topics) {
    if (text.includes(topic.toLowerCase())) evidence.add(topic);
  }
  return [...evidence];
}

function sourceNameMatches(seed: GlobalSourceSeed, pageText: string): boolean {
  const text = pageText.toLowerCase();
  const tokens = seed.name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length >= 4 && !['2026', '2027', 'conference', 'summit', 'foundation'].includes(token));
  return tokens.some(token => text.includes(token));
}

function extractYears(pageText: string): number[] {
  const years = new Set<number>();
  for (const match of pageText.matchAll(/\b20(2[0-9]|3[0-2])\b/g)) {
    years.add(Number(match[0]));
  }
  return [...years].sort((a, b) => a - b);
}

function sourceLooksStale(seed: GlobalSourceSeed, pageText: string): boolean {
  if (seed.type !== 'event' && seed.type !== 'meetup') return false;
  const currentYear = new Date().getUTCFullYear();
  const years = extractYears(pageText);
  return years.length > 0 && Math.max(...years) < currentYear;
}

function scoreGlobalSource(seed: GlobalSourceSeed, evidence: string[], pageText: string): number {
  const productMatches = evidence.filter(item => seed.products.includes(item)).length;
  const topicMatches = evidence.filter(item => seed.topics.includes(item)).length;
  const host = new URL(seed.url).hostname;
  const officialBonus = seed.type === 'official-nvidia' && host.includes('nvidia') ? 10 : 0;
  const authorityBonus = ['regional-association', 'event'].includes(seed.type) && sourceNameMatches(seed, pageText) ? 8 : 0;
  return Math.min(100, 35 + Math.min(40, productMatches * 10) + Math.min(17, topicMatches * 4) + officialBonus + authorityBonus);
}

function classifyGlobalSource(seed: GlobalSourceSeed, evidence: string[], pageText: string, relevanceScore: number) {
  const productMatches = evidence.filter(item => seed.products.includes(item)).length;
  const topicMatches = evidence.filter(item => seed.topics.includes(item)).length;
  const hasNameMatch = sourceNameMatches(seed, pageText);
  const host = new URL(seed.url).hostname;

  if (sourceLooksStale(seed, pageText)) {
    return {
      status: 'stale' as const,
      confidence: Math.min(50, Math.max(30, relevanceScore)),
      statusReason: 'The page resolved, but visible date evidence only points to past editions.',
    };
  }

  const verified =
    (seed.type === 'official-nvidia' && host.includes('nvidia') && (productMatches > 0 || topicMatches > 0 || hasNameMatch)) ||
    (seed.type === 'regional-association' && (hasNameMatch || topicMatches > 0)) ||
    (seed.type !== 'official-nvidia' && seed.type !== 'regional-association' && (productMatches > 0 || (topicMatches > 0 && hasNameMatch) || evidence.length >= 2));

  if (verified) {
    return {
      status: 'verified' as const,
      confidence: Math.max(65, relevanceScore),
      statusReason: 'The page resolved and contains product, topic, or source-name evidence.',
    };
  }

  return {
    status: 'candidate' as const,
    confidence: Math.min(64, Math.max(35, relevanceScore)),
    statusReason: 'The page resolved, but product/topic evidence is weak; keep as a candidate until reviewed.',
  };
}

async function verifyGlobalSource(seed: GlobalSourceSeed, verifiedAt: string): Promise<GlobalSourceRecord> {
  const headers = {
    'User-Agent': 'physical-ai-community-hub/1.0 (+https://github.com)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };
  const res = await fetchWithRetry(seed.url, { headers }, `global:${seed.id}`);
  if (!res) {
    return {
      ...seed,
      status: 'dead',
      confidence: 0,
      relevanceScore: 0,
      statusReason: 'The source did not return a successful HTTP response during refresh.',
      lastVerified: verifiedAt,
      evidence: [],
      error: 'Source did not return a successful HTTP response during refresh.',
    };
  }
  const html = await res.text();
  const pageTitle = extractTitle(html);
  const pageDescription = extractMetaDescription(html);
  const plain = stripHtml(html).slice(0, 25_000);
  const pageText = `${seed.url} ${pageTitle} ${pageDescription} ${plain}`;
  const evidence = sourceEvidence(seed, pageText);
  const relevanceScore = scoreGlobalSource(seed, evidence, pageText);
  const classification = classifyGlobalSource(seed, evidence, pageText, relevanceScore);
  return {
    ...seed,
    status: classification.status,
    confidence: classification.confidence,
    relevanceScore,
    statusReason: classification.statusReason,
    lastVerified: verifiedAt,
    pageTitle,
    pageDescription,
    evidence,
  };
}

async function pullGlobalSources(): Promise<GlobalSourceRecord[]> {
  logSection('Global source registry');
  const verifiedAt = new Date().toISOString();
  const records = await mapWithConcurrency(GLOBAL_SOURCE_SEEDS, 6, seed => verifyGlobalSource(seed, verifiedAt));
  const verified = records.filter(record => record.status === 'verified').length;
  recordSource('global-sources', verified);
  console.log(`  ✓ ${verified}/${records.length} source pages verified`);
  return records;
}

function printHelp() {
  console.log(`Physical AI Community Hub data refresh

Fetches global source registry checks, GitHub, arXiv, Hacker News, YouTube,
public RSS/Atom feeds, and optional Claude enrichment.
Writes static snapshot files into src/data/auto/.

Required:
  GITHUB_PAT or GITHUB_TOKEN

Flags:
  --global-sources-only
    Verify only Global View source URLs and write global-sources.json without
    requiring GitHub, YouTube, or Claude credentials.

Optional:
  YOUTUBE_API_KEY
  ANTHROPIC_API_KEY
  CLAUDE_MODEL

Hot Topics:
  Builds a daily listening-report signal pool from HN, arXiv, YouTube,
  GitHub repo activity, and HOT_TOPIC_RSS_SOURCES. Claude writes topic
  narratives plus action guidance when ANTHROPIC_API_KEY is available.

The script carries forward the last good source snapshot when optional keys are
missing or a source temporarily returns no rows, so local runs do not wipe data.`);
}

// ─── GitHub ─────────────────────────────────────────────────────────────────

async function pullGitHub(token: string): Promise<GitHubFacts[]> {
  logSection('GitHub');
  const out: GitHubFacts[] = [];
  for (const repo of GITHUB_REPOS) {
    const [owner, name] = repo.split('/');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'physical-ai-community-hub',
      'Accept': 'application/vnd.github+json',
    };

    const repoData = await safeFetch<{
      stargazers_count: number;
      forks_count: number;
      open_issues_count: number;
      pushed_at: string;
      language: string;
    }>(`https://api.github.com/repos/${owner}/${name}`, { headers }, repo);

    if (!repoData) continue;

    // Open PRs (separate endpoint)
    const prs = await safeFetch<{ length: number }>(
      `https://api.github.com/search/issues?q=is:pr+is:open+repo:${owner}/${name}&per_page=1`,
      { headers },
      `${repo}#prs`,
    );
    const prCount = (prs as unknown as { total_count?: number })?.total_count ?? 0;

    // Contributors (HEAD only — count is in Link header)
    const contribRes = await fetchWithRetry(
      `https://api.github.com/repos/${owner}/${name}/contributors?per_page=1&anon=true`,
      { headers },
      `${repo}#contributors`,
    );
    let contributors = 0;
    if (contribRes) {
      const link = contribRes.headers.get('link');
      if (link) {
        const m = link.match(/page=(\d+)>; rel="last"/);
        contributors = m ? parseInt(m[1]) : 1;
      } else {
        const sample = await contribRes.json() as unknown[];
        contributors = sample.length;
      }
    }

    // Weekly commits — last week from /stats/participation
    const stats = await safeFetch<{ all: number[]; owner: number[] }>(
      `https://api.github.com/repos/${owner}/${name}/stats/participation`,
      { headers },
      `${repo}#stats`,
    );
    const weeklyCommits = stats?.all?.[stats.all.length - 1] ?? 0;

    out.push({
      ownerRepo: repo,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      openPRs: prCount,
      openIssues: Math.max(0, repoData.open_issues_count - prCount),
      contributors,
      lastCommit: repoData.pushed_at,
      weeklyCommits,
      starsGrowthPct: 0,                             // filled below
      language: repoData.language ?? '',
    });

    console.log(`  ✓ ${repo}  ★${repoData.stargazers_count}  PRs:${prCount}  contrib:${contributors}`);
  }
  recordSource('github', out.length);
  return out;
}

// ─── arXiv ──────────────────────────────────────────────────────────────────

async function pullArxiv(): Promise<ArxivPaper[]> {
  logSection('arXiv');
  const url = `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(ARXIV_QUERY)}&start=0&max_results=40&sortBy=submittedDate&sortOrder=descending`;
  try {
    const res = await fetchWithRetry(url, undefined, 'arXiv');
    if (!res) return [];
    const xml = await res.text();
    // Lightweight Atom parsing — arXiv's response is well-formed Atom
    const entries = xml.split('<entry>').slice(1);
    const papers: ArxivPaper[] = entries.map(entry => {
      const get = (tag: string) => decodeXml(entry.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))?.[1].trim() ?? '');
      const id = get('id').match(/abs\/([\d.]+)/)?.[1] ?? '';
      const authors = [...entry.matchAll(/<name>([^<]+)<\/name>/g)].map(m => decodeXml(m[1]));
      const cat = entry.match(/<category[^>]*term="([^"]+)"/)?.[1] ?? '';
      return {
        arxivId: id,
        title: get('title').replace(/\s+/g, ' '),
        authors,
        abstract: get('summary').replace(/\s+/g, ' ').slice(0, 800),
        published: get('published'),
        category: cat,
        url: `https://arxiv.org/abs/${id}`,
      };
    });
    console.log(`  ✓ ${papers.length} papers`);
    recordSource('arxiv', papers.length);
    return papers;
  } catch (e) {
    errors.push(`arXiv: ${e instanceof Error ? e.message : String(e)}`);
    return [];
  }
}

// ─── YouTube ────────────────────────────────────────────────────────────────

/** Resolve "@HANDLE" to a channel ID via the YouTube Data API. */
async function resolveHandleToId(channel: YouTubeChannelConfig, apiKey: string): Promise<{ id: string; name: string; handle: string } | null> {
  const { handle } = channel;
  // Strip leading "@" if present, the API takes either form
  const clean = handle.startsWith('@') ? handle.slice(1) : handle;
  const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet&forHandle=${encodeURIComponent(clean)}&key=${apiKey}`;
  const data = await safeFetch<{ items?: { id: string; snippet: { title: string } }[] }>(
    url, undefined, `youtube:resolve(${handle})`,
  );
  if (!data?.items?.[0]) {
    errors.push(`YouTube: handle "${handle}" not found — channel may not exist or has been renamed`);
    return null;
  }
  const name = data.items[0].snippet.title;
  if (!matchesExpectedChannel(name, channel)) {
    warn(`YouTube: ${handle} resolved to "${name}", which does not match the expected channel guard; skipping`);
    return null;
  }
  return { id: data.items[0].id, name, handle };
}

function matchesExpectedChannel(name: string, channel: YouTubeChannelConfig): boolean {
  const normalized = name.trim().toLowerCase();
  if (channel.expectedTitle && normalized !== channel.expectedTitle.toLowerCase()) return false;
  if (channel.expectedTitleIncludes?.length) {
    return channel.expectedTitleIncludes.some(fragment => normalized.includes(fragment.toLowerCase()));
  }
  return true;
}

async function pullYouTube(apiKey: string): Promise<YouTubeVideo[]> {
  logSection('YouTube');
  const out: YouTubeVideo[] = [];

  // Resolve all handles to channel IDs first
  const resolved: { id: string; name: string; handle: string }[] = [];
  for (const channel of YOUTUBE_CHANNELS) {
    const r = await resolveHandleToId(channel, apiKey);
    if (r) {
      resolved.push(r);
      console.log(`  ✓ resolved ${channel.handle} → ${r.name} (${r.id})`);
    } else {
      console.log(`  ✗ couldn't resolve ${channel.handle} — skipping`);
    }
  }

  // Fetch latest videos for each resolved channel
  for (const ch of resolved) {
    const list = await safeFetch<{ items: { id: { videoId: string } }[] }>(
      `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${ch.id}&maxResults=10&order=date&type=video&key=${apiKey}`,
      undefined,
      `youtube:${ch.name}`,
    );
    if (!list?.items) continue;
    const ids = list.items.map(i => i.id.videoId).filter(Boolean).join(',');
    if (!ids) continue;

    interface VideoItem {
      id: string;
      snippet: { title: string; description: string; channelId: string; channelTitle: string; publishedAt: string };
      contentDetails: { duration: string };
      statistics: { viewCount?: string };
    }
    const detail = await safeFetch<{ items: VideoItem[] }>(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${ids}&key=${apiKey}`,
      undefined,
      `youtube:${ch.name}#detail`,
    );
    if (!detail?.items) continue;

    let skipped = 0;
    for (const v of detail.items) {
      if (!isRelevantYouTubeVideo(v.snippet.title, v.snippet.description, v.snippet.channelTitle)) {
        skipped += 1;
        continue;
      }
      out.push({
        youtubeId: v.id,
        title: v.snippet.title,
        channelId: v.snippet.channelId,
        channel: v.snippet.channelTitle,
        views: parseInt(v.statistics?.viewCount ?? '0'),
        durationSec: parseDuration(v.contentDetails.duration),
        publishedDate: v.snippet.publishedAt,
        description: v.snippet.description.slice(0, 400),
      });
    }
    if (skipped > 0) warn(`YouTube: ${ch.name} skipped ${skipped} low-relevance uploads`);
    console.log(`  ✓ ${ch.name}  ${detail.items.length - skipped} videos`);
  }
  recordSource('youtube', out.length);
  return out;
}

function isRelevantYouTubeVideo(title: string, description: string, channel: string): boolean {
  const text = `${title} ${description} ${channel}`.toLowerCase();
  return [
    'physical ai',
    'robot',
    'robotics',
    'humanoid',
    'neo',
    'reachy',
    'unitree',
    'boston dynamics',
    'ros',
    'isaac',
    'gr00t',
    'groot',
    'cosmos',
    'newton',
    'omniverse',
    'openusd',
    'open usd',
    'jetson',
    'sim-to-real',
    'sim2real',
    'world model',
    'foundation model',
    'embodied',
    'manipulation',
    'locomotion',
    'autonomous driving',
    'self-driving',
    'digital twin',
  ].some(keyword => text.includes(keyword));
}

function parseDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] ?? '0') * 3600) + (parseInt(m[2] ?? '0') * 60) + parseInt(m[3] ?? '0');
}

// ─── Hacker News ────────────────────────────────────────────────────────────
// (Reddit removed — see note at top of file)

async function pullHackerNews(): Promise<HotTopicSignal[]> {
  logSection('Hacker News');
  const queries = [
    'physical ai',
    'robotics',
    'humanoid robot',
    'GR00T Nvidia',
    'Isaac Sim Nvidia',
    'OpenUSD robotics',
    'sim-to-real robot',
    'world model robotics',
    'autonomous driving simulation',
    'digital twin robotics',
  ];
  const since = Math.floor((Date.now() - HN_LOOKBACK_DAYS * 24 * 60 * 60 * 1000) / 1000);
  const out: HotTopicSignal[] = [];
  for (const q of queries) {
    const params = new URLSearchParams({
      query: q,
      tags: 'story',
      hitsPerPage: '12',
    });
    params.append('numericFilters', `created_at_i>${since}`);
    params.append('numericFilters', 'points>10');
    const data = await safeFetch<{ hits: { title: string; url?: string; points: number; num_comments: number; created_at: string; objectID: string }[] }>(
      `https://hn.algolia.com/api/v1/search_by_date?${params.toString()}`,
      undefined,
      `hn:${q}`,
    );
    if (!data?.hits) continue;
    for (const hit of data.hits) {
      const createdAt = new Date(hit.created_at).getTime();
      if (!Number.isFinite(createdAt) || createdAt < since * 1000) continue;
      const signal = makeHotTopicSignal({
        source: 'hackernews',
        sourceLabel: 'Hacker News',
        signalType: 'discussion',
        title: hit.title,
        url: hit.url ?? `https://news.ycombinator.com/item?id=${hit.objectID}`,
        score: hit.points,
        comments: hit.num_comments,
        publishedAt: hit.created_at,
      });
      if (signal) out.push(signal);
    }
    console.log(`  ✓ "${q}"  ${data.hits.length} stories`);
  }
  const deduped = dedupeHotTopicSignals(out);
  if (deduped.length < out.length) {
    warn(`Hacker News: deduped ${out.length - deduped.length} overlapping query results`);
  }
  recordSource('hackernews', deduped.length);
  return deduped;
}

function normalizeSignalUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    [...parsed.searchParams.keys()]
      .filter(key => key.startsWith('utm_') || key === 'ref' || key === 'source')
      .forEach(key => parsed.searchParams.delete(key));
    return parsed.toString().replace(/\/$/, '').toLowerCase();
  } catch {
    return url.trim().replace(/\/$/, '').toLowerCase();
  }
}

function dedupeHotTopicSignals(signals: HotTopicSignal[]): HotTopicSignal[] {
  const byUrl = new Map<string, HotTopicSignal>();
  for (const signal of signals) {
    const key = normalizeSignalUrl(signal.url);
    const existing = byUrl.get(key);
    if (!existing) {
      byUrl.set(key, signal);
      continue;
    }
    byUrl.set(key, {
      ...existing,
      score: Math.max(existing.score, signal.score),
      comments: Math.max(existing.comments, signal.comments),
      publishedAt: new Date(signal.publishedAt) > new Date(existing.publishedAt)
        ? signal.publishedAt
        : existing.publishedAt,
      productTags: [...new Set([...(existing.productTags ?? []), ...(signal.productTags ?? [])])],
      sectorTags: [...new Set([...(existing.sectorTags ?? []), ...(signal.sectorTags ?? [])])],
      relevanceScore: Math.max(existing.relevanceScore ?? 0, signal.relevanceScore ?? 0),
      sourceLabel: existing.sourceLabel === signal.sourceLabel
        ? existing.sourceLabel
        : `${existing.sourceLabel ?? existing.source}, ${signal.sourceLabel ?? signal.source}`,
    });
  }
  return [...byUrl.values()];
}

function arxivSignals(papers: ArxivPaper[]): HotTopicSignal[] {
  return papers
    .map(paper => makeHotTopicSignal({
      source: 'arxiv',
      sourceLabel: 'arXiv',
      signalType: 'paper',
      title: paper.title,
      url: paper.url,
      score: 35 + hotTopicRelevanceScore(paper.title, paper.abstract),
      publishedAt: paper.published,
      summary: paper.abstract,
    }))
    .filter((signal): signal is HotTopicSignal => Boolean(signal));
}

function youtubeSignals(videos: YouTubeVideo[]): HotTopicSignal[] {
  return videos
    .map(video => makeHotTopicSignal({
      source: 'youtube',
      sourceLabel: video.channel,
      signalType: 'video',
      title: video.title,
      url: `https://www.youtube.com/watch?v=${video.youtubeId}`,
      score: Math.min(100, Math.log10(video.views + 1) * 18),
      publishedAt: video.publishedDate,
      summary: video.description,
    }))
    .filter((signal): signal is HotTopicSignal => Boolean(signal));
}

function githubSignals(repos: GitHubFacts[]): HotTopicSignal[] {
  return repos
    .map(repo => makeHotTopicSignal({
      source: 'github',
      sourceLabel: 'GitHub',
      signalType: 'repo',
      title: `${repo.ownerRepo}: ${repo.weeklyCommits} commits this week, ${repo.openPRs} open PRs, ${repo.stars} stars`,
      url: `https://github.com/${repo.ownerRepo}`,
      score: Math.min(100, repo.weeklyCommits * 7 + repo.openPRs * 2 + Math.log10(repo.stars + 1) * 12 + Math.max(0, repo.starsGrowthPct) * 8),
      publishedAt: repo.lastCommit,
      summary: `${repo.ownerRepo} ${repo.language} NVIDIA Physical AI repository activity`,
    }))
    .filter((signal): signal is HotTopicSignal => Boolean(signal));
}

function xmlTagValue(block: string, tag: string): string {
  return decodeXml(block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))?.[1] ?? '')
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function xmlLinkValue(block: string): string {
  const href = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i)?.[1];
  if (href) return decodeXml(href).trim();
  return xmlTagValue(block, 'link');
}

function parseRssSignals(xml: string, source: typeof HOT_TOPIC_RSS_SOURCES[number]): HotTopicSignal[] {
  const entries = [
    ...xml.split(/<item\b[^>]*>/i).slice(1).map(entry => entry.split(/<\/item>/i)[0]),
    ...xml.split(/<entry\b[^>]*>/i).slice(1).map(entry => entry.split(/<\/entry>/i)[0]),
  ].slice(0, 12);

  return entries
    .map(entry => {
      const title = xmlTagValue(entry, 'title');
      const url = xmlLinkValue(entry);
      const publishedAt = xmlTagValue(entry, 'pubDate') || xmlTagValue(entry, 'published') || xmlTagValue(entry, 'updated') || new Date().toISOString();
      const publishedDate = new Date(publishedAt);
      const summary = stripHtml(xmlTagValue(entry, 'description') || xmlTagValue(entry, 'summary') || xmlTagValue(entry, 'content'));
      if (!title || !url) return null;
      return makeHotTopicSignal({
        source: 'rss',
        sourceLabel: source.label,
        signalType: 'news',
        title,
        url,
        score: 45 + hotTopicRelevanceScore(title, summary),
        publishedAt: Number.isFinite(publishedDate.getTime()) ? publishedDate.toISOString() : new Date().toISOString(),
        summary,
      });
    })
    .filter((signal): signal is HotTopicSignal => Boolean(signal));
}

async function pullRssSignals(): Promise<HotTopicSignal[]> {
  logSection('RSS / public feeds');
  const signals: HotTopicSignal[] = [];
  for (const source of HOT_TOPIC_RSS_SOURCES) {
    const res = await fetchWithRetry(source.url, undefined, `optional:rss:${source.id}`);
    if (!res) continue;
    const xml = await res.text();
    const parsed = parseRssSignals(xml, source)
      .filter(signal => daysOld(signal.publishedAt) <= 180);
    signals.push(...parsed);
    console.log(`  ✓ ${source.label}  ${parsed.length} signals`);
  }
  recordSource('rss', signals.length);
  return dedupeHotTopicSignals(signals);
}

function buildHotTopicSignalPool(inputs: {
  hn: HotTopicSignal[];
  rss: HotTopicSignal[];
  papers: ArxivPaper[];
  videos: YouTubeVideo[];
  github: GitHubFacts[];
}): HotTopicSignal[] {
  const combined = [
    ...inputs.hn,
    ...inputs.rss,
    ...arxivSignals(inputs.papers),
    ...youtubeSignals(inputs.videos),
    ...githubSignals(inputs.github),
  ];
  return dedupeHotTopicSignals(combined)
    .filter(signal => daysOld(signal.publishedAt) <= 730 || signal.source === 'github')
    .sort((a, b) => signalSortScore(b) - signalSortScore(a))
    .slice(0, 140);
}

// ─── Claude enrichment (optional) ───────────────────────────────────────────

async function enrichHotTopicsWithClaude(
  signals: HotTopicSignal[],
  apiKey: string,
  model: string,
): Promise<EnrichedHotTopic[] | null> {
  logSection('Claude enrichment');
  if (signals.length === 0) return null;
  const prompt = `You are a Physical AI community analyst for NVIDIA developer relations. Given these recent, source-backed signals, synthesize the top 8 hot topics in the Physical AI ecosystem.

Each topic must have:
- topic: short title (3-7 words)
- description: 1-2 sentence narrative explaining the trend
- whatPeopleAreSaying: plain-language summary of the community conversation
- whyItMatters: why this trend matters to developers and ecosystem builders
- nvidiaRelevance: how it maps to NVIDIA products or sectors such as Cosmos, GR00T, Isaac Sim, Isaac Lab, Isaac ROS, Newton, Jetson, Omniverse, OpenUSD, DriveOS, Alpamayo, Halos, Metropolis, DGX Spark, Intelligent Vision AI, Industrial Digital Twins, AV, and CAE
- recommendedAction: the highest-leverage NVIDIA dev-rel action
- next7Days: concrete action for the next week
- next30Days: concrete action for the next month
- buzzScore: 0-100 based on engagement, source count, recency, and topic relevance
- trend: "rising", "stable", or "falling"
- sources: array of source names represented by the evidence
- productTags: array of matching NVIDIA product/topic tags
- sectorTags: array of sectors
- signalCount: count of evidence signals used
- confidence: 0-100 based on source diversity and evidence quality
- topSignals: up to 4 evidence objects with title, url, sourceLabel, publishedAt, score

Signals (${signals.length} items):
${JSON.stringify(signals.slice(0, 80), null, 0)}

Respond with ONLY a JSON array of 8 objects matching the shape above. No markdown, no commentary.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) {
      errors.push(`Claude: HTTP ${res.status}`);
      return null;
    }
    const data = await res.json() as { content: { text: string }[] };
    const text = data.content[0].text;
    const jsonStart = text.indexOf('[');
    const jsonEnd = text.lastIndexOf(']');
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error('Claude response was not a JSON array');
    }
    const topics = parsed
      .map(normalizeHotTopic)
      .filter((topic): topic is EnrichedHotTopic => topic !== null)
      .slice(0, 8);
    if (topics.length === 0) {
      throw new Error('Claude response did not include any valid hot topics');
    }
    console.log(`  ✓ ${topics.length} topics synthesized`);
    recordSource('claude', topics.length);
    return topics;
  } catch (e) {
    errors.push(`Claude: ${e instanceof Error ? e.message : String(e)}`);
    return null;
  }
}

function normalizeHotTopic(value: unknown): EnrichedHotTopic | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<EnrichedHotTopic>;
  if (!raw.topic || !raw.description) return null;
  const trend = raw.trend === 'rising' || raw.trend === 'falling' || raw.trend === 'stable'
    ? raw.trend
    : 'stable';
  const buzzScore = Math.max(0, Math.min(100, Number(raw.buzzScore ?? 50)));
  const topSignals = Array.isArray(raw.topSignals)
    ? raw.topSignals
      .filter(signal => signal && typeof signal === 'object')
      .map(signal => {
        const s = signal as Partial<Pick<HotTopicSignal, 'title' | 'url' | 'sourceLabel' | 'publishedAt' | 'score'>>;
        return {
          title: String(s.title ?? '').slice(0, 180),
          url: String(s.url ?? ''),
          sourceLabel: String(s.sourceLabel ?? 'Source').slice(0, 80),
          publishedAt: String(s.publishedAt ?? ''),
          score: Number(s.score ?? 0),
        };
      })
      .filter(signal => signal.title && signal.url)
      .slice(0, 4)
    : undefined;
  return {
    topic: String(raw.topic).slice(0, 80),
    description: String(raw.description).slice(0, 500),
    buzzScore: Number.isFinite(buzzScore) ? buzzScore : 50,
    trend,
    sources: Array.isArray(raw.sources) && raw.sources.length > 0
      ? raw.sources.map(source => String(source)).slice(0, 5)
      : ['HackerNews'],
    productTags: Array.isArray(raw.productTags) ? raw.productTags.map(tag => String(tag)).slice(0, 8) : [],
    sectorTags: Array.isArray(raw.sectorTags) ? raw.sectorTags.map(tag => String(tag)).slice(0, 8) : [],
    signalCount: Math.max(1, Math.round(Number(raw.signalCount ?? topSignals?.length ?? 1))),
    confidence: Math.max(0, Math.min(100, Number(raw.confidence ?? 60))),
    topSignals,
    whatPeopleAreSaying: raw.whatPeopleAreSaying ? String(raw.whatPeopleAreSaying).slice(0, 500) : undefined,
    whyItMatters: raw.whyItMatters ? String(raw.whyItMatters).slice(0, 500) : undefined,
    nvidiaRelevance: raw.nvidiaRelevance ? String(raw.nvidiaRelevance).slice(0, 500) : undefined,
    recommendedAction: raw.recommendedAction ? String(raw.recommendedAction).slice(0, 500) : undefined,
    next7Days: raw.next7Days ? String(raw.next7Days).slice(0, 400) : undefined,
    next30Days: raw.next30Days ? String(raw.next30Days).slice(0, 400) : undefined,
  };
}

function topicAction(topic: EnrichedHotTopic): string {
  if (topic.recommendedAction) return topic.recommendedAction;
  const text = `${topic.topic} ${topic.description}`.toLowerCase();
  if (/world model|foundation model|cosmos|gr00t|vla|physical reasoning/.test(text)) {
    return 'Publish a source-backed world-model explainer that connects Cosmos, GR00T, Isaac Sim, and Isaac Lab to the developer workflow.';
  }
  if (/openusd|omniverse|digital twin|industrial/.test(text)) {
    return 'Create an OpenUSD/Omniverse technical thread with one reproducible asset-pipeline example and one industrial partner proof point.';
  }
  if (/jetson|edge|on-device|inference/.test(text)) {
    return 'Run a Jetson benchmark/tutorial that turns the discussion into a concrete edge robotics recipe.';
  }
  if (/autonomous|drive|waymo|carla|av|alpamayo|halos/.test(text)) {
    return 'Coordinate an AV simulation deep dive that maps world-model discussion to DriveOS, Alpamayo, Halos, and Cosmos validation stories.';
  }
  if (/robot|manipulation|humanoid|locomotion|isaac/.test(text)) {
    return 'Turn the trend into a hands-on Isaac Lab or Isaac Sim challenge with clear starter code and community office hours.';
  }
  return 'Add this trend to the weekly community brief and assign one dev-rel owner to validate whether it needs content, events, or partner outreach.';
}

function topicProducts(topic: EnrichedHotTopic): string[] {
  if (topic.productTags && topic.productTags.length > 0) return topic.productTags;
  return detectProductTags(`${topic.topic} ${topic.description} ${topic.nvidiaRelevance ?? ''}`);
}

function topicSectors(topic: EnrichedHotTopic): string[] {
  if (topic.sectorTags && topic.sectorTags.length > 0) return topic.sectorTags;
  return detectSectorTags(`${topic.topic} ${topic.description}`);
}

function sourceCoverage(signals: HotTopicSignal[]): HotTopicAnalysis['sourceCoverage'] {
  const grouped = new Map<string, HotTopicSignal[]>();
  signals.forEach(signal => {
    const label = signal.source === 'rss' ? signal.sourceLabel : signal.sourceLabel || signal.source;
    grouped.set(label, [...(grouped.get(label) ?? []), signal]);
  });
  return [...grouped.entries()]
    .map(([source, rows]) => {
      const sorted = [...rows].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      return {
        source,
        signals: rows.length,
        newestSignal: sorted[0]?.publishedAt,
        oldestSignal: sorted[sorted.length - 1]?.publishedAt,
        notes: rows.some(row => row.source === 'hackernews')
          ? 'Public developer discussion signal; can be noisy, so relevance filters remove stale/off-topic matches.'
          : rows.some(row => row.source === 'arxiv')
            ? 'Research signal from the Physical AI arXiv query.'
            : rows.some(row => row.source === 'youtube')
              ? 'Developer video signal from tracked verified channels.'
              : rows.some(row => row.source === 'github')
                ? 'OSS activity signal from tracked NVIDIA and NVIDIA-aligned repositories.'
                : 'Public RSS/feed signal from robotics, NVIDIA, OpenUSD, or adjacent ecosystem pages.',
      };
    })
    .sort((a, b) => b.signals - a.signals);
}

function buildHotTopicAnalysis(topics: EnrichedHotTopic[], signals: HotTopicSignal[], generatedAt: string): HotTopicAnalysis {
  const highPriority = topics.filter(topic => topic.buzzScore >= 75 || topic.trend === 'rising').slice(0, 5);
  const sourceCount = new Set(signals.map(signal => signal.sourceLabel)).size;
  return {
    generatedAt,
    summary: `${topics.length} synthesized trends from ${signals.length} filtered signals across ${sourceCount} public source streams. The strongest lanes are ${topics.slice(0, 3).map(topic => topic.topic).join(', ')}.`,
    sourceCoverage: sourceCoverage(signals),
    topTrends: topics.map(topic => ({
      topic: topic.topic,
      buzzScore: topic.buzzScore,
      trend: topic.trend,
      whatPeopleAreSaying: topic.whatPeopleAreSaying ?? topic.description,
      whyItMatters: topic.whyItMatters ?? 'This topic is showing enough public momentum to affect developer education, content planning, or partner outreach.',
      nvidiaRelevance: topic.nvidiaRelevance ?? `Relevant products/topics: ${topicProducts(topic).join(', ') || 'Physical AI platform story'}.`,
      recommendedAction: topicAction(topic),
      next7Days: topic.next7Days ?? 'Validate the top evidence links, draft a short listening note, and identify one subject-matter reviewer.',
      next30Days: topic.next30Days ?? 'Ship one reusable asset: tutorial, benchmark, explainer, event prompt, or partner outreach brief.',
      sources: topic.sources,
    })),
    actionQueue: highPriority.map(topic => ({
      priority: topic.buzzScore >= 85 ? 'high' : topic.buzzScore >= 70 ? 'medium' : 'watch',
      action: topicAction(topic),
      owner: topicSectors(topic).includes('Autonomous Vehicles') ? 'AV dev-rel' :
        topicSectors(topic).includes('Industrial Digital Twins') || topicSectors(topic).includes('OpenUSD') ? 'Omniverse/OpenUSD dev-rel' :
        topicSectors(topic).includes('Edge AI') ? 'Jetson dev-rel' :
        'Physical AI community manager',
      horizon: topic.buzzScore >= 80 ? '7 days' : '30 days',
      relatedProducts: topicProducts(topic),
    })),
    knownGaps: [
      'Reddit is not scraped because unauthenticated JSON endpoints return 403 from GitHub Actions runners.',
      'Private Discord, Slack, and LinkedIn conversations are not scraped; any use should be permissioned or manually curated.',
      'Hacker News is useful for developer sentiment but is not representative of the full robotics ecosystem.',
      'Conference CFP/news pages and newsletters should be added as explicit RSS/source records when stable public feeds are available.',
    ],
  };
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const args = new Set(process.argv.slice(2));
  if (args.has('--help') || args.has('-h')) {
    printHelp();
    return;
  }
  const globalSourcesOnly = args.has('--global-sources-only');

  const githubToken = process.env.GITHUB_PAT ?? process.env.GITHUB_TOKEN;
  const youtubeKey  = process.env.YOUTUBE_API_KEY;
  const claudeKey   = process.env.ANTHROPIC_API_KEY;
  const claudeModel = process.env.CLAUDE_MODEL ?? 'claude-haiku-4-5';

  if (!githubToken && !globalSourcesOnly) {
    console.error('FATAL: GITHUB_PAT required.');
    process.exit(1);
  }

  await mkdir(AUTO_DIR, { recursive: true });
  const previous = await loadPreviousSnapshot();
  const previousHotTopics = previous?.hotTopics ?? await loadAutoFile<EnrichedHotTopic[]>('hot-topics.json', []);
  const previousGlobalSources = previous?.globalSources ?? await loadAutoFile<GlobalSourceRecord[]>('global-sources.json', []);
  const previousGitHub = previous?.github ?? await loadAutoFile<GitHubFacts[]>('github.json', []);
  const previousPapers = previous?.papers ?? await loadAutoFile<ArxivPaper[]>('papers.json', []);
  const previousVideos = previous?.videos ?? await loadAutoFile<YouTubeVideo[]>('videos.json', []);
  const previousHotTopicSignals = previous?.hotTopicSignals ?? await loadAutoFile<HotTopicSignal[]>('hot-topic-signals.json', []);
  const previousHotTopicAnalysis = previous?.hotTopicAnalysis ?? await loadAutoFile<HotTopicAnalysis>('hot-topic-analysis.json', {
    generatedAt: '',
    summary: 'No automated Hot Topics analysis has been generated yet.',
    sourceCoverage: [],
    topTrends: [],
    actionQueue: [],
    knownGaps: [],
  });

  if (globalSourcesOnly) {
    const freshGlobalSources = await pullGlobalSources();
    const globalSources = carryForwardOnEmpty('global-sources', freshGlobalSources, previousGlobalSources, 'fresh verification returned no rows');
    const snapshot: AutoSnapshot = {
      generatedAt: new Date().toISOString(),
      globalSources,
      github: previousGitHub,
      papers: previousPapers,
      videos: previousVideos,
      hotTopicSignals: previousHotTopicSignals,
      hotTopics: previousHotTopics,
      hotTopicAnalysis: previousHotTopicAnalysis,
      meta: { errors, warnings, sourceIssues, sourcesUsed },
    };

    logSection('Writing files');
    await writeFile(join(AUTO_DIR, 'global-sources.json'), JSON.stringify(globalSources, null, 2));
    await writeFile(join(AUTO_DIR, 'snapshot.json'), JSON.stringify(snapshot, null, 2));
    await writeFile(join(AUTO_DIR, '_meta.json'), JSON.stringify({
      generatedAt: snapshot.generatedAt,
      sourcesUsed,
      counts: { globalSources: globalSources.length, github: previousGitHub.length, papers: previousPapers.length, videos: previousVideos.length, signals: previousHotTopicSignals.length, topics: previousHotTopics.length },
      errors,
      warnings,
      sourceIssues,
    }, null, 2));

    console.log(`  ✓ Wrote Global View validation snapshot`);
    console.log(`\n━━━ Summary ━━━`);
    console.log(`  Global:   ${globalSources.filter(source => source.status === 'verified').length}/${globalSources.length} source pages verified`);
    console.log(`  Source issues: ${sourceIssues.length}`);
    console.log(`  Warnings: ${warnings.length}`);
    console.log(`  Errors:   ${errors.length}`);
    return;
  }

  // Pull all sources in parallel where possible
  const [freshGlobalSources, freshGitHub, freshPapers, freshHnSignals, freshRssSignals] = await Promise.all([
    pullGlobalSources(),
    pullGitHub(githubToken!),
    pullArxiv(),
    pullHackerNews(),
    pullRssSignals(),
  ]);

  const globalSources = carryForwardOnEmpty('global-sources', freshGlobalSources, previousGlobalSources, 'fresh verification returned no rows');
  const github = backfillMissingRepos(
    carryForwardOnEmpty('github', freshGitHub, previousGitHub, 'fresh pull returned no rows'),
    previousGitHub,
  );
  const papers = carryForwardOnEmpty('arxiv', freshPapers, previousPapers, 'fresh pull returned no rows');
  const hnSignals = carryForwardOnEmpty('hackernews', freshHnSignals, previousHotTopicSignals.filter(signal => signal.source === 'hackernews'), 'fresh pull returned no rows');

  // YouTube only if key provided
  const freshVideos = youtubeKey ? await pullYouTube(youtubeKey) : [];
  if (!youtubeKey) warn('YouTube: YOUTUBE_API_KEY missing; set it to refresh channel/video data');
  const videos = youtubeKey
    ? carryForwardOnEmpty('youtube', freshVideos, previousVideos, 'fresh pull returned no rows')
    : carryForwardOnEmpty('youtube', [], previousVideos, 'API key missing');

  // Compute GitHub stars-growth deltas vs. previous snapshot
  if (previous?.github) {
    for (const repo of github) {
      const prev = previous.github.find(r => r.ownerRepo === repo.ownerRepo);
      if (prev && prev.stars > 0) {
        repo.starsGrowthPct = Math.round(((repo.stars - prev.stars) / prev.stars) * 1000) / 10;
      }
    }
  }

  // Combine signals + optional Claude enrichment
  const freshSignalPool = buildHotTopicSignalPool({
    hn: hnSignals,
    rss: freshRssSignals,
    papers,
    videos,
    github,
  });
  const hotTopicSignals = carryForwardOnEmpty('hot-topic-signals', freshSignalPool, previousHotTopicSignals, 'fresh signal pool returned no rows');

  let enrichedTopics: EnrichedHotTopic[] | null = null;
  if (claudeKey && hotTopicSignals.length > 0) {
    enrichedTopics = await enrichHotTopicsWithClaude(hotTopicSignals, claudeKey, claudeModel);
  } else if (!claudeKey) {
    warn('Claude: ANTHROPIC_API_KEY missing; set it to synthesize hot-topic narratives');
  }
  const hotTopics = enrichedTopics
    ?? carryForwardOnEmpty('claude', [], previousHotTopics, enrichedTopics === null ? 'no fresh enriched topics' : 'fresh enrichment returned no rows');
  const hotTopicAnalysis = buildHotTopicAnalysis(hotTopics, hotTopicSignals, new Date().toISOString());

  // Write JSON files
  logSection('Writing files');
  const snapshot: AutoSnapshot = {
    generatedAt: new Date().toISOString(),
    globalSources,
    github,
    papers,
    videos,
    hotTopicSignals,
    hotTopics,
    hotTopicAnalysis,
    meta: { errors, warnings, sourceIssues, sourcesUsed },
  };

  await writeFile(join(AUTO_DIR, 'global-sources.json'), JSON.stringify(globalSources, null, 2));
  await writeFile(join(AUTO_DIR, 'github.json'),    JSON.stringify(github, null, 2));
  await writeFile(join(AUTO_DIR, 'papers.json'),    JSON.stringify(papers, null, 2));
  await writeFile(join(AUTO_DIR, 'videos.json'),    JSON.stringify(videos, null, 2));
  await writeFile(join(AUTO_DIR, 'hot-topic-signals.json'), JSON.stringify(hotTopicSignals, null, 2));
  await writeFile(join(AUTO_DIR, 'hot-topics.json'), JSON.stringify(hotTopics, null, 2));
  await writeFile(join(AUTO_DIR, 'hot-topic-analysis.json'), JSON.stringify(hotTopicAnalysis, null, 2));
  await writeFile(join(AUTO_DIR, 'snapshot.json'),  JSON.stringify(snapshot, null, 2));
  await writeFile(join(AUTO_DIR, '_meta.json'), JSON.stringify({
    generatedAt: snapshot.generatedAt,
    sourcesUsed,
    counts: { globalSources: globalSources.length, github: github.length, papers: papers.length, videos: videos.length, signals: hotTopicSignals.length, topics: hotTopics.length },
    errors,
    warnings,
    sourceIssues,
  }, null, 2));

  console.log(`  ✓ Wrote 9 files to src/data/auto/`);

  // Summary
  console.log(`\n━━━ Summary ━━━`);
  console.log(`  Sources:  ${sourcesUsed.join(', ')}`);
  console.log(`  Global:   ${globalSources.filter(source => source.status === 'verified').length}/${globalSources.length} source pages verified`);
  console.log(`  GitHub:   ${github.length} repos`);
  console.log(`  Papers:   ${papers.length} arXiv`);
  console.log(`  Videos:   ${videos.length} YouTube`);
  console.log(`  Signals:  ${hotTopicSignals.length} hot topic signals`);
  console.log(`  Topics:   ${hotTopics.length} enriched`);
  console.log(`  Source issues: ${sourceIssues.length}`);
  console.log(`  Warnings: ${warnings.length}`);
  console.log(`  Errors:   ${errors.length}`);
  if (warnings.length > 0) {
    warnings.forEach(w => console.log(`    - ${w}`));
  }
  if (errors.length > 0) {
    errors.forEach(e => console.log(`    - ${e}`));
  }
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
