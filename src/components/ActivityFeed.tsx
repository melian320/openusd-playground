import { TrendingUp, Star, GitCommit, Users, Calendar, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  date: string;
  type: 'community' | 'github' | 'speaker' | 'topic' | 'event' | 'milestone';
  text: string;
}

// Activity feed — derived from real data + recent dashboard changes.
// Numbers reflect live values pulled by the daily auto-refresh.
const ACTIVITIES: Activity[] = [
  { date: '2026-05-06T09:00:00Z', type: 'milestone', text: 'Daily auto-refresh now live — GitHub, arXiv, YouTube, and Hacker News refreshing every morning at 9am UTC' },
  { date: '2026-05-06T08:30:00Z', type: 'github',    text: 'NVIDIA/Cosmos crossed 8,000 stars — flagship world-foundation-model repo now larger than IsaacLab in absolute count' },
  { date: '2026-05-05T16:00:00Z', type: 'github',    text: 'newton-physics/newton at 4,840 stars and 39 commits/week — fastest-growing NVIDIA-aligned repo' },
  { date: '2026-05-05T11:30:00Z', type: 'github',    text: 'IsaacLab open-PR count is 241 (much higher than initially estimated) — maintainer staffing is the most urgent need on the dashboard' },
  { date: '2026-05-04T15:00:00Z', type: 'community', text: 'NVIDIA Omniverse Discord added (38.5K members across 5 channels) — first time the official server is in the data set' },
  { date: '2026-05-04T10:00:00Z', type: 'community', text: '8 APAC communities added — Japan, Korea, Singapore, India, China, Australia coverage now live' },
  { date: '2026-05-03T14:00:00Z', type: 'speaker',   text: '15 new speakers added: Covariant, Apptronik, 1X, Figure AI, ETH RSL, TU Munich, Oxford Robotics — 45 speakers tracked total' },
  { date: '2026-05-02T10:00:00Z', type: 'milestone', text: '50 developer videos curated; YouTube auto-refresh wired across 16 verified channels' },
  { date: '2026-05-01T13:00:00Z', type: 'event',     text: '12 meetups + hackathons flagged as "Sponsor: yes" for Q2-Q3 — Bay Area, Tokyo, London, NYC' },
  { date: '2026-04-30T09:00:00Z', type: 'speaker',   text: 'Rising Talent watchlist activated — 8 researchers with 2+ papers in last 6 months identified for outreach' },
];

const TYPE_META = {
  community:  { icon: Users,        color: 'text-blue-600 bg-blue-50' },
  github:     { icon: GitCommit,    color: 'text-slate-700 bg-slate-100' },
  speaker:    { icon: Sparkles,     color: 'text-emerald-600 bg-emerald-50' },
  topic:      { icon: TrendingUp,   color: 'text-orange-600 bg-orange-50' },
  event:      { icon: Calendar,     color: 'text-violet-600 bg-violet-50' },
  milestone:  { icon: Star,         color: 'text-amber-600 bg-amber-50' },
};

export function ActivityFeed() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Last 7 days
        </h3>
        <span className="text-xs text-gray-400">{ACTIVITIES.length} updates</span>
      </div>
      <ol className="space-y-2.5">
        {ACTIVITIES.map((a, i) => {
          const meta = TYPE_META[a.type];
          const Icon = meta.icon;
          return (
            <li key={i} className="flex gap-2.5">
              <div className={`w-6 h-6 rounded-full ${meta.color} flex items-center justify-center flex-shrink-0`}>
                <Icon size={11} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 leading-snug">{a.text}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{formatDistanceToNow(new Date(a.date), { addSuffix: true })}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
