import { useState } from 'react';
import { MessageSquare, Mail, Hash, ExternalLink, Slack, Pencil, Trash2, Megaphone, Copy, Check } from 'lucide-react';
import { Story, StorySource, NVIDIA_PRODUCT_LABELS } from '../types/story';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

// ── Social URL detection ────────────────────────────────────────────────────
const SOCIAL_HOSTS = [
  'linkedin.com', 'twitter.com', 'x.com', 'youtube.com', 'youtu.be',
  'github.com', 'facebook.com', 'instagram.com', 'tiktok.com', 'threads.net',
  'huggingface.co', 'reddit.com', 'medium.com', 'substack.com', 'dev.to',
];
export function getSocialPlatform(url?: string): { platform: string; emoji: string; color: string } | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    if (host.includes('linkedin')) return { platform: 'LinkedIn', emoji: 'in', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
    if (host.includes('twitter') || host === 'x.com') return { platform: 'X', emoji: '𝕏', color: 'bg-gray-100 text-gray-800 border-gray-300' };
    if (host.includes('youtube') || host === 'youtu.be') return { platform: 'YouTube', emoji: '▶', color: 'bg-red-50 text-red-700 border-red-200' };
    if (host.includes('github')) return { platform: 'GitHub', emoji: '⚙', color: 'bg-slate-100 text-slate-700 border-slate-300' };
    if (host.includes('facebook')) return { platform: 'Facebook', emoji: 'f', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (host.includes('instagram')) return { platform: 'Instagram', emoji: '📷', color: 'bg-pink-50 text-pink-700 border-pink-200' };
    if (host.includes('tiktok')) return { platform: 'TikTok', emoji: '♪', color: 'bg-gray-100 text-gray-800 border-gray-300' };
    if (host.includes('threads')) return { platform: 'Threads', emoji: '@', color: 'bg-gray-100 text-gray-800 border-gray-300' };
    if (host.includes('huggingface')) return { platform: 'HuggingFace', emoji: '🤗', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (host.includes('reddit')) return { platform: 'Reddit', emoji: 'r', color: 'bg-orange-50 text-orange-700 border-orange-200' };
    if (host.includes('medium') || host.includes('substack') || host.includes('dev.to')) return { platform: 'Blog', emoji: '✍', color: 'bg-violet-50 text-violet-700 border-violet-200' };
    return null;
  } catch { return null; }
}
export function hasSocialUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return SOCIAL_HOSTS.some(h => host.includes(h));
  } catch { return false; }
}

// ── Auto-generate amplification copy from story content ────────────────────
function buildSocialCopy(story: Story): { x: string; linkedin: string; facebook: string } {
  const productHash = (story.products ?? []).map(p => `#${NVIDIA_PRODUCT_LABELS[p].replace(/\s+/g, '')}`).join(' ');
  const tagHash = story.tags.slice(0, 3).map(t => `#${t.replace(/-/g, '')}`).join(' ');
  const platform = getSocialPlatform(story.url);
  const handlePart = platform ? ` via ${platform.platform}` : '';
  // X — short, punchy, under 280 chars
  const xCore = story.summary.slice(0, 160).replace(/\s+\S*$/, '…');
  const x = `🚀 ${story.title}\n\n${xCore}\n\n${productHash} ${tagHash}`.slice(0, 275);
  // LinkedIn — longer, professional
  const linkedin = `${story.title}\n\n${story.summary.slice(0, 320)}${story.summary.length > 320 ? '…' : ''}\n\nKudos to ${story.author} for sharing this with the Physical AI community${handlePart}.\n\n${productHash} #PhysicalAI #Robotics`;
  // Facebook — friendly, mid-length
  const facebook = `${story.title}\n\n${story.summary.slice(0, 220)}${story.summary.length > 220 ? '…' : ''}\n\nShared by ${story.author}. Worth a read for anyone building in Physical AI 👇`;
  return { x, linkedin, facebook };
}

const SOURCE_COLORS: Record<StorySource, string> = {
  slack: 'bg-purple-100 text-purple-800 border-purple-200',
  email: 'bg-blue-100 text-blue-800 border-blue-200',
  discord: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  twitter: 'bg-sky-100 text-sky-800 border-sky-200',
  linkedin: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  manual: 'bg-gray-100 text-gray-700 border-gray-200',
  arxiv: 'bg-rose-100 text-rose-800 border-rose-200',
};

const TAG_COLORS: Record<string, string> = {
  robotics: 'bg-orange-50 text-orange-700',
  humanoids: 'bg-red-50 text-red-700',
  'embodied-ai': 'bg-violet-50 text-violet-700',
  'digital-twins': 'bg-teal-50 text-teal-700',
  simulation: 'bg-emerald-50 text-emerald-700',
  community: 'bg-yellow-50 text-yellow-700',
  event: 'bg-pink-50 text-pink-700',
  research: 'bg-blue-50 text-blue-700',
  product: 'bg-indigo-50 text-indigo-700',
  funding: 'bg-green-50 text-green-700',
  tutorial: 'bg-cyan-50 text-cyan-700',
  announcement: 'bg-amber-50 text-amber-700',
  discussion: 'bg-slate-100 text-slate-600',
  job: 'bg-lime-50 text-lime-700',
};

function SourceIcon({ source }: { source: StorySource }) {
  if (source === 'slack') return <Slack size={12} />;
  if (source === 'email') return <Mail size={12} />;
  if (source === 'arxiv') return <span className="font-bold text-[10px] leading-none">arXiv</span>;
  return <Hash size={12} />;
}

interface Props {
  story: Story;
  onEdit: (story: Story) => void;
  onDelete: (id: string) => void;
}

export function StoryCard({ story, onEdit, onDelete }: Props) {
  const timeAgo = formatDistanceToNow(new Date(story.date), { addSuffix: true });
  const [showCopy, setShowCopy] = useState(false);
  const [copied, setCopied] = useState<'x' | 'linkedin' | 'facebook' | null>(null);
  const social = getSocialPlatform(story.url);
  const copy = buildSocialCopy(story);

  const handleCopy = (text: string, platform: 'x' | 'linkedin' | 'facebook') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(platform);
      setTimeout(() => setCopied(null), 1800);
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete "${story.title}"?`)) onDelete(story.id);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-gray-300 transition-all group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border', SOURCE_COLORS[story.source])}>
              <SourceIcon source={story.source} />
              {story.source}
            </span>
            {social && (
              <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border', social.color)}>
                <span className="font-bold leading-none">{social.emoji}</span>
                {social.platform}
              </span>
            )}
            {story.channel && (
              <span className="text-xs text-gray-400 font-mono truncate max-w-[160px]">{story.channel}</span>
            )}
            <span className="text-xs text-gray-400 ml-auto">{timeAgo}</span>
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-1.5 group-hover:text-blue-700 transition-colors">
            {story.url ? (
              <a href={story.url} target="_blank" rel="noopener noreferrer" className="hover:underline inline-flex items-center gap-1">
                {story.title}
                <ExternalLink size={11} className="opacity-50 flex-shrink-0" />
              </a>
            ) : story.title}
          </h3>

          {/* Summary */}
          <p className="text-xs text-gray-600 leading-relaxed mb-3 line-clamp-3">{story.summary}</p>

          {/* Product tags */}
          {story.products && story.products.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {story.products.map(p => (
                <span key={p} className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-50 text-green-700 border border-green-100">
                  {NVIDIA_PRODUCT_LABELS[p]}
                </span>
              ))}
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-3">
            {story.tags.map(tag => (
              <span key={tag} className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', TAG_COLORS[tag] ?? 'bg-gray-100 text-gray-600')}>
                {tag}
              </span>
            ))}
          </div>

          {/* Amplification toggle */}
          <button
            onClick={() => setShowCopy(v => !v)}
            className={clsx(
              'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all mb-2',
              showCopy
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            )}
          >
            <Megaphone size={11} />
            {showCopy ? 'Hide amplification copy ▲' : 'Recommended social copy ▼'}
          </button>

          {showCopy && (
            <div className="space-y-2 mb-3 border-t border-gray-100 pt-2">
              {([
                { key: 'x' as const,        label: '𝕏 Twitter / X', text: copy.x },
                { key: 'linkedin' as const, label: 'LinkedIn',      text: copy.linkedin },
                { key: 'facebook' as const, label: 'Facebook',      text: copy.facebook },
              ]).map(({ key, label, text }) => (
                <div key={key} className="bg-gray-50 rounded-lg p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
                    <button
                      onClick={() => handleCopy(text, key)}
                      className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-white border border-gray-200 rounded text-gray-500 hover:text-blue-600 hover:border-blue-300 transition-colors"
                    >
                      {copied === key ? <Check size={9} /> : <Copy size={9} />}
                      {copied === key ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-700 leading-relaxed whitespace-pre-line">{text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-medium text-gray-600">{story.author}</span>
            <div className="flex items-center gap-3">
              {story.engagementScore !== undefined && (
                <span className="inline-flex items-center gap-1">
                  <MessageSquare size={11} />
                  {story.engagementScore}
                </span>
              )}
              {/* Edit / Delete — visible on hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <button
                  onClick={e => { e.stopPropagation(); onEdit(story); }}
                  className="p-1 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  aria-label="Edit story"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1 rounded hover:bg-red-50 hover:text-red-500 transition-colors"
                  aria-label="Delete story"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
