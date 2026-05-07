import { useEffect, useState, useMemo } from 'react';
import { Globe, Mic, Calendar, CalendarDays, List, MapPin, Flame, Users, TrendingUp, TrendingDown, Minus, ExternalLink, Radio, Search, FileText, Download, Hash, Info, ChevronDown, ChevronUp, Zap, Star, PlayCircle, FileSpreadsheet, FileDown, Github, X, MessageSquare, ShieldCheck, Target, Clock } from 'lucide-react';
import { exportToExcel, exportToPDF, ExportColumn } from '../lib/exportUtils';
import { useSettings, usePersistedState } from '../hooks/useSettings';
import { toGenZ } from '../lib/assistantEngine';
import { Sparkline } from './Sparkline';
import { relatedToSpeaker } from '../lib/relatedItems';
import { RelatedSection } from './RelatedSection';
import { SummaryModal } from './SummaryModal';
import { EventsCalendar } from './EventsCalendar';
import { GlobalEventsCalendar, parseGlobalEventDateRange } from './GlobalEventsCalendar';
import { communities, conferences, speakers, shows, hotTopics as curatedHotTopics, discordChannels, influencers, meetupsHackathons } from '../data/communityData';
import { autoGlobalSourcesData, autoHotTopicSignalsData, autoPapersData, globalSourcesByRegion, hasAutoGlobalSources, hasAutoPapers, hotTopicAnalysisData, isTrustedGlobalSource, needsGlobalSourceValidation, mergeHotTopics } from '../data/autoMerge';
import type { GlobalSourceRecord, GlobalSourceType } from '../data/globalSourceRegistry';
import { VideosDashboard } from './VideosDashboard';
import { GitHubDashboard } from './GitHubDashboard';
import { BuzzLevel, Community, Conference, Speaker, Show, HotTopic, DiscordChannel, PhysicalAIDomain, DOMAIN_META, Region, REGION_META, PersonaFilter, Influencer } from '../types/community';
import { PaperCard } from './PaperCard';
import { PAPER_TOPICS } from '../lib/arxiv';
import clsx from 'clsx';
import { format } from 'date-fns';

const ALL_DOMAINS = Object.keys(DOMAIN_META) as PhysicalAIDomain[];
type GlobalStatusScope = 'trusted' | 'new' | 'all';
type GlobalSortMode = 'status' | 'relevance' | 'upcoming' | 'verified' | 'region' | 'name';

const GLOBAL_SORT_OPTIONS: { id: GlobalSortMode; label: string }[] = [
  { id: 'status', label: 'Status' },
  { id: 'relevance', label: 'Relevance' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'verified', label: 'Recently verified' },
  { id: 'region', label: 'Region' },
  { id: 'name', label: 'Name' },
];

// ── Per-tab data-sourcing analysis ──────────────────────────────────────
interface TabAnalysis {
  signals: number;
  sources: string[];
  method: string;
  refresh: string;
  topicFocus: string[];
}

const TAB_ANALYSIS: Record<string, TabAnalysis> = {
  global: {
    signals: 49,
    sources: ['Daily HTTP verification of official product, community, event, meetup, and association pages', 'Imported Global Events workbook rows with public URLs'],
    method: 'Global View starts from a source registry tied to NVIDIA Physical AI products. Spreadsheet event rows are imported only when they include public http(s) source URLs; blank, TBD, and generic Link rows are excluded. The refresh job fetches each public page, extracts title/meta/body evidence, assigns verified/candidate/stale/dead status plus a relevance score, and writes src/data/auto/global-sources.json. Private Discord/Slack messages and pages behind auth are not scraped.',
    refresh: 'Daily auto-refresh + workbook import on demand',
    topicFocus: ['Robotics', 'AV', 'OpenUSD', 'Industrial Digital Twins', 'Intelligent Vision AI', 'CAE'],
  },
  topics: {
    signals: 30,
    sources: ['Hacker News Algolia', 'arXiv Physical AI/product query', 'Tracked YouTube channels', 'GitHub repo activity', 'NVIDIA/product RSS feeds', 'Claude-synthesized narratives'],
    method: 'Hot Topics is a daily listening report. The refresh job filters public signals for NVIDIA Physical AI product/topic relevance, including DriveOS, Alpamayo, Halos, NuRec, Cosmos, DGX Spark, Omniverse, OpenUSD, Isaac Sim, Isaac Lab, Isaac ROS, Newton, GR00T, Jetson, Metropolis, Robotics, Industrial Digital Twins, Intelligent Vision AI, AV, and CAE. It tags each signal by product and sector, removes stale/off-topic matches, then asks Claude Haiku to synthesize top trends and next actions. Curated topics remain visible as editorial backfill and are labeled separately from auto-synthesized topics.',
    refresh: 'Daily auto-refresh via GitHub Actions',
    topicFocus: ['Robotics', 'World Foundation Models', 'OpenUSD', 'Edge AI', 'Industrial Digital Twins', 'Vision AI'],
  },
  communities: {
    signals: 49,
    sources: ['Editorially curated list (no auto-discovery)'],
    method: 'Manually maintained list of Discord servers, LinkedIn groups, Slack workspaces. Member counts and activity stats are editorial estimates from public-facing pages.',
    refresh: 'Editorial — updated by Claude on request',
    topicFocus: ['Robotics', 'Industrial Digital Twins', 'OpenUSD', 'Edge AI', 'World Foundation Models', 'Vision AI'],
  },
  conferences: {
    signals: 24,
    sources: ['Editorially curated from IEEE/ACM calendars + conference websites'],
    method: 'Manually maintained list of major Physical AI conferences. Attendance, format, and CFP deadlines are pulled from each conference\'s public site at curation time.',
    refresh: 'Editorial — updated by Claude on request',
    topicFocus: ['Robotics', 'Industrial Digital Twins', 'OpenUSD', 'Edge AI', 'Vision AI', 'World Foundation Models'],
  },
  speakers: {
    signals: 37,
    sources: ['Editorially curated from public conference speaker lists, arXiv author profiles, lab websites'],
    method: 'Manually maintained roster. Klout scores (0-100) are editorial composite estimates based on public follower counts + speaking frequency + topic relevance — not pulled from any single API.',
    refresh: 'Editorial — updated by Claude on request',
    topicFocus: ['Robotics', 'Vision AI', 'World Foundation Models', 'Edge AI', 'Industrial Digital Twins', 'OpenUSD'],
  },
  podcasts: {
    signals: 30,
    sources: ['Editorially curated from public podcast directories'],
    method: 'Manually maintained list. Subscriber counts and episode frequency are public-page snapshots — no Spotify/Apple API integration.',
    refresh: 'Editorial — updated by Claude on request',
    topicFocus: ['Robotics', 'Industrial Digital Twins', 'OpenUSD', 'Edge AI', 'World Foundation Models', 'Vision AI'],
  },
  influencers: {
    signals: 22,
    sources: ['Editorially curated public social profiles (X, LinkedIn)'],
    method: 'Manually maintained roster. Follower counts are public-page snapshots at curation time. shouldEngage flag is editorial judgment based on klout + topic overlap. recentPosts array is intentionally empty — fabricated posts removed.',
    refresh: 'Editorial — updated by Claude on request',
    topicFocus: ['Robotics', 'World Foundation Models', 'Edge AI', 'OpenUSD', 'Industrial Digital Twins', 'Vision AI'],
  },
  meetups: {
    signals: 9,
    sources: ['Editorially curated from Luma + Eventbrite + community referrals'],
    method: 'Manually maintained list of Physical AI meetups and hackathons. NVIDIA tech badge applied where the event description names Isaac Lab, GR00T, Cosmos, or Newton. Sponsor recommendation is editorial judgment.',
    refresh: 'Editorial — updated by Claude on request',
    topicFocus: ['Robotics', 'Edge AI', 'World Foundation Models', 'Industrial Digital Twins', 'OpenUSD'],
  },
  discord: {
    signals: 15,
    sources: ['Editorially curated public Discord invites'],
    method: 'Manually maintained list of public Discord servers. Member counts and weekly message rates are editorial snapshots from server widgets — no Discord bot integration.',
    refresh: 'Editorial — updated by Claude on request',
    topicFocus: ['Robotics', 'Simulation', 'Edge AI', 'Vision AI', 'Industrial Digital Twins', 'OpenUSD', 'World Foundation Models'],
  },
  papers: {
    signals: 40,
    sources: ['arXiv API (Physical AI topic queries)'],
    method: 'Auto-pulled daily — 40 most recent arXiv papers matching Physical AI keywords (GR00T, Cosmos, OpenUSD, diffusion policy, sim-to-real, world models, all of cs.RO). NVIDIA technology detection (24 patterns) applied. No HuggingFace, OpenReview, or Semantic Scholar integration yet.',
    refresh: 'Daily auto-refresh via GitHub Actions',
    topicFocus: ['NVIDIA GPU Hardware', 'CUDA · TensorRT', 'Isaac Platform', 'Cosmos · GR00T', 'Edge Inference', 'Simulation'],
  },
};

function AnalysisPanel({ tabId, signalCount }: { tabId: string; signalCount?: number }) {
  const [open, setOpen] = useState(false);
  const analysis = TAB_ANALYSIS[tabId];
  if (!analysis) return null;
  return (
    <div className="mb-3 border border-blue-100 rounded-lg bg-blue-50/40 text-xs overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-blue-700 hover:bg-blue-50/80 transition-colors"
      >
        <div className="flex items-center gap-1.5 font-medium">
          <Info size={11} />
          How this data was pulled
          <span className="text-blue-400 font-normal ml-1">{(signalCount ?? analysis.signals).toLocaleString()} signals · {analysis.refresh}</span>
        </div>
        {open ? <ChevronUp size={12} className="flex-shrink-0 text-blue-400" /> : <ChevronDown size={12} className="flex-shrink-0 text-blue-400" />}
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-blue-100 space-y-2">
          <div>
            <p className="font-semibold text-blue-800 mb-1">Topic Focus</p>
            <div className="flex flex-wrap gap-1">
              {analysis.topicFocus.map(t => (
                <span key={t} className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">{t}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="font-semibold text-blue-800 mb-1">Sources</p>
            <p className="text-blue-600 leading-relaxed">{analysis.sources.join(' · ')}</p>
          </div>
          <div>
            <p className="font-semibold text-blue-800 mb-1">Scoring Method</p>
            <p className="text-blue-600 leading-relaxed">{analysis.method}</p>
          </div>
        </div>
      )}
    </div>
  );
}


function LastUpdated({ tabId }: { tabId: string }) {
  const analysis = TAB_ANALYSIS[tabId];
  if (!analysis) return null;
  const match = analysis.refresh.match(/Last pull:\s*(.+)/);
  const lastPull = match ? match[1] : analysis.refresh;
  const cadence = analysis.refresh.split(' · ')[0];
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      Updated {lastPull} · {cadence}
    </span>
  );
}

function FiltersGroup({
  activeCount,
  children,
  onClearAll,
}: {
  activeCount: number;
  children: React.ReactNode;
  onClearAll?: () => void;
}) {
  const [open, setOpen] = useState(activeCount > 0);
  return (
    <div className={clsx('mb-3 border rounded-xl overflow-hidden transition-colors', activeCount > 0 ? 'border-violet-200 bg-violet-50/20' : 'border-gray-200 bg-white')}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
          <span>Filters</span>
          {activeCount > 0 && (
            <span className="bg-violet-600 text-white text-[10px] rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center font-bold">
              {activeCount}
            </span>
          )}
          {!open && activeCount > 0 && (
            <span className="text-[10px] text-violet-600 font-medium">{activeCount} active</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && onClearAll && (
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); onClearAll(); }}
              className="text-[10px] text-red-500 hover:text-red-700 font-semibold underline"
            >
              Clear all
            </span>
          )}
          {open ? <ChevronUp size={11} className="text-gray-400" /> : <ChevronDown size={11} className="text-gray-400" />}
        </div>
      </button>
      {open && (
        <div className="px-3 pb-2 pt-1 border-t border-gray-100 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
}

function EmptyFilteredState({ onClear }: { onClear: () => void }) {
  return (
    <div className="bg-white border border-dashed border-gray-300 rounded-2xl py-12 px-6 flex flex-col items-center text-gray-400 text-center">
      <Search size={32} className="mb-3 opacity-40" />
      <p className="text-sm font-semibold text-gray-600 mb-1">No matches with the current filters</p>
      <p className="text-xs text-gray-500 max-w-sm leading-relaxed mb-4">
        Try widening the filters above. Removing the score, region, or tag filters typically surfaces more results.
      </p>
      <button
        onClick={onClear}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <X size={11} /> Clear all filters
      </button>
    </div>
  );
}

function SummarizeButton<T>({
  tabName,
  items,
  totalAvailable,
  describeItem,
}: {
  tabName: string;
  items: T[];
  totalAvailable: number;
  describeItem: (item: T) => { name: string; metric?: string };
}) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold border border-violet-200 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 transition-all"
      >
        📝 Summarize
      </button>
      <SummaryModal
        open={open}
        onClose={() => setOpen(false)}
        tabName={tabName}
        items={items}
        totalAvailable={totalAvailable}
        describeItem={describeItem}
      />
    </>
  );
}

function ExportButton<T>({
  data,
  columns,
  filename,
  title,
}: {
  data: T[];
  columns: ExportColumn<T>[];
  filename: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  if (data.length === 0) return null;
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg bg-white text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-all"
      >
        <Download size={12} />
        Export <span className="text-gray-400 font-normal">({data.length})</span>
        <ChevronDown size={11} className={clsx('transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
            <button
              onClick={() => { exportToExcel({ filename, sheetName: title.slice(0, 31), data, columns }); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 text-left transition-colors"
            >
              <FileSpreadsheet size={14} className="text-emerald-600" />
              <div>
                <p className="font-semibold">Excel (.xlsx)</p>
                <p className="text-[10px] text-gray-400">Auto-sized columns</p>
              </div>
            </button>
            <button
              onClick={() => { exportToPDF({ filename, title, data, columns }); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-rose-50 hover:text-rose-700 text-left transition-colors border-t border-gray-100"
            >
              <FileDown size={14} className="text-rose-600" />
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

function OSSBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
      ⚡ OSS
    </span>
  );
}

function OpenUSDBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
      🔷 OpenUSD
    </span>
  );
}

// Detect OSS via keywords on any item
function detectOSS(x: { topics?: string[]; name?: string; description?: string; topic?: string; bio?: string; platform?: string; server?: string; channel?: string }): boolean {
  if (x.platform === 'github') return true;
  const text = [
    ...(x.topics ?? []),
    x.name ?? '',
    x.description ?? '',
    x.topic ?? '',
    x.bio ?? '',
    x.server ?? '',
    x.channel ?? '',
  ].join(' ').toLowerCase();
  return OSS_KEYWORDS.some(kw => text.includes(kw));
}

// Detect OpenUSD via keywords on any item
function detectOpenUSD(x: { topics?: string[]; name?: string; description?: string; topic?: string; bio?: string; server?: string; channel?: string; recentTopics?: string[] }): boolean {
  const text = [
    ...(x.topics ?? []),
    ...(x.recentTopics ?? []),
    x.name ?? '',
    x.description ?? '',
    x.topic ?? '',
    x.bio ?? '',
    x.server ?? '',
    x.channel ?? '',
  ].join(' ').toLowerCase();
  return OPENUSD_KEYWORDS.some(kw => text.includes(kw));
}

function DomainBadges({ domains }: { domains?: PhysicalAIDomain[] }) {
  if (!domains || domains.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {domains.map(d => {
        const meta = DOMAIN_META[d];
        return (
          <span key={d} className={clsx('text-xs px-1.5 py-0.5 rounded-full font-medium', meta.color)}>
            {meta.emoji} {meta.short}
          </span>
        );
      })}
    </div>
  );
}

// CAE keyword detection — used instead of domain tag since CAE spans multiple domains
const CAE_KEYWORDS = ['cae', 'fea', 'cfd', 'fem', 'ansys', 'simulia', 'openfoam', 'nastran', 'abaqus', 'hypermesh', 'comsol', 'catia', 'structural analysis', 'computational fluid', 'finite element', 'digital twin', 'plm', 'dassault', 'ptc', 'computer-aided engineering', 'engineering simulation'];

// OSS keyword detection
const OSS_KEYWORDS = ['open-source', 'open source', 'oss', 'github', 'open-source robotics', 'open robot', 'lerobot', 'ros', 'yocto', 'mujoco', 'drake', 'openfoam', 'blender', 'open x-embodiment'];

// OpenUSD keyword detection
const OPENUSD_KEYWORDS = ['openusd', 'open usd', 'usd composer', 'omniverse', 'pixar usd', 'scene description', 'usd schema', 'universal scene description', 'hydra renderer', 'usdview', 'usd asset', 'usd interchange'];

function DomainFilter({
  active,
  onChange,
  counts,
  exclude,
}: {
  active: PhysicalAIDomain | null;
  onChange: (d: PhysicalAIDomain | null) => void;
  counts: Partial<Record<PhysicalAIDomain, number>>;
  exclude?: PhysicalAIDomain[];
}) {
  const domainsWithData = ALL_DOMAINS.filter(d => (counts[d] ?? 0) > 0 && !exclude?.includes(d));
  if (domainsWithData.length === 0) return null;
  return (
    <div className="flex gap-1 flex-wrap mb-3">
      <button
        onClick={() => onChange(null)}
        className={clsx(
          'text-xs px-2.5 py-1 rounded-full font-medium transition-all border',
          active === null
            ? 'bg-gray-800 text-white border-gray-800'
            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
        )}
      >
        All
      </button>
      {domainsWithData.map(d => {
        const meta = DOMAIN_META[d];
        const count = counts[d] ?? 0;
        return (
          <button
            key={d}
            onClick={() => onChange(active === d ? null : d)}
            className={clsx(
              'text-xs px-2.5 py-1 rounded-full font-medium transition-all',
              active === d ? meta.color + ' ring-1 ring-inset ring-current' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {meta.emoji} {meta.short} <span className="opacity-60">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

const ALL_REGIONS = Object.keys(REGION_META) as Region[];

function RegionBadge({ region }: { region?: Region }) {
  if (!region) return null;
  const meta = REGION_META[region];
  return (
    <span className={clsx('inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium', meta.color)}>
      {meta.emoji} {meta.short}
    </span>
  );
}

function RegionFilter({
  active,
  onChange,
  counts,
}: {
  active: Region | null;
  onChange: (r: Region | null) => void;
  counts: Partial<Record<Region, number>>;
}) {
  const regionsWithData = ALL_REGIONS.filter(r => (counts[r] ?? 0) > 0);
  if (regionsWithData.length < 2) return null;
  return (
    <div className="flex gap-1 flex-wrap mb-2">
      <button
        onClick={() => onChange(null)}
        className={clsx(
          'text-xs px-2.5 py-1 rounded-full font-medium transition-all border',
          active === null
            ? 'bg-gray-800 text-white border-gray-800'
            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
        )}
      >
        🌐 All Regions
      </button>
      {regionsWithData.map(r => {
        const meta = REGION_META[r];
        const count = counts[r] ?? 0;
        return (
          <button
            key={r}
            onClick={() => onChange(active === r ? null : r)}
            className={clsx(
              'text-xs px-2.5 py-1 rounded-full font-medium transition-all',
              active === r ? meta.color + ' ring-1 ring-inset ring-current' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {meta.emoji} {meta.short} <span className="opacity-60">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

export type CommunityIntelTab = 'global' | 'topics' | 'conferences' | 'meetups' | 'communities' | 'discord' | 'papers' | 'podcasts' | 'videos' | 'github' | 'speakers' | 'influencers';

const SCORE_TIERS: { id: BuzzLevel; label: string; emoji: string; cls: string }[] = [
  { id: 'trending', label: 'Trending',  emoji: '🔥', cls: 'bg-red-100 text-red-700 border-red-200' },
  { id: 'high',     label: 'High',      emoji: '⭐', cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 'medium',   label: 'Medium',    emoji: '·',  cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { id: 'low',      label: 'Low',       emoji: '·',  cls: 'bg-gray-100 text-gray-500 border-gray-200' },
];

function ScoreFilter({
  active,
  onChange,
  counts,
}: {
  active: BuzzLevel | null;
  onChange: (l: BuzzLevel | null) => void;
  counts: Partial<Record<BuzzLevel, number>>;
}) {
  return (
    <div className="flex gap-1 flex-wrap mb-2 items-center">
      <span className="text-xs text-gray-400 font-medium mr-1">Score:</span>
      <button
        onClick={() => onChange(null)}
        className={clsx(
          'text-xs px-2.5 py-1 rounded-full font-medium transition-all border',
          active === null
            ? 'bg-gray-800 text-white border-gray-800'
            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
        )}
      >
        All
      </button>
      {SCORE_TIERS.map(t => {
        const count = counts[t.id] ?? 0;
        return (
          <button
            key={t.id}
            onClick={() => onChange(active === t.id ? null : t.id)}
            className={clsx(
              'text-xs px-2.5 py-1 rounded-full font-medium transition-all border',
              active === t.id ? t.cls + ' ring-1 ring-inset ring-current' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
            )}
            title={`${t.label}+ buzz`}
          >
            {t.emoji} {t.label} <span className="opacity-60">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

function TagFilterRow({
  tags,
  active,
  onToggle,
}: {
  tags: { tag: string; count: number }[];
  active: Set<string>;
  onToggle: (t: string) => void;
}) {
  if (tags.length === 0) return null;
  return (
    <div className="flex gap-1 flex-wrap mb-3 items-center">
      <span className="text-xs text-gray-400 font-medium mr-1">Tags:</span>
      {tags.map(({ tag, count }) => {
        const isActive = active.has(tag);
        return (
          <button
            key={tag}
            onClick={() => onToggle(tag)}
            className={clsx(
              'text-xs px-2.5 py-1 rounded-full font-medium transition-all border',
              isActive
                ? tag === 'OSS'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : tag === 'OpenUSD'
                  ? 'bg-cyan-600 text-white border-cyan-600'
                  : 'bg-violet-600 text-white border-violet-600'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
            )}
          >
            {tag === 'OSS' && '⚡ '}{tag === 'OpenUSD' && '🔷 '}{tag} <span className="opacity-60">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

const BUZZ_STYLES: Record<BuzzLevel, string> = {
  trending: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-gray-100 text-gray-500 border-gray-200',
};

function BuzzBadge({ level }: { level: BuzzLevel }) {
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border', BUZZ_STYLES[level])}>
      {level === 'trending' && <Flame size={10} />}
      {level}
    </span>
  );
}

const SOURCE_TYPE_LABELS: Record<GlobalSourceRecord['type'], string> = {
  'official-nvidia': 'NVIDIA',
  community: 'Community',
  event: 'Event',
  meetup: 'Meetup',
  'regional-association': 'Association',
};

const SOURCE_TYPE_STYLES: Record<GlobalSourceRecord['type'], string> = {
  'official-nvidia': 'bg-green-50 text-green-700 border-green-200',
  community: 'bg-blue-50 text-blue-700 border-blue-200',
  event: 'bg-violet-50 text-violet-700 border-violet-200',
  meetup: 'bg-teal-50 text-teal-700 border-teal-200',
  'regional-association': 'bg-amber-50 text-amber-700 border-amber-200',
};

const ALL_SOURCE_TYPES = Object.keys(SOURCE_TYPE_LABELS) as GlobalSourceType[];

const SOURCE_STATUS_STYLES: Record<GlobalSourceRecord['status'], string> = {
  verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  candidate: 'bg-blue-50 text-blue-700 border-blue-200',
  stale: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  dead: 'bg-red-50 text-red-700 border-red-200',
  unavailable: 'bg-red-50 text-red-700 border-red-200',
  unchecked: 'bg-gray-50 text-gray-500 border-gray-200',
};

const SOURCE_STATUS_LABELS: Record<GlobalSourceRecord['status'], string> = {
  verified: 'Verified',
  candidate: 'Candidate',
  stale: 'Stale',
  dead: 'Dead',
  unavailable: 'Dead',
  unchecked: 'Unchecked',
};

function GlobalSourceCard({ source }: { source: GlobalSourceRecord }) {
  const relevance = source.relevanceScore ?? source.confidence;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm hover:border-gray-300 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-sm text-gray-900 hover:text-blue-600 inline-flex items-center gap-1">
              {source.name} <ExternalLink size={10} className="opacity-40" />
            </a>
            <span className={clsx('text-xs px-2 py-0.5 rounded-full font-semibold border', SOURCE_TYPE_STYLES[source.type])}>
              {SOURCE_TYPE_LABELS[source.type]}
            </span>
            <span className={clsx('text-xs px-2 py-0.5 rounded-full font-semibold border', SOURCE_STATUS_STYLES[source.status])}>
              {SOURCE_STATUS_LABELS[source.status]}
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-2 leading-relaxed line-clamp-2">{source.pageDescription || source.description}</p>
          {source.statusReason && (
            <p className="text-[11px] text-gray-400 mb-2 leading-relaxed">{source.statusReason}</p>
          )}
          {(source.eventDate || source.location || source.focusArea) && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2 text-[11px] text-gray-500">
              {source.eventDate && (
                <span className="inline-flex items-center gap-1">
                  <Calendar size={11} className="text-gray-400" />
                  {source.eventDate}
                </span>
              )}
              {source.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={11} className="text-gray-400" />
                  {source.location}
                </span>
              )}
              {source.focusArea && (
                <span className="inline-flex items-center gap-1">
                  <FileSpreadsheet size={11} className="text-gray-400" />
                  {source.focusArea}
                </span>
              )}
            </div>
          )}
          {(source.eventTier || source.activationTier) && (
            <div className="flex flex-wrap gap-1 mb-2">
              {source.eventTier && <span className="text-[10px] bg-violet-50 text-violet-600 border border-violet-100 px-2 py-0.5 rounded-full">{source.eventTier}</span>}
              {source.activationTier && <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full">{source.activationTier}</span>}
            </div>
          )}
          <div className="flex flex-wrap gap-1 mb-2">
            {source.products.slice(0, 5).map(product => (
              <span key={product} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{product}</span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-gray-400">
            <RegionBadge region={source.region} />
            {source.lastVerified && <span>Verified {format(new Date(source.lastVerified), 'MMM d, yyyy')}</span>}
            {source.evidence.length > 0 && <span>{source.evidence.slice(0, 3).join(' · ')}</span>}
          </div>
        </div>
        <div className="w-16 flex-shrink-0 text-right">
          <div className="text-xs text-gray-400 mb-1">Relevance</div>
          <div className="font-bold text-sm text-gray-800">{relevance}</div>
          <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={clsx('h-full rounded-full', relevance >= 80 ? 'bg-emerald-500' : relevance >= 60 ? 'bg-blue-500' : 'bg-gray-300')} style={{ width: `${relevance}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function KloutBar({ score }: { score: number }) {
  const color = score >= 90 ? 'bg-violet-500' : score >= 80 ? 'bg-blue-500' : score >= 70 ? 'bg-teal-500' : 'bg-gray-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={clsx('h-full rounded-full transition-all', color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-700 w-6 text-right">{score}</span>
    </div>
  );
}

function CommunityRow({ c }: { c: Community }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm hover:border-gray-300 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <a href={c.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-sm text-gray-900 hover:text-blue-600 inline-flex items-center gap-1">
              {c.name} <ExternalLink size={10} className="opacity-40" />
            </a>
            <BuzzBadge level={c.buzzLevel} />
          </div>
          <p className="text-xs text-gray-500 mb-2 leading-relaxed">{c.description}</p>
          <div className="flex flex-wrap gap-1">
            {c.topics.map(t => (
              <span key={t} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1 mt-1.5">
            {detectOSS(c) && <OSSBadge />}
            {detectOpenUSD(c) && <OpenUSDBadge />}
            <DomainBadges domains={c.domains} />
            {c.region && <RegionBadge region={c.region} />}
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="flex items-center gap-1 text-xs text-gray-500 justify-end mb-1">
            <Users size={11} />
            <span className="font-semibold text-gray-700">{c.members.toLocaleString()}</span>
          </div>
          <div className="text-xs text-gray-400">{c.weeklyActivity.toLocaleString()}/wk</div>
          <div className="flex justify-end mt-1">
            <Sparkline seed={`comm-${c.id}`} anchor={c.weeklyActivity} showValue label="Weekly activity (14-day trend)" />
          </div>
          <div className="text-xs text-gray-300 mt-0.5 capitalize">{c.platform}</div>
        </div>
      </div>
    </div>
  );
}

function ConferenceCard({ conf }: { conf: Conference }) {
  const start = format(new Date(conf.startDate), 'MMM d, yyyy');
  const isPast = new Date(conf.startDate) < new Date();
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm hover:border-gray-300 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <a href={conf.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-sm text-gray-900 hover:text-blue-600 inline-flex items-center gap-1">
              {conf.name} <ExternalLink size={10} className="opacity-40" />
            </a>
            <BuzzBadge level={conf.buzzLevel} />
            {isPast && <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Past</span>}
          </div>
          <p className="text-xs text-gray-400 mb-2">
            <Calendar size={10} className="inline mr-1" />
            {start} · {conf.location} · <span className="capitalize">{conf.format}</span>
            {conf.expectedAttendance && <span className="ml-2"><Users size={10} className="inline mr-0.5" />{conf.expectedAttendance.toLocaleString()}</span>}
          </p>
          <p className="text-xs text-gray-500 mb-2 leading-relaxed line-clamp-2">{conf.description}</p>
          <div className="flex flex-wrap gap-1 mb-2">
            {conf.topics.slice(0, 4).map(t => (
              <span key={t} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
          {conf.notableSpeakers && conf.notableSpeakers.length > 0 && (
            <p className="text-xs text-gray-400">
              <Mic size={10} className="inline mr-1" />
              {conf.notableSpeakers.join(', ')}
            </p>
          )}
          {conf.cfpDeadline && (
            <p className="text-xs text-red-500 mt-1 font-medium">
              CFP deadline: {format(new Date(conf.cfpDeadline), 'MMM d, yyyy')}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-1 mt-1.5">
            {detectOSS(conf) && <OSSBadge />}
            {detectOpenUSD(conf) && <OpenUSDBadge />}
            <DomainBadges domains={conf.domains} />
            {conf.region && <RegionBadge region={conf.region} />}
          </div>
        </div>
        <div className="flex-shrink-0 flex flex-col items-end gap-1">
          <span className={clsx('text-xs px-2 py-0.5 rounded-full capitalize font-medium',
            conf.type === 'hackathon' ? 'bg-green-50 text-green-700' :
            conf.type === 'meetup' ? 'bg-teal-50 text-teal-700' :
            conf.type === 'summit' ? 'bg-purple-50 text-purple-700' :
            conf.type === 'conference' ? 'bg-blue-50 text-blue-700' :
            conf.type === 'workshop' ? 'bg-amber-50 text-amber-700' :
            'bg-gray-100 text-gray-600'
          )}>
            {conf.type}
          </span>
        </div>
      </div>
    </div>
  );
}

function SpeakerCard({ speaker }: { speaker: Speaker }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm hover:border-gray-300 transition-all">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {speaker.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-sm text-gray-900">{speaker.name}</p>
              <p className="text-xs text-gray-500">{speaker.title} · {speaker.company}</p>
            </div>
          </div>
          <div className="mt-2 mb-2">
            <p className="text-xs text-gray-400 mb-1">Klout Score</p>
            <KloutBar score={speaker.kloutScore} />
          </div>
          <p className="text-xs text-gray-500 mb-2 line-clamp-2 leading-relaxed">{speaker.bio}</p>
          <div className="flex flex-wrap gap-1 mb-2">
            {speaker.topics.slice(0, 3).map(t => (
              <span key={t} className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
          <div className="flex gap-3 text-xs text-gray-400">
            {speaker.linkedinFollowers && <span>LI: {(speaker.linkedinFollowers / 1000).toFixed(0)}k</span>}
            {speaker.twitterFollowers && <span>X: {(speaker.twitterFollowers / 1000).toFixed(0)}k</span>}
          </div>
          <div className="flex flex-wrap items-center gap-1 mt-1.5">
            {detectOSS(speaker) && <OSSBadge />}
            {detectOpenUSD(speaker) && <OpenUSDBadge />}
            <DomainBadges domains={speaker.domains} />
          </div>
          {speaker.recentAppearances.length > 0 && (
            <div className="mt-2 border-t border-gray-100 pt-2">
              <p className="text-xs font-medium text-gray-400 mb-1">Recent appearances</p>
              {speaker.recentAppearances.slice(0, 2).map((a, i) => (
                <div key={i} className="text-xs text-gray-500 flex items-center gap-1 mb-0.5">
                  <Radio size={9} className="flex-shrink-0 text-gray-300" />
                  <span className="truncate">{a.show}</span>
                  <span className="text-gray-300 flex-shrink-0">·</span>
                  <span className="text-gray-400 flex-shrink-0">{format(new Date(a.date), 'MMM yyyy')}</span>
                </div>
              ))}
            </div>
          )}
          {/* Cross-references */}
          <RelatedSection items={relatedToSpeaker(speaker.id)} />
        </div>
      </div>
    </div>
  );
}

function ShowCard({ show }: { show: Show }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm hover:border-gray-300 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <a href={show.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-sm text-gray-900 hover:text-blue-600 inline-flex items-center gap-1">
              {show.name} <ExternalLink size={10} className="opacity-40" />
            </a>
            <BuzzBadge level={show.buzzLevel} />
          </div>
          <p className="text-xs text-gray-400 mb-2">
            Hosted by <span className="font-medium text-gray-600">{show.host}</span>
            {show.subscribers && <span className="ml-2"><Users size={10} className="inline mr-0.5" />{show.subscribers.toLocaleString()} subs</span>}
            {show.episodesPerMonth && <span className="ml-2">{show.episodesPerMonth}x/mo</span>}
          </p>
          <p className="text-xs text-gray-500 mb-2 leading-relaxed line-clamp-2">{show.description}</p>
          <div className="flex flex-wrap gap-1 mb-2">
            {show.topics.slice(0, 3).map(t => (
              <span key={t} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
          <p className="text-xs text-gray-400">
            <Mic size={10} className="inline mr-1" />
            Recent: {show.recentGuests.slice(0, 3).join(', ')}
          </p>
          <div className="flex flex-wrap items-center gap-1 mt-1.5">
            {detectOSS(show) && <OSSBadge />}
            {detectOpenUSD(show) && <OpenUSDBadge />}
            <DomainBadges domains={show.domains} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Derive a recommended action per topic based on its content + buzz + trend
function deriveTopicAction(t: HotTopic): string {
  if (t.recommendedAction) return t.recommendedAction;
  const text = `${t.topic} ${t.description}`.toLowerCase();

  // Cluster-specific actions
  if (/world model|foundation model|generalist|vla |gr00t|cosmos|rt-2|octo|openvla|π0/.test(text)) {
    return t.buzzScore >= 80
      ? 'Commission a deep-dive blog + companion Dev Video benchmarking against GR00T N1 / Cosmos. Pitch a co-authored thread with a top researcher in this space.'
      : 'Track for emerging benchmarks. Add 2 papers to the Papers tab and tag relevant Speakers for outreach.';
  }
  if (/openusd|usd composer|omniverse|scene description|hydra|pixar usd/.test(text)) {
    return 'Pair with the LearnOpenUSD repo and Dev Videos OpenUSD content. Run a #OpenUSDFriday post series amplifying community USD work.';
  }
  if (/digital twin|industrial|manufacturing|siemens|abb|rockwell|factory|iiot|scada/.test(text)) {
    return 'Engage one industrial partner (Siemens / ABB / Rockwell) for a joint case study. Surface ROI metrics in a LinkedIn thought-leadership post.';
  }
  if (/edge ai|jetson|onnx|tflite|executorch|inference|on-device|llama\.cpp/.test(text)) {
    return 'Highlight Jetson Orin Nano $249 path. Commission a benchmark tutorial + share in r/embedded and HF Edge community.';
  }
  if (/robot|manipulation|locomotion|humanoid|lerobot|gripper|embodied|bipedal|so-arm/.test(text)) {
    return t.trend === 'rising'
      ? 'Boost via Discord engagement in LeRobot + Isaac Sim channels. Pitch a speaker spot at the next Bay Area Physical AI Meetup.'
      : 'Monitor and reactivate via a community challenge if buzz drops further.';
  }
  if (/vision|object detection|depth|segmentation|gaussian splat|grounding dino|sam /.test(text)) {
    return 'Submit a paper to CVPR 2026 fast-track. Cross-promote with Vision AI influencers on X and LinkedIn.';
  }
  if (/cae|fea|cfd|simulation|fem|ansys|simulia|openfoam|physics-accurate/.test(text)) {
    return 'Connect with Ansys / SIMULIA dev relations. Position Newton + Omniverse as the open simulation stack story.';
  }
  if (/automotive|autonomous driving|av |carla|self-driving|openpilot/.test(text)) {
    return 'Loop in the Alpamayo team for a co-marketed technical deep dive. Engage CARLA Discord with a sponsored challenge.';
  }
  if (/discord|community|forum/.test(text)) {
    return 'Activate community engagement plan. Post in 3 highest-traffic channels and pin a NVIDIA-tech amplification thread.';
  }

  // Trend / buzz-based fallback
  if (t.trend === 'rising' && t.buzzScore >= 80) {
    return 'High-priority amplification. Launch a thought-leadership post + community AMA within 14 days while momentum is hot.';
  }
  if (t.trend === 'rising') {
    return 'Watch and prepare. Schedule a content piece for the next 30 days as buzz grows.';
  }
  if (t.trend === 'falling') {
    return 'Deprioritize for now. Archive in trend-tracking; reassess in 60 days.';
  }
  return 'Monitor weekly. Tag in next monthly review for action prioritization.';
}

function formatSignalDate(date?: string): string {
  if (!date) return 'Unknown';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Unknown';
  return format(parsed, 'MMM d');
}

function HotTopicsListeningPanel({ topics }: { topics: HotTopic[] }) {
  const autoCount = topics.filter(topic => topic.listeningStatus === 'auto').length;
  const curatedCount = topics.length - autoCount;
  const coverage = hotTopicAnalysisData.sourceCoverage ?? [];
  const topAction = hotTopicAnalysisData.actionQueue?.[0];
  const newestSignal = [...autoHotTopicSignalsData]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())[0];
  const averageRelevance = autoHotTopicSignalsData.length
    ? Math.round(autoHotTopicSignalsData.reduce((sum, signal) => sum + (signal.relevanceScore ?? 0), 0) / autoHotTopicSignalsData.length)
    : 0;

  return (
    <div className="mb-4 space-y-3">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)] gap-3">
        <div className="border border-gray-200 bg-white rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
              <MessageSquare size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="text-sm font-bold text-gray-900">Daily Listening Readout</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                  {autoCount} auto-synthesized
                </span>
                {curatedCount > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200">
                    {curatedCount} curated backfill
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                {hotTopicAnalysisData.summary || 'Run the daily refresh to generate the source-backed listening report.'}
              </p>
              <div className="flex flex-wrap gap-2 mt-3 text-[11px] text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <Clock size={11} />
                  Newest signal {formatSignalDate(newestSignal?.publishedAt)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck size={11} />
                  {autoHotTopicSignalsData.length} filtered signals
                </span>
                <span className="inline-flex items-center gap-1">
                  <Target size={11} />
                  Avg relevance {averageRelevance}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-blue-100 bg-blue-50/60 rounded-lg p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-700 mb-1">Fastest useful move</p>
          <p className="text-sm font-semibold text-blue-950 leading-snug">{topAction?.action ?? 'Generate a fresh listening report, then assign the top trend to a dev-rel owner.'}</p>
          <p className="text-[11px] text-blue-700 mt-2">
            {topAction ? `${topAction.owner} · ${topAction.horizon}` : 'Owner and horizon will populate after refresh.'}
          </p>
        </div>
      </div>

      {coverage.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
          {coverage.slice(0, 6).map(source => (
            <div key={source.source} className="border border-gray-200 bg-white rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-wide font-semibold text-gray-400 truncate">{source.source}</p>
              <div className="text-lg font-bold text-gray-900 leading-none mt-1">{source.signals}</div>
              <p className="text-[11px] text-gray-500 mt-1">newest {formatSignalDate(source.newestSignal)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TopicCard({ topic }: { topic: HotTopic }) {
  const { settings } = useSettings();
  const genZ = settings.genZMode;
  const TrendIcon = topic.trend === 'rising' ? TrendingUp : topic.trend === 'falling' ? TrendingDown : Minus;
  const trendColor = topic.trend === 'rising' ? 'text-green-600' : topic.trend === 'falling' ? 'text-red-400' : 'text-gray-400';
  const barColor = topic.buzzScore >= 90 ? 'bg-red-500' : topic.buzzScore >= 75 ? 'bg-orange-500' : topic.buzzScore >= 60 ? 'bg-yellow-500' : 'bg-gray-400';
  const action = deriveTopicAction(topic);
  const displayAction = genZ ? toGenZ(action) : action;
  const isAuto = topic.listeningStatus === 'auto';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm hover:border-gray-300 transition-all">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <h3 className="font-semibold text-sm text-gray-900">{topic.topic}</h3>
            <span className={clsx(
              'text-[10px] px-1.5 py-0.5 rounded-full border font-medium',
              isAuto ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-500 border-gray-200'
            )}>
              {isAuto ? 'auto listening' : 'curated'}
            </span>
          </div>
          {topic.signalCount && (
            <p className="text-[10px] text-gray-400">{topic.signalCount} signals · confidence {topic.confidence ?? 'n/a'}</p>
          )}
        </div>
        <div className={clsx('flex items-center gap-1 flex-shrink-0 text-xs font-medium', trendColor)}>
          <TrendIcon size={13} />
          {topic.trend}
        </div>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={clsx('h-full rounded-full', barColor)} style={{ width: `${topic.buzzScore}%` }} />
        </div>
        <span className="text-xs font-bold text-gray-700 w-8 text-right">🔥 {topic.buzzScore}</span>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed mb-3">{topic.whatPeopleAreSaying ?? topic.description}</p>
      {(topic.whyItMatters || topic.nvidiaRelevance) && (
        <div className="grid grid-cols-1 gap-2 mb-3">
          {topic.whyItMatters && (
            <div className="rounded-lg bg-gray-50 border border-gray-100 p-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Why it matters</p>
              <p className="text-xs text-gray-600 leading-relaxed">{topic.whyItMatters}</p>
            </div>
          )}
          {topic.nvidiaRelevance && (
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">NVIDIA relevance</p>
              <p className="text-xs text-slate-600 leading-relaxed">{topic.nvidiaRelevance}</p>
            </div>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-1 mb-3">
        {topic.sources.map(s => (
          <span key={s} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">{s}</span>
        ))}
        {topic.productTags?.slice(0, 4).map(product => (
          <span key={product} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">{product}</span>
        ))}
      </div>
      {topic.topSignals && topic.topSignals.length > 0 && (
        <div className="mb-3 border border-gray-100 rounded-lg divide-y divide-gray-100 overflow-hidden">
          {topic.topSignals.slice(0, 3).map(signal => (
            <a
              key={`${signal.url}-${signal.title}`}
              href={signal.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-2.5 py-2 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-gray-700 leading-snug">{signal.title}</p>
                <ExternalLink size={10} className="text-gray-300 flex-shrink-0 mt-0.5" />
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">{signal.source} · {formatSignalDate(signal.publishedAt)}</p>
            </a>
          ))}
        </div>
      )}
      {/* Recommended action callout */}
      <TopicActionCallout topic={topic} action={displayAction} genZ={genZ} />
      {(topic.next7Days || topic.next30Days) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          {topic.next7Days && (
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Next 7 days</p>
              <p className="text-xs text-emerald-950 leading-relaxed mt-0.5">{topic.next7Days}</p>
            </div>
          )}
          {topic.next30Days && (
            <div className="rounded-lg border border-violet-100 bg-violet-50/60 p-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-700">Next 30 days</p>
              <p className="text-xs text-violet-950 leading-relaxed mt-0.5">{topic.next30Days}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TopicActionCallout({ action, genZ }: { topic: HotTopic; action: string; genZ: boolean }) {
  return (
    <div className={clsx(
      'rounded-lg p-2.5 border',
      genZ ? 'bg-pink-50/60 border-pink-200' : 'bg-blue-50/60 border-blue-100'
    )}>
      <div className="flex items-start gap-2">
        <span className={clsx('text-xs font-bold flex-shrink-0 mt-0.5', genZ ? 'text-pink-500' : 'text-blue-500')}>▶</span>
        <div className="flex-1 min-w-0">
          <p className={clsx('text-[10px] font-semibold uppercase tracking-wide mb-0.5', genZ ? 'text-pink-700' : 'text-blue-700')}>
            {genZ ? '✨ The play bestie' : 'Recommended action'}
          </p>
          <p className={clsx('text-xs leading-relaxed', genZ ? 'text-pink-900' : 'text-blue-900')}>{action}</p>
        </div>
      </div>
    </div>
  );
}

function DiscordChannelCard({ ch }: { ch: DiscordChannel }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm hover:border-gray-300 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <Hash size={9} className="text-white" />
              </div>
              <a href={ch.serverUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-sm text-gray-900 hover:text-indigo-600 inline-flex items-center gap-1">
                {ch.channel} <ExternalLink size={10} className="opacity-40" />
              </a>
            </div>
            <BuzzBadge level={ch.buzzLevel} />
          </div>
          <p className="text-xs text-gray-400 mb-2">
            <span className="font-medium text-gray-600">{ch.server}</span> server
          </p>
          <p className="text-xs text-gray-500 mb-2 leading-relaxed">{ch.topic}</p>
          <div className="mb-2">
            <p className="text-xs font-medium text-gray-400 mb-1">Hot threads this week</p>
            <div className="flex flex-col gap-1">
              {ch.recentTopics.slice(0, 3).map((t, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className="text-indigo-400 font-bold">#</span>
                  <span className="truncate">{t}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1 mt-1.5">
            {detectOSS(ch) && <OSSBadge />}
            {detectOpenUSD(ch) && <OpenUSDBadge />}
            <DomainBadges domains={ch.domains} />
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="flex items-center gap-1 text-xs text-gray-500 justify-end mb-1">
            <Users size={11} />
            <span className="font-semibold text-gray-700">{ch.members.toLocaleString()}</span>
          </div>
          <div className="text-xs text-gray-400">{ch.weeklyMessages.toLocaleString()}/wk</div>
          <div className="text-xs text-indigo-400 mt-0.5">Discord</div>
        </div>
      </div>
    </div>
  );
}


// Maps persona → relevant Physical AI domains for cross-tab filtering
const PERSONA_DOMAINS: Record<string, PhysicalAIDomain[]> = {
  robotics:               ['robotics', 'simulation'],
  automotive:             ['autonomous-vehicles', 'simulation', 'edge-ai'],
  vss:                    ['edge-ai', 'infrastructure'],
  'world-foundation-models': ['simulation', 'robotics', 'edge-ai'],
  openusd:                ['simulation', 'infrastructure'],
  'industrial-dt':        ['industrial', 'simulation', 'infrastructure'],
};

function InfluencerCard({ inf }: { inf: Influencer }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm hover:border-gray-300 transition-all">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {inf.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-semibold text-sm text-gray-900">{inf.name}</p>
              <p className="text-xs text-gray-500">{inf.title} · {inf.company}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {inf.shouldEngage
                ? <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">✓ Engage</span>
                : <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 font-medium">Watch</span>
              }
            </div>
          </div>
          <div className="mt-2 mb-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-400">Klout Score</p>
              <Sparkline seed={`inf-klout-${inf.id}`} anchor={inf.kloutScore} showValue label="30-day klout trend" />
            </div>
            <KloutBar score={inf.kloutScore} />
          </div>
          <p className="text-xs text-gray-500 mb-2 line-clamp-2 leading-relaxed">{inf.bio}</p>
          <div className="flex flex-wrap gap-1 mb-2">
            {inf.topics.slice(0, 3).map(t => (
              <span key={t} className="text-xs bg-pink-50 text-pink-700 px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
          <div className="flex gap-3 text-xs text-gray-400 mb-2">
            {inf.twitterFollowers && (
              <a href={`https://twitter.com/${inf.twitterHandle}`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors">
                𝕏 {(inf.twitterFollowers / 1000).toFixed(0)}k
              </a>
            )}
            {inf.linkedinFollowers && (
              <a href={inf.linkedinUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-700 transition-colors">
                LI {(inf.linkedinFollowers / 1000).toFixed(0)}k
              </a>
            )}
          </div>
          {inf.shouldEngage && (
            <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-2 py-1.5 leading-relaxed mb-2">
              💡 {inf.engageReason}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-1 mt-1.5">
            {detectOSS(inf) && <OSSBadge />}
            {detectOpenUSD(inf) && <OpenUSDBadge />}
            <DomainBadges domains={inf.domains} />
          </div>
          {/* Recent posts toggle */}
          <button
            onClick={() => setExpanded(v => !v)}
            className="mt-2 text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
          >
            {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            {expanded ? 'Hide' : 'Show'} recent posts
          </button>
          {expanded && (
            <div className="mt-2 space-y-2">
              {inf.recentPosts.map((post, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-2.5 text-xs text-gray-600 leading-relaxed">
                  <p className="mb-1">{post.text}</p>
                  <div className="flex items-center gap-2 text-gray-400">
                    <span className="capitalize">{post.platform}</span>
                    <span>·</span>
                    <span>{format(new Date(post.date), 'MMM d, yyyy')}</span>
                    <span>·</span>
                    <span>❤ {post.likes.toLocaleString()}</span>
                    {post.reposts && <span>↩ {post.reposts.toLocaleString()}</span>}
                    {post.url && <a href={post.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-500"><ExternalLink size={10} /></a>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MeetupCard({ conf }: { conf: Conference }) {
  const start = format(new Date(conf.startDate), 'MMM d, yyyy');
  const isPast = new Date(conf.startDate) < new Date();
  const sponsorColor =
    conf.sponsorRecommendation === 'yes'   ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
    conf.sponsorRecommendation === 'maybe' ? 'bg-amber-50 text-amber-700 border-amber-200' :
    'bg-gray-50 text-gray-400 border-gray-200';
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm hover:border-gray-300 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <a href={conf.lumaUrl ?? conf.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-sm text-gray-900 hover:text-blue-600 inline-flex items-center gap-1">
              {conf.name} <ExternalLink size={10} className="opacity-40" />
            </a>
            <BuzzBadge level={conf.buzzLevel} />
            {isPast && <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Past</span>}
          </div>
          <p className="text-xs text-gray-400 mb-1.5">
            <Calendar size={10} className="inline mr-1" />
            {start}{conf.endDate ? ` – ${format(new Date(conf.endDate), 'MMM d')}` : ''} · {conf.location}
            {conf.expectedAttendance && <span className="ml-2"><Users size={10} className="inline mr-0.5" />{conf.expectedAttendance.toLocaleString()} expected</span>}
          </p>
          <p className="text-xs text-gray-500 mb-2 leading-relaxed line-clamp-2">{conf.description}</p>
          {conf.nvidiaTech && (
            <p className="text-xs text-[#76B900] bg-green-50 rounded px-2 py-1 mb-2 font-medium">
              ⬡ NVIDIA tech: {conf.nvidiaTechDetails}
            </p>
          )}
          {conf.sponsorReason && (
            <p className="text-xs text-gray-500 italic mb-2">{conf.sponsorReason}</p>
          )}
          <div className="flex flex-wrap gap-1 mb-2">
            {conf.topics.slice(0, 4).map(t => (
              <span key={t} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1 mt-1.5">
            {detectOSS(conf) && <OSSBadge />}
            {detectOpenUSD(conf) && <OpenUSDBadge />}
            <DomainBadges domains={conf.domains} />
            {conf.region && <RegionBadge region={conf.region} />}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className={clsx('text-xs px-2 py-0.5 rounded-full capitalize font-medium',
            conf.type === 'hackathon' ? 'bg-green-50 text-green-700' :
            conf.type === 'meetup'    ? 'bg-teal-50 text-teal-700' :
            'bg-purple-50 text-purple-700'
          )}>
            {conf.type}
          </span>
          {conf.sponsorRecommendation && (
            <span className={clsx('text-xs px-2 py-0.5 rounded-full border font-semibold', sponsorColor)}>
              Sponsor: {conf.sponsorRecommendation}
            </span>
          )}
          <span className={clsx('text-xs px-1.5 py-0.5 rounded font-medium capitalize',
            conf.format === 'virtual' ? 'bg-blue-50 text-blue-500' :
            conf.format === 'hybrid' ? 'bg-violet-50 text-violet-600' :
            'bg-orange-50 text-orange-600'
          )}>
            {conf.format}
          </span>
        </div>
      </div>
    </div>
  );
}

export function CommunityIntel({ persona = 'all', initialTab }: { persona?: PersonaFilter; initialTab?: CommunityIntelTab }) {
  const [activeTab, setActiveTab] = useState<CommunityIntelTab>(initialTab ?? 'topics');
  const [search, setSearch] = useState('');
  const { settings, update } = useSettings();

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const papers = autoPapersData;
  const globalSources = autoGlobalSourcesData;
  const hotTopics = useMemo(() => mergeHotTopics(curatedHotTopics), []);
  const [nvidiaOnly, setNvidiaOnly] = useState(true);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  // Filters — persisted to localStorage so they survive tab navigation + page refresh
  const [activeDomain, setActiveDomain] = usePersistedState<PhysicalAIDomain | null>('domain', null);
  const [activeRegion, setActiveRegion] = usePersistedState<Region | null>('region', null);
  const [globalStatusScope, setGlobalStatusScope] = usePersistedState<GlobalStatusScope>('global-status-scope', 'trusted');
  const [globalSortMode, setGlobalSortMode] = usePersistedState<GlobalSortMode>('global-sort-mode', 'status');
  const [activeSourceType, setActiveSourceType] = usePersistedState<GlobalSourceType | null>('global-source-type', null);
  const [activeGlobalProduct, setActiveGlobalProduct] = usePersistedState<string | null>('global-product', null);
  // activeTags is stored as array in localStorage, exposed as Set in code
  const [tagsArr, setTagsArr] = usePersistedState<string[]>('tags', []);
  const activeTags = useMemo(() => new Set(tagsArr), [tagsArr]);
  const [minBuzz, setMinBuzz] = usePersistedState<BuzzLevel | null>('buzz', null);
  const [influencerTier, setInfluencerTier] = usePersistedState<'all' | 'micro' | 'macro' | 'top'>('tier', 'all');

  const toggleTag = (t: string) => setTagsArr(prev => {
    const next = new Set(prev);
    next.has(t) ? next.delete(t) : next.add(t);
    return [...next];
  });

  // Reset all filters back to defaults
  const clearAllFilters = () => {
    setActiveDomain(null);
    setActiveRegion(null);
    setMinBuzz(null);
    setTagsArr([]);
    setInfluencerTier('all');
    setGlobalStatusScope('trusted');
    setActiveSourceType(null);
    setActiveGlobalProduct(null);
    setSearch('');
  };

  const anyFilterActive = activeDomain !== null || activeRegion !== null || minBuzz !== null || activeTags.size > 0 || influencerTier !== 'all' || globalStatusScope !== 'trusted' || activeSourceType !== null || activeGlobalProduct !== null || search.trim().length > 0;

  const tabs: { id: CommunityIntelTab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'global',      label: 'Global View',          icon: <Globe size={14} />,       count: globalSources.length },
    { id: 'topics',      label: 'Hot Topics',            icon: <Flame size={14} />,       count: hotTopics.length },
    { id: 'conferences', label: 'Events',                icon: <Calendar size={14} />,    count: conferences.length },
    { id: 'meetups',     label: 'Meetups & Hackathons',  icon: <Zap size={14} />,         count: meetupsHackathons.length },
    { id: 'communities', label: 'Communities',           icon: <Users size={14} />,       count: communities.length },
    { id: 'discord',     label: 'Discord',               icon: <Hash size={14} />,        count: discordChannels.length },
    { id: 'papers',      label: 'Papers',                icon: <FileText size={14} />,    count: papers.length },
    { id: 'podcasts',    label: 'Podcasts',              icon: <Radio size={14} />,       count: shows.length },
    { id: 'videos',      label: 'Dev Videos',            icon: <PlayCircle size={14} />,  count: 50 },
    { id: 'github',      label: 'GitHub',                icon: <Github size={14} />,      count: 9 },
    { id: 'speakers',    label: 'Speakers',              icon: <Mic size={14} />,         count: speakers.length },
    { id: 'influencers', label: 'Influencers',           icon: <Star size={14} />,        count: influencers.length },
  ];

  const q = search.toLowerCase();

  // Domain filter — CAE uses keyword matching; others use domain tag
  const byDomain = <T extends { domains?: PhysicalAIDomain[]; topics?: string[]; description?: string; bio?: string; topic?: string; name?: string }>(arr: T[]) => {
    if (!activeDomain) return arr;
    if (activeDomain === 'cae') {
      return arr.filter(x => {
        if (x.domains?.includes('cae')) return true;
        const text = [...(x.topics ?? []), x.description ?? '', x.bio ?? '', x.topic ?? '', x.name ?? ''].join(' ').toLowerCase();
        return CAE_KEYWORDS.some(kw => text.includes(kw));
      });
    }
    return arr.filter(x => x.domains?.includes(activeDomain));
  };

  // OSS detection — used as a tag/badge across cards
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isOSSItem = (x: Record<string, any>): boolean => {
    if (x.platform === 'github') return true;
    const text = [
      ...(Array.isArray(x.topics) ? x.topics : []),
      x.name ?? '',
      x.description ?? '',
      x.topic ?? '',
      x.bio ?? '',
      x.server ?? '',
      x.channel ?? '',
    ].join(' ').toLowerCase();
    return OSS_KEYWORDS.some(kw => text.includes(kw));
  };

  // Score filter — buzz level minimum threshold
  const BUZZ_RANK: Record<BuzzLevel, number> = { low: 0, medium: 1, high: 2, trending: 3 };
  const byScore = <T extends { buzzLevel?: BuzzLevel }>(arr: T[]) => {
    if (!minBuzz) return arr;
    const min = BUZZ_RANK[minBuzz];
    return arr.filter(x => x.buzzLevel ? BUZZ_RANK[x.buzzLevel] >= min : false);
  };

  // Tag filter — checks tags array OR derived OSS / OpenUSD tag
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byTags = <T extends Record<string, any>>(arr: T[], deriveTags?: (x: T) => string[]) => {
    if (activeTags.size === 0) return arr;
    return arr.filter(x => {
      const tags = deriveTags ? deriveTags(x) : [];
      if (activeTags.has('OSS') && isOSSItem(x)) return true;
      if (activeTags.has('OpenUSD') && detectOpenUSD(x)) return true;
      return tags.some(t => activeTags.has(t));
    });
  };

  const byRegion = <T extends { region?: Region }>(arr: T[]) =>
    activeRegion ? arr.filter(x => x.region === activeRegion) : arr;

  const searchedGlobalSources = search
    ? globalSources.filter(source =>
      source.name.toLowerCase().includes(q) ||
      source.description.toLowerCase().includes(q) ||
      source.location?.toLowerCase().includes(q) ||
      source.focusArea?.toLowerCase().includes(q) ||
      source.eventTier?.toLowerCase().includes(q) ||
      source.activationTier?.toLowerCase().includes(q) ||
      source.products.some(product => product.toLowerCase().includes(q)) ||
      source.topics.some(topic => topic.toLowerCase().includes(q)))
    : globalSources;
  const globalSourcesForStatusScope = useMemo(() => {
    if (globalStatusScope === 'all') return searchedGlobalSources;
    if (globalStatusScope === 'new') return searchedGlobalSources.filter(needsGlobalSourceValidation);
    return searchedGlobalSources.filter(isTrustedGlobalSource);
  }, [globalStatusScope, searchedGlobalSources]);
  const globalProductOptions = useMemo(() => {
    const products = new Set<string>();
    globalSources.forEach(source => source.products.forEach(product => products.add(product)));
    return [...products].sort((a, b) => a.localeCompare(b));
  }, [globalSources]);
  const filteredGlobalSources = byRegion(globalSourcesForStatusScope)
    .filter(source => !activeSourceType || source.type === activeSourceType)
    .filter(source => !activeGlobalProduct || source.products.includes(activeGlobalProduct));

  // Persona filter — domain + keyword matching so it actually works
  const PERSONA_KEYWORDS: Record<string, string[]> = {
    robotics:               ['robot', 'manipulation', 'locomotion', 'humanoid', 'lerobot', 'actuator', 'gripper', 'embodied', 'bipedal', 'arm control', 'pick-and-place', 'ros', 'unitree', 'boston dynamics', 'figure ai', 'covariant'],
    automotive:             ['automotive', 'autonomous vehicle', 'self-driving', 'carla', 'lidar', 'adas', 'waymo', 'cruise', 'vehicle', 'driving simulation', 'av ', 'driveos', 'drive os', 'alpamayo', 'halos', 'nvidia drive'],
    vss:                    ['vss', 'vehicle security', 'autosar', 'embedded', 'safety-critical', 'functional safety', 'iso 26262'],
    'world-foundation-models': ['foundation model', 'world model', 'generalist', 'vla', 'gr00t', 'groot', 'cosmos', 'genie', 'generative world', 'newton', 'physical ai', 'cosmos predict', 'cosmos transfer'],
    openusd:                ['openusd', 'open usd', 'universal scene description', 'omniverse', 'usd composer', 'scene graph', 'hydra', 'pixar usd', 'usdskel', 'usd schema'],
    'industrial-dt':        ['digital twin', 'industrial', 'manufacturing', 'factory', 'plm', 'iiot', 'scada', 'siemens', 'fanuc', 'abb', 'rockwell', 'predictive maintenance', 'metropolis', 'vision ai', 'video analytics', 'cae', 'cfd', 'fea', 'computer-aided engineering', 'computer aided engineering'],
  };

  const byPersona = <T extends { domains?: PhysicalAIDomain[]; topics?: string[]; name?: string; description?: string; bio?: string; topic?: string }>(arr: T[]) => {
    if (persona === 'all') return arr;
    const allowedDomains = PERSONA_DOMAINS[persona] ?? [];
    const keywords = PERSONA_KEYWORDS[persona] ?? [];
    return arr.filter(x => {
      // Domain match (strict)
      if (x.domains && x.domains.length > 0 && x.domains.some(d => allowedDomains.includes(d))) return true;
      // Keyword match across all text fields
      const text = [
        ...(x.topics ?? []),
        x.name ?? '',
        x.description ?? '',
        x.bio ?? '',
        x.topic ?? '',
      ].join(' ').toLowerCase();
      return keywords.some(kw => text.includes(kw.toLowerCase()));
    });
  };

  const searchedCommunities = search ? communities.filter(c => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)) : communities;
  const filteredCommunities = byTags(byScore(byRegion(byDomain(byPersona(searchedCommunities)))), c => c.topics);

  const searchedConferences = search ? conferences.filter(c => c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q)) : conferences;
  const filteredConferences = byTags(byScore(byRegion(byDomain(byPersona(searchedConferences)))), c => c.topics);

  const searchedSpeakers = search ? speakers.filter(s => s.name.toLowerCase().includes(q) || s.company.toLowerCase().includes(q)) : speakers;
  const filteredSpeakers = byTags(byDomain(byPersona(searchedSpeakers)), s => s.topics);

  const searchedShows = search ? shows.filter(s => s.name.toLowerCase().includes(q)) : shows;
  const filteredPodcasts = byTags(byDomain(byPersona(searchedShows)), s => s.topics);

  // Hot Topics — derive cluster tags via keyword matching
  const deriveTopicTags = (t: HotTopic): string[] => {
    const generatedTags = [...(t.sectorTags ?? []), ...(t.productTags ?? [])];
    const text = `${t.topic} ${t.description}`.toLowerCase();
    const tags: string[] = [...generatedTags];
    if (/world model|foundation model|generalist|vla |gr00t|groot|cosmos|rt-2|octo|openvla|π0/.test(text)) tags.push('World Foundation Models');
    if (/robot|manipulation|locomotion|humanoid|lerobot|gripper|embodied|bipedal|so-arm|isaac sim|isaac lab|isaac ros|newton/.test(text)) tags.push('Robotics');
    if (/openusd|open usd|usd composer|omniverse|scene description|hydra|pixar usd|usdskel/.test(text)) tags.push('OpenUSD');
    if (/edge ai|jetson|jetpack|onnx|tflite|executorch|inference|on-device|llama\.cpp|dgx spark/.test(text)) tags.push('Edge AI');
    if (/digital twin|industrial|manufacturing|siemens|abb|rockwell|factory|iiot|scada|metropolis|warehouse automation/.test(text)) tags.push('Industrial DT');
    if (/vision ai|metropolis|vision|video analytics|object detection|depth|segmentation|gaussian splat|grounding dino|sam /.test(text)) tags.push('Vision AI');
    if (/cae|fea|cfd|simulation|fem|ansys|simulia|openfoam|physics-accurate|computer-aided engineering|computer aided engineering/.test(text)) tags.push('CAE / Simulation');
    if (/automotive|autonomous driving|autonomous vehicle|av |carla|self-driving|openpilot|driveos|drive os|alpamayo|halos/.test(text)) tags.push('Automotive');
    return [...new Set(tags)];
  };
  const searchedTopics = search ? hotTopics.filter(t => t.topic.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) : hotTopics;
  const filteredTopics = byTags(searchedTopics, deriveTopicTags);

  const searchedInfluencers = search ? influencers.filter(i => i.name.toLowerCase().includes(q) || i.company.toLowerCase().includes(q) || i.topics.some(t => t.toLowerCase().includes(q))) : influencers;
  const filteredInfluencers = byTags(byPersona(searchedInfluencers), i => i.topics);

  const searchedMeetups = search ? meetupsHackathons.filter(m => m.name.toLowerCase().includes(q) || m.location.toLowerCase().includes(q)) : meetupsHackathons;
  const filteredMeetups = byTags(byScore(byRegion(byPersona(searchedMeetups))), m => m.topics);

  const searchedDiscord = search ? discordChannels.filter(d => d.channel.toLowerCase().includes(q) || d.server.toLowerCase().includes(q) || d.topic.toLowerCase().includes(q)) : discordChannels;
  const filteredDiscord = byTags(byScore(byDomain(byPersona(searchedDiscord))), d => d.recentTopics ?? []);

  // Domain counts per tab (pre-filter so chips always reflect full dataset)
  // CAE is keyword-detected so we add a synthetic count
  const domainCounts = (arr: { domains?: PhysicalAIDomain[]; topics?: string[]; description?: string; bio?: string; topic?: string; name?: string }[]) => {
    const c: Partial<Record<PhysicalAIDomain, number>> = {};
    arr.forEach(x => x.domains?.forEach(d => { c[d] = (c[d] ?? 0) + 1; }));
    // Add CAE keyword count
    const caeCount = arr.filter(x => {
      if (x.domains?.includes('cae')) return false; // already counted
      const text = [...(x.topics ?? []), x.description ?? '', x.bio ?? '', x.topic ?? '', x.name ?? ''].join(' ').toLowerCase();
      return CAE_KEYWORDS.some(kw => text.includes(kw));
    }).length;
    if (caeCount > 0) c['cae'] = (c['cae'] ?? 0) + caeCount;
    return c;
  };

  // Buzz level counts per tab
  const buzzCounts = (arr: { buzzLevel?: BuzzLevel }[]) => {
    const c: Partial<Record<BuzzLevel, number>> = {};
    arr.forEach(x => { if (x.buzzLevel) c[x.buzzLevel] = (c[x.buzzLevel] ?? 0) + 1; });
    return c;
  };

  // Region counts
  const regionCounts = (arr: { region?: Region }[]) => {
    const c: Partial<Record<Region, number>> = {};
    arr.forEach(x => { if (x.region) c[x.region] = (c[x.region] ?? 0) + 1; });
    return c;
  };
  const filteredPapers = papers
    .filter(p => !search || p.title.toLowerCase().includes(q) || p.authors.some(a => a.toLowerCase().includes(q)) || p.tags.some(t => t.includes(q)) || p.paperTopics?.some(t => t.includes(q)))
    .filter(p => !nvidiaOnly || (p.nvidiaTerms && p.nvidiaTerms.length > 0))
    .filter(p => !activeTopic || (p.paperTopics && p.paperTopics.includes(activeTopic)));

  const sortedTopics = useMemo(() => [...filteredTopics].sort((a, b) => b.buzzScore - a.buzzScore), [filteredTopics]);
  const sortedCommunities = useMemo(() => [...filteredCommunities].sort((a, b) => BUZZ_RANK[b.buzzLevel] - BUZZ_RANK[a.buzzLevel] || (b.weeklyActivity - a.weeklyActivity)), [filteredCommunities]);
  const sortedConferences = useMemo(() => [...filteredConferences].sort((a, b) => BUZZ_RANK[b.buzzLevel] - BUZZ_RANK[a.buzzLevel] || new Date(a.startDate).getTime() - new Date(b.startDate).getTime()), [filteredConferences]);
  const sortedSpeakers = useMemo(() => [...filteredSpeakers].sort((a, b) => b.kloutScore - a.kloutScore), [filteredSpeakers]);
  const sortedPodcasts = useMemo(() => [...filteredPodcasts].sort((a, b) => BUZZ_RANK[b.buzzLevel] - BUZZ_RANK[a.buzzLevel] || ((b.subscribers ?? 0) - (a.subscribers ?? 0))), [filteredPodcasts]);
  const visibleInfluencers = useMemo(() => filteredInfluencers
    .filter(i => !activeDomain || i.domains?.includes(activeDomain))
    .filter(i =>
      influencerTier === 'all'   ? true
      : influencerTier === 'micro' ? i.followers < 25000
      : influencerTier === 'macro' ? i.followers >= 25000 && i.followers < 100000
      : i.followers >= 100000),
    [activeDomain, filteredInfluencers, influencerTier],
  );
  const sortedInfluencers = useMemo(() => [...visibleInfluencers].sort((a, b) => b.kloutScore - a.kloutScore), [visibleInfluencers]);
  const visibleMeetups = useMemo(() => filteredMeetups.filter(m => activeTags.size === 0 || activeTags.has(m.type) || activeTags.has('OSS')), [activeTags, filteredMeetups]);
  const sortedMeetups = useMemo(() => [...visibleMeetups].sort((a, b) => BUZZ_RANK[b.buzzLevel] - BUZZ_RANK[a.buzzLevel] || new Date(a.startDate).getTime() - new Date(b.startDate).getTime()), [visibleMeetups]);
  const sortedDiscord = useMemo(() => [...filteredDiscord].sort((a, b) => BUZZ_RANK[b.buzzLevel] - BUZZ_RANK[a.buzzLevel] || (b.weeklyMessages - a.weeklyMessages)), [filteredDiscord]);
  const sortedPapers = useMemo(() => [...filteredPapers].sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime()), [filteredPapers]);
  const sortedGlobalSources = useMemo(() => {
    const statusRank: Record<GlobalSourceRecord['status'], number> = { verified: 5, candidate: 4, unchecked: 3, stale: 2, dead: 1, unavailable: 1 };
    const regionRank = new Map(ALL_REGIONS.map((region, index) => [region, index]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const baseSort = (a: GlobalSourceRecord, b: GlobalSourceRecord) =>
      statusRank[b.status] - statusRank[a.status] ||
      (b.relevanceScore ?? b.confidence) - (a.relevanceScore ?? a.confidence) ||
      a.name.localeCompare(b.name);
    const upcomingSortTime = (source: GlobalSourceRecord) => {
      const parsed = parseGlobalEventDateRange(source.eventDate);
      if (!parsed) return Number.POSITIVE_INFINITY;
      if (parsed.end < today) return 9_000_000_000_000 + parsed.start.getTime();
      return parsed.start.getTime();
    };
    return [...filteredGlobalSources].sort((a, b) => {
      if (globalSortMode === 'relevance') {
        return (b.relevanceScore ?? b.confidence) - (a.relevanceScore ?? a.confidence) || baseSort(a, b);
      }
      if (globalSortMode === 'upcoming') {
        return upcomingSortTime(a) - upcomingSortTime(b) || baseSort(a, b);
      }
      if (globalSortMode === 'verified') {
        return new Date(b.lastVerified || 0).getTime() - new Date(a.lastVerified || 0).getTime() || baseSort(a, b);
      }
      if (globalSortMode === 'region') {
        return (regionRank.get(a.region) ?? 99) - (regionRank.get(b.region) ?? 99) || baseSort(a, b);
      }
      if (globalSortMode === 'name') {
        return a.name.localeCompare(b.name);
      }
      return baseSort(a, b);
    });
  }, [filteredGlobalSources, globalSortMode]);
  const globalRegionGroups = useMemo(() => globalSourcesByRegion(sortedGlobalSources), [sortedGlobalSources]);
  const globalStatusCounts = useMemo(() => globalSources.reduce((acc, source) => {
    const status = source.status === 'unavailable' ? 'dead' : source.status;
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {} as Partial<Record<GlobalSourceRecord['status'], number>>), [globalSources]);
  const sourceTypeCounts = useMemo(() => globalSourcesForStatusScope.reduce((acc, source) => {
    acc[source.type] = (acc[source.type] ?? 0) + 1;
    return acc;
  }, {} as Partial<Record<GlobalSourceType, number>>), [globalSourcesForStatusScope]);
  const trustedGlobalCount = useMemo(() => globalSources.filter(isTrustedGlobalSource).length, [globalSources]);
  const newGlobalCount = globalStatusCounts.unchecked ?? 0;
  const staleDeadGlobalCount = (globalStatusCounts.stale ?? 0) + (globalStatusCounts.dead ?? 0) + (globalStatusCounts.unavailable ?? 0);
  const globalEventSources = useMemo(() => filteredGlobalSources.filter(source => source.type === 'event' || source.type === 'meetup'), [filteredGlobalSources]);
  const globalDatedEventSources = useMemo(() => globalEventSources.filter(source => Boolean(parseGlobalEventDateRange(source.eventDate))), [globalEventSources]);
  const globalCalendarEventCount = globalDatedEventSources.length;
  const globalUndatedEventCount = globalEventSources.length - globalDatedEventSources.length;
  const globalUpcomingEventCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return globalDatedEventSources.filter(source => {
      const parsed = parseGlobalEventDateRange(source.eventDate);
      return parsed ? parsed.end >= today : false;
    }).length;
  }, [globalDatedEventSources]);
  const globalVisibleStatusCounts = useMemo(() => filteredGlobalSources.reduce((acc, source) => {
    const status = source.status === 'unavailable' ? 'dead' : source.status;
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {} as Partial<Record<GlobalSourceRecord['status'], number>>), [filteredGlobalSources]);
  const globalVisibleRegionCounts = useMemo(() => regionCounts(filteredGlobalSources), [filteredGlobalSources]);
  const globalVisibleRegionCoverage = ALL_REGIONS.filter(region => (globalVisibleRegionCounts[region] ?? 0) > 0).length;
  const globalKpis = [
    {
      label: 'Verified',
      value: globalVisibleStatusCounts.verified ?? 0,
      detail: `${globalVisibleStatusCounts.candidate ?? 0} candidates in view`,
    },
    {
      label: 'Upcoming Events',
      value: globalUpcomingEventCount,
      detail: `${globalCalendarEventCount} calendar-ready`,
    },
    {
      label: 'Undated Events',
      value: globalUndatedEventCount,
      detail: `${globalEventSources.length} event sources in view`,
    },
    {
      label: 'Stale / Dead',
      value: (globalVisibleStatusCounts.stale ?? 0) + (globalVisibleStatusCounts.dead ?? 0) + (globalVisibleStatusCounts.unavailable ?? 0),
      detail: 'Needs source review',
    },
    {
      label: 'Regions',
      value: `${globalVisibleRegionCoverage}/${ALL_REGIONS.length}`,
      detail: `${globalVisibleRegionCounts.americas ?? 0} AMER · ${globalVisibleRegionCounts.emea ?? 0} EMEA · ${globalVisibleRegionCounts.apac ?? 0} APAC`,
    },
    {
      label: 'Visible Sources',
      value: filteredGlobalSources.length,
      detail: `${globalEventSources.length} events · ${filteredGlobalSources.length - globalEventSources.length} other sources`,
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search communities, speakers, events…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-2 text-xs border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Daily auto-refresh
        </div>
      </div>

      {/* Sub-tabs — sticky for long pages, horizontal scroll on narrow screens */}
      <div className="tab-bar scroll-snap-x flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl flex-wrap sticky top-14 z-10 backdrop-blur-sm bg-gray-100/95">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all justify-center',
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.icon}
            {tab.label}
            <span className={clsx('text-xs rounded-full px-1.5', activeTab === tab.id ? 'bg-gray-100 text-gray-600' : 'bg-transparent text-gray-400')}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div key={activeTab} className="tab-fade overflow-y-auto flex-1 pb-4">
        {activeTab === 'topics' && (
          <div>
            <AnalysisPanel tabId="topics" signalCount={autoHotTopicSignalsData.length || hotTopics.length} />
            <HotTopicsListeningPanel topics={hotTopics} />
            {/* Tag filter for Hot Topics */}
            <FiltersGroup
              activeCount={activeTags.size}
              onClearAll={clearAllFilters}
            >
              {(() => {
                const counts = new Map<string, number>();
                hotTopics.forEach(t => deriveTopicTags(t).forEach(tag => counts.set(tag, (counts.get(tag) ?? 0) + 1)));
                const tagList = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([tag, count]) => ({ tag, count }));
                return <TagFilterRow tags={tagList} active={activeTags} onToggle={toggleTag} />;
              })()}
            </FiltersGroup>
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <p className="text-xs text-gray-400">
                <Flame size={11} className="inline mr-1" />
                <span className="font-semibold text-gray-600">{filteredTopics.length}</span> topics — sorted by buzz score
                {' · '}<LastUpdated tabId="topics" />
              </p>
              <SummarizeButton
                tabName="Hot Topics"
                items={filteredTopics}
                totalAvailable={hotTopics.length}
                describeItem={t => ({ name: t.topic, metric: `🔥 ${t.buzzScore} · ${t.trend}` })}
              />
              <ExportButton
                data={sortedTopics}
                filename="hot_topics"
                title="Physical AI Hot Topics"
                columns={[
                  { header: 'Topic',                accessor: t => t.topic, width: 60 },
                  { header: 'Buzz Score',           accessor: t => t.buzzScore, width: 18 },
                  { header: 'Trend',                accessor: t => t.trend, width: 18 },
                  { header: 'Listening Status',     accessor: t => t.listeningStatus ?? 'curated', width: 22 },
                  { header: 'Signal Count',         accessor: t => t.signalCount ?? '', width: 18 },
                  { header: 'Confidence',           accessor: t => t.confidence ?? '', width: 18 },
                  { header: 'Tags',                 accessor: t => deriveTopicTags(t).join(', '), width: 50 },
                  { header: 'Products',             accessor: t => t.productTags?.join(', ') ?? '', width: 50 },
                  { header: 'What People Are Saying', accessor: t => t.whatPeopleAreSaying ?? '', width: 100 },
                  { header: 'NVIDIA Relevance',     accessor: t => t.nvidiaRelevance ?? '', width: 100 },
                  { header: 'Sources',              accessor: t => t.sources.join(', '), width: 60 },
                  { header: 'Description',          accessor: t => t.description, width: 100 },
                  { header: 'Recommended Action',   accessor: t => deriveTopicAction(t), width: 100 },
                  { header: 'Next 7 Days',           accessor: t => t.next7Days ?? '', width: 80 },
                  { header: 'Next 30 Days',          accessor: t => t.next30Days ?? '', width: 80 },
                ]}
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {sortedTopics.map(t => <TopicCard key={t.id} topic={t} />)}
            </div>
          </div>
        )}
        {activeTab === 'communities' && (
          <div>
            <AnalysisPanel tabId="communities" />
            <FiltersGroup
              activeCount={(activeDomain ? 1 : 0) + (activeRegion ? 1 : 0) + (minBuzz ? 1 : 0) + activeTags.size}
              onClearAll={clearAllFilters}
            >
              <RegionFilter active={activeRegion} onChange={setActiveRegion} counts={regionCounts(communities)} />
              <DomainFilter active={activeDomain} onChange={setActiveDomain} counts={domainCounts(communities)} exclude={['aerospace']} />
              <ScoreFilter active={minBuzz} onChange={setMinBuzz} counts={buzzCounts(communities)} />
              <TagFilterRow
                tags={[
                  { tag: 'OSS',     count: communities.filter(c => detectOSS(c)).length },
                  { tag: 'OpenUSD', count: communities.filter(c => detectOpenUSD(c)).length },
                ]}
                active={activeTags}
                onToggle={toggleTag}
              />
            </FiltersGroup>
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <p className="text-xs text-gray-400">
                <Users size={11} className="inline mr-1" />
                <span className="font-semibold text-gray-600">{filteredCommunities.length}</span> communities — sorted by buzz
                {' · '}<LastUpdated tabId="communities" />
              </p>
              <SummarizeButton
                tabName="Communities"
                items={filteredCommunities}
                totalAvailable={communities.length}
                describeItem={c => ({ name: c.name, metric: `${c.members.toLocaleString()} members · ${c.buzzLevel}` })}
              />
              <ExportButton
                data={sortedCommunities}
                filename="communities"
                title="Physical AI Communities"
                columns={[
                  { header: 'Name',            accessor: c => c.name, width: 50 },
                  { header: 'Platform',        accessor: c => c.platform, width: 20 },
                  { header: 'Members',         accessor: c => c.members, width: 20 },
                  { header: 'Weekly Activity', accessor: c => c.weeklyActivity, width: 20 },
                  { header: 'Buzz',            accessor: c => c.buzzLevel, width: 18 },
                  { header: 'Region',          accessor: c => c.region ?? '', width: 18 },
                  { header: 'Domains',         accessor: c => (c.domains ?? []).join(', '), width: 30 },
                  { header: 'Topics',          accessor: c => c.topics.join(', '), width: 50 },
                  { header: 'OSS',             accessor: c => detectOSS(c) ? 'Yes' : '', width: 12 },
                  { header: 'OpenUSD',         accessor: c => detectOpenUSD(c) ? 'Yes' : '', width: 12 },
                  { header: 'URL',             accessor: c => c.url, width: 50 },
                ]}
              />
            </div>
            {filteredCommunities.length === 0 ? (
              <EmptyFilteredState onClear={clearAllFilters} />
            ) : (
              <div className="flex flex-col gap-3">
                {sortedCommunities.map(c => <CommunityRow key={c.id} c={c} />)}
              </div>
            )}
          </div>
        )}
        {activeTab === 'conferences' && (
          <div>
            <AnalysisPanel tabId="conferences" />
            <FiltersGroup
              activeCount={(activeDomain ? 1 : 0) + (activeRegion ? 1 : 0) + (minBuzz ? 1 : 0)}
              onClearAll={clearAllFilters}
            >
              <RegionFilter active={activeRegion} onChange={setActiveRegion} counts={regionCounts(conferences)} />
              <DomainFilter active={activeDomain} onChange={setActiveDomain} counts={domainCounts(conferences)} />
              <ScoreFilter active={minBuzz} onChange={setMinBuzz} counts={buzzCounts(conferences)} />
            </FiltersGroup>
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <p className="text-xs text-gray-400">
                <Calendar size={11} className="inline mr-1" />
                <span className="font-semibold text-gray-600">{filteredConferences.length}</span> events — sorted by buzz score
                {' · '}<LastUpdated tabId="conferences" />
              </p>
              <SummarizeButton
                tabName="Events"
                items={filteredConferences}
                totalAvailable={conferences.length}
                describeItem={c => ({ name: c.name, metric: `${c.location} · ${c.type}` })}
              />
              <ExportButton
                data={sortedConferences}
                filename="events"
                title="Physical AI Events"
                columns={[
                  { header: 'Name',         accessor: c => c.name, width: 50 },
                  { header: 'Type',         accessor: c => c.type, width: 18 },
                  { header: 'Format',       accessor: c => c.format, width: 18 },
                  { header: 'Start Date',   accessor: c => c.startDate, width: 22 },
                  { header: 'End Date',     accessor: c => c.endDate ?? '', width: 22 },
                  { header: 'Location',     accessor: c => c.location, width: 30 },
                  { header: 'Region',       accessor: c => c.region ?? '', width: 16 },
                  { header: 'Buzz',         accessor: c => c.buzzLevel, width: 16 },
                  { header: 'Attendance',   accessor: c => c.expectedAttendance ?? '', width: 18 },
                  { header: 'Topics',       accessor: c => c.topics.join(', '), width: 50 },
                  { header: 'CFP Deadline', accessor: c => c.cfpDeadline ?? '', width: 22 },
                  { header: 'URL',          accessor: c => c.url, width: 50 },
                ]}
              />
            </div>
            {/* List/Calendar toggle */}
            <div className="flex items-center gap-1 mb-3">
              <span className="text-xs text-gray-400 font-medium mr-1">View:</span>
              <button
                onClick={() => update({ eventsView: 'list' })}
                className={clsx(
                  'text-xs px-2.5 py-1 rounded-full font-medium border transition-all',
                  settings.eventsView === 'list' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                )}
              >
                📋 List
              </button>
              <button
                onClick={() => update({ eventsView: 'calendar' })}
                className={clsx(
                  'text-xs px-2.5 py-1 rounded-full font-medium border transition-all',
                  settings.eventsView === 'calendar' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                )}
              >
                📅 Calendar
              </button>
            </div>
            {filteredConferences.length === 0 ? (
              <EmptyFilteredState onClear={clearAllFilters} />
            ) : settings.eventsView === 'calendar' ? (
              <EventsCalendar events={filteredConferences} />
            ) : (
              <div className="flex flex-col gap-3">
                {sortedConferences.map(c => <ConferenceCard key={c.id} conf={c} />)}
              </div>
            )}
          </div>
        )}
        {activeTab === 'speakers' && (
          <div>
            <AnalysisPanel tabId="speakers" />
            <FiltersGroup
              activeCount={(activeDomain ? 1 : 0) + activeTags.size}
              onClearAll={clearAllFilters}
            >
              <DomainFilter active={activeDomain} onChange={setActiveDomain} counts={domainCounts(speakers)} />
              <TagFilterRow
                tags={[
                  { tag: 'OSS',     count: speakers.filter(s => detectOSS(s)).length },
                  { tag: 'OpenUSD', count: speakers.filter(s => detectOpenUSD(s)).length },
                ]}
                active={activeTags}
                onToggle={toggleTag}
              />
            </FiltersGroup>
            <div className="flex items-center justify-end mb-3">
              <SummarizeButton
                tabName="Speakers"
                items={filteredSpeakers}
                totalAvailable={speakers.length}
                describeItem={s => ({ name: s.name, metric: `${s.title} · Klout ${s.kloutScore}` })}
              />
              <ExportButton
                data={sortedSpeakers}
                filename="speakers"
                title="Physical AI Speakers"
                columns={[
                  { header: 'Name',         accessor: s => s.name, width: 30 },
                  { header: 'Title',        accessor: s => s.title, width: 40 },
                  { header: 'Company',      accessor: s => s.company, width: 35 },
                  { header: 'Klout Score',  accessor: s => s.kloutScore, width: 16 },
                  { header: 'LI Followers', accessor: s => s.linkedinFollowers ?? '', width: 18 },
                  { header: 'X Followers',  accessor: s => s.twitterFollowers ?? '', width: 18 },
                  { header: 'Topics',       accessor: s => s.topics.join(', '), width: 50 },
                  { header: 'Domains',      accessor: s => (s.domains ?? []).join(', '), width: 30 },
                  { header: 'LinkedIn',     accessor: s => s.linkedinUrl ?? '', width: 50 },
                  { header: 'X / Twitter',  accessor: s => s.twitterHandle ?? '', width: 22 },
                  { header: 'Bio',          accessor: s => s.bio, width: 100 },
                ]}
              />
            </div>
            {filteredSpeakers.length === 0 ? (
              <EmptyFilteredState onClear={clearAllFilters} />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {sortedSpeakers.map(s => <SpeakerCard key={s.id} speaker={s} />)}
              </div>
            )}
          </div>
        )}
        {activeTab === 'podcasts' && (
          <div>
            <AnalysisPanel tabId="podcasts" />
            <FiltersGroup
              activeCount={(activeDomain ? 1 : 0) + (minBuzz ? 1 : 0) + activeTags.size}
              onClearAll={clearAllFilters}
            >
              <DomainFilter active={activeDomain} onChange={setActiveDomain} counts={domainCounts(shows)} />
              <ScoreFilter active={minBuzz} onChange={setMinBuzz} counts={buzzCounts(shows)} />
              <TagFilterRow
                tags={[
                  { tag: 'OSS',     count: shows.filter(s => detectOSS(s)).length },
                  { tag: 'OpenUSD', count: shows.filter(s => detectOpenUSD(s)).length },
                ]}
                active={activeTags}
                onToggle={toggleTag}
              />
            </FiltersGroup>
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <p className="text-xs text-gray-400">
                <Radio size={11} className="inline mr-1" />
                <span className="font-semibold text-gray-600">{filteredPodcasts.length}</span> podcasts — sorted by buzz
                {' · '}<LastUpdated tabId="podcasts" />
              </p>
              <SummarizeButton
                tabName="Podcasts"
                items={filteredPodcasts}
                totalAvailable={shows.length}
                describeItem={s => ({ name: s.name, metric: s.host })}
              />
              <ExportButton
                data={sortedPodcasts}
                filename="podcasts"
                title="Physical AI Podcasts"
                columns={[
                  { header: 'Name',          accessor: s => s.name, width: 40 },
                  { header: 'Host',          accessor: s => s.host, width: 30 },
                  { header: 'Platform',      accessor: s => s.platform, width: 18 },
                  { header: 'Subscribers',   accessor: s => s.subscribers ?? '', width: 18 },
                  { header: 'Episodes / Mo', accessor: s => s.episodesPerMonth ?? '', width: 18 },
                  { header: 'Buzz',          accessor: s => s.buzzLevel, width: 16 },
                  { header: 'Topics',        accessor: s => s.topics.join(', '), width: 50 },
                  { header: 'OSS',           accessor: s => detectOSS(s) ? 'Yes' : '', width: 12 },
                  { header: 'OpenUSD',       accessor: s => detectOpenUSD(s) ? 'Yes' : '', width: 12 },
                  { header: 'URL',           accessor: s => s.url, width: 50 },
                  { header: 'Description',   accessor: s => s.description, width: 80 },
                ]}
              />
            </div>
            {filteredPodcasts.length === 0 ? (
              <EmptyFilteredState onClear={clearAllFilters} />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {sortedPodcasts.map(s => <ShowCard key={s.id} show={s} />)}
              </div>
            )}
          </div>
        )}
        {activeTab === 'influencers' && (
          <div>
            <AnalysisPanel tabId="influencers" />
            {/* Engage toggle + tier */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <p className="text-xs text-gray-500">
                <span className="font-semibold text-gray-700">{filteredInfluencers.length}</span> influencers
                {' · '}
                <span className="font-semibold text-emerald-600">{filteredInfluencers.filter(i => i.shouldEngage).length}</span> flagged to engage
              </p>
            </div>
            {/* Tier filter — micro / macro / top */}
            <div className="flex gap-1 flex-wrap mb-3 items-center">
              <span className="text-xs text-gray-400 font-medium mr-1">Tier:</span>
              {([
                { id: 'all',   label: 'All',                 count: influencers.length },
                { id: 'micro', label: 'Micro · < 25K',       count: influencers.filter(i => i.followers < 25000).length },
                { id: 'macro', label: 'Macro · 25K – 100K',  count: influencers.filter(i => i.followers >= 25000 && i.followers < 100000).length },
                { id: 'top',   label: 'Top · 100K+',         count: influencers.filter(i => i.followers >= 100000).length },
              ] as const).map(t => (
                <button
                  key={t.id}
                  onClick={() => setInfluencerTier(t.id)}
                  className={clsx(
                    'text-xs px-2.5 py-1 rounded-full font-medium border transition-all',
                    influencerTier === t.id
                      ? t.id === 'top'   ? 'bg-violet-600 text-white border-violet-600'
                      : t.id === 'macro' ? 'bg-blue-600 text-white border-blue-600'
                      : t.id === 'micro' ? 'bg-pink-600 text-white border-pink-600'
                      : 'bg-gray-800 text-white border-gray-800'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                  )}
                >
                  {t.label} <span className="opacity-60">{t.count}</span>
                </button>
              ))}
            </div>
            <FiltersGroup
              activeCount={(activeDomain ? 1 : 0) + activeTags.size + (influencerTier !== 'all' ? 1 : 0)}
              onClearAll={clearAllFilters}
            >
              <DomainFilter active={activeDomain} onChange={setActiveDomain} counts={domainCounts(influencers)} />
              <TagFilterRow
                tags={[
                  { tag: 'OSS',     count: influencers.filter(i => detectOSS(i)).length },
                  { tag: 'OpenUSD', count: influencers.filter(i => detectOpenUSD(i)).length },
                ]}
                active={activeTags}
                onToggle={toggleTag}
              />
            </FiltersGroup>
            <div className="flex items-center justify-end mb-3">
              <SummarizeButton
                tabName="Influencers"
                items={visibleInfluencers}
                totalAvailable={influencers.length}
                describeItem={i => ({ name: i.name, metric: `Klout ${i.kloutScore} · ${(i.followers / 1000).toFixed(0)}k followers` })}
              />
              <ExportButton
                data={sortedInfluencers}
                filename="influencers"
                title="Physical AI Influencers"
                columns={[
                  { header: 'Name',          accessor: i => i.name, width: 30 },
                  { header: 'Handle',        accessor: i => i.handle, width: 22 },
                  { header: 'Title',         accessor: i => i.title, width: 35 },
                  { header: 'Company',       accessor: i => i.company, width: 35 },
                  { header: 'Followers',     accessor: i => i.followers, width: 18 },
                  { header: 'X Followers',   accessor: i => i.twitterFollowers ?? '', width: 18 },
                  { header: 'LI Followers',  accessor: i => i.linkedinFollowers ?? '', width: 18 },
                  { header: 'Klout',         accessor: i => i.kloutScore, width: 14 },
                  { header: 'Should Engage', accessor: i => i.shouldEngage ? 'Yes' : 'No', width: 16 },
                  { header: 'Engage Reason', accessor: i => i.engageReason, width: 80 },
                  { header: 'Topics',        accessor: i => i.topics.join(', '), width: 45 },
                  { header: 'LinkedIn',      accessor: i => i.linkedinUrl ?? '', width: 50 },
                ]}
              />
            </div>
            {sortedInfluencers.length === 0 ? (
              <EmptyFilteredState onClear={clearAllFilters} />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {sortedInfluencers.map(i => <InfluencerCard key={i.id} inf={i} />)}
              </div>
            )}
          </div>
        )}
        {activeTab === 'meetups' && (
          <div>
            <AnalysisPanel tabId="meetups" />
            {/* Summary bar */}
            <div className="flex items-center gap-3 mb-3 flex-wrap text-xs text-gray-500">
              <span><span className="font-semibold text-gray-700">{filteredMeetups.length}</span> events</span>
              <span>·</span>
              <span className="text-emerald-600 font-semibold">{filteredMeetups.filter(m => m.sponsorRecommendation === 'yes').length} sponsor ✓</span>
              <span className="text-amber-600 font-semibold">{filteredMeetups.filter(m => m.sponsorRecommendation === 'maybe').length} sponsor maybe</span>
              <span className="text-[#76B900] font-semibold">{filteredMeetups.filter(m => m.nvidiaTech).length} NVIDIA tech</span>
            </div>
            <FiltersGroup
              activeCount={(activeRegion ? 1 : 0) + (minBuzz ? 1 : 0) + activeTags.size}
              onClearAll={clearAllFilters}
            >
              <RegionFilter active={activeRegion} onChange={setActiveRegion} counts={regionCounts(meetupsHackathons)} />
              <ScoreFilter active={minBuzz} onChange={setMinBuzz} counts={buzzCounts(meetupsHackathons)} />
              {/* Type filter */}
              <div className="flex gap-1 flex-wrap mb-2 items-center">
                <span className="text-xs text-gray-400 font-medium mr-1">Type:</span>
                {(['meetup', 'hackathon', 'workshop'] as const).map(type => {
                  const count = filteredMeetups.filter(m => m.type === type).length;
                  const isActive = activeTags.has(type);
                  return (
                    <button
                      key={type}
                      onClick={() => toggleTag(type)}
                      className={clsx(
                        'text-xs px-2.5 py-1 rounded-full font-medium border capitalize transition-all',
                        isActive ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                      )}
                    >
                      {type} <span className="opacity-60">{count}</span>
                    </button>
                  );
                })}
              </div>
            </FiltersGroup>
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <p className="text-xs text-gray-400">
                <Zap size={11} className="inline mr-1" />
                <span className="font-semibold text-gray-600">{visibleMeetups.length}</span> events — sorted by buzz score
                {' · '}<LastUpdated tabId="meetups" />
              </p>
              <SummarizeButton
                tabName="Meetups & Hackathons"
                items={filteredMeetups}
                totalAvailable={meetupsHackathons.length}
                describeItem={m => ({ name: m.name, metric: `${m.type} · ${m.location}` })}
              />
              <ExportButton
                data={sortedMeetups}
                filename="meetups_hackathons"
                title="Meetups & Hackathons"
                columns={[
                  { header: 'Name',          accessor: m => m.name, width: 50 },
                  { header: 'Type',          accessor: m => m.type, width: 18 },
                  { header: 'Format',        accessor: m => m.format, width: 18 },
                  { header: 'Start Date',    accessor: m => m.startDate, width: 22 },
                  { header: 'Location',      accessor: m => m.location, width: 30 },
                  { header: 'Region',        accessor: m => m.region ?? '', width: 16 },
                  { header: 'Buzz',          accessor: m => m.buzzLevel, width: 16 },
                  { header: 'Attendance',    accessor: m => m.expectedAttendance ?? '', width: 18 },
                  { header: 'NVIDIA Tech',   accessor: m => m.nvidiaTech ? 'Yes' : 'No', width: 16 },
                  { header: 'NVIDIA Detail', accessor: m => m.nvidiaTechDetails ?? '', width: 70 },
                  { header: 'Sponsor Rec',   accessor: m => m.sponsorRecommendation ?? '', width: 18 },
                  { header: 'Sponsor Why',   accessor: m => m.sponsorReason ?? '', width: 80 },
                  { header: 'Luma URL',      accessor: m => m.lumaUrl ?? '', width: 50 },
                  { header: 'URL',           accessor: m => m.url, width: 50 },
                ]}
              />
            </div>
            {sortedMeetups.length === 0 ? (
              <EmptyFilteredState onClear={clearAllFilters} />
            ) : (
              <div className="flex flex-col gap-3">
                {sortedMeetups.map(m => <MeetupCard key={m.id} conf={m} />)}
              </div>
            )}
          </div>
        )}
        {activeTab === 'videos' && (
          <VideosDashboard persona={persona} />
        )}
        {activeTab === 'github' && (
          <GitHubDashboard />
        )}
        {activeTab === 'discord' && (
          <div>
            <AnalysisPanel tabId="discord" />
            <FiltersGroup
              activeCount={(activeDomain ? 1 : 0) + (minBuzz ? 1 : 0) + activeTags.size}
              onClearAll={clearAllFilters}
            >
              <DomainFilter active={activeDomain} onChange={setActiveDomain} counts={domainCounts(discordChannels)} exclude={['aerospace']} />
              <ScoreFilter active={minBuzz} onChange={setMinBuzz} counts={buzzCounts(discordChannels)} />
              <TagFilterRow
                tags={[
                  { tag: 'OSS',     count: discordChannels.filter(d => detectOSS(d)).length },
                  { tag: 'OpenUSD', count: discordChannels.filter(d => detectOpenUSD(d)).length },
                ]}
                active={activeTags}
                onToggle={toggleTag}
              />
            </FiltersGroup>
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <p className="text-xs text-gray-400">
                <Hash size={11} className="inline mr-1" />
                <span className="font-semibold text-gray-600">{filteredDiscord.length}</span> channels tracked across {new Set(discordChannels.map(d => d.server)).size} Discord servers — sorted by buzz
                {' · '}<LastUpdated tabId="discord" />
              </p>
              <SummarizeButton
                tabName="Discord"
                items={filteredDiscord}
                totalAvailable={discordChannels.length}
                describeItem={d => ({ name: `#${d.channel}`, metric: `${d.server} · ${d.weeklyMessages.toLocaleString()}/wk` })}
              />
              <ExportButton
                data={sortedDiscord}
                filename="discord_channels"
                title="Discord Channels"
                columns={[
                  { header: 'Server',          accessor: d => d.server, width: 30 },
                  { header: 'Channel',         accessor: d => d.channel, width: 25 },
                  { header: 'Members',         accessor: d => d.members, width: 18 },
                  { header: 'Weekly Messages', accessor: d => d.weeklyMessages, width: 22 },
                  { header: 'Buzz',            accessor: d => d.buzzLevel, width: 16 },
                  { header: 'Topic',           accessor: d => d.topic, width: 60 },
                  { header: 'Recent Topics',   accessor: d => d.recentTopics.join(', '), width: 70 },
                  { header: 'Domains',         accessor: d => (d.domains ?? []).join(', '), width: 30 },
                  { header: 'Server URL',      accessor: d => d.serverUrl, width: 50 },
                ]}
              />
            </div>
            {filteredDiscord.length === 0 ? (
              <EmptyFilteredState onClear={clearAllFilters} />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {sortedDiscord.map(ch => <DiscordChannelCard key={ch.id} ch={ch} />)}
              </div>
            )}
          </div>
        )}
        {activeTab === 'papers' && (
          <div>
            <AnalysisPanel tabId="papers" />
            {/* Papers toolbar */}
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs text-gray-500">
                  <span className="font-semibold text-gray-700">{filteredPapers.length}</span>
                  {filteredPapers.length !== papers.length && <span className="text-gray-400"> of {papers.length}</span>}
                  {' '}auto-pulled arXiv papers
                  {hasAutoPapers() && <span className="text-emerald-600 ml-1">· daily refresh active</span>}
                </p>
                {papers.length > 0 && (
                  <button
                    onClick={() => setNvidiaOnly(v => !v)}
                    className={clsx(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border transition-all',
                      nvidiaOnly
                        ? 'text-white border-transparent'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-[#76B900]/50 hover:text-[#5a8a00]'
                    )}
                    style={nvidiaOnly ? { background: '#76B900', borderColor: '#76B900' } : {}}
                  >
                    <span>⬡</span>
                    NVIDIA + GPU only
                  </button>
                )}
              </div>
            </div>

            {/* Topic filter strip — shown when papers exist */}
            {papers.length > 0 && (
              <div className="flex gap-1 flex-wrap mb-3">
                <button
                  onClick={() => setActiveTopic(null)}
                  className={clsx(
                    'text-xs px-2.5 py-1 rounded-full font-medium transition-all border',
                    activeTopic === null
                      ? 'bg-gray-800 text-white border-gray-800'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                  )}
                >
                  All topics
                </button>
                {PAPER_TOPICS.map(t => {
                  const count = papers.filter(p => p.paperTopics?.includes(t.id)).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTopic(prev => prev === t.id ? null : t.id)}
                      className={clsx(
                        'text-xs px-2.5 py-1 rounded-full font-medium transition-all',
                        activeTopic === t.id ? t.color + ' ring-1 ring-inset ring-current' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {t.short} <span className="opacity-60">{count}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {papers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <FileText size={36} className="mb-3 opacity-30" />
                <p className="text-sm font-medium text-gray-500 mb-1">No auto-pulled papers yet</p>
                <p className="text-xs text-gray-400 mb-4">The daily refresh writes the latest arXiv Physical AI matches into src/data/auto/papers.json.</p>
              </div>
            ) : filteredPapers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <p className="text-sm">No papers match your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {sortedPapers.map(p => (
                  <PaperCard key={p.arxivId} paper={p} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'global' && (
          <div>
            <AnalysisPanel tabId="global" signalCount={globalSources.length} />

            <FiltersGroup
              activeCount={[
                activeRegion,
                activeSourceType,
                activeGlobalProduct,
                globalStatusScope !== 'trusted' ? globalStatusScope : null,
              ].filter(Boolean).length}
              onClearAll={clearAllFilters}
            >
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Region</p>
                <RegionFilter
                  active={activeRegion}
                  onChange={setActiveRegion}
                  counts={regionCounts(globalSourcesForStatusScope)}
                />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Source Type</p>
                <div className="flex gap-1 flex-wrap mb-2">
                  <button
                    onClick={() => setActiveSourceType(null)}
                    className={clsx(
                      'text-xs px-2.5 py-1 rounded-full font-medium transition-all border',
                      activeSourceType === null
                        ? 'bg-gray-800 text-white border-gray-800'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                    )}
                  >
                    All types
                  </button>
                  {ALL_SOURCE_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => setActiveSourceType(activeSourceType === type ? null : type)}
                      className={clsx(
                        'text-xs px-2.5 py-1 rounded-full font-medium transition-all border',
                        activeSourceType === type ? SOURCE_TYPE_STYLES[type] : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                      )}
                    >
                      {SOURCE_TYPE_LABELS[type]} <span className="opacity-60">{sourceTypeCounts[type] ?? 0}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">NVIDIA Product / Topic Match</p>
                <div className="flex gap-1 flex-wrap mb-2">
                  <button
                    onClick={() => setActiveGlobalProduct(null)}
                    className={clsx(
                      'text-xs px-2.5 py-1 rounded-full font-medium transition-all border',
                      activeGlobalProduct === null
                        ? 'bg-gray-800 text-white border-gray-800'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                    )}
                  >
                    All products
                  </button>
                  {globalProductOptions.map(product => (
                    <button
                      key={product}
                      onClick={() => setActiveGlobalProduct(activeGlobalProduct === product ? null : product)}
                      className={clsx(
                        'text-xs px-2.5 py-1 rounded-full font-medium transition-all border',
                        activeGlobalProduct === product
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                      )}
                    >
                      {product}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Verification Scope</p>
                <div className="flex gap-1 flex-wrap">
                  <button
                    onClick={() => setGlobalStatusScope('trusted')}
                    className={clsx(
                      'text-xs px-2.5 py-1 rounded-full font-medium transition-all border',
                      globalStatusScope === 'trusted'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                    )}
                  >
                    Verified + candidate <span className="opacity-60">{trustedGlobalCount}</span>
                  </button>
                  <button
                    onClick={() => setGlobalStatusScope('new')}
                    className={clsx(
                      'text-xs px-2.5 py-1 rounded-full font-medium transition-all border',
                      globalStatusScope === 'new'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                    )}
                  >
                    New imports needing validation <span className="opacity-60">{newGlobalCount}</span>
                  </button>
                  <button
                    onClick={() => setGlobalStatusScope('all')}
                    className={clsx(
                      'text-xs px-2.5 py-1 rounded-full font-medium transition-all border',
                      globalStatusScope === 'all'
                        ? 'bg-gray-800 text-white border-gray-800'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                    )}
                  >
                    All statuses <span className="opacity-60">{globalSources.length}</span>
                    {staleDeadGlobalCount > 0 && <span className="opacity-60"> · {staleDeadGlobalCount} stale/dead</span>}
                  </button>
                </div>
              </div>
            </FiltersGroup>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 mb-4">
              {globalKpis.map(kpi => (
                <div key={kpi.label} className="border border-gray-200 bg-white rounded-lg p-3">
                  <p className="text-[10px] uppercase tracking-wide font-semibold text-gray-400 mb-1">{kpi.label}</p>
                  <div className="text-lg font-bold text-gray-900 leading-none">{kpi.value}</div>
                  <p className="text-[11px] text-gray-500 mt-1 leading-snug">{kpi.detail}</p>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Physical AI Source Map</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {sortedGlobalSources.length} source pages
                    {' · '}
                    {sortedGlobalSources.filter(source => source.status === 'verified').length} verified
                    {' · '}
                    {sortedGlobalSources.filter(source => source.status === 'candidate').length} candidates
                    {' · '}
                    {sortedGlobalSources.filter(needsGlobalSourceValidation).length} new
                    {hasAutoGlobalSources() ? ' · pulled by the daily refresh job' : ' · awaiting first refresh verification'}
                  </p>
                </div>
                <ExportButton
                  data={sortedGlobalSources}
                  filename="global_source_registry"
                  title="Physical AI Global Source Registry"
                  columns={[
                    { header: 'Name', accessor: s => s.name, width: 42 },
                    { header: 'Type', accessor: s => s.type, width: 22 },
                    { header: 'Region', accessor: s => s.region, width: 18 },
                    { header: 'Status', accessor: s => s.status, width: 18 },
                    { header: 'Confidence', accessor: s => s.confidence, width: 18 },
                    { header: 'Relevance', accessor: s => s.relevanceScore ?? s.confidence, width: 18 },
                    { header: 'Reason', accessor: s => s.statusReason ?? '', width: 60 },
                    { header: 'Event Date', accessor: s => s.eventDate ?? '', width: 22 },
                    { header: 'Location', accessor: s => s.location ?? '', width: 32 },
                    { header: 'Focus Area', accessor: s => s.focusArea ?? '', width: 24 },
                    { header: 'Event Tier', accessor: s => s.eventTier ?? '', width: 36 },
                    { header: 'Activation Tier', accessor: s => s.activationTier ?? '', width: 40 },
                    { header: 'Products', accessor: s => s.products.join(', '), width: 60 },
                    { header: 'Topics', accessor: s => s.topics.join(', '), width: 60 },
                    { header: 'Evidence', accessor: s => s.evidence.join(', '), width: 60 },
                    { header: 'Last Verified', accessor: s => s.lastVerified, width: 28 },
                    { header: 'Workbook Source', accessor: s => [s.sourceFile, s.sourceSheet, s.sourceRow ? `row ${s.sourceRow}` : ''].filter(Boolean).join(' · '), width: 46 },
                    { header: 'URL', accessor: s => s.url, width: 70 },
                  ]}
                />
              </div>
              <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-xs text-gray-400 font-medium mr-1">View:</span>
                  <button
                    onClick={() => update({ globalEventsView: 'list' })}
                    className={clsx(
                      'inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium border transition-all',
                      settings.globalEventsView === 'list'
                        ? 'bg-gray-800 text-white border-gray-800'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                    )}
                  >
                    <List size={12} />
                    Source list
                  </button>
                  <button
                    onClick={() => update({ globalEventsView: 'calendar' })}
                    className={clsx(
                      'inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium border transition-all',
                      settings.globalEventsView === 'calendar'
                        ? 'bg-gray-800 text-white border-gray-800'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                    )}
                  >
                    <CalendarDays size={12} />
                    Event calendar <span className="opacity-60">{globalCalendarEventCount}</span>
                  </button>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-xs text-gray-400 font-medium mr-1">Sort:</span>
                  {GLOBAL_SORT_OPTIONS.map(option => (
                    <button
                      key={option.id}
                      onClick={() => setGlobalSortMode(option.id)}
                      className={clsx(
                        'text-xs px-2.5 py-1 rounded-full font-medium border transition-all',
                        globalSortMode === option.id
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              {sortedGlobalSources.length === 0 ? (
                <EmptyFilteredState onClear={clearAllFilters} />
              ) : settings.globalEventsView === 'calendar' ? (
                <GlobalEventsCalendar sources={sortedGlobalSources} />
              ) : (
                <div className="space-y-6">
                  {(activeRegion === null ? ALL_REGIONS : [activeRegion]).map(region => {
                    const meta = REGION_META[region];
                    const sources = globalRegionGroups[region] ?? [];
                    if (sources.length === 0) return null;
                    const verifiedCount = sources.filter(source => source.status === 'verified').length;
                    const candidateCount = sources.filter(source => source.status === 'candidate').length;
                    const eventCount = sources.filter(source => source.type === 'event' || source.type === 'meetup').length;
                    const communityCount = sources.filter(source => source.type === 'community' || source.type === 'regional-association').length;
                    return (
                      <section key={region}>
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                          <span className="text-2xl">{meta.emoji}</span>
                          <div>
                            <h2 className="text-sm font-bold text-gray-900">{meta.label}</h2>
                            <p className="text-xs text-gray-400">
                              {sources.length} sources · {verifiedCount} verified · {candidateCount} candidates · {communityCount} communities/associations · {eventCount} events
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {sources.map(source => <GlobalSourceCard key={source.id} source={source} />)}
                        </div>
                      </section>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
