import { useMemo, useState } from 'react';
import {
  Star,
  GitFork,
  GitPullRequest,
  AlertCircle,
  Users,
  Search,
  TrendingUp,
  Activity,
  ExternalLink,
  Sparkles,
  GitCommit,
  Info,
  ChevronUp,
} from 'lucide-react';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { exportToExcel, exportToPDF } from '../lib/exportUtils';
import { Download, ChevronDown, FileSpreadsheet, FileDown } from 'lucide-react';
import { Sparkline } from './Sparkline';
import { relatedToRepo } from '../lib/relatedItems';
import { RelatedSection } from './RelatedSection';
import { mergeAutoGitHubFacts, hasAutoData, lastAutoRefresh } from '../data/autoMerge';

type RepoCategory =
  | 'official-nvidia'
  | 'community-fork'
  | 'community-tutorial'
  | 'community-tool'
  | 'community-research';

type HealthStatus = 'thriving' | 'active' | 'steady' | 'slow';

interface GitHubRepo {
  id: string;
  name: string;
  ownerRepo: string;
  url: string;
  description: string;
  category: RepoCategory;
  language: string;
  stars: number;
  forks: number;
  openPRs: number;
  openIssues: number;
  contributors: number;
  lastCommit: string;
  topics: string[];
  health: HealthStatus;
  weeklyCommits: number;
  starsGrowthPct?: number;
  /** For community repos — which official repo it relates to */
  relatedRepo?: string;
  /** Why this matters / what it does */
  highlight?: string;
}

const REPOS: GitHubRepo[] = [
  // ---------- Official NVIDIA repos ----------
  {
    id: 'isaaclab',
    name: 'IsaacLab',
    ownerRepo: 'isaac-sim/IsaacLab',
    url: 'https://github.com/isaac-sim/IsaacLab',
    description:
      'Unified GPU-accelerated framework for robot learning built on Isaac Sim — RL, imitation, and motion planning.',
    category: 'official-nvidia',
    language: 'Python',
    stars: 14000,
    forks: 3500,
    openPRs: 80,
    openIssues: 250,
    contributors: 120,
    lastCommit: '2026-05-05',
    topics: ['reinforcement-learning', 'robotics', 'isaac-lab', 'sim2real'],
    health: 'thriving',
    weeklyCommits: 96,
    starsGrowthPct: 22,
  },
  {
    id: 'cosmos',
    name: 'NVIDIA Cosmos',
    ownerRepo: 'NVIDIA/Cosmos',
    url: 'https://github.com/NVIDIA/Cosmos',
    description:
      'World foundation models for Physical AI — generate, predict, and reason about physical environments.',
    category: 'official-nvidia',
    language: '',
    stars: 8094,
    forks: 511,
    openPRs: 10,
    openIssues: 14,
    contributors: 6,
    lastCommit: '2026-01-06',
    topics: ['world-models', 'foundation-models', 'cosmos', 'video-generation'],
    health: 'thriving',
    weeklyCommits: 0,
    starsGrowthPct: 0,
  },
  {
    id: 'cosmos-predict1',
    name: 'cosmos-predict1',
    ownerRepo: 'nvidia-cosmos/cosmos-predict1',
    url: 'https://github.com/nvidia-cosmos/cosmos-predict1',
    description:
      'Cosmos Predict1 model repository for physical AI world prediction workflows.',
    category: 'official-nvidia',
    language: 'Jupyter Notebook',
    stars: 443,
    forks: 79,
    openPRs: 6,
    openIssues: 7,
    contributors: 36,
    lastCommit: '2026-01-06',
    topics: ['cosmos', 'world-models', 'prediction', 'physical-ai'],
    health: 'steady',
    weeklyCommits: 0,
    starsGrowthPct: 0,
  },
  {
    id: 'cosmos-transfer1',
    name: 'cosmos-transfer1',
    ownerRepo: 'nvidia-cosmos/cosmos-transfer1',
    url: 'https://github.com/nvidia-cosmos/cosmos-transfer1',
    description:
      'Cosmos Transfer1 model repository for world-model transfer workflows.',
    category: 'official-nvidia',
    language: 'Python',
    stars: 797,
    forks: 102,
    openPRs: 8,
    openIssues: 14,
    contributors: 32,
    lastCommit: '2026-01-06',
    topics: ['cosmos', 'world-models', 'transfer', 'physical-ai'],
    health: 'steady',
    weeklyCommits: 0,
    starsGrowthPct: 0,
  },
  {
    id: 'alpamayo',
    name: 'Alpamayo',
    ownerRepo: 'NVlabs/alpamayo',
    url: 'https://github.com/NVlabs/alpamayo',
    description:
      'NVIDIA Research project exploring end-to-end autonomous driving stacks with foundation models.',
    category: 'official-nvidia',
    language: 'Python',
    stars: 1200,
    forks: 180,
    openPRs: 6,
    openIssues: 28,
    contributors: 14,
    lastCommit: '2026-04-28',
    topics: ['autonomous-driving', 'self-driving', 'research', 'foundation-models'],
    health: 'active',
    weeklyCommits: 18,
    starsGrowthPct: 35,
  },
  {
    id: 'learn-openusd',
    name: 'LearnOpenUSD',
    ownerRepo: 'NVIDIA-Omniverse/LearnOpenUSD',
    url: 'https://github.com/NVIDIA-Omniverse/LearnOpenUSD',
    description:
      'Tutorials, samples, and learning paths for OpenUSD — the universal 3D scene description format.',
    category: 'official-nvidia',
    language: 'Python',
    stars: 2100,
    forks: 600,
    openPRs: 11,
    openIssues: 42,
    contributors: 28,
    lastCommit: '2026-05-02',
    topics: ['openusd', 'usd', 'omniverse', 'tutorial', '3d'],
    health: 'active',
    weeklyCommits: 14,
    starsGrowthPct: 12,
  },
  {
    id: 'newton',
    name: 'Newton',
    ownerRepo: 'newton-physics/newton',
    url: 'https://github.com/newton-physics/newton',
    description:
      'GPU-accelerated, differentiable physics simulator for robot learning — built with NVIDIA, Google DeepMind & Disney Research.',
    category: 'official-nvidia',
    language: 'Python',
    stars: 4000,
    forks: 410,
    openPRs: 22,
    openIssues: 88,
    contributors: 36,
    lastCommit: '2026-05-05',
    topics: ['physics', 'differentiable-simulation', 'newton', 'robotics'],
    health: 'thriving',
    weeklyCommits: 64,
    starsGrowthPct: 200,
  },
  {
    id: 'ncore',
    name: 'NVIDIA nCore',
    ownerRepo: 'NVIDIA/ncore',
    url: 'https://github.com/NVIDIA/ncore',
    description:
      'Core NVIDIA libraries and shared infrastructure for accelerated computing workflows.',
    category: 'official-nvidia',
    language: 'C++',
    stars: 980,
    forks: 145,
    openPRs: 8,
    openIssues: 34,
    contributors: 22,
    lastCommit: '2026-04-25',
    topics: ['cuda', 'core', 'infrastructure', 'libraries'],
    health: 'steady',
    weeklyCommits: 9,
    starsGrowthPct: 4,
  },
  {
    id: 'isaac-groot',
    name: 'Isaac GR00T',
    ownerRepo: 'NVIDIA/Isaac-GR00T',
    url: 'https://github.com/NVIDIA/Isaac-GR00T',
    description:
      'Open foundation model for generalist humanoid robots — pretrained on diverse manipulation and locomotion data.',
    category: 'official-nvidia',
    language: 'Python',
    stars: 6300,
    forks: 1450,
    openPRs: 36,
    openIssues: 142,
    contributors: 52,
    lastCommit: '2026-05-04',
    topics: ['humanoid', 'foundation-model', 'gr00t', 'manipulation', 'robotics'],
    health: 'thriving',
    weeklyCommits: 58,
    starsGrowthPct: 88,
  },
];

const TRACKED_OWNER_REPOS = new Set([
  'isaac-sim/IsaacLab',
  'NVIDIA/Isaac-GR00T',
  'NVIDIA/Cosmos',
  'nvidia-cosmos/cosmos-predict1',
  'nvidia-cosmos/cosmos-transfer1',
  'NVlabs/alpamayo',
  'NVIDIA-Omniverse/LearnOpenUSD',
  'newton-physics/newton',
  'NVIDIA/ncore',
]);

const CATEGORY_LABELS: Record<RepoCategory | 'all', string> = {
  all: 'All',
  'official-nvidia': 'Official NVIDIA',
  'community-fork': 'Community Forks',
  'community-tutorial': 'Tutorials',
  'community-tool': 'Tools',
  'community-research': 'Research',
};

const CATEGORY_BADGE: Record<RepoCategory, { bg: string; text: string; label: string }> = {
  'official-nvidia': { bg: 'bg-[#76B900]/10', text: 'text-[#4d7a00]', label: 'Official NVIDIA' },
  'community-fork': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Community Fork' },
  'community-tutorial': { bg: 'bg-sky-100', text: 'text-sky-700', label: 'Tutorial' },
  'community-tool': { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Tool' },
  'community-research': { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Research' },
};

const HEALTH_BADGE: Record<HealthStatus, { bg: string; text: string; label: string }> = {
  thriving: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Thriving' },
  active: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Active' },
  steady: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Steady' },
  slow: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Slow' },
};

type SortKey = 'stars' | 'updated' | 'active' | 'trending';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'stars', label: 'Stars' },
  { value: 'updated', label: 'Recently updated' },
  { value: 'active', label: 'Most active' },
  { value: 'trending', label: 'Trending' },
];

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return n.toString();
}

function nameById(id: string): string {
  return REPOS.find((r) => r.ownerRepo === id)?.name ?? id;
}

function RepoExportButton({ repos }: { repos: GitHubRepo[] }) {
  const [open, setOpen] = useState(false);
  if (repos.length === 0) return null;
  const columns = [
    { header: 'Name',           accessor: (r: GitHubRepo) => r.name, width: 30 },
    { header: 'Owner/Repo',     accessor: (r: GitHubRepo) => r.ownerRepo, width: 36 },
    { header: 'Category',       accessor: (r: GitHubRepo) => r.category, width: 22 },
    { header: 'Health',         accessor: (r: GitHubRepo) => r.health, width: 16 },
    { header: 'Language',       accessor: (r: GitHubRepo) => r.language, width: 18 },
    { header: 'Stars',          accessor: (r: GitHubRepo) => r.stars, width: 16 },
    { header: 'Forks',          accessor: (r: GitHubRepo) => r.forks, width: 16 },
    { header: 'Open PRs',       accessor: (r: GitHubRepo) => r.openPRs, width: 14 },
    { header: 'Open Issues',    accessor: (r: GitHubRepo) => r.openIssues, width: 16 },
    { header: 'Contributors',   accessor: (r: GitHubRepo) => r.contributors, width: 16 },
    { header: 'Weekly Commits', accessor: (r: GitHubRepo) => r.weeklyCommits, width: 18 },
    { header: 'Stars Growth %', accessor: (r: GitHubRepo) => r.starsGrowthPct ?? '', width: 18 },
    { header: 'Last Commit',    accessor: (r: GitHubRepo) => r.lastCommit, width: 22 },
    { header: 'Topics',         accessor: (r: GitHubRepo) => r.topics.join(', '), width: 50 },
    { header: 'Related Repo',   accessor: (r: GitHubRepo) => r.relatedRepo ?? '', width: 36 },
    { header: 'Highlight',      accessor: (r: GitHubRepo) => r.highlight ?? '', width: 80 },
    { header: 'Description',    accessor: (r: GitHubRepo) => r.description, width: 80 },
    { header: 'URL',            accessor: (r: GitHubRepo) => r.url, width: 50 },
  ];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:shadow-sm transition"
      >
        <Download className="w-4 h-4" />
        Export <span className="text-gray-400 font-normal text-xs">({repos.length})</span>
        <ChevronDown className={clsx('w-3 h-3 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
            <button
              onClick={() => { exportToExcel({ filename: 'github_repos', sheetName: 'GitHub Repos', data: repos, columns }); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 text-left transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <div>
                <p className="font-semibold">Excel (.xlsx)</p>
                <p className="text-[10px] text-gray-400">Auto-sized columns</p>
              </div>
            </button>
            <button
              onClick={() => { exportToPDF({ filename: 'github_repos', title: 'GitHub Repository Tracker', data: repos, columns }); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-rose-50 hover:text-rose-700 text-left transition-colors border-t border-gray-100"
            >
              <FileDown className="w-4 h-4 text-rose-600" />
              <div>
                <p className="font-semibold">PDF (.pdf)</p>
                <p className="text-[10px] text-gray-400">Landscape A4 with table</p>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function GitHubDataDisclosure() {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-blue-100 rounded-lg bg-blue-50/40 text-xs overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-blue-700 hover:bg-blue-50/80 transition-colors"
      >
        <span className="inline-flex items-center gap-1.5 font-medium">
          <Info className="w-3 h-3" />
          How this data was pulled
          <span className="text-blue-400 font-normal ml-1">GitHub REST · 9 tracked repos · daily refresh</span>
        </span>
        {open ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />}
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-blue-100 space-y-2 text-blue-600">
          <p><strong className="text-blue-800">Repos:</strong> IsaacLab, Isaac-GR00T, Cosmos, cosmos-predict1, cosmos-transfer1, Alpamayo, LearnOpenUSD, Newton, and nCore.</p>
          <p><strong className="text-blue-800">Metrics:</strong> stars, forks, contributors, open issues, open PRs, weekly commits, language, and last commit are pulled from GitHub REST during the refresh job.</p>
          <p><strong className="text-blue-800">Known gaps:</strong> community-adjacent repos are intentionally excluded unless they are added to the tracked repo list and resolve through GitHub REST.</p>
        </div>
      )}
    </div>
  );
}

export function GitHubDashboard() {
  const [category, setCategory] = useState<RepoCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('stars');

  // Merge in auto-pulled GitHub facts (stars, forks, PRs, etc.) when daily refresh has run.
  // Falls back to curated values if no auto data is available.
  const liveReposBase = useMemo(
    () => REPOS.filter(repo => TRACKED_OWNER_REPOS.has(repo.ownerRepo)).map(mergeAutoGitHubFacts),
    [],
  );

  const filteredRepos = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = liveReposBase.filter((r) => {
      if (category !== 'all' && r.category !== category) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.ownerRepo.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.topics.some((t) => t.toLowerCase().includes(q))
      );
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'updated':
          return new Date(b.lastCommit).getTime() - new Date(a.lastCommit).getTime();
        case 'active':
          return b.weeklyCommits - a.weeklyCommits;
        case 'trending':
          return (b.starsGrowthPct ?? 0) - (a.starsGrowthPct ?? 0);
        case 'stars':
        default:
          return b.stars - a.stars;
      }
    });

    return list;
  }, [category, search, sort, liveReposBase]);

  const officialRepos = liveReposBase.filter((r) => r.category === 'official-nvidia');
  const totalStars = liveReposBase.reduce((sum, r) => sum + r.stars, 0);
  const officialStars = officialRepos.reduce((s, r) => s + r.stars, 0);
  const officialForks = officialRepos.reduce((s, r) => s + r.forks, 0);
  const officialPRs = officialRepos.reduce((s, r) => s + r.openPRs, 0);
  const officialContributors = officialRepos.reduce((s, r) => s + r.contributors, 0);

  const liveDataActive = hasAutoData();
  const liveDataAt = lastAutoRefresh();

  return (
    <div className="space-y-6">
      <GitHubDataDisclosure />

      {/* Live data indicator */}
      {liveDataActive && liveDataAt && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-700 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <strong>Live GitHub data</strong> — last auto-refreshed {new Date(liveDataAt).toLocaleString()}.
          <span className="ml-auto text-emerald-600/70 italic">Updates daily via GitHub Actions.</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">GitHub Tracker</h2>
          <p className="text-sm text-gray-500 mt-1">
            Tracking <span className="font-medium text-gray-700">{liveReposBase.length}</span> NVIDIA repos
            {' · '}
            <span className="font-medium text-gray-700">{formatNumber(totalStars)}</span> total
            stars across the daily GitHub health set.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RepoExportButton repos={filteredRepos} />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Star className="w-5 h-5" />}
          label="Stars (official)"
          value={formatNumber(officialStars)}
          accent="bg-[#76B900]/10 text-[#4d7a00]"
        />
        <StatCard
          icon={<GitFork className="w-5 h-5" />}
          label="Forks (official)"
          value={formatNumber(officialForks)}
          accent="bg-indigo-100 text-indigo-700"
        />
        <StatCard
          icon={<GitPullRequest className="w-5 h-5" />}
          label="Open PRs (official)"
          value={officialPRs.toString()}
          accent="bg-amber-100 text-amber-700"
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Contributors (official)"
          value={officialContributors.toString()}
          accent="bg-emerald-100 text-emerald-700"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'official-nvidia'] as (keyof typeof CATEGORY_LABELS)[]).map((key) => {
            const active = category === key;
            return (
              <button
                key={key}
                onClick={() => setCategory(key as RepoCategory | 'all')}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-sm font-medium border transition',
                  active
                    ? 'bg-gray-900 border-gray-900 text-white'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                )}
              >
                {CATEGORY_LABELS[key]}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search repos by name, description, or topic…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs uppercase tracking-wide text-gray-500">Sort</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="text-sm border border-gray-200 rounded-lg bg-white px-2 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      {filteredRepos.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-xl bg-white p-10 text-center">
          <p className="text-sm font-medium text-gray-700">No repos match your filters.</p>
          <p className="text-xs text-gray-500 mt-1">
            Try clearing the search or selecting a different category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredRepos.map((repo) => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</span>
        <span className={clsx('w-8 h-8 rounded-lg inline-flex items-center justify-center', accent)}>
          {icon}
        </span>
      </div>
      <div className="mt-2 text-2xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function RepoCard({ repo }: { repo: GitHubRepo }) {
  const isOfficial = repo.category === 'official-nvidia';
  const catBadge = CATEGORY_BADGE[repo.category];
  const healthBadge = HEALTH_BADGE[repo.health];
  const lastCommitLabel = formatDistanceToNow(new Date(repo.lastCommit), { addSuffix: true });

  return (
    <div
      className={clsx(
        'bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition flex flex-col gap-4',
        isOfficial && 'border-l-4 border-l-[#76B900]'
      )}
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <a
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-base font-semibold text-gray-900 hover:text-[#4d7a00] transition"
          >
            {repo.name}
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
          </a>
          <div className="text-xs text-gray-500 mt-0.5 truncate">{repo.ownerRepo}</div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span
            className={clsx(
              'text-[11px] font-medium px-2 py-0.5 rounded-full',
              catBadge.bg,
              catBadge.text
            )}
          >
            {catBadge.label}
          </span>
          <span
            className={clsx(
              'text-[11px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1',
              healthBadge.bg,
              healthBadge.text
            )}
          >
            <span
              className={clsx(
                'w-1.5 h-1.5 rounded-full',
                repo.health === 'thriving' && 'bg-emerald-500',
                repo.health === 'active' && 'bg-blue-500',
                repo.health === 'steady' && 'bg-amber-500',
                repo.health === 'slow' && 'bg-gray-400'
              )}
            />
            {healthBadge.label}
          </span>
        </div>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed">{repo.description}</p>

      {/* Highlight box for community */}
      {!isOfficial && repo.highlight && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-lg p-3 flex gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <p className="text-xs text-indigo-900 leading-relaxed">{repo.highlight}</p>
        </div>
      )}

      {!isOfficial && repo.relatedRepo && (
        <div className="text-xs text-gray-500">
          Related to{' '}
          <span className="font-medium text-gray-700">{nameById(repo.relatedRepo)}</span>
        </div>
      )}

      {/* Stars trend sparkline */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-gray-400 font-medium">30-day stars trend</span>
        <Sparkline
          seed={`repo-${repo.id}`}
          anchor={repo.stars}
          points={20}
          width={120}
          height={24}
          trend={(repo.starsGrowthPct ?? 0) > 5 ? 'up' : (repo.starsGrowthPct ?? 0) < -5 ? 'down' : 'flat'}
          showValue
          label={`Stars growth ${repo.starsGrowthPct ?? 0}%`}
        />
        {repo.starsGrowthPct !== undefined && (
          <span className={clsx(
            'text-[11px] font-bold ml-auto',
            repo.starsGrowthPct > 0 ? 'text-emerald-600' : repo.starsGrowthPct < 0 ? 'text-red-500' : 'text-gray-400'
          )}>
            {repo.starsGrowthPct > 0 ? '+' : ''}{repo.starsGrowthPct}% / 30d
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-2 text-xs">
        <Stat icon={<Star className="w-3.5 h-3.5" />} value={formatNumber(repo.stars)} label="Stars" />
        <Stat
          icon={<GitFork className="w-3.5 h-3.5" />}
          value={formatNumber(repo.forks)}
          label="Forks"
        />
        <Stat
          icon={<GitPullRequest className="w-3.5 h-3.5" />}
          value={repo.openPRs.toString()}
          label="PRs"
        />
        <Stat
          icon={<AlertCircle className="w-3.5 h-3.5" />}
          value={repo.openIssues.toString()}
          label="Issues"
        />
        <Stat
          icon={<Users className="w-3.5 h-3.5" />}
          value={repo.contributors.toString()}
          label="Devs"
        />
      </div>

      {/* Topics */}
      {repo.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {repo.topics.map((topic) => (
            <span
              key={topic}
              className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
            >
              {topic}
            </span>
          ))}
        </div>
      )}

      {/* Cross-references */}
      <RelatedSection
        items={relatedToRepo(repo.ownerRepo, repo.name, repo.description, repo.topics)}
        label="Related communities, contributors, & tutorials"
      />

      {/* Footer row */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            {repo.language}
          </span>
          <span className="inline-flex items-center gap-1">
            <GitCommit className="w-3.5 h-3.5" />
            Updated {lastCommitLabel}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <Activity className="w-3.5 h-3.5" />
            {repo.weeklyCommits}/wk
          </span>
          {typeof repo.starsGrowthPct === 'number' && (
            <span
              className={clsx(
                'inline-flex items-center gap-1 font-medium',
                repo.starsGrowthPct > 0 ? 'text-emerald-600' : 'text-gray-500'
              )}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              {repo.starsGrowthPct > 0 ? '+' : ''}
              {repo.starsGrowthPct}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg py-2">
      <div className="flex items-center gap-1 text-gray-700 font-semibold">
        <span className="text-gray-500">{icon}</span>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wide text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}
