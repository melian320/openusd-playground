#!/usr/bin/env bun
/**
 * Daily data refresh script for Physical AI Community Hub.
 *
 * Pulls factual data from free APIs, optionally enriches with Claude,
 * writes JSON files to src/data/auto/, and prints a summary.
 *
 * Required env vars:
 *   GITHUB_TOKEN        — GitHub Personal Access Token (scope: public_repo)
 *
 * Optional env vars (skipped silently if missing):
 *   YOUTUBE_API_KEY     — Google Cloud YouTube Data API v3 key
 *   ANTHROPIC_API_KEY   — Claude API key for editorial enrichment
 *   CLAUDE_MODEL        — defaults to "claude-haiku-4-5"
 *
 * Usage:
 *   bun run scripts/refresh-data.ts
 *
 * Designed to run from a GitHub Action; see .github/workflows/refresh-data.yml.
 */

import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dir, '..');
const AUTO_DIR = join(ROOT, 'src', 'data', 'auto');

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

// YouTube channels to track. Use handles (the @username format) — easier to
// add new ones since you don't need to look up the cryptic UC... channel ID.
// The script auto-resolves handles to IDs at runtime via YouTube's API.
//
// To add: visit youtube.com/@SOMETHING — if it loads, copy the handle below.
// To remove: just delete the line.
const YOUTUBE_HANDLES: string[] = [
  // ── NVIDIA & official ─────────────────────────────────────────────
  '@NVIDIADeveloper',
  '@NVIDIA',
  '@NVIDIAOmniverse',

  // ── University labs ───────────────────────────────────────────────
  '@ETHZurich',          // broader university channel
  '@LeggedRobotics',     // ETH Robotic Systems Lab — the actual robotics group
  '@MITCSAIL',
  '@StanfordHAI',

  // ── Robotics companies ────────────────────────────────────────────
  '@BostonDynamics',
  '@UnitreeRobotics',
  '@PollenRobotics',     // Reachy humanoid
  '@1x_technologies',    // NEO humanoid

  // ── Open-source + community ───────────────────────────────────────
  '@HuggingFace',
  '@TheConstruct',       // ROS tutorials + community

  // ── Educators ─────────────────────────────────────────────────────
  '@lexfridman',
  '@TwoMinutePapers',
  '@YannicKilcher',
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
  github: GitHubFacts[];
  papers: ArxivPaper[];
  videos: YouTubeVideo[];
  hotTopicSignals: HotTopicSignal[];
  meta: { errors: string[]; sourcesUsed: string[] };
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

interface HotTopicSignal {
  source: 'reddit' | 'hackernews';
  title: string;
  url: string;
  score: number;
  comments: number;
  publishedAt: string;
  subreddit?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const errors: string[] = [];
const sourcesUsed: string[] = [];

function logSection(name: string) {
  console.log(`\n━━━ ${name} ━━━`);
}

async function safeFetch<T>(url: string, init?: RequestInit, sourceName?: string): Promise<T | null> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) {
      const msg = `${sourceName ?? url}: HTTP ${res.status}`;
      errors.push(msg);
      console.error(`  ✗ ${msg}`);
      return null;
    }
    return await res.json() as T;
  } catch (e) {
    const msg = `${sourceName ?? url}: ${e instanceof Error ? e.message : String(e)}`;
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
    const contribRes = await fetch(
      `https://api.github.com/repos/${owner}/${name}/contributors?per_page=1&anon=true`,
      { headers },
    );
    let contributors = 0;
    const link = contribRes.headers.get('link');
    if (link) {
      const m = link.match(/page=(\d+)>; rel="last"/);
      contributors = m ? parseInt(m[1]) : 1;
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
  sourcesUsed.push('github');
  return out;
}

// ─── arXiv ──────────────────────────────────────────────────────────────────

async function pullArxiv(): Promise<ArxivPaper[]> {
  logSection('arXiv');
  const url = `http://export.arxiv.org/api/query?search_query=${encodeURIComponent(ARXIV_QUERY)}&start=0&max_results=40&sortBy=submittedDate&sortOrder=descending`;
  try {
    const res = await fetch(url);
    if (!res.ok) { errors.push(`arXiv: HTTP ${res.status}`); return []; }
    const xml = await res.text();
    // Lightweight Atom parsing — arXiv's response is well-formed Atom
    const entries = xml.split('<entry>').slice(1);
    const papers: ArxivPaper[] = entries.map(entry => {
      const get = (tag: string) => entry.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))?.[1].trim() ?? '';
      const id = get('id').match(/abs\/([\d.]+)/)?.[1] ?? '';
      const authors = [...entry.matchAll(/<name>([^<]+)<\/name>/g)].map(m => m[1]);
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
    sourcesUsed.push('arxiv');
    return papers;
  } catch (e) {
    errors.push(`arXiv: ${e instanceof Error ? e.message : String(e)}`);
    return [];
  }
}

// ─── YouTube ────────────────────────────────────────────────────────────────

/** Resolve "@HANDLE" to a channel ID via the YouTube Data API. */
async function resolveHandleToId(handle: string, apiKey: string): Promise<{ id: string; name: string } | null> {
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
  return { id: data.items[0].id, name: data.items[0].snippet.title };
}

async function pullYouTube(apiKey: string): Promise<YouTubeVideo[]> {
  logSection('YouTube');
  const out: YouTubeVideo[] = [];

  // Resolve all handles to channel IDs first
  const resolved: { id: string; name: string; handle: string }[] = [];
  for (const handle of YOUTUBE_HANDLES) {
    const r = await resolveHandleToId(handle, apiKey);
    if (r) {
      resolved.push({ ...r, handle });
      console.log(`  ✓ resolved ${handle} → ${r.name} (${r.id})`);
    } else {
      console.log(`  ✗ couldn't resolve ${handle} — skipping`);
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

    for (const v of detail.items) {
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
    console.log(`  ✓ ${ch.name}  ${detail.items.length} videos`);
  }
  sourcesUsed.push('youtube');
  return out;
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
  const queries = ['robotics', 'GR00T', 'Isaac Sim', 'OpenUSD', 'world model'];
  const out: HotTopicSignal[] = [];
  for (const q of queries) {
    const data = await safeFetch<{ hits: { title: string; url?: string; points: number; num_comments: number; created_at: string; objectID: string }[] }>(
      `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(q)}&tags=story&hitsPerPage=8&numericFilters=points%3E10`,
      undefined,
      `hn:${q}`,
    );
    if (!data?.hits) continue;
    for (const hit of data.hits) {
      out.push({
        source: 'hackernews',
        title: hit.title,
        url: hit.url ?? `https://news.ycombinator.com/item?id=${hit.objectID}`,
        score: hit.points,
        comments: hit.num_comments,
        publishedAt: hit.created_at,
      });
    }
    console.log(`  ✓ "${q}"  ${data.hits.length} stories`);
  }
  sourcesUsed.push('hackernews');
  return out;
}

// ─── Claude enrichment (optional) ───────────────────────────────────────────

async function enrichHotTopicsWithClaude(
  signals: HotTopicSignal[],
  apiKey: string,
  model: string,
): Promise<{ topic: string; description: string; buzzScore: number; trend: 'rising' | 'stable' | 'cooling'; sources: string[] }[] | null> {
  logSection('Claude enrichment');
  if (signals.length === 0) return null;
  const prompt = `You are a Physical AI community analyst. Given these recent signals from Hacker News, synthesize the top 8 hot topics in the Physical AI ecosystem.

Each topic must have:
- topic: short title (3-7 words)
- description: 1-2 sentence narrative explaining what's happening and why it matters
- buzzScore: 0-100 based on points/comments, recency, and topic relevance
- trend: "rising", "stable", or "cooling"
- sources: array of source names (e.g. ["HackerNews"])

Signals (${signals.length} items):
${JSON.stringify(signals.slice(0, 50), null, 0)}

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
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    console.log(`  ✓ ${parsed.length} topics synthesized`);
    sourcesUsed.push('claude');
    return parsed;
  } catch (e) {
    errors.push(`Claude: ${e instanceof Error ? e.message : String(e)}`);
    return null;
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const githubToken = process.env.GITHUB_TOKEN;
  const youtubeKey  = process.env.YOUTUBE_API_KEY;
  const claudeKey   = process.env.ANTHROPIC_API_KEY;
  const claudeModel = process.env.CLAUDE_MODEL ?? 'claude-haiku-4-5';

  if (!githubToken) {
    console.error('FATAL: GITHUB_TOKEN required.');
    process.exit(1);
  }

  await mkdir(AUTO_DIR, { recursive: true });
  const previous = await loadPreviousSnapshot();

  // Pull all sources in parallel where possible
  const [github, papers, hnSignals] = await Promise.all([
    pullGitHub(githubToken),
    pullArxiv(),
    pullHackerNews(),
  ]);

  // YouTube only if key provided
  const videos = youtubeKey ? await pullYouTube(youtubeKey) : [];
  if (!youtubeKey) console.log('\n⚠ Skipping YouTube — set YOUTUBE_API_KEY to enable');

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
  const hotTopicSignals = [...hnSignals]
    .sort((a, b) => b.score - a.score)
    .slice(0, 100);

  let enrichedTopics = null;
  if (claudeKey && hotTopicSignals.length > 0) {
    enrichedTopics = await enrichHotTopicsWithClaude(hotTopicSignals, claudeKey, claudeModel);
  } else if (!claudeKey) {
    console.log('\n⚠ Skipping Claude enrichment — set ANTHROPIC_API_KEY to enable');
  }

  // Write JSON files
  logSection('Writing files');
  const snapshot: AutoSnapshot = {
    generatedAt: new Date().toISOString(),
    github,
    papers,
    videos,
    hotTopicSignals,
    meta: { errors, sourcesUsed },
  };

  await writeFile(join(AUTO_DIR, 'github.json'),    JSON.stringify(github, null, 2));
  await writeFile(join(AUTO_DIR, 'papers.json'),    JSON.stringify(papers, null, 2));
  await writeFile(join(AUTO_DIR, 'videos.json'),    JSON.stringify(videos, null, 2));
  await writeFile(join(AUTO_DIR, 'hot-topic-signals.json'), JSON.stringify(hotTopicSignals, null, 2));
  if (enrichedTopics) {
    await writeFile(join(AUTO_DIR, 'hot-topics.json'), JSON.stringify(enrichedTopics, null, 2));
  }
  await writeFile(join(AUTO_DIR, 'snapshot.json'),  JSON.stringify(snapshot, null, 2));
  await writeFile(join(AUTO_DIR, '_meta.json'), JSON.stringify({
    generatedAt: snapshot.generatedAt,
    sourcesUsed,
    counts: { github: github.length, papers: papers.length, videos: videos.length, signals: hotTopicSignals.length, topics: enrichedTopics?.length ?? 0 },
    errors,
  }, null, 2));

  console.log(`  ✓ Wrote 6 files to src/data/auto/`);

  // Summary
  console.log(`\n━━━ Summary ━━━`);
  console.log(`  Sources:  ${sourcesUsed.join(', ')}`);
  console.log(`  GitHub:   ${github.length} repos`);
  console.log(`  Papers:   ${papers.length} arXiv`);
  console.log(`  Videos:   ${videos.length} YouTube`);
  console.log(`  Signals:  ${hotTopicSignals.length} hot topic signals`);
  console.log(`  Topics:   ${enrichedTopics?.length ?? 0} enriched (Claude)`);
  console.log(`  Errors:   ${errors.length}`);
  if (errors.length > 0) {
    errors.forEach(e => console.log(`    - ${e}`));
  }
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
