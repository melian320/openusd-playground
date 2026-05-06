import { useState } from 'react';
import { TrendingUp, AlertTriangle, Lightbulb, Target, ChevronDown, ChevronUp, BarChart3, Zap, Plus, Check, MessageSquare } from 'lucide-react';
import clsx from 'clsx';
import { useSettings, useAnnotations, useTasks } from '../hooks/useSettings';
import { toGenZ } from '../lib/assistantEngine';
import { ActivityFeed } from './ActivityFeed';

// Helper: apply Gen Z transform when mode is on
function gz(text: string, on: boolean): string {
  return on ? toGenZ(text) : text;
}

// Inline analysis data until agent-generated file is ready
interface MonthlySection {
  id: string;
  title: string;
  icon: string;
  score: number;
  headline: string;
  wins: string[];
  gaps: string[];
  actions: string[];
  priority: 'high' | 'medium' | 'low';
}

const MONTHLY_SECTIONS: MonthlySection[] = [
  {
    id: 'topics',
    title: 'Hot Topics',
    icon: '🔥',
    score: 78,
    headline: 'Strong robotics signal, but OpenUSD and Industrial DT coverage is thin',
    wins: [
      'π0.5 and diffusion policy debates are driving the highest cross-platform engagement in 6 months',
      'Humanoid locomotion (Unitree G1/H1) generating 3x normal GitHub activity',
      'Genesis simulator adoption rising fast as a MuJoCo alternative',
    ],
    gaps: [
      'OpenUSD ecosystem topics underrepresented — only 3 of 30 hot topics touch it',
      'Industrial digital twin ROI discussions happening on LinkedIn but not captured',
      'Vision AI at the edge barely surfaced despite being a top enterprise ask',
    ],
    actions: [
      'Set up keyword monitoring for "OpenUSD", "USD Composer", "digital twin" on LinkedIn and X',
      'Add CVPR 2026 paper tracking — vision AI topics will spike in June',
      'Create a dedicated Industrial DT topic cluster pulling from Siemens, ABB, Rockwell LinkedIn feeds',
    ],
    priority: 'high',
  },
  {
    id: 'communities',
    title: 'Communities',
    icon: '👥',
    score: 72,
    headline: 'Good breadth, but APAC and EMEA communities are underdiscovered',
    wins: [
      'Open-source communities (LeRobot, MuJoCo, Drake) added for the first time — strong signal quality',
      'Campus groups now tracked — MIT, Stanford, CMU, ETH Zurich all showing rising activity',
      '50 communities tracked across all Physical AI verticals',
    ],
    gaps: [
      'Only 5 APAC communities despite Japan, Korea, Singapore being hotbeds of robotics R&D',
      'No Chinese robotics communities tracked (Unitree HQ is Shenzhen) — major blind spot',
      'Industrial IoT and smart manufacturing communities thin vs. the actual industry size',
    ],
    actions: [
      'Scout WeChat, Weibo, and Bilibili for Chinese robotics communities',
      'Find and add 5 more APAC communities — look at ROS Japan, Korean robotics forums',
      'Add AMR-focused communities: MiR, Geek+, Quicktron user communities',
    ],
    priority: 'medium',
  },
  {
    id: 'conferences',
    title: 'Events',
    icon: '📅',
    score: 82,
    headline: 'Great conference coverage but hackathon/meetup layer just getting started',
    wins: [
      '50 events tracked including 10 new hackathons and 10 meetups across all regions',
      'Good CFP deadline tracking — 4 open CFPs identified for Q3 2026',
      'CVPR, RSS, IROS all captured with speaker lineups',
    ],
    gaps: [
      'No sponsorship pipeline — 12 "yes" sponsorship events with no follow-through tracking',
      'APAC events severely underrepresented — only 1 confirmed event in Asia',
      'Missing corporate open-house style events (Boston Dynamics, Figure AI, Agility regular demos)',
    ],
    actions: [
      'Create a sponsorship tracker for the 12 "yes" events and assign DRI to each',
      'Add IROS 2026 (Dubai) and ICRA 2027 CFP to the watch list',
      'Reach out to Tokyo Robot Meetup and Singapore AI & Robotics Meetup organizers for sponsorship',
    ],
    priority: 'high',
  },
  {
    id: 'speakers',
    title: 'Speakers',
    icon: '🎤',
    score: 68,
    headline: 'Strong researcher bench, but practitioners and startup founders underrepresented',
    wins: [
      '30 speakers tracked with klout scores — Jitendra Malik (91) and Chelsea Finn (88) are highest-value targets',
      'Good coverage of top academic labs: Berkeley, Stanford, CMU, MIT',
      'Speaker domains now tagged — makes routing content to right audiences easier',
    ],
    gaps: [
      'No speakers from Industrial DT world (Siemens, Rockwell, PTC, Ansys)',
      'Very few international speakers — 80% US-based, missing European and Asian voices',
      'Up-and-coming speakers (< 50K followers, high publication velocity) not tracked',
    ],
    actions: [
      'Add 10 practitioners from robotics companies (Covariant, Apptronik, 1X Technologies)',
      'Source 5 European speakers from ETH Zurich, TU Munich, IIT Genova research groups',
      'Build a "rising talent" watchlist: researchers with 2+ papers in last 6 months and active social',
    ],
    priority: 'medium',
  },
  {
    id: 'podcasts',
    title: 'Podcasts',
    icon: '🎙️',
    score: 60,
    headline: 'Good robotics podcast coverage but Industrial DT and OpenUSD shows are missing',
    wins: [
      '30 shows tracked across robotics, edge AI, foundation models, and physical AI broadly',
      'New shows added covering digital twins, edge AI, and computer vision topics',
      'Subscriber data and episode frequency now tracked for trend analysis',
    ],
    gaps: [
      'No podcasts focused specifically on OpenUSD or 3D infrastructure for Physical AI',
      'Industrial automation podcasts (Manufacturing Happy Hour, Quality during Manufacturing) undertracked',
      'No video-first shows tracked despite YouTube being the dominant format for technical deep-dives',
    ],
    actions: [
      'Audit top 20 robotics YouTube channels for guest booking opportunities',
      'Pitch The Robotics Podcast, Robots in Depth, and Underrepresented in Robotics for a Physical AI episode',
      'Track Manufacturing Happy Hour and Quality during Manufacturing for industrial DT crossover',
    ],
    priority: 'medium',
  },
  {
    id: 'discord',
    title: 'Discord',
    icon: '💬',
    score: 75,
    headline: 'Solid monitoring setup, but we are mostly observers not participants',
    wins: [
      '30 Discord channels monitored across 20+ servers — good signal on community health',
      'New topic clusters added: OpenUSD, Digital Twin, Foundation Models, Vision AI',
      'Weekly message velocity tracked — useful for spotting conversation spikes',
    ],
    gaps: [
      'We are data consumers only — no NVIDIA presence or active engagement in most channels',
      'No alerting system for when NVIDIA products are mentioned negatively',
      'Chinese robotics Discords not tracked — Unitree, DJI communities are large',
    ],
    actions: [
      'Identify 5 channels where NVIDIA tech is discussed and create a posting schedule for community engagement',
      'Set up keyword alerts for "Isaac", "GR00T", "Cosmos" mentions in monitored servers',
      'Join and introduce community presence in HuggingFace #robotics and LeRobot #hardware-builds',
    ],
    priority: 'high',
  },
  {
    id: 'papers',
    title: 'Papers',
    icon: '📄',
    score: 65,
    headline: 'NVIDIA-tech filter working well but paper volume is sparse for action',
    wins: [
      'Multi-source import working: arXiv, HuggingFace, Papers With Code, OpenReview',
      'NVIDIA technology detection (24 patterns) plus 15-topic Physical AI taxonomy in place',
      'HF upvotes, GitHub stars, and OpenReview venue data all surfaced per paper',
    ],
    gaps: [
      'Papers library requires manual import — no automated daily pull',
      'Citation velocity not tracked — can\'t tell which papers are breaking out vs. plateau',
      'No connection between papers and speakers (who\'s writing what we should be amplifying)',
    ],
    actions: [
      'Set up a weekly automated pull from HF daily papers filtered to Physical AI topics',
      'Link paper authors to Speaker profiles where matches exist',
      'Create a "must amplify" tag for papers with HF upvotes > 100 and NVIDIA tech mention',
    ],
    priority: 'medium',
  },
  {
    id: 'influencers',
    title: 'Influencers',
    icon: '⭐',
    score: 58,
    headline: 'Strong researcher bench tracked but zero active outreach has happened',
    wins: [
      '32 influencers tracked with klout scores, follower data, and sample posts',
      'Chelsea Finn (93) and Sergey Levine (95) are highest-value — both actively benchmarking GR00T',
      'shouldEngage flag active on 18 of 32 — clear prioritization already done',
    ],
    gaps: [
      'No outreach has been initiated — tracked list is still just a watchlist',
      'European and APAC influencers underrepresented — 80% of tracked profiles are US-based',
      'No micro-influencer strategy — missing high-growth accounts with 5K-50K followers and strong engagement',
    ],
    actions: [
      'Send personalized collaboration pitch to top 5 shouldEngage profiles — prioritize Chelsea Finn and Sergey Levine',
      'Add 5 European influencers (ETH Zurich, TU Munich, Oxford Robotics) and 3 APAC accounts',
      'Create a micro-influencer track: identify 10 rising creators with >15% follower growth rate and tag them',
    ],
    priority: 'high',
  },
  {
    id: 'videos',
    title: 'Dev Videos',
    icon: '🎬',
    score: 62,
    headline: 'Good global video coverage but amplification strategy is missing',
    wins: [
      '50 developer tutorials tracked across 8 product areas — global creator diversity across Americas, EMEA, APAC',
      '6 featured videos identified as highest-impact content for promotion',
      'Community creators (university labs, open-source, independents) account for 73% of catalog — strong third-party credibility signal',
    ],
    gaps: [
      'No videos are being actively promoted — identified but not amplified',
      'Zero co-creation deals with community creators despite high-quality content existing',
      'APAC tutorial gap — only 12 of 50 videos from Asian creators despite Japan/Korea/Singapore being key robotics markets',
    ],
    actions: [
      'Repost 3 community creator videos this month with credit — target ones using Isaac Lab or Jetson',
      'Reach out to top 3 non-NVIDIA creators about co-branded tutorial series with GPU credits as compensation',
      'Commission 2 APAC-region tutorials in Japanese and Korean for community-localized content',
    ],
    priority: 'medium',
  },
  {
    id: 'github',
    title: 'GitHub',
    icon: '🐙',
    score: 76,
    headline: 'IsaacLab and GR00T trending hard, but community fork ecosystem is undertapped',
    wins: [
      'IsaacLab at 14K stars / 3.5K forks / 120 contributors — strongest physical AI repo in the ecosystem and growing',
      'Newton physics simulator gaining 200% star growth/month since launch — fastest organic adoption curve we have ever seen',
      'GR00T (+88%) and Cosmos (+64%) showing healthy 30-day growth across stars, forks, and contributor activity',
      '15 community projects identified across LeRobot bridges, GR00T fine-tuning recipes, OpenUSD ROS integrations, and Newton tutorials',
    ],
    gaps: [
      'IsaacLab open PRs sitting at 80 — community contributions are stacking up faster than maintainers can review',
      '250 open issues on IsaacLab signaling unmet developer pain points — not feeding back into product roadmap',
      'No formal recognition program for top community contributors — projects like huggingface/lerobot-isaaclab-bridge are doing huge ecosystem work with zero reward',
      'LearnOpenUSD repo (~2K stars) underleveraged as a teaching tool — no companion video series, no curated lesson paths',
      'Alpamayo and nCore are NVIDIA-backed but community-invisible — < 1K stars combined despite high technical value',
    ],
    actions: [
      'Add 3 maintainers to IsaacLab to clear the 80-PR backlog within 60 days — unblocks community contribution velocity',
      'Launch a "Community Spotlight" monthly post highlighting top 3 community forks/tools, driving traffic from NVIDIA channels back to those repos',
      'Triage IsaacLab issues into product-team feedback loop — top 20 issues should map to roadmap items',
      'Pair LearnOpenUSD repo with Dev Videos OpenUSD content — link from README to tutorial videos and back',
      'Run a Newton physics community challenge in Q3 with $25K prize pool — capitalize on the 200% growth window before it cools',
      'Tag 5 high-signal community contributors for direct outreach — invite to NVIDIA developer programs and conference speaker slots',
    ],
    priority: 'high',
  },
];

const MONTHLY_SUMMARY = {
  month: 'May 2026',
  overallScore: 73,
  headline: 'Strong foundation, but we are mostly watching the game instead of playing in it.',
  topOpportunity: 'IsaacLab and Newton are showing 200%+ star growth — running a community challenge with a $25K prize pool this quarter would lock in developer mindshare before competitors catch up.',
  topRisk: 'IsaacLab has 80 open PRs and 250 open issues stacking up — community contribution velocity will stall and developers will start forking elsewhere if we do not add maintainers in the next 60 days.',
  bigBets: [
    'Add IsaacLab maintainers + launch a Newton community challenge — capitalize on the GitHub growth window',
    'Build an active Discord and community presence — shift from observer to participant in top 5 channels',
    'Expand APAC and EMEA coverage — add 15 communities, 10 events, 5 speakers from non-US regions',
  ],
  quickWins: [
    'Triage top 20 IsaacLab issues into the product roadmap and merge 30 of the 80 stalled PRs',
    'Set up keyword alerts for NVIDIA product mentions in 10 highest-traffic Discord servers this week',
    'Reach out to the Bay Area Physical AI Meetup organizer about co-sponsoring June event',
    'Add the 4 open CFPs to a shared calendar and assign a DRI to each submission',
  ],
};

const PRIORITY_STYLES = {
  high:   'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low:    'bg-gray-50 text-gray-500 border-gray-200',
};

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? 'text-emerald-600' : score >= 65 ? 'text-amber-500' : 'text-red-500';
  const bg    = score >= 80 ? 'bg-emerald-50'    : score >= 65 ? 'bg-amber-50'    : 'bg-red-50';
  return (
    <div className={clsx('w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0', bg, color)}>
      {score}
    </div>
  );
}

function ActionRow({ text, source }: { text: string; source: string }) {
  const { add, has } = useTasks();
  const added = has(text, source);
  return (
    <li className="text-xs text-gray-600 flex gap-1.5 group">
      <span className="text-blue-400 mt-0.5 flex-shrink-0">→</span>
      <span className="flex-1">{text}</span>
      <button
        onClick={() => !added && add(text, source)}
        disabled={added}
        title={added ? 'Already in tasks' : 'Add to tasks'}
        className={clsx(
          'flex-shrink-0 transition-all opacity-0 group-hover:opacity-100',
          added ? 'text-emerald-500 opacity-100' : 'text-gray-300 hover:text-blue-500'
        )}
      >
        {added ? <Check size={11} /> : <Plus size={11} />}
      </button>
    </li>
  );
}

function AnnotationBlock({ sectionId }: { sectionId: string }) {
  const { notes, set } = useAnnotations();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(notes[sectionId] ?? '');
  const current = notes[sectionId] ?? '';
  const save = () => { set(sectionId, draft); setEditing(false); };
  if (!editing && !current) {
    return (
      <button
        onClick={() => { setDraft(''); setEditing(true); }}
        className="text-[10px] font-medium text-gray-400 hover:text-blue-600 inline-flex items-center gap-1 mt-2"
      >
        <MessageSquare size={10} /> Add note
      </button>
    );
  }
  return (
    <div className="mt-2 border-t border-gray-100 pt-2">
      {editing ? (
        <div>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Your notes for this section…"
            rows={3}
            className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            autoFocus
          />
          <div className="flex items-center gap-2 mt-1.5">
            <button onClick={save} className="text-[10px] font-semibold bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded">Save</button>
            <button onClick={() => setEditing(false)} className="text-[10px] text-gray-400 hover:text-gray-700">Cancel</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => { setDraft(current); setEditing(true); }}
          className="w-full text-left bg-yellow-50/60 border border-yellow-200 rounded-lg px-2.5 py-1.5 hover:bg-yellow-50 transition-colors"
        >
          <p className="text-[10px] font-bold text-yellow-700 uppercase tracking-wide mb-0.5 flex items-center gap-1">
            <MessageSquare size={9} /> Your notes
          </p>
          <p className="text-xs text-gray-700 whitespace-pre-line">{current}</p>
        </button>
      )}
    </div>
  );
}

function SectionCard({ section, genZ }: { section: MonthlySection; genZ: boolean }) {
  const [open, setOpen] = useState(false);
  const taskSource = `Monthly: ${section.title}`;
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-sm transition-all">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <span className="text-2xl">{section.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-semibold text-sm text-gray-900">{section.title}</span>
            <span className={clsx('text-xs px-1.5 py-0.5 rounded-full border font-medium', PRIORITY_STYLES[section.priority])}>
              {section.priority} priority
            </span>
          </div>
          <p className="text-xs text-gray-500 line-clamp-1">{gz(section.headline, genZ)}</p>
        </div>
        <ScoreRing score={section.score} />
        {open ? <ChevronUp size={14} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-bold text-emerald-700 flex items-center gap-1 mb-2"><TrendingUp size={11} /> {genZ ? 'The slays' : 'Wins'}</p>
            <ul className="space-y-1.5">
              {section.wins.map((w, i) => (
                <li key={i} className="text-xs text-gray-600 flex gap-1.5"><span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>{gz(w, genZ)}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold text-amber-700 flex items-center gap-1 mb-2"><AlertTriangle size={11} /> {genZ ? 'The L\'s & lore gaps' : 'Gaps & Blind Spots'}</p>
            <ul className="space-y-1.5">
              {section.gaps.map((g, i) => (
                <li key={i} className="text-xs text-gray-600 flex gap-1.5"><span className="text-amber-400 mt-0.5 flex-shrink-0">!</span>{gz(g, genZ)}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold text-blue-700 flex items-center gap-1 mb-2"><Target size={11} /> {genZ ? 'The plays for June' : 'Actions for June'}</p>
            <ul className="space-y-1.5">
              {section.actions.map((a, i) => (
                <ActionRow key={i} text={gz(a, genZ)} source={taskSource} />
              ))}
            </ul>
          </div>
        </div>
      )}
      {open && (
        <div className="px-4 pb-3">
          <AnnotationBlock sectionId={section.id} />
        </div>
      )}
    </div>
  );
}

export function MonthlyAnalysis() {
  const { settings } = useSettings();
  const genZ = settings.genZMode;
  return (
    <div className="space-y-6">
      {/* Overall scorecard */}
      <div className={clsx(
        'rounded-2xl p-6 text-white transition-all',
        genZ
          ? 'bg-gradient-to-br from-fuchsia-600 via-pink-600 to-violet-700'
          : 'bg-gradient-to-br from-gray-900 to-gray-800'
      )}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 size={16} className="text-gray-400" />
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                {MONTHLY_SUMMARY.month} Dashboard Review {genZ && '· slay edition ✨'}
              </span>
            </div>
            <h2 className="text-lg font-bold leading-snug">{gz(MONTHLY_SUMMARY.headline, genZ)}</h2>
          </div>
          <div className="text-center flex-shrink-0">
            <div className="text-3xl font-black text-emerald-400">{MONTHLY_SUMMARY.overallScore}</div>
            <div className="text-xs text-gray-400">/ 100</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-xs text-emerald-300 font-semibold flex items-center gap-1 mb-1"><Zap size={10} /> {genZ ? 'Biggest W' : 'Top Opportunity'}</p>
            <p className="text-xs text-gray-200 leading-relaxed">{gz(MONTHLY_SUMMARY.topOpportunity, genZ)}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-xs text-red-300 font-semibold flex items-center gap-1 mb-1"><AlertTriangle size={10} /> {genZ ? 'Biggest L incoming' : 'Top Risk'}</p>
            <p className="text-xs text-gray-200 leading-relaxed">{gz(MONTHLY_SUMMARY.topRisk, genZ)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-xs text-violet-300 font-semibold flex items-center gap-1 mb-2"><TrendingUp size={10} /> {genZ ? 'Big bets bestie' : 'Big Bets for June'}</p>
            <ul className="space-y-1">
              {MONTHLY_SUMMARY.bigBets.map((b, i) => (
                <li key={i} className="text-xs text-gray-200 flex gap-1.5"><span className="text-violet-400">◆</span>{gz(b, genZ)}</li>
              ))}
            </ul>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-xs text-amber-300 font-semibold flex items-center gap-1 mb-2"><Lightbulb size={10} /> {genZ ? 'Quick wins (real quick)' : 'Quick Wins This Week'}</p>
            <ul className="space-y-1">
              {MONTHLY_SUMMARY.quickWins.map((q, i) => (
                <li key={i} className="text-xs text-gray-200 flex gap-1.5"><span className="text-amber-400">→</span>{gz(q, genZ)}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Activity feed */}
      <ActivityFeed />

      {/* Section breakdown */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <BarChart3 size={14} />
          {genZ ? 'Section breakdown (no skips)' : 'Section Breakdown'}
          <span className="text-xs text-gray-400 font-normal">— click any section to expand analysis</span>
        </h3>
        <div className="space-y-2">
          {[...MONTHLY_SECTIONS].sort((a, b) => {
            const p = { high: 0, medium: 1, low: 2 };
            return p[a.priority] - p[b.priority] || a.score - b.score;
          }).map(s => <SectionCard key={s.id} section={s} genZ={genZ} />)}
        </div>
      </div>
    </div>
  );
}
