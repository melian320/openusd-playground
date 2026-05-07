import { useState } from 'react';
import { TrendingUp, AlertTriangle, Lightbulb, Target, ChevronDown, ChevronUp, BarChart3, Zap, MessageSquare } from 'lucide-react';
import clsx from 'clsx';
import { useSettings, useAnnotations } from '../hooks/useSettings';
import { toGenZ } from '../lib/assistantEngine';
import { ActivityFeed } from './ActivityFeed';
import { candidateGlobalSources, globalSourceCoverageSummary, hasAutoGlobalSources, hotTopicAnalysisData, lastAutoRefresh, verifiedGlobalSources } from '../data/autoMerge';

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
  keyTakeaway?: string;
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
    headline: 'World models, autonomous-driving simulation, low-cost robot arms, and physical-reasoning benchmarks lead public buzz',
    keyTakeaway: hotTopicAnalysisData.summary || 'Hot Topics now runs as a daily listening report across HN, arXiv, YouTube, GitHub activity, and public RSS feeds. The strongest current lanes are world models, AV simulation, low-cost manipulation, physical reasoning, OpenUSD, and simulation tooling.',
    wins: [
      'Hot Topics now combines public discussion, research, video, OSS activity, and RSS/news signals before synthesis',
      'Each automated topic can carry product/sector tags, source evidence, confidence, and recommended next actions',
      'World models, OpenUSD, edge robotics, industrial digital twins, vision AI, and automotive simulation are all active enough to support dedicated content tracks',
    ],
    gaps: [
      'Reddit JSON endpoints still block CI runners (HTTP 403), so Reddit remains a documented gap rather than a scraped source',
      'Private Discord, Slack, and LinkedIn conversations are not scraped without permissioned access',
      'Industrial DT and CAE still need more stable public feeds from Siemens, ABB, Rockwell, Ansys, SIMULIA, and OpenFOAM communities',
      'The quality of generated actions depends on Claude enrichment being available in the scheduled workflow',
    ],
    actions: [
      'Review the generated Hot Topics action queue weekly and assign each high-priority trend to a dev-rel owner',
      'Add stable public RSS/news feeds for Siemens, ABB, Rockwell, Ansys, SIMULIA, OpenFOAM, ROS events, and major robotics conferences',
      'Use the top world-model trend to ship a Cosmos + GR00T + Isaac Sim explainer and benchmark plan',
      'Keep private/community-only channels as manual/permissioned inputs, not automated scraping targets',
    ],
    priority: 'high',
  },
  {
    id: 'communities',
    title: 'Communities',
    icon: '👥',
    score: 68,
    headline: 'Open-source robotics communities are reachable and active; APAC manufacturing communities remain underrepresented',
    keyTakeaway: 'Region balance is skewed: APAC has only 9/49 communities despite being where much of the world\'s robotics manufacturing and a large developer base lives. The public web makes many global communities easy to find, but region-specific signal still needs partner sourcing.',
    wins: [
      'Open-source robotics communities (ROS, LeRobot, MuJoCo, Drake, Nav2, Open-RMF, CARLA) are central, reachable, and already discuss NVIDIA stack components',
      'MIT, Stanford, CMU, ETH Zurich, Berkeley, TUM, IIT Genova, and Tokyo robotics groups are credible academic anchors for regional engagement',
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
    score: 66,
    headline: 'The verified event map now separates official source pages from older editorial inventory',
    keyTakeaway: 'The most reliable event intelligence should come from official event/source pages first. Americas and EMEA have strong anchors, while APAC coverage is improving through Sydney and Tokyo robotics/AI events but still needs Korea, China, Singapore, and India expansion.',
    wins: [
      'Official robotics/AI anchors now cover ICRA, RSS, IROS, CoRL, CVPR, NeurIPS, GTC, Automate, Hannover Messe, Embedded Vision Summit, IMTS, and Humanoids Summit',
      'Automate, Embedded Vision Summit, CVPR, GTC, IMTS, and IROS give Americas strong developer-relations surfaces across robotics, edge vision, AV, and industrial automation',
      'RSS Sydney, NeurIPS Sydney, Humanoids Summit Tokyo, JARA, and AIRoA establish credible APAC entry points for robot learning, humanoids, and AI robotics',
    ],
    gaps: [
      'Korea, China, Singapore, and India still need stronger source-backed regional event coverage',
      'Meetup/hackathon coverage is weak because many links are private, stale, or not exposed through stable public pages',
      'Corporate open-house and practitioner events remain hard to validate without partner submissions or official event calendars',
    ],
    actions: [
      'Add official APAC sources for Korea Robot World, ICRA/IROS regional chapters, Singapore robotics meetups, and India AI/robotics developer events',
      'Keep Global View source-first: only promote event claims when a public page confirms the event, date, and theme',
      'Ask regional partner teams for official community/event pages rather than private chat links',
    ],
    priority: 'high',
  },
  {
    id: 'speakers',
    title: 'Speakers',
    icon: '🎤',
    score: 70,
    headline: '37 speakers — median Klout 84/100, range 61–100. Robotics (35/37) and simulation (30/37) dominate; industrial DT has zero',
    keyTakeaway: 'Speaker pool is research-heavy and credible (top-tier names like Levine, Finn, Abbeel, Goldberg, Hutter, Malik) but has a glaring blind spot: zero speakers from Siemens / Rockwell / PTC / ANSYS / Dassault. The Rising Talent watchlist (6 names) averages 26% social growth and 3.3 papers in 6 months — that\'s the highest-signal pre-engagement cohort on the dashboard.',
    wins: [
      '6 speakers on the Rising Talent watchlist with verifiable paper output (2–5 each) and 18–34% social-follower growth — clear amplification candidates before they hit top-tier price tags',
      'Top tier (Klout 90+) covers the language-shaping voices: Sergey Levine, Chelsea Finn, Pieter Abbeel, Ken Goldberg, Marco Hutter, Jitendra Malik, Fei-Fei Li',
      'Domain coverage is broad enough for variety: 35 robotics, 30 simulation, 8 industrial, 5 healthcare, 4 edge-AI, 4 autonomous-vehicles',
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
    score: 64,
    headline: '30 shows tracked — Lex (4.2M) and SingularityHub (880K) anchor reach; ~18 shows under 50K subs are the booking-friendly tier',
    keyTakeaway: 'Distribution is bimodal — 4 shows (Lex 4.2M, SingularityHub 880K, NVIDIA On-Air 220K, MLST 158K) carry mass-reach; the rest are <100K and most under 50K. The smaller shows (TWIML 61K, Robot Brains 48K, Practical AI 52K, Robot Report 24K, Manufacturing Happy Hour 18.5K) are where guest booking actually closes — they are hungry, technical, and aligned.',
    wins: [
      'Top of funnel is real: Lex Fridman (4.2M subs), SingularityHub Robotics (880K), NVIDIA On-Air: Physical AI (220K), Machine Learning Street Talk (158K)',
      'Manufacturing-side coverage exists (Manufacturing Happy Hour 18.5K, The Digital Twin Show 18K, Edge AI Insider 12K) — small audiences but precisely the industrial DT decision-makers',
      '3 NVIDIA-owned shows in the inventory — owned distribution alongside the earned-media list',
    ],
    gaps: [
      'No auto-refresh — Spotify and Apple APIs require auth, neither in our pipeline',
      'No podcasts focused specifically on OpenUSD or 3D infrastructure for Physical AI',
      'Industrial automation podcasts (Manufacturing Happy Hour, Quality during Manufacturing) undertracked',
    ],
    actions: [
      'Run a guest-booking blitz on the ~18 shows under 50K subs — they convert fastest, especially TWIML, Robot Brains, Practical AI, Robot Report, Robohub, Toward Intelligent Machines',
      'Pitch one tier-1 episode (Lex / MLST / NVIDIA On-Air) per quarter with a flagship NVIDIA Physical AI guest (Deepu Talla / Rev Lebaredian / Jim Fan)',
      'Stand up a dedicated OpenUSD-for-Physical-AI show — there is no incumbent to compete with',
    ],
    priority: 'medium',
  },
  {
    id: 'discord',
    title: 'Discord',
    icon: '💬',
    score: 62,
    headline: '15 verified channels across 7 unique servers — NVIDIA Omniverse anchors with 5 channels at 38.5K members each',
    keyTakeaway: 'NVIDIA Omniverse (38.5K) + Hugging Face (38K) + comma.ai (28K) + ROS (21.5K) = ~125K reachable engineers across the 4 biggest verified servers. Coverage is thin (only 7 unique servers) but every entry is real and the membership concentration is high — fewer servers, more density per server is fine for now.',
    wins: [
      '5 NVIDIA Omniverse channels (#general, #isaac-sim, #openusd, #cosmos, #digital-twins) all in one verified 38.5K-member server — owned developer surface',
      'Hugging Face Discord (#robotics, #sim-to-real) at 38K members — already-active VLA + LeRobot conversation, perfect cross-amplification target',
      'comma.ai (28K members in #openpilot-dev) gives a credible AV-developer channel that is otherwise hard to reach',
    ],
    gaps: [
      'Only 7 unique servers — coverage breadth is thin; we need to verify and add more real public servers',
      'Still observer-mode in non-NVIDIA channels — no posting schedule or community engagement plan',
      'No member-count auto-refresh — Discord widget API would unlock this for public servers',
    ],
    actions: [
      'Verify and add 8–10 real Physical AI servers (target: bringing total back to ~25 verified channels)',
      'Stand up a posting schedule for the 4 highest-leverage non-NVIDIA channels (HF #robotics, HF #sim-to-real, ROS #isaac-ros, LeRobot #policy-training)',
      'Wire Discord widget API for public-server member counts on the daily refresh',
    ],
    priority: 'high',
  },
  {
    id: 'papers',
    title: 'Papers',
    icon: '📄',
    score: 68,
    headline: '40 most-recent arXiv papers (Apr 12 – May 5) — ~13/week cadence, 73% (29/40) cs.RO',
    keyTakeaway: 'arXiv cs.RO is producing roughly 13 Physical-AI-relevant papers per week in our keyword window. Topic mix on a hand-scan: VLA architectures (Latent Bridge, VILAS, CoRAL), low-cost teleoperation (Phone2Act), contact-rich manipulation, monocular depth, social-robot agents. The schema is bare (title/authors/abstract/category) — no NVIDIA-tech detection, no HF upvote signal, no author→speaker linkage yet, so the data is descriptive but not actionable.',
    wins: [
      'Steady weekly arXiv volume (~13/week) across the Physical AI keyword set — VLA, sim-to-real, world models, diffusion policy, contact-rich manipulation all represented in the last 3 weeks',
      '73% of pulled papers are cs.RO; remainder spreads across cs.CV (4), cs.AI (3), cs.LG/DC/CY/physics.optics — strong robotics signal-to-noise',
      'Independent research is producing low-cost / open-hardware contributions (Phone2Act $X teleoperation rig, VILAS soft-grasp arm) — community-friendly stories worth amplifying',
    ],
    gaps: [
      'Citation velocity not tracked — can\'t tell which papers are breaking out vs. plateau',
      'Papers not linked to Speaker profiles (when Sergey Levine publishes, dashboard doesn\'t surface it on his card)',
      'No NVIDIA-tech detection on the paper schema yet — can\'t auto-flag "uses Cosmos / Isaac Lab / GR00T" papers',
    ],
    actions: [
      'Add HuggingFace daily-papers integration as second source for upvote signal',
      'Build paper-to-speaker linkage by matching author names against Speaker entries',
      'Run NVIDIA-tech keyword detection on paper abstracts (24 patterns) so "must amplify" auto-surfaces',
    ],
    priority: 'medium',
  },
  {
    id: 'influencers',
    title: 'Influencers',
    icon: '⭐',
    score: 58,
    headline: '22 verified influencers — 7 top-tier (100K+), 15 macro (25–100K), 0 micro. Mean 124K followers',
    keyTakeaway: 'Top-tier reach concentrated in 3 accounts (top follower counts: 850K, 320K, 310K). Every single one of the 22 is flagged shouldEngage:true — meaning the flag has lost signal value (it is currently a tautology). The 0-micro gap is the real surprise: there is no plausible test cohort under 25K to run an A/B amplification experiment against the macro tier.',
    wins: [
      'Top-tier voices in the inventory have genuine reach: 3 accounts at 300K+ (likely Lex, plus top robot-learning leaders), 4 more in the 100–200K range',
      'Macro tier (25–100K) is well-populated at 15/22 — these are the practitioners with real technical credibility AND active engagement, the sweet spot for collab content',
      'All 22 entries verified-real with valid LinkedIn URLs and Twitter handles — no fabricated personas',
    ],
    gaps: [
      'Zero micro-influencers (<25K) — we have no test cohort for amplification experiments',
      'shouldEngage:true on all 22 means the flag has no discriminatory value — needs sub-tags (e.g. NVIDIA-aligned, neutral, skeptical)',
      'No follower-growth tracking — Twitter/X paywall blocks programmatic auto-refresh, so we can\'t spot rising voices automatically',
    ],
    actions: [
      'Add 8–10 verified-real micro-influencers (<25K) to enable a real micro-vs-macro amplification A/B',
      'Replace single shouldEngage flag with engagement-stance taxonomy: aligned / neutral / skeptical / declined',
      'Send personalized collaboration pitch to the top 5 (start with the 3 at 300K+, then the 4 at 100–200K)',
    ],
    priority: 'high',
  },
  {
    id: 'videos',
    title: 'Dev Videos',
    icon: '🎬',
    score: 78,
    headline: '151 videos across 16 channels, ~100M total views — Unitree Robotics alone drives 88M (88%) of all views',
    keyTakeaway: 'Massive audience asymmetry. Unitree\'s 10 most-recent uploads (88M views) outweigh every other channel combined. NVIDIA\'s own three channels (Developer + Omniverse + main) total ~31K views across 21 videos — 0.03% of catalog reach. The implication is uncomfortable but useful: NVIDIA needs Unitree, Lex (9M), Two Minute Papers (964K), and Boston Dynamics (867K) as distribution far more than they need NVIDIA-owned channels.',
    wins: [
      'Top reach is enormous: Unitree 88M, Lex Fridman 9M, The Construct 1.85M, Two Minute Papers 964K, Boston Dynamics 867K — total catalog ~100M views',
      '16 channels resolving cleanly via the YouTube API — daily refresh produces real titles, view counts, durations, and publishedDate',
      'Educational + research mix is strong: Two Minute Papers, Yannic Kilcher (328K), MLST, MIT CSAIL, Stanford HAI, ETH RSL — credible technical audience',
    ],
    gaps: [
      'NVIDIA-owned channels combined (~31K views) are 0.03% of catalog reach — the brand is structurally dependent on third-party amplification',
      'No view-count delta tracking — we know absolute views, not which videos are accelerating',
      'Zero co-creation deals with the high-reach community creators (Unitree, Lex, Two Minute Papers, Boston Dynamics) — opportunity is real but unaddressed',
    ],
    actions: [
      'Initiate co-creation pitches with the top 4 creators by reach (Unitree, Lex, Two Minute Papers, Boston Dynamics) — GPU credits + early access in exchange for episode/segment commitments',
      'Add view-count delta tracking to the daily refresh — flag any video whose 7-day view rate doubles week-over-week',
      'Add Claude enrichment step to auto-generate promote-this-video flags + 𝕏/LinkedIn copy on top-viewed videos',
    ],
    priority: 'high',
  },
  {
    id: 'github',
    title: 'GitHub',
    icon: '🐙',
    score: 68,
    headline: '9 NVIDIA repos, 30,340 total stars — Newton (39 commits/week) is the active one; Cosmos main repo silent since Jan 6',
    keyTakeaway: 'Two stories. (1) Newton is the breakout — 4,840★, 39 commits/week, 59 contributors, last commit today. (2) Cosmos main repo, despite being the largest at 8,094★, has not had a commit since 2026-01-06 (4 months). Two of the three Cosmos repos are similarly stale. The flagship-by-stars is also the most-stalled. IsaacLab carries the heaviest community-engagement load (241 open PRs / 396 open issues / 202 contributors).',
    wins: [
      'Newton physics simulator is the most active repo on the dashboard — 4,840★, 39 weekly commits, 59 contributors, last commit today (2026-05-06)',
      'IsaacLab has the largest contributor base — 7,094★, 3,473 forks, 202 contributors — community engagement is real even if the backlog is brutal',
      'GR00T (6,933★) and Cosmos (8,094★) anchor the lineup with strong star counts and real downstream interest',
      'LearnOpenUSD has 10 weekly commits on a 240★ base — small but actively maintained, ready to be amplified into the OpenUSD educational push',
    ],
    gaps: [
      'Cosmos main repo: last commit 2026-01-06 (4 months silent) despite being the 8,094★ flagship — looks abandoned to anyone scanning the timeline',
      'cosmos-predict1 and cosmos-transfer1: also stale since Jan 6 — entire Cosmos repo family has been dormant for one full quarter',
      'IsaacLab: 241 open PRs + 396 open issues — community contributions are stacking up faster than maintainers can review',
      'GR00T: 80 open PRs and only 37 contributors — small core team carrying a flagship repo',
      'NVIDIA/ncore at 153★ and 4 contributors — community-invisible; either needs marketing investment or rationalization',
    ],
    actions: [
      'Resume Cosmos commits or publish a roadmap update — 4 months of silence on the 8,094★ flagship is the single biggest brand risk on the repo dashboard',
      'Add 5 maintainers to IsaacLab to attack the 241-PR backlog — even merging the easy 80 would unblock significant contribution velocity',
      'Run a Newton physics community challenge in Q3 with a $25K prize pool — the repo has 39 commits/week of momentum to capitalize on',
      'Pair LearnOpenUSD with the OpenUSD video tutorials and ICRA OpenUSD workshop — cross-link READMEs ↔ videos ↔ event content for compounding discovery',
      'Add 3 maintainers + a community-contribution program for GR00T — 37 contributors is too thin for a flagship repo',
    ],
    priority: 'high',
  },
];

const MONTHLY_SUMMARY = {
  month: 'May 2026',
  overallScore: 67,
  headline: 'Inventory is honest and the data is alive — but two flagship signals (Cosmos repo silence and IsaacLab backlog) are quietly eroding contributor confidence.',
  topOpportunity: 'Newton physics simulator is the most active repo on the dashboard — 4,840★, 39 commits/week, 59 contributors, last commit today. A Q3 community challenge ($25K prize pool) plus a Newton x LearnOpenUSD content pairing would lock in developer mindshare while the momentum is fresh and compound it across the OpenUSD educational push.',
  topRisk: 'The Cosmos main repo has had zero commits since 2026-01-06 — 4 months of public silence on the 8,094★ flagship. cosmos-predict1 and cosmos-transfer1 are similarly stale. To anyone scanning the timeline, the entire Cosmos repo family looks abandoned. If the silence continues into Q3, the strongest brand asset in the lineup will hemorrhage credibility just as world-models hit peak buzz (92/100 trending).',
  bigBets: [
    'Resume Cosmos commit cadence (or publish a roadmap update) within 30 days — the 4-month silence on the 8,094★ flagship is the single highest-leverage signal NVIDIA can send right now',
    'Add 5 maintainers to IsaacLab to drain the 241-PR / 396-issue backlog before forks accelerate',
    'Run a Newton community challenge in Q3 with $25K prize pool — capitalize on the 39-commits/week momentum',
    'Co-creation pitches to the top 4 high-reach creators (Unitree 88M, Lex 9M, Two Minute Papers 964K, Boston Dynamics 867K) — NVIDIA-owned channels alone reach 0.03% of catalog views',
  ],
  quickWins: [
    'Merge the easiest 30 of the 241 stalled IsaacLab PRs this week — symbolic and practical signal to contributors',
    'Booking blitz on the ~18 podcasts under 50K subs (Robot Brains, TWIML, Practical AI, Robot Report, Manufacturing Happy Hour) — these convert fastest',
    'Activate outreach on the 6 Rising Talent watchlist speakers (avg 26% social growth, 3.3 papers in 6 months) — engage before top-tier price tags',
    'Pair LearnOpenUSD repo (240★, 10 commits/week) with the OpenUSD-tagged videos and ICRA OpenUSD workshop — instant compounding discovery',
    'Add 8–10 verified-real Discord servers + 8–10 micro-influencers (<25K) to rebuild breadth where the audit thinned coverage',
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

function ActionRow({ text }: { text: string }) {
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

      {open && section.keyTakeaway && (
        <div className="border-t border-gray-100 px-4 pt-3">
          <div className="bg-blue-50/60 border border-blue-200 rounded-lg px-3 py-2.5">
            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wide mb-1 flex items-center gap-1">
              <Lightbulb size={10} /> {genZ ? 'The tea' : 'Key Takeaway'}
            </p>
            <p className="text-xs text-gray-700 leading-relaxed">{gz(section.keyTakeaway, genZ)}</p>
          </div>
        </div>
      )}

      {open && (
        <div className={clsx(section.keyTakeaway ? 'px-4 pb-4 pt-3' : 'border-t border-gray-100 px-4 pb-4 pt-3', 'grid grid-cols-1 md:grid-cols-3 gap-4')}>
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
                <ActionRow key={i} text={gz(a, genZ)} />
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
  const refreshedAt = lastAutoRefresh();
  const coverage = globalSourceCoverageSummary();
  const globalCoverageTotal = coverage.americas + coverage.emea + coverage.apac + coverage.global;
  const globalHeadline = hasAutoGlobalSources()
    ? `${verifiedGlobalSources.length} verified and ${candidateGlobalSources.length} candidate source pages across Americas, EMEA, APAC, and global channels`
    : `${globalCoverageTotal} source seeds across Americas, EMEA, APAC, and global channels awaiting first automated verification`;
  const globalSection: MonthlySection = {
    id: 'global',
    title: 'Global View',
    icon: '🌐',
    score: 74,
    headline: globalHeadline,
    keyTakeaway: `Verified/candidate coverage is Americas ${coverage.americas}, EMEA ${coverage.emea}, APAC ${coverage.apac}, Global ${coverage.global}. Global and Americas coverage are strongest; APAC is now represented by credible Japan/Sydney/Tokyo sources but still needs broader regional discovery.`,
    wins: [
      'Official NVIDIA surfaces, ROS/OpenUSD ecosystems, major robotics conferences, and regional robotics associations are now represented as source-backed entries',
      'APAC coverage includes Japan Robot Association, AIRoA, RSS Sydney, NeurIPS Sydney, and Humanoids Summit Tokyo as credible public entry points',
      'Americas coverage includes MassRobotics, Silicon Valley Robotics, Pittsburgh Robotics Network, Automate, Embedded Vision Summit, IMTS, CVPR, CoRL, and IROS',
    ],
    gaps: [
      'Korea, China, Singapore, and India need more official public sources before the regional view can be considered balanced',
      'Private Discord, Slack, WeChat, and LinkedIn community activity is intentionally not scraped, so some real community energy remains invisible',
      'Meetups and hackathons remain weaker than conferences because many public links are unstable or lack durable source pages',
    ],
    actions: [
      'Add source-backed APAC regional associations and event calendars before adding more inferred community rows',
      'Require source evidence for any claim that a specific NVIDIA product is part of an event track or workshop',
      'Use candidate entries as the review queue for regional partner validation each month',
    ],
    priority: 'high',
  };
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
                {MONTHLY_SUMMARY.month} Dashboard Review · Editorial snapshot
                {refreshedAt && ` · auto data refreshed ${new Date(refreshedAt).toLocaleDateString()}`}
                {genZ && ' · slay edition ✨'}
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
          {[globalSection, ...MONTHLY_SECTIONS].sort((a, b) => {
            const p = { high: 0, medium: 1, low: 2 };
            return p[a.priority] - p[b.priority] || a.score - b.score;
          }).map(s => <SectionCard key={s.id} section={s} genZ={genZ} />)}
        </div>
      </div>
    </div>
  );
}
