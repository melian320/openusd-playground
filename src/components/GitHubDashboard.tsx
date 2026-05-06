import { useMemo, useState } from 'react';
import {
  Star,
  GitFork,
  GitPullRequest,
  AlertCircle,
  Users,
  RefreshCw,
  Search,
  TrendingUp,
  Activity,
  ExternalLink,
  Sparkles,
  GitCommit,
} from 'lucide-react';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { exportToExcel, exportToPDF } from '../lib/exportUtils';
import { Download, ChevronDown, FileSpreadsheet, FileDown } from 'lucide-react';
import { Sparkline } from './Sparkline';
import { relatedToRepo } from '../lib/relatedItems';
import { RelatedSection } from './RelatedSection';
import { mergeAutoGitHubFacts, hasAutoData, lastAutoRefresh } from '../lib/autoMerge';

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
    id: 'isaac-sim-org',
    name: 'Isaac Sim org',
    ownerRepo: 'isaac-sim',
    url: 'https://github.com/isaac-sim',
    description:
      'NVIDIA Isaac Sim — robotics simulation organization hosting Isaac Lab and related simulation tooling.',
    category: 'official-nvidia',
    language: 'Python',
    stars: 21400,
    forks: 4800,
    openPRs: 32,
    openIssues: 410,
    contributors: 180,
    lastCommit: '2026-05-04',
    topics: ['robotics', 'simulation', 'isaac-sim', 'physical-ai'],
    health: 'thriving',
    weeklyCommits: 142,
    starsGrowthPct: 18,
  },
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
    ownerRepo: 'nvidia-cosmos',
    url: 'https://github.com/nvidia-cosmos',
    description:
      'World foundation models for Physical AI — generate, predict, and reason about physical environments.',
    category: 'official-nvidia',
    language: 'Python',
    stars: 8700,
    forks: 1500,
    openPRs: 41,
    openIssues: 188,
    contributors: 64,
    lastCommit: '2026-05-04',
    topics: ['world-models', 'foundation-models', 'cosmos', 'video-generation'],
    health: 'thriving',
    weeklyCommits: 72,
    starsGrowthPct: 64,
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
    id: 'omniverse',
    name: 'NVIDIA Omniverse',
    ownerRepo: 'NVIDIA-Omniverse',
    url: 'https://github.com/NVIDIA-Omniverse',
    description:
      'Omniverse main org — extensions, kit apps, and OpenUSD tooling for collaborative 3D workflows.',
    category: 'official-nvidia',
    language: 'Python',
    stars: 9400,
    forks: 1900,
    openPRs: 24,
    openIssues: 156,
    contributors: 88,
    lastCommit: '2026-05-03',
    topics: ['omniverse', 'openusd', 'kit', '3d', 'collaboration'],
    health: 'active',
    weeklyCommits: 38,
    starsGrowthPct: 9,
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
    ownerRepo: 'nvidia/ncore',
    url: 'https://github.com/nvidia/ncore',
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

  // ---------- Community: Isaac Lab ----------
  {
    id: 'lerobot-isaaclab-bridge',
    name: 'lerobot-isaaclab-bridge',
    ownerRepo: 'huggingface/lerobot-isaaclab-bridge',
    url: 'https://github.com/huggingface/lerobot-isaaclab-bridge',
    description:
      'Bridge connecting Hugging Face LeRobot policies to Isaac Lab environments for sim2real evaluation.',
    category: 'community-tool',
    language: 'Python',
    stars: 1840,
    forks: 220,
    openPRs: 14,
    openIssues: 38,
    contributors: 19,
    lastCommit: '2026-05-03',
    topics: ['lerobot', 'isaac-lab', 'huggingface', 'sim2real'],
    health: 'thriving',
    weeklyCommits: 22,
    starsGrowthPct: 110,
    relatedRepo: 'isaac-sim/IsaacLab',
    highlight:
      'First-class interop between LeRobot datasets/policies and Isaac Lab — unlocks evaluating HF community policies in NVIDIA sim.',
  },
  {
    id: 'diffusion-policy-isaaclab',
    name: 'diffusion-policy-isaaclab',
    ownerRepo: 'BAIR-Berkeley/diffusion-policy-isaaclab',
    url: 'https://github.com/BAIR-Berkeley/diffusion-policy-isaaclab',
    description:
      'Reference implementation of Diffusion Policy adapted for Isaac Lab manipulation benchmarks.',
    category: 'community-research',
    language: 'Python',
    stars: 920,
    forks: 142,
    openPRs: 6,
    openIssues: 21,
    contributors: 11,
    lastCommit: '2026-04-30',
    topics: ['diffusion-policy', 'isaac-lab', 'manipulation', 'bair'],
    health: 'active',
    weeklyCommits: 11,
    starsGrowthPct: 48,
    relatedRepo: 'isaac-sim/IsaacLab',
    highlight:
      'BAIR research port of Diffusion Policy on Isaac Lab tasks — a credible baseline the whole community can build on.',
  },
  {
    id: 'lerobot-isaaclab-tutorial',
    name: 'lerobot-isaaclab-tutorial',
    ownerRepo: 'RoboticsDeveloper/lerobot-isaaclab-tutorial',
    url: 'https://github.com/RoboticsDeveloper/lerobot-isaaclab-tutorial',
    description:
      'Step-by-step tutorial training a LeRobot policy in Isaac Lab from zero to deployment.',
    category: 'community-tutorial',
    language: 'Jupyter Notebook',
    stars: 540,
    forks: 96,
    openPRs: 3,
    openIssues: 9,
    contributors: 6,
    lastCommit: '2026-04-29',
    topics: ['tutorial', 'isaac-lab', 'lerobot', 'beginner'],
    health: 'active',
    weeklyCommits: 7,
    starsGrowthPct: 65,
    relatedRepo: 'isaac-sim/IsaacLab',
    highlight:
      'The tutorial we keep recommending to new community members — clear path from “never used Isaac Lab” to a trained policy.',
  },
  {
    id: 'anymal-isaaclab-fork',
    name: 'anymal-isaaclab-fork',
    ownerRepo: 'eth-rsl/anymal-isaaclab-fork',
    url: 'https://github.com/eth-rsl/anymal-isaaclab-fork',
    description:
      'ETH RSL fork of Isaac Lab with extended ANYmal locomotion environments and rough-terrain benchmarks.',
    category: 'community-fork',
    language: 'Python',
    stars: 760,
    forks: 88,
    openPRs: 5,
    openIssues: 18,
    contributors: 9,
    lastCommit: '2026-05-01',
    topics: ['anymal', 'locomotion', 'isaac-lab', 'eth', 'quadruped'],
    health: 'active',
    weeklyCommits: 9,
    starsGrowthPct: 28,
    relatedRepo: 'isaac-sim/IsaacLab',
    highlight:
      'ETH Robotic Systems Lab — the team behind ANYmal — maintains this fork with cutting-edge legged locomotion tasks.',
  },
  {
    id: 'isaaclab-domain-randomization',
    name: 'isaaclab-domain-randomization',
    ownerRepo: 'nvidia-community/isaaclab-domain-randomization',
    url: 'https://github.com/nvidia-community/isaaclab-domain-randomization',
    description:
      'Drop-in domain randomization utilities for Isaac Lab — lighting, friction, mass, sensor noise.',
    category: 'community-tool',
    language: 'Python',
    stars: 410,
    forks: 58,
    openPRs: 4,
    openIssues: 12,
    contributors: 7,
    lastCommit: '2026-04-27',
    topics: ['domain-randomization', 'isaac-lab', 'sim2real'],
    health: 'active',
    weeklyCommits: 6,
    starsGrowthPct: 40,
    relatedRepo: 'isaac-sim/IsaacLab',
    highlight:
      'Plug-and-play DR — saves teams weeks of boilerplate when transferring policies from sim to real.',
  },

  // ---------- Community: GR00T ----------
  {
    id: 'groot-finetune-recipes',
    name: 'groot-finetune-recipes',
    ownerRepo: 'huggingface/groot-finetune-recipes',
    url: 'https://github.com/huggingface/groot-finetune-recipes',
    description:
      'Curated fine-tuning recipes and PEFT configs for Isaac GR00T on custom humanoid datasets.',
    category: 'community-tool',
    language: 'Python',
    stars: 1240,
    forks: 198,
    openPRs: 9,
    openIssues: 24,
    contributors: 14,
    lastCommit: '2026-05-04',
    topics: ['gr00t', 'fine-tuning', 'huggingface', 'humanoid', 'peft'],
    health: 'thriving',
    weeklyCommits: 18,
    starsGrowthPct: 130,
    relatedRepo: 'NVIDIA/Isaac-GR00T',
    highlight:
      'Hugging Face-grade recipes for adapting GR00T to your own humanoid data with LoRA/QLoRA — major accelerant for community fine-tunes.',
  },
  {
    id: 'groot-humanoid-deploy',
    name: 'groot-humanoid-deploy',
    ownerRepo: 'figure-ai-community/groot-humanoid-deploy',
    url: 'https://github.com/figure-ai-community/groot-humanoid-deploy',
    description:
      'Deployment scaffolding for running GR00T policies on real humanoid hardware with safety wrappers.',
    category: 'community-tool',
    language: 'Python',
    stars: 680,
    forks: 92,
    openPRs: 5,
    openIssues: 17,
    contributors: 10,
    lastCommit: '2026-05-02',
    topics: ['gr00t', 'deployment', 'humanoid', 'real-robot'],
    health: 'active',
    weeklyCommits: 12,
    starsGrowthPct: 75,
    relatedRepo: 'NVIDIA/Isaac-GR00T',
    highlight:
      'Real-robot deployment harness — turns a trained GR00T checkpoint into a safely runnable policy on hardware.',
  },
  {
    id: 'groot-cross-embodiment',
    name: 'groot-cross-embodiment',
    ownerRepo: 'KAIST-robotics/groot-cross-embodiment',
    url: 'https://github.com/KAIST-robotics/groot-cross-embodiment',
    description:
      'KAIST research on transferring GR00T policies across humanoid embodiments with morphology adapters.',
    category: 'community-research',
    language: 'Python',
    stars: 320,
    forks: 41,
    openPRs: 3,
    openIssues: 8,
    contributors: 6,
    lastCommit: '2026-04-26',
    topics: ['gr00t', 'cross-embodiment', 'kaist', 'transfer-learning'],
    health: 'active',
    weeklyCommits: 5,
    starsGrowthPct: 55,
    relatedRepo: 'NVIDIA/Isaac-GR00T',
    highlight:
      'Tackles the hardest GR00T question — can one model run across multiple humanoid bodies? — with shared morphology adapters.',
  },

  // ---------- Community: OpenUSD ----------
  {
    id: 'openusd-ros2-bridge',
    name: 'openusd-ros2-bridge',
    ownerRepo: 'ros-industrial/openusd-ros2-bridge',
    url: 'https://github.com/ros-industrial/openusd-ros2-bridge',
    description:
      'Bidirectional bridge between OpenUSD scenes and ROS 2 topics for live robot visualization.',
    category: 'community-tool',
    language: 'C++',
    stars: 880,
    forks: 124,
    openPRs: 7,
    openIssues: 26,
    contributors: 13,
    lastCommit: '2026-05-01',
    topics: ['openusd', 'ros2', 'bridge', 'visualization'],
    health: 'active',
    weeklyCommits: 13,
    starsGrowthPct: 32,
    relatedRepo: 'NVIDIA-Omniverse/LearnOpenUSD',
    highlight:
      'ROS-Industrial-backed bridge — lets ROS 2 robot stacks publish/subscribe directly into USD scenes for digital twins.',
  },
  {
    id: 'openusd-reachy-assets',
    name: 'openusd-reachy-assets',
    ownerRepo: 'pollen-robotics/openusd-reachy-assets',
    url: 'https://github.com/pollen-robotics/openusd-reachy-assets',
    description:
      'Pollen Robotics-maintained OpenUSD asset library for the Reachy 2 humanoid platform.',
    category: 'community-tool',
    language: 'Python',
    stars: 290,
    forks: 38,
    openPRs: 2,
    openIssues: 7,
    contributors: 5,
    lastCommit: '2026-04-24',
    topics: ['openusd', 'reachy', 'pollen', 'assets', 'humanoid'],
    health: 'steady',
    weeklyCommits: 4,
    starsGrowthPct: 18,
    relatedRepo: 'NVIDIA-Omniverse/LearnOpenUSD',
    highlight:
      'Production-quality Reachy 2 USD assets — the easiest way to drop a real humanoid into an Omniverse scene.',
  },
  {
    id: 'usd-composer-templates',
    name: 'usd-composer-templates',
    ownerRepo: 'community/usd-composer-templates',
    url: 'https://github.com/community/usd-composer-templates',
    description:
      'Starter templates for USD Composer covering robotics cells, warehouses, and manipulation tabletops.',
    category: 'community-tutorial',
    language: 'Python',
    stars: 210,
    forks: 34,
    openPRs: 1,
    openIssues: 5,
    contributors: 4,
    lastCommit: '2026-04-20',
    topics: ['openusd', 'usd-composer', 'templates', 'omniverse'],
    health: 'steady',
    weeklyCommits: 3,
    starsGrowthPct: 14,
    relatedRepo: 'NVIDIA-Omniverse/LearnOpenUSD',
    highlight:
      'Drop-in scene templates that get teams from blank Composer to a useful robotics cell in minutes.',
  },

  // ---------- Community: Newton ----------
  {
    id: 'newton-mujoco-comparison',
    name: 'newton-mujoco-comparison',
    ownerRepo: 'mit-csail/newton-mujoco-comparison',
    url: 'https://github.com/mit-csail/newton-mujoco-comparison',
    description:
      'MIT CSAIL benchmark comparing Newton vs MuJoCo on canonical contact-rich manipulation tasks.',
    category: 'community-research',
    language: 'Python',
    stars: 470,
    forks: 52,
    openPRs: 4,
    openIssues: 11,
    contributors: 8,
    lastCommit: '2026-05-02',
    topics: ['newton', 'mujoco', 'benchmark', 'physics', 'mit'],
    health: 'active',
    weeklyCommits: 8,
    starsGrowthPct: 95,
    relatedRepo: 'newton-physics/newton',
    highlight:
      'MIT CSAIL — credible third-party benchmark giving the community honest numbers on Newton vs MuJoCo.',
  },
  {
    id: 'newton-tutorials',
    name: 'newton-tutorials',
    ownerRepo: 'community/newton-tutorials',
    url: 'https://github.com/community/newton-tutorials',
    description:
      'Beginner-friendly notebooks introducing Newton’s differentiable physics for robot learning.',
    category: 'community-tutorial',
    language: 'Jupyter Notebook',
    stars: 230,
    forks: 31,
    openPRs: 2,
    openIssues: 6,
    contributors: 5,
    lastCommit: '2026-04-28',
    topics: ['newton', 'tutorial', 'differentiable-physics'],
    health: 'active',
    weeklyCommits: 5,
    starsGrowthPct: 140,
    relatedRepo: 'newton-physics/newton',
    highlight:
      'Newton is brand new and the docs are still maturing — these notebooks are filling the gap for newcomers.',
  },

  // ---------- Community: Cosmos ----------
  {
    id: 'cosmos-finetuning',
    name: 'cosmos-finetuning',
    ownerRepo: 'tu-munich/cosmos-finetuning',
    url: 'https://github.com/tu-munich/cosmos-finetuning',
    description:
      'TU Munich research framework for fine-tuning Cosmos world models on domain-specific video corpora.',
    category: 'community-research',
    language: 'Python',
    stars: 540,
    forks: 68,
    openPRs: 4,
    openIssues: 13,
    contributors: 7,
    lastCommit: '2026-05-03',
    topics: ['cosmos', 'fine-tuning', 'world-models', 'tu-munich'],
    health: 'active',
    weeklyCommits: 9,
    starsGrowthPct: 80,
    relatedRepo: 'nvidia-cosmos',
    highlight:
      'TU Munich — first credible community-maintained fine-tuning stack for Cosmos world foundation models.',
  },
  {
    id: 'cosmos-synthetic-data-pipeline',
    name: 'cosmos-synthetic-data-pipeline',
    ownerRepo: 'community/cosmos-synthetic-data-pipeline',
    url: 'https://github.com/community/cosmos-synthetic-data-pipeline',
    description:
      'End-to-end pipeline for generating synthetic robotics video datasets with Cosmos and Isaac Sim.',
    category: 'community-tool',
    language: 'Python',
    stars: 380,
    forks: 47,
    openPRs: 3,
    openIssues: 10,
    contributors: 6,
    lastCommit: '2026-04-30',
    topics: ['cosmos', 'synthetic-data', 'pipeline', 'isaac-sim'],
    health: 'active',
    weeklyCommits: 7,
    starsGrowthPct: 70,
    relatedRepo: 'nvidia-cosmos',
    highlight:
      'Combines Cosmos generation with Isaac Sim labels — a turnkey way to build training datasets at scale.',
  },
];

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

export function GitHubDashboard() {
  const [category, setCategory] = useState<RepoCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('stars');
  const [refreshing, setRefreshing] = useState(false);

  // Merge in auto-pulled GitHub facts (stars, forks, PRs, etc.) when daily refresh has run.
  // Falls back to curated values if no auto data is available.
  const liveReposBase = useMemo(() => REPOS.map(mergeAutoGitHubFacts), []);

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

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 900);
  };

  const liveDataActive = hasAutoData();
  const liveDataAt = lastAutoRefresh();

  return (
    <div className="space-y-6">
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
            Tracking <span className="font-medium text-gray-700">{REPOS.length}</span> repos
            {' · '}
            <span className="font-medium text-gray-700">{formatNumber(totalStars)}</span> total
            stars across NVIDIA Physical AI and the community.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RepoExportButton repos={filteredRepos} />
          <button
            onClick={handleRefresh}
            className={clsx(
              'inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700',
              'hover:bg-gray-50 hover:shadow-sm transition'
            )}
          >
            <RefreshCw className={clsx('w-4 h-4', refreshing && 'animate-spin')} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
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
          {(Object.keys(CATEGORY_LABELS) as (keyof typeof CATEGORY_LABELS)[]).map((key) => {
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
