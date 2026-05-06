import { useState } from 'react';
import { TrendingUp, AlertTriangle, Lightbulb, Target, ChevronDown, ChevronUp, BarChart3, Zap, MessageSquare } from 'lucide-react';
import clsx from 'clsx';
import { useSettings, useAnnotations } from '../hooks/useSettings';
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
    score: 76,
    headline: '30 curated topics + 8 daily Claude-synthesized topics from HN signals — Reddit channel still missing',
    wins: [
      'Static cluster coverage solid: WFM, Robotics, OpenUSD, Edge AI, Industrial DT, Vision AI, Automotive',
    ],
    gaps: [
      'Reddit JSON endpoints now block CI runners (HTTP 403) — lost roughly half the hot-topic signal volume',
      'No cross-platform deduplication — same topic appearing on HN and arXiv counted twice',
      'LinkedIn / X signals not captured at all — biggest blind spot for industrial DT and corporate announcements',
      'CAE cluster has zero dedicated hot topics — ANSYS / Simulia / OpenFOAM / CFD chatter not currently surfaced even though the detection layer is wired',
    ],
    actions: [
      'Restore Reddit signal via authenticated API or partner script (no longer free + simple)',
      'Add deduplication step in Claude prompt to merge same-concept topics across sources',
      'Pilot LinkedIn RSS scraping for Siemens, ABB, Rockwell official feeds — non-paywalled and TOS-compliant',
      'Curate a CAE hot topic (ANSYS / Simulia / OpenFOAM community activity, AI-assisted CFD/FEA workflows) so the cluster has real content behind it',
    ],
    priority: 'high',
  },
  {
    id: 'communities',
    title: 'Communities',
    icon: '👥',
    score: 70,
    headline: '49 communities tracked after audit removed fabricated entries — coverage is real, but thinner than before',
    wins: [
      'Open-source communities well represented — LeRobot, MuJoCo, Drake all in the tracked set',
      'Campus groups tracked across MIT, Stanford, CMU, ETH Zurich, IIT Genova',
    ],
    gaps: [
      'Chinese ecosystem coverage limited to forum/Discord proxies — no presence on WeChat, Weibo, Bilibili where most Chinese robotics chatter actually happens',
      'Industrial IoT and smart manufacturing communities thin vs. the actual industry size',
      'No telemetry on community engagement — we know they exist, not whether NVIDIA tech is being discussed in them',
    ],
    actions: [
      'Add lightweight bot/manual sweep for top 10 Chinese WeChat groups via partner intros',
      'Tag each community with last NVIDIA product mention date — surface stale ones for re-engagement',
      'Add AMR-focused communities: MiR, Geek+, Quicktron user communities',
    ],
    priority: 'medium',
  },
  {
    id: 'conferences',
    title: 'Events',
    icon: '📅',
    score: 70,
    headline: '24 conferences + 9 meetups/hackathons after audit — fabricated entries and fake Luma URLs removed',
    wins: [
      'Major conferences verified (CVPR, RSS, ICRA, IROS, CoRL, NeurIPS, GTC) — these anchor the calendar',
    ],
    gaps: [
      'Sponsorship state still manual — no DRI assignment, no follow-through tracking after the flag is set',
      'APAC events still underrepresented relative to the actual market (Tokyo, Seoul, Singapore robotics scenes are dense but only 5-6 events tracked there)',
      'Missing corporate open-house events (Boston Dynamics, Figure, Agility regular demos)',
    ],
    actions: [
      'Create a sponsorship tracker for the 12 "yes"-flagged events — assign DRI, set deadline, track outcome',
      'Add IROS 2026 (Dubai) and ICRA 2027 CFP to the watch list',
      'Reach out to Tokyo Robot Meetup and Singapore AI & Robotics Meetup organizers for sponsorship',
    ],
    priority: 'high',
  },
  {
    id: 'speakers',
    title: 'Speakers',
    icon: '🎤',
    score: 70,
    headline: '37 speakers tracked after audit — fabricated personas removed, real names with verifiable affiliations remain',
    wins: [
      'Klout scores spread well — top tier (Sergey Levine, Chelsea Finn, Pieter Abbeel) for credibility, mid-tier practitioners for technical depth',
    ],
    gaps: [
      'Industrial DT world (Siemens, Rockwell, PTC, Ansys) still has zero speakers in the system',
      'Speakers tagged but not yet linked to papers — when Sergey Levine publishes, the dashboard does not surface that connection',
      'No outreach state tracked — list is pure inventory, not workflow',
    ],
    actions: [
      'Link Speaker entries to Papers via author-name match — surface "X just published" automatically',
      'Add 5 industrial DT speakers from Siemens / ABB / Rockwell / Dassault',
      'Layer outreach state on each speaker (uncontacted / pitched / responded / booked)',
    ],
    priority: 'medium',
  },
  {
    id: 'podcasts',
    title: 'Podcasts',
    icon: '🎙️',
    score: 60,
    headline: '30 shows tracked but no auto-refresh and no OpenUSD-specific shows exist',
    wins: [
      '30 podcasts tracked covering robotics, edge AI, foundation models, and Physical AI broadly',
    ],
    gaps: [
      'No auto-refresh — Spotify and Apple APIs require auth, neither in our pipeline',
      'No podcasts focused specifically on OpenUSD or 3D infrastructure for Physical AI',
      'Industrial automation podcasts (Manufacturing Happy Hour, Quality during Manufacturing) undertracked',
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
    score: 65,
    headline: '15 verified Discord channels — fabricated invites removed; coverage is now thin but trustworthy',
    wins: [
      'NVIDIA Omniverse Discord channels remain (#general, #isaac-sim, #openusd, #cosmos, #digital-twins) — verified real invite',
    ],
    gaps: [
      'Coverage is thin — 15 channels is too few; we need to find more real, verifiable invites to rebuild breadth',
      'Still observer-mode in non-NVIDIA channels — no posting schedule or community engagement plan',
      'No member-count auto-refresh — Discord widget API would unlock this for public servers',
    ],
    actions: [
      'Identify 5 channels where NVIDIA tech is discussed and create a posting schedule for community engagement',
      'Set up keyword alerts for "Isaac", "GR00T", "Cosmos", "Newton" mentions in monitored servers',
      'Join and introduce community presence in HuggingFace #robotics and LeRobot #hardware-builds',
    ],
    priority: 'high',
  },
  {
    id: 'papers',
    title: 'Papers',
    icon: '📄',
    score: 72,
    headline: 'arXiv auto-pull live (40 papers/day) — citation velocity and author-speaker linkage still missing',
    wins: [
      'arXiv cs.RO and Physical AI keyword space is producing a steady stream of new work — GR00T, Cosmos, OpenUSD, diffusion policy, sim-to-real, and world-model papers all showing weekly volume',
    ],
    gaps: [
      'Citation velocity not tracked — can\'t tell which papers are breaking out vs. plateau',
      'Papers not linked to Speaker profiles (when Sergey Levine publishes, dashboard doesn\'t surface it on his card)',
      'No "must amplify" auto-flag yet — papers with NVIDIA tech mention and high HF upvotes are not visually distinct',
    ],
    actions: [
      'Add HuggingFace daily-papers integration as second source for upvote signal',
      'Build paper-to-speaker linkage by matching author names against Speaker entries',
      'Auto-flag papers with NVIDIA tech AND >50 arXiv-listed citations as "must amplify"',
    ],
    priority: 'medium',
  },
  {
    id: 'influencers',
    title: 'Influencers',
    icon: '⭐',
    score: 60,
    headline: '22 verified-real influencers — fabricated personas removed, recentPosts arrays stripped (no more invented quotes)',
    wins: [
      'Top-tier Physical AI voices (Chelsea Finn, Sergey Levine, Jim Fan) remain active and engageable across X / LinkedIn',
      'Healthy mix across micro / macro / top tiers means a balanced amplification strategy is feasible',
    ],
    gaps: [
      'Roster is now thinner — 22 verified-real beats 50 with fabrications, but we need to rebuild breadth carefully',
      'Outreach has not started — tracked list is pure inventory, not workflow',
      'No follower-growth tracking — Twitter/X paywall blocks programmatic auto-refresh',
    ],
    actions: [
      'Send personalized collaboration pitch to top 5 shouldEngage profiles — prioritize Chelsea Finn, Sergey Levine, Jim Fan',
      'Pilot 3 micro-influencers (<25K) for a co-amplification test — measure engagement vs. macros',
      'Wire follower-count refresh via paid Twitter/X API or scrape-as-a-service if budget allows',
    ],
    priority: 'high',
  },
  {
    id: 'videos',
    title: 'Dev Videos',
    icon: '🎬',
    score: 75,
    headline: 'Fully auto-pulled — 16 verified YouTube channels, ~150 real videos refreshed daily',
    wins: [
      '16 active Physical AI YouTube channels (NVIDIA Developer/Omniverse, ETH RSL, MIT CSAIL, Stanford HAI, Boston Dynamics, Unitree, Pollen, 1X, Lex Fridman, Two Minute Papers, Yannic Kilcher, and others) — consistent upload cadence across the set',
    ],
    gaps: [
      'Promotion flags + social copy were lost in the cleanup (they were attached to fake videos that no longer exist)',
      'Zero co-creation deals with community creators — opportunity is real but unaddressed',
      'View counts pulled but not surfaced as deltas — we know absolute views, not which videos are accelerating',
    ],
    actions: [
      'Add Claude enrichment step to auto-generate promote-this-video flags + 𝕏/LinkedIn copy on top-viewed videos',
      'Reach out to top 3 non-NVIDIA creators (ETH RSL, Hugging Face, Pollen Robotics) about co-branded tutorials with GPU credits',
      'Add view-count delta tracking to the daily refresh — flag any video whose 7-day view rate doubles week-over-week',
    ],
    priority: 'medium',
  },
  {
    id: 'github',
    title: 'GitHub',
    icon: '🐙',
    score: 70,
    headline: 'Live data flowing for 9 NVIDIA repos — IsaacLab PR backlog is far worse than feared (241 open)',
    wins: [
      'Cosmos (8,094 ⭐) is the breakout — flagship world-foundation-model repo, larger than IsaacLab in absolute stars',
      'IsaacLab at 7,092 ⭐ / 3,473 forks / 202 contributors — strong contributor base for a sim framework',
      'Newton physics simulator: 4,840 ⭐, 39 weekly commits, 59 contributors — extremely active development for a brand-new repo',
      'GR00T at 6,931 ⭐ / 37 contributors — focused team, healthy issue volume',
    ],
    gaps: [
      'IsaacLab has 241 open PRs (3x worse than initially estimated) — community contributions are stacking up faster than maintainers can review',
      'IsaacLab has 396 open issues — the backlog signals significant unmet developer pain not feeding back into product roadmap',
      'GR00T has 80 open PRs and only 37 contributors — small core team carrying a flagship repo',
      'LearnOpenUSD at only 240 ⭐ despite being NVIDIA\'s primary OpenUSD teaching resource — massive growth headroom, currently underleveraged',
      'NVIDIA/ncore at 153 ⭐ — community-invisible. Either needs marketing or rationalization',
    ],
    actions: [
      'Add 5 maintainers to IsaacLab to attack the 241-PR backlog — even merging the easy 80 would unblock significant contribution velocity',
      'Triage top 30 IsaacLab issues into the product-team backlog — these are real user signals',
      'Run a Newton physics community challenge in Q3 with a $25K prize pool — the repo has 39 commits/week of momentum to capitalize on',
      'Pair LearnOpenUSD repo with the Dev Videos OpenUSD content — cross-link READMEs ↔ tutorial videos to compound discovery',
      'Add 3 maintainers + a community-contribution program for GR00T — 37 contributors is too thin for a flagship repo',
      'Launch a "Community Spotlight" monthly post highlighting external NVIDIA-stack contributions on huggingface/lerobot, real-stanford/diffusion_policy, leggedrobotics/legged_gym',
    ],
    priority: 'high',
  },
];

const MONTHLY_SUMMARY = {
  month: 'May 2026',
  overallScore: 71,
  headline: 'Cleaner inventory, smaller surface — every entry is now defensible. Time to actually engage.',
  topOpportunity: 'Newton physics simulator is genuinely on fire — 4,840 stars and 39 commits/week of active development. A $25K Q3 community challenge would lock in developer mindshare while the momentum is still fresh.',
  topRisk: 'IsaacLab has 241 open PRs and 396 open issues — far worse than expected. Community contribution velocity is already stalling; without 5 new maintainers in the next 60 days, developers will start forking the project to alternative simulation stacks.',
  bigBets: [
    'Add 5 maintainers to IsaacLab to attack the 241-PR backlog — most urgent action on the entire dashboard',
    'Run a Newton community challenge in Q3 with $25K prize pool — capitalize on the 39-commits/week momentum',
    'Rebuild Discord and Influencer breadth carefully — post-audit numbers are thin (15 channels, 22 influencers), but every remaining entry is verified-real',
  ],
  quickWins: [
    'Merge the easiest 30 of the 241 stalled IsaacLab PRs this week — symbolic and practical signal to contributors',
    'Activate outreach on the surviving shouldEngage influencers (Chelsea Finn, Sergey Levine, Jim Fan, etc.)',
    'Pair LearnOpenUSD repo (240 ⭐) with the OpenUSD video tutorials — instant compounding discovery',
    'Find 10 more verified Discord servers to bring channel coverage back to ~25',
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

function ActionRow({ text }: { text: string; source?: string }) {
  return (
    <li className="text-xs text-gray-600 flex gap-1.5">
      <span className="text-blue-400 mt-0.5 flex-shrink-0">→</span>
      <span className="flex-1">{text}</span>
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
                {MONTHLY_SUMMARY.month} Dashboard Review · Editorial · numbers reflect latest auto-refresh {genZ && '· slay edition ✨'}
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
