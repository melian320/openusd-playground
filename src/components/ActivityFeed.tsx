import { TrendingUp, Star, GitCommit, Users, Calendar, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  date: string;
  type: 'community' | 'github' | 'speaker' | 'topic' | 'event' | 'milestone';
  text: string;
}

// Mock activity feed — in production this would be derived from data deltas
const ACTIVITIES: Activity[] = [
  { date: '2026-05-04T09:30:00Z', type: 'github',    text: 'IsaacLab crossed 14,000 stars (+82 in last 24h) — Newton repo +200% week-over-week' },
  { date: '2026-05-03T15:00:00Z', type: 'topic',     text: 'New rising topic: "Industrial Digital Twin ROI Case Studies" hit buzz score 84' },
  { date: '2026-05-03T11:00:00Z', type: 'community', text: '8 APAC communities added — Japan, Korea, Singapore, India, China, Australia coverage now live' },
  { date: '2026-05-02T14:20:00Z', type: 'speaker',   text: '15 new speakers added: Covariant, Apptronik, 1X, ETH Zürich RSL, TU Munich, Oxford Robotics' },
  { date: '2026-05-02T10:00:00Z', type: 'milestone', text: '50 developer videos now tracked across global creators (NVIDIA Official + open-source + university + independent)' },
  { date: '2026-05-01T16:45:00Z', type: 'event',     text: '12 meetups + hackathons flagged as "Sponsor: yes" for the summer — Bay Area, Tokyo, London, NYC' },
  { date: '2026-05-01T09:00:00Z', type: 'github',    text: 'Cosmos repo launched community contribution guidelines — 6 new community projects already related' },
  { date: '2026-04-30T13:15:00Z', type: 'topic',     text: 'World Foundation Models cluster gained 3 new tracked topics — π0.5, OpenVLA-2, Genie-3' },
  { date: '2026-04-29T08:00:00Z', type: 'speaker',   text: 'Rising Talent watchlist activated — 8 researchers with 2+ papers in last 6 months identified for outreach' },
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
