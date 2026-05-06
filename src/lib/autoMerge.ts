// Reads from src/data/auto/*.json (populated daily by GitHub Actions)
// and merges factual fields into the curated/editorial data.
//
// - Curated entries that have a matching ownerRepo / youtubeId / arxivId
//   get their factual fields overwritten by the auto data
// - Curated entries with no match are left untouched
// - Auto entries with no curated match are NOT shown (we trust the curated list as canonical)

import autoGitHub from '../data/auto/github.json';
import autoMeta from '../data/auto/_meta.json';

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

/** Merge auto-pulled facts into a curated repo. Auto wins for factual fields. */
export function mergeAutoGitHubFacts<T extends RepoBase>(curated: T): T {
  const auto = autoGitHubData.find(a => a.ownerRepo === curated.ownerRepo);
  if (!auto) return curated;
  return {
    ...curated,
    stars:           auto.stars,
    forks:           auto.forks,
    openPRs:         auto.openPRs,
    openIssues:      auto.openIssues,
    contributors:    auto.contributors,
    lastCommit:      auto.lastCommit,
    weeklyCommits:   auto.weeklyCommits,
    starsGrowthPct:  auto.starsGrowthPct,
    language:        auto.language || curated.language,
  };
}

/** Whether the daily auto-refresh has actually run yet. */
export function hasAutoData(): boolean {
  return autoGitHubData.length > 0 && autoMeta.generatedAt !== null;
}

/** When the last refresh happened, ISO string or null. */
export function lastAutoRefresh(): string | null {
  return autoMeta.generatedAt;
}
