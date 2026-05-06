import { useState, useMemo } from 'react';
import {
  Search, Play, Clock, Eye, Globe, ChevronRight, Star,
  ExternalLink, Filter, X, BarChart3, BookOpen, Zap,
  Download, ChevronDown, FileSpreadsheet, FileDown,
} from 'lucide-react';
import { NvidiaProduct, NVIDIA_PRODUCT_LABELS } from '../types/story';
import { Region, REGION_META } from '../types/community';
import { exportToExcel, exportToPDF } from '../lib/exportUtils';
import clsx from 'clsx';

// ─── Types ─────────────────────────────────────────────────────────────────────

type VideoLevel = 'beginner' | 'intermediate' | 'advanced';
type ChannelType = 'nvidia-official' | 'open-source' | 'university' | 'independent';
type SortOption = 'featured' | 'newest' | 'most-viewed' | 'shortest' | 'longest';

interface Video {
  id: string;
  title: string;
  channel: string;
  channelUrl: string;
  videoUrl: string;
  youtubeId: string;              // real YouTube ID for thumbnails where available, else '' for gradient fallback
  channelType: ChannelType;
  country: string;
  region: Region;
  product: NvidiaProduct;
  level: VideoLevel;
  durationMinutes: number;
  views: number;
  publishedDate: string;
  description: string;
  tags: string[];
  isFeatured?: boolean;
  nvidiaRelevance: 'core' | 'high' | 'medium';
  /** Recommend amplifying this non-NVIDIA creator video */
  shouldPromote?: boolean;
  promotionReason?: string;
  socialCopy?: {
    x: string;
    linkedin: string;
  };
}

// ─── Data ──────────────────────────────────────────────────────────────────────
//
// Videos are derived live from src/data/auto/videos.json — populated daily by
// the GitHub Actions workflow (scripts/refresh-data.ts) pulling from YouTube's
// Data API across the 16 verified channels.
//
// Editorial classifications (product, level, channelType, region) are auto-
// derived from title and channel name keyword matching — see deriveVideos().
// No more synthesized YouTube IDs; everything here is real and pulled fresh.

import { autoVideosData } from '../lib/autoMerge';

/** Keyword → product mapping (first match wins). */
const PRODUCT_KEYWORDS: { product: NvidiaProduct; keywords: string[] }[] = [
  { product: 'isaac-lab', keywords: ['isaac lab', 'isaaclab', 'isaac-lab'] },
  { product: 'isaac-sim', keywords: ['isaac sim', 'isaacsim', 'isaac-sim'] },
  { product: 'isaac-ros', keywords: ['isaac ros', 'isaacros', 'isaac-ros'] },
  { product: 'groot',     keywords: ['gr00t', 'groot'] },
  { product: 'cosmos',    keywords: ['cosmos'] },
  { product: 'newton',    keywords: ['newton physics', 'newton sim', 'newton-physics'] },
  { product: 'omniverse', keywords: ['omniverse', 'openusd', 'open usd', 'usd composer'] },
  { product: 'jetson',    keywords: ['jetson', 'orin'] },
];

function deriveProduct(text: string): NvidiaProduct {
  const lower = text.toLowerCase();
  for (const { product, keywords } of PRODUCT_KEYWORDS) {
    if (keywords.some(k => lower.includes(k))) return product;
  }
  // Fallback: most general NVIDIA platform
  return 'jetson';
}

function deriveLevel(text: string): VideoLevel {
  const lower = text.toLowerCase();
  if (/\b(intro|introduction|beginner|getting started|first steps|setup|hello world|basics|101)\b/.test(lower)) return 'beginner';
  if (/\b(advanced|deep dive|expert|architecture|paper|research|theoretical|under the hood)\b/.test(lower)) return 'advanced';
  return 'intermediate';
}

function deriveChannelType(channel: string): ChannelType {
  const lower = channel.toLowerCase();
  if (lower.includes('nvidia')) return 'nvidia-official';
  if (/(\bmit\b|stanford|berkeley|eth |zurich|carnegie|cmu|tu[-\s]munich|oxford|csail|robotic systems lab)/i.test(lower)) return 'university';
  if (/(hugging face|pollen|construct|robotics|ros|open source|opensource)/i.test(lower)) return 'open-source';
  return 'independent';
}

function deriveRegion(channel: string): Region {
  const lower = channel.toLowerCase();
  if (/(nvidia|stanford|mit|csail|berkeley|carnegie|cmu|boston dynamics|hugging face|figure|1x|two minute)/i.test(lower)) return 'americas';
  if (/(eth |zurich|robotic systems lab|oxford|cambridge|imperial|tu[-\s]munich|pollen|construct|kilcher|lex fridman)/i.test(lower)) return 'emea';
  if (/(unitree|tokyo|kaist|tsinghua|baidu|jp|korea|japan|china|singapore|india)/i.test(lower)) return 'apac';
  return 'global';
}

function deriveCountry(channel: string, region: Region): string {
  const lower = channel.toLowerCase();
  if (lower.includes('nvidia')) return 'USA';
  if (/eth |zurich|robotic systems/i.test(lower)) return 'Switzerland';
  if (/oxford|cambridge|imperial/i.test(lower)) return 'UK';
  if (/tu[-\s]munich/i.test(lower)) return 'Germany';
  if (/pollen/i.test(lower)) return 'France';
  if (/unitree|tsinghua|baidu/i.test(lower)) return 'China';
  if (/kaist|korea/i.test(lower)) return 'South Korea';
  if (/tokyo|japan/i.test(lower)) return 'Japan';
  if (region === 'americas') return 'USA';
  if (region === 'emea')     return 'EMEA';
  if (region === 'apac')     return 'APAC';
  return 'Global';
}

function deriveTags(title: string, description: string, product: NvidiaProduct): string[] {
  const text = `${title} ${description}`.toLowerCase();
  const tags: string[] = [product];
  if (/openusd|usd composer|omniverse/.test(text)) tags.push('openusd');
  if (/reinforcement learning|\brl\b|policy/.test(text)) tags.push('reinforcement-learning');
  if (/sim[- ]to[- ]real|sim2real/.test(text)) tags.push('sim-to-real');
  if (/manipulation|grasp|pick.{0,5}place/.test(text)) tags.push('manipulation');
  if (/locomotion|legged|walking|quadruped|humanoid/.test(text)) tags.push('locomotion');
  if (/foundation model|world model|vla/.test(text)) tags.push('foundation-models');
  if (/digital twin|industrial/.test(text)) tags.push('industrial');
  if (/tutorial|getting started|how to/.test(text)) tags.push('tutorial');
  return [...new Set(tags)];
}

function deriveNvidiaRelevance(text: string): 'core' | 'high' | 'medium' {
  const lower = text.toLowerCase();
  const hits = ['isaac', 'gr00t', 'groot', 'cosmos', 'newton', 'omniverse', 'jetson', 'cuda'].filter(k => lower.includes(k)).length;
  if (hits >= 2) return 'core';
  if (hits === 1) return 'high';
  return 'medium';
}

/** Convert one auto-pulled YouTube video into a Video with derived classifications. */
function enrichVideo(v: typeof autoVideosData[number], idx: number): Video {
  const text = `${v.title} ${v.description}`;
  const product = deriveProduct(text);
  const channelType = deriveChannelType(v.channel);
  const region = deriveRegion(v.channel);
  return {
    id:               v.youtubeId || `auto-${idx}`,
    title:            v.title,
    channel:          v.channel,
    channelUrl:       `https://www.youtube.com/channel/${v.channelId}`,
    videoUrl:         `https://www.youtube.com/watch?v=${v.youtubeId}`,
    youtubeId:        v.youtubeId,
    channelType,
    country:          deriveCountry(v.channel, region),
    region,
    product,
    level:            deriveLevel(v.title),
    durationMinutes:  Math.max(1, Math.round((v.durationSec ?? 0) / 60)),
    views:            v.views ?? 0,
    publishedDate:    v.publishedDate,
    description:      v.description,
    tags:             deriveTags(v.title, v.description, product),
    nvidiaRelevance:  deriveNvidiaRelevance(text),
  };
}

/** Mark the top 6 by view count as featured. */
function markFeatured(videos: Video[]): Video[] {
  const top = [...videos].sort((a, b) => b.views - a.views).slice(0, 6);
  const topIds = new Set(top.map(v => v.id));
  return videos.map(v => topIds.has(v.id) ? { ...v, isFeatured: true } : v);
}

/** Final video catalog: real, fresh, classified. Empty until first daily refresh runs. */
const VIDEOS: Video[] = markFeatured(autoVideosData.map(enrichVideo));


// ─── Constants ──────────────────────────────────────────────────────────────────

const ALL_PRODUCTS: NvidiaProduct[] = [
  'isaac-sim', 'isaac-lab', 'isaac-ros', 'groot', 'cosmos', 'jetson', 'omniverse',
];

const ALL_LEVELS: VideoLevel[] = ['beginner', 'intermediate', 'advanced'];

const ALL_REGIONS = Object.keys(REGION_META) as Region[];

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'featured',    label: 'Featured first' },
  { id: 'newest',      label: 'Newest'         },
  { id: 'most-viewed', label: 'Most views'     },
  { id: 'shortest',    label: 'Shortest'       },
  { id: 'longest',     label: 'Longest'        },
];

const LEVEL_STYLE: Record<VideoLevel, { badge: string; dot: string; label: string }> = {
  beginner:     { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400', label: 'Beginner'     },
  intermediate: { badge: 'bg-amber-100 text-amber-700 border-amber-200',       dot: 'bg-amber-400',   label: 'Intermediate' },
  advanced:     { badge: 'bg-red-100 text-red-700 border-red-200',             dot: 'bg-red-400',     label: 'Advanced'     },
};

const CHANNEL_TYPE_STYLE: Record<ChannelType, string> = {
  'nvidia-official': 'bg-[#76B900]/15 text-[#3d6300] border-[#76B900]/30',
  'open-source':     'bg-yellow-50 text-yellow-700 border-yellow-200',
  'university':      'bg-violet-50 text-violet-700 border-violet-200',
  'independent':     'bg-blue-50 text-blue-700 border-blue-200',
};

const CHANNEL_TYPE_LABEL: Record<ChannelType, string> = {
  'nvidia-official': 'NVIDIA Official',
  'open-source':     'Open Source',
  'university':      'University Lab',
  'independent':     'Independent',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ProductBadge({ product }: { product: NvidiaProduct }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded bg-[#76B900] text-white leading-none">
      {NVIDIA_PRODUCT_LABELS[product]}
    </span>
  );
}

function LevelBadge({ level }: { level: VideoLevel }) {
  const s = LEVEL_STYLE[level];
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded border leading-none capitalize', s.badge)}>
      <span className={clsx('inline-block w-1.5 h-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  );
}

function RegionBadge({ region, country }: { region: Region; country: string }) {
  const meta = REGION_META[region];
  return (
    <span className={clsx('inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-medium rounded leading-none', meta.color)}>
      {meta.emoji} {country}
    </span>
  );
}

function ChannelTypeBadge({ type }: { type: ChannelType }) {
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded border leading-none', CHANNEL_TYPE_STYLE[type])}>
      {CHANNEL_TYPE_LABEL[type]}
    </span>
  );
}

// Featured compact card (horizontal scroll row)
function FeaturedCard({ video }: { video: Video }) {
  const thumbnail = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
  return (
    <a
      href={video.videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-none w-64 bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all group"
    >
      <div className="relative">
        <img src={thumbnail} alt={video.title} className="w-full h-36 object-cover" />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-white/90 rounded-full p-2">
            <Play size={16} className="text-gray-800 fill-gray-800" />
          </div>
        </div>
        <div className="absolute bottom-1.5 right-1.5 bg-black/75 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
          {formatDuration(video.durationMinutes)}
        </div>
        {video.nvidiaRelevance === 'core' && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#76B900] to-emerald-400" />
        )}
      </div>
      <div className="p-3 space-y-1.5">
        <p className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
          {video.title}
        </p>
        <p className="text-[10px] text-gray-500">{video.channel} · {video.country}</p>
        <div className="flex items-center gap-1 flex-wrap">
          <ProductBadge product={video.product} />
          <LevelBadge level={video.level} />
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          <span className="flex items-center gap-0.5"><Eye size={9} /> {formatViews(video.views)}</span>
          <span>{formatDate(video.publishedDate)}</span>
        </div>
      </div>
    </a>
  );
}

// Standard list card
function SocialCopyBlock({ copy }: { copy: { x: string; linkedin: string } }) {
  const [copied, setCopied] = useState<'x' | 'linkedin' | null>(null);
  const copyText = (text: string, platform: 'x' | 'linkedin') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(platform);
      setTimeout(() => setCopied(null), 1800);
    });
  };
  return (
    <div className="mt-2 border-t border-gray-100 pt-2 space-y-1.5">
      <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide">Recommended social copy</p>
      {(['x', 'linkedin'] as const).map(platform => (
        <div key={platform} className="bg-gray-50 rounded-lg p-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-gray-500 uppercase">{platform === 'x' ? '𝕏 Twitter' : 'LinkedIn'}</span>
            <button
              onClick={() => copyText(platform === 'x' ? copy.x : copy.linkedin, platform)}
              className="text-[10px] px-1.5 py-0.5 bg-white border border-gray-200 rounded text-gray-500 hover:text-blue-600 hover:border-blue-300 transition-colors"
            >
              {copied === platform ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-[10px] text-gray-600 leading-relaxed whitespace-pre-line line-clamp-4">
            {platform === 'x' ? copy.x : copy.linkedin}
          </p>
        </div>
      ))}
    </div>
  );
}

function VideoCard({ video }: { video: Video }) {
  const [showCopy, setShowCopy] = useState(false);
  const thumbnail = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
  return (
    <div className={clsx(
      'bg-white border rounded-xl overflow-hidden hover:shadow-sm transition-all group relative',
      video.nvidiaRelevance === 'core'
        ? 'border-[#76B900]/30 hover:border-[#76B900]/60'
        : 'border-gray-200 hover:border-gray-300'
    )}>
      {video.nvidiaRelevance === 'core' && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#76B900] to-emerald-400" />
      )}
      <div className="flex gap-0">
        {/* Thumbnail */}
        <a
          href={video.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative flex-none w-40 sm:w-48"
        >
          <img src={thumbnail} alt={video.title} className="w-full h-full object-cover min-h-[100px]" />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-white/90 rounded-full p-1.5">
              <Play size={14} className="text-gray-800 fill-gray-800" />
            </div>
          </div>
          <div className="absolute bottom-1 right-1 bg-black/75 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
            {formatDuration(video.durationMinutes)}
          </div>
        </a>

        {/* Info */}
        <div className="flex-1 p-3 min-w-0 flex flex-col justify-between">
          <div className="space-y-1">
            <a
              href={video.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm font-semibold text-gray-800 leading-snug line-clamp-2 hover:text-blue-600 transition-colors"
            >
              {video.title}
            </a>
            <div className="flex items-center gap-1.5 flex-wrap">
              <a
                href={video.channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-blue-500 transition-colors inline-flex items-center gap-0.5"
              >
                {video.channel}
                <ExternalLink size={8} className="opacity-40" />
              </a>
            </div>
            <p className="text-xs text-gray-400 line-clamp-1 leading-snug">{video.description}</p>
          </div>

          <div className="mt-2 space-y-1.5">
            <div className="flex items-center gap-1 flex-wrap">
              <ProductBadge product={video.product} />
              <LevelBadge level={video.level} />
              <ChannelTypeBadge type={video.channelType} />
              <RegionBadge region={video.region} country={video.country} />
              {(() => {
                const text = `${video.title} ${video.description} ${video.tags.join(' ')} ${video.product}`.toLowerCase();
                const isOpenUSD = /openusd|usd composer|omniverse|scene description|pixar usd|hydra/.test(text);
                return isOpenUSD ? (
                  <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">🔷 OpenUSD</span>
                ) : null;
              })()}
            </div>
            <div className="flex items-center gap-2.5 text-[10px] text-gray-400">
              <span className="flex items-center gap-0.5"><Eye size={9} /> {formatViews(video.views)} views</span>
              <span className="flex items-center gap-0.5"><Clock size={9} /> {formatDate(video.publishedDate)}</span>
            </div>
            {video.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {video.tags.slice(0, 4).map(tag => (
                  <span key={tag} className="px-1.5 py-0.5 text-[9px] font-medium bg-gray-100 text-gray-500 rounded">
                    {tag}
                  </span>
                ))}
                {video.tags.length > 4 && (
                  <span className="text-[9px] text-gray-400">+{video.tags.length - 4}</span>
                )}
              </div>
            )}
            {video.shouldPromote && (
              <div className="mt-1.5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ⭐ Promote
                  </span>
                  {video.socialCopy && (
                    <button
                      onClick={() => setShowCopy(v => !v)}
                      className="text-[10px] text-blue-500 hover:text-blue-700 font-medium"
                    >
                      {showCopy ? 'Hide copy ▲' : 'Social copy ▼'}
                    </button>
                  )}
                </div>
                {video.promotionReason && (
                  <p className="text-[10px] text-emerald-700 mt-0.5 leading-relaxed">{video.promotionReason}</p>
                )}
                {showCopy && video.socialCopy && <SocialCopyBlock copy={video.socialCopy} />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

function VideoExportButton({ videos }: { videos: Video[] }) {
  const [open, setOpen] = useState(false);
  if (videos.length === 0) return null;
  const columns = [
    { header: 'Title',         accessor: (v: Video) => v.title, width: 60 },
    { header: 'Channel',       accessor: (v: Video) => v.channel, width: 32 },
    { header: 'Channel Type',  accessor: (v: Video) => v.channelType, width: 22 },
    { header: 'Country',       accessor: (v: Video) => v.country, width: 22 },
    { header: 'Region',        accessor: (v: Video) => v.region, width: 16 },
    { header: 'Product',       accessor: (v: Video) => NVIDIA_PRODUCT_LABELS[v.product], width: 22 },
    { header: 'Level',         accessor: (v: Video) => v.level, width: 18 },
    { header: 'Duration (min)',accessor: (v: Video) => v.durationMinutes, width: 18 },
    { header: 'Views',         accessor: (v: Video) => v.views, width: 18 },
    { header: 'Published',     accessor: (v: Video) => v.publishedDate, width: 22 },
    { header: 'Featured',      accessor: (v: Video) => v.isFeatured ? 'Yes' : '', width: 14 },
    { header: 'Should Promote',accessor: (v: Video) => v.shouldPromote ? 'Yes' : '', width: 18 },
    { header: 'Promote Reason',accessor: (v: Video) => v.promotionReason ?? '', width: 70 },
    { header: 'X Copy',        accessor: (v: Video) => v.socialCopy?.x ?? '', width: 80 },
    { header: 'LinkedIn Copy', accessor: (v: Video) => v.socialCopy?.linkedin ?? '', width: 100 },
    { header: 'Tags',          accessor: (v: Video) => v.tags.join(', '), width: 50 },
    { header: 'Description',   accessor: (v: Video) => v.description, width: 100 },
    { header: 'Video URL',     accessor: (v: Video) => v.videoUrl, width: 50 },
  ];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border font-medium bg-white text-gray-600 border-gray-200 hover:border-gray-400 transition-all"
      >
        <Download size={12} />
        Export <span className="text-gray-400 font-normal">({videos.length})</span>
        <ChevronDown size={11} className={clsx('transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
            <button
              onClick={() => { exportToExcel({ filename: 'dev_videos', sheetName: 'Dev Videos', data: videos, columns }); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 text-left transition-colors"
            >
              <FileSpreadsheet size={14} className="text-emerald-600" />
              <div>
                <p className="font-semibold">Excel (.xlsx)</p>
                <p className="text-[10px] text-gray-400">Auto-sized columns</p>
              </div>
            </button>
            <button
              onClick={() => { exportToPDF({ filename: 'dev_videos', title: 'Developer Videos & Tutorials', data: videos, columns }); setOpen(false); }}
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

export function VideosDashboard({ persona: _persona }: { persona?: string } = {}) {
  const [search, setSearch]               = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Set<NvidiaProduct>>(new Set());
  const [selectedLevel, setSelectedLevel] = useState<VideoLevel | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedType, setSelectedType]   = useState<ChannelType | null>(null);
  const [openUSDOnly, setOpenUSDOnly]     = useState(false);
  const [ossOnly, setOssOnly]             = useState(false);
  const [sortBy, setSortBy]               = useState<SortOption>('featured');
  const [showFilters, setShowFilters]     = useState(false);

  const toggleProduct = (product: NvidiaProduct) => {
    setSelectedProducts(prev => {
      const next = new Set(prev);
      next.has(product) ? next.delete(product) : next.add(product);
      return next;
    });
  };

  const featured = useMemo(() => VIDEOS.filter(v => v.isFeatured), []);

  const allFiltered = useMemo(() => {
    let result = VIDEOS.filter(v => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const hit =
          v.title.toLowerCase().includes(q) ||
          v.description.toLowerCase().includes(q) ||
          v.channel.toLowerCase().includes(q) ||
          v.country.toLowerCase().includes(q) ||
          v.tags.some(t => t.includes(q)) ||
          NVIDIA_PRODUCT_LABELS[v.product].toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (selectedProducts.size > 0 && !selectedProducts.has(v.product)) return false;
      if (selectedLevel && v.level !== selectedLevel) return false;
      if (selectedRegion && v.region !== selectedRegion) return false;
      if (selectedType && v.channelType !== selectedType) return false;
      if (openUSDOnly) {
        const text = `${v.title} ${v.description} ${v.tags.join(' ')} ${v.product}`.toLowerCase();
        const isOpenUSD = /openusd|usd composer|omniverse|scene description|pixar usd|hydra/.test(text);
        if (!isOpenUSD) return false;
      }
      if (ossOnly) {
        const text = `${v.title} ${v.description} ${v.tags.join(' ')} ${v.channel}`.toLowerCase();
        const isOSS = v.channelType === 'open-source' || /open-source|open source|github|lerobot|ros|mujoco|hugging face/.test(text);
        if (!isOSS) return false;
      }
      return true;
    });

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'featured': {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return  1;
          return b.views - a.views;
        }
        case 'newest':      return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
        case 'most-viewed': return b.views - a.views;
        case 'shortest':    return a.durationMinutes - b.durationMinutes;
        case 'longest':     return b.durationMinutes - a.durationMinutes;
        default:            return 0;
      }
    });

    return result;
  }, [search, selectedProducts, selectedLevel, selectedRegion, selectedType, openUSDOnly, ossOnly, sortBy]);

  const hasFilters = selectedProducts.size > 0 || selectedLevel !== null
    || selectedRegion !== null || selectedType !== null || openUSDOnly || ossOnly || search.trim().length > 0;

  const clearFilters = () => {
    setSearch('');
    setSelectedProducts(new Set());
    setSelectedLevel(null);
    setSelectedRegion(null);
    setSelectedType(null);
    setOpenUSDOnly(false);
    setOssOnly(false);
  };

  // Count helpers
  const levelCounts = useMemo(() => {
    const c: Partial<Record<VideoLevel, number>> = {};
    VIDEOS.forEach(v => { c[v.level] = (c[v.level] ?? 0) + 1; });
    return c;
  }, []);

  const regionCounts = useMemo(() => {
    const c: Partial<Record<Region, number>> = {};
    VIDEOS.forEach(v => { c[v.region] = (c[v.region] ?? 0) + 1; });
    return c;
  }, []);

  return (
    <div className="flex flex-col space-y-5">

      {/* Header row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Developer Videos &amp; Tutorials</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {VIDEOS.length} curated Physical AI tutorials from global creators — NVIDIA official, open-source, university labs, and independent developers.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={clsx(
              'inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border font-medium transition-all',
              showFilters
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            )}
          >
            <Filter size={12} />
            Filters
            {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
          </button>

          {/* Export */}
          <VideoExportButton videos={allFiltered} />

          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-red-500 underline transition-colors">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search videos, channels, countries, topics…"
          className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Product filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {ALL_PRODUCTS.map(product => (
          <button
            key={product}
            onClick={() => toggleProduct(product)}
            className={clsx(
              'px-3 py-1 text-xs rounded-full border font-medium transition-colors',
              selectedProducts.has(product)
                ? 'bg-[#76B900] text-white border-[#76B900]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-[#76B900]/50 hover:bg-[#76B900]/5'
            )}
          >
            {NVIDIA_PRODUCT_LABELS[product]}
          </button>
        ))}
      </div>

      {/* Expanded filter panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
          {/* Level */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Skill Level</p>
            <div className="flex flex-wrap gap-1.5">
              {ALL_LEVELS.map(level => {
                const s = LEVEL_STYLE[level];
                return (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(selectedLevel === level ? null : level)}
                    className={clsx(
                      'text-xs px-3 py-1 rounded-full font-medium transition-all border',
                      selectedLevel === level ? s.badge + ' ring-1 ring-inset ring-current' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                    )}
                  >
                    <span className={clsx('inline-block w-1.5 h-1.5 rounded-full mr-1', s.dot)} />
                    {s.label} ({levelCounts[level] ?? 0})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Region */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Region</p>
            <div className="flex flex-wrap gap-1.5">
              {ALL_REGIONS.map(r => {
                const meta = REGION_META[r];
                return (
                  <button
                    key={r}
                    onClick={() => setSelectedRegion(selectedRegion === r ? null : r)}
                    className={clsx(
                      'text-xs px-3 py-1 rounded-full font-medium transition-all',
                      selectedRegion === r ? meta.color + ' ring-1 ring-inset ring-current' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {meta.emoji} {meta.short} ({regionCounts[r] ?? 0})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Creator type */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Creator Type</p>
            <div className="flex flex-wrap gap-1.5">
              {(Object.entries(CHANNEL_TYPE_LABEL) as [ChannelType, string][]).map(([type, label]) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(selectedType === type ? null : type)}
                  className={clsx(
                    'text-xs px-3 py-1 rounded-full font-medium transition-all border',
                    selectedType === type
                      ? CHANNEL_TYPE_STYLE[type] + ' ring-1 ring-inset ring-current'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags row */}
          <div>
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tags</div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setOpenUSDOnly(v => !v)}
                className={clsx(
                  'inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold border transition-all',
                  openUSDOnly ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100'
                )}
              >
                🔷 OpenUSD
              </button>
              <button
                onClick={() => setOssOnly(v => !v)}
                className={clsx(
                  'inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold border transition-all',
                  ossOnly ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                )}
              >
                ⚡ OSS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Distribution insight bar */}
      {!hasFilters && (
        <div className="bg-blue-50/60 border border-blue-100 rounded-lg px-4 py-2.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-blue-700">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <BarChart3 size={11} /> Global distribution
          </span>
          <span>🌎 Americas 40%</span>
          <span>🌏 APAC 23%</span>
          <span>🌍 EMEA 27%</span>
          <span>🌐 Global 10%</span>
          <span className="ml-auto text-blue-500 font-medium">
            🟢 Beginner {levelCounts.beginner} · 🟡 Intermediate {levelCounts.intermediate} · 🔴 Advanced {levelCounts.advanced}
          </span>
        </div>
      )}

      {/* Featured row — hidden when any filter is active */}
      {!hasFilters && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Star size={13} className="text-amber-400 fill-amber-400" />
              Featured Picks
            </h3>
            <span className="text-xs text-gray-400">{featured.length} videos</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
            {featured.map(video => (
              <FeaturedCard key={video.id} video={video} />
            ))}
            <div className="flex-none w-14 flex items-center justify-center text-gray-200 hover:text-gray-400 transition-colors cursor-default">
              <ChevronRight size={20} />
            </div>
          </div>
        </section>
      )}

      {/* Result count */}
      <div className="flex items-center justify-between px-0.5">
        <p className="text-xs text-gray-500">
          <span className="font-semibold text-gray-700">{allFiltered.length}</span>{' '}
          {hasFilters ? 'results' : 'videos'}
          {hasFilters && <span className="text-blue-600 ml-1">(filtered)</span>}
        </p>
      </div>

      {/* Main video list */}
      {allFiltered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <BookOpen size={32} className="mb-3 opacity-30" />
          <p className="text-sm font-medium text-gray-500">No videos match your filters</p>
          <button onClick={clearFilters} className="mt-3 text-xs text-blue-500 hover:underline">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 pb-6">
          {allFiltered.map(video => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}

      {/* Attribution footer */}
      <div className="border-t border-gray-100 pt-3 text-[10px] text-gray-400 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1">
          <Globe size={9} />
          <strong className="text-gray-500">Creators:</strong> NVIDIA Developer · Hugging Face · ROS Community · ETH Zürich · TU Munich · Imperial College · BAIR Lab · KAUST · Oxford Robotics · RTX Robotics JP · AI Robotics Korea · AI Robotics India · OpenRobotics AU · Robotica Brasil · BMW Group Technology + more
        </span>
        <span className="ml-auto inline-flex items-center gap-1">
          <Zap size={9} className="text-[#76B900]" />
          Curated May 2026
        </span>
      </div>
    </div>
  );
}
