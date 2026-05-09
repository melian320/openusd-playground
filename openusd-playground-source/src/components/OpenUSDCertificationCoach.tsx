import { useMemo, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  BookOpen,
  Boxes,
  Brain,
  Check,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Clock3,
  Compass,
  Database,
  Download,
  ExternalLink,
  Eye,
  FileQuestion,
  Film,
  GitBranch,
  GraduationCap,
  Layers,
  Map,
  MousePointerClick,
  Paintbrush,
  Puzzle,
  RefreshCw,
  Route,
  Search,
  Sparkles,
  Target,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import clsx from 'clsx';
import {
  certificationUrl,
  domainVisualMeta,
  examBlueprintDomains,
  examSnapshot,
  learnOpenUSDSourceUrl,
  openUSDGlossaryTerms,
  openUSDLearningModules,
  practiceQuestions,
  studyGuideUrl,
  type OpenUSDDomainId,
  type OpenUSDLearningModule,
} from '../data/openusdCertification';
import { usePersistedState } from '../hooks/useSettings';

type View = 'start' | 'model' | 'lessons' | 'practice' | 'plan' | 'resources';
type ScenePieceId = 'asset' | 'material' | 'light' | 'variant' | 'payload';
type PaceId = 'quick' | 'steady' | 'cert';

const VIDEO_PLAYLIST_URL = 'https://www.youtube.com/playlist?list=PL3jK4xNnlCVf3HuZD4qOWlKlouJyh6Prb';

const DOMAIN_ICONS: Record<OpenUSDDomainId, LucideIcon> = {
  composition: Layers,
  'content-aggregation': Boxes,
  'customizing-usd': Wrench,
  'data-exchange': RefreshCw,
  'data-modeling': Database,
  debugging: Search,
  'pipeline-development': GitBranch,
  visualization: Eye,
};

const JOURNEY_STEPS: {
  id: View;
  label: string;
  short: string;
  promise: string;
  Icon: LucideIcon;
}[] = [
  {
    id: 'start',
    label: 'Start Here',
    short: 'Why it matters',
    promise: 'OpenUSD in plain English before any jargon.',
    Icon: Sparkles,
  },
  {
    id: 'model',
    label: 'Mental Model',
    short: 'See the idea',
    promise: 'Build a small visual scene and watch the pieces combine.',
    Icon: Eye,
  },
  {
    id: 'lessons',
    label: 'Learn Path',
    short: 'Follow the docs',
    promise: 'Break NVIDIA Learn OpenUSD into approachable steps.',
    Icon: Map,
  },
  {
    id: 'practice',
    label: 'Practice',
    short: 'Check yourself',
    promise: 'Use light, source-linked questions to build confidence.',
    Icon: FileQuestion,
  },
  {
    id: 'plan',
    label: 'Certification',
    short: 'Prepare',
    promise: 'Turn the exam blueprint into a study plan.',
    Icon: GraduationCap,
  },
  {
    id: 'resources',
    label: 'Resources',
    short: 'Go deeper',
    promise: 'Official links, videos, and how to use them.',
    Icon: BookOpen,
  },
];

const TEACHING_LOOP = [
  {
    title: 'See it',
    body: 'Start with a picture or scenario, not a definition.',
    Icon: Eye,
    color: 'border-cyan-200 bg-cyan-50 text-cyan-800',
  },
  {
    title: 'Say it',
    body: 'Restate the idea in everyday words.',
    Icon: Brain,
    color: 'border-blue-200 bg-blue-50 text-blue-800',
  },
  {
    title: 'Try it',
    body: 'Make one choice in a tiny example.',
    Icon: MousePointerClick,
    color: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  {
    title: 'Check it',
    body: 'Connect the idea back to official Learn OpenUSD material.',
    Icon: ClipboardCheck,
    color: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
];

const START_OUTCOMES = [
  {
    title: 'Understand the why',
    body: 'OpenUSD helps teams build complex 3D worlds without locking everything inside one fragile file.',
    Icon: Sparkles,
    color: 'border-cyan-200 bg-cyan-50 text-cyan-800',
  },
  {
    title: 'Build a mental picture',
    body: 'You will learn to picture a stage, layers, assets, choices, and the final composed scene.',
    Icon: Layers,
    color: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  {
    title: 'Prepare with calm',
    body: 'The app turns certification topics into a map, so study feels sequenced instead of scattered.',
    Icon: Target,
    color: 'border-rose-200 bg-rose-50 text-rose-800',
  },
];

const PACE_OPTIONS: Record<PaceId, {
  label: string;
  time: string;
  path: string[];
  note: string;
}> = {
  quick: {
    label: 'I have 15 minutes',
    time: 'Quick start',
    path: ['Start Here', 'Mental Model', '3 key terms', '1 practice check'],
    note: 'Best when you want the idea to click before reading the official docs.',
  },
  steady: {
    label: 'I want a beginner journey',
    time: '1-2 weeks',
    path: ['Start Here', 'Mental Model', 'Learn Path', 'Resources'],
    note: 'Best when you want a non-technical route through the Learn OpenUSD materials.',
  },
  cert: {
    label: 'I want certification prep',
    time: '4+ weeks',
    path: ['Learn Path', 'Practice', 'Certification', 'Study guide'],
    note: 'Best when you want to map your study time to the NVIDIA exam blueprint.',
  },
};

const SCENE_PIECES: {
  id: ScenePieceId;
  label: string;
  term: string;
  plain: string;
  Icon: LucideIcon;
  color: string;
}[] = [
  {
    id: 'asset',
    label: 'Asset',
    term: 'Prim',
    plain: 'A thing in the scene, like a house, robot, light, or camera.',
    Icon: Boxes,
    color: 'border-blue-200 bg-blue-50 text-blue-800',
  },
  {
    id: 'material',
    label: 'Color',
    term: 'Attribute',
    plain: 'A value on that thing, such as color, size, or position.',
    Icon: Paintbrush,
    color: 'border-rose-200 bg-rose-50 text-rose-800',
  },
  {
    id: 'light',
    label: 'Light',
    term: 'Schema',
    plain: 'A known type of scene thing with expected properties.',
    Icon: Sparkles,
    color: 'border-lime-200 bg-lime-50 text-lime-800',
  },
  {
    id: 'variant',
    label: 'Choice',
    term: 'Variant',
    plain: 'A planned option, like small or large, red or blue, draft or final.',
    Icon: Puzzle,
    color: 'border-violet-200 bg-violet-50 text-violet-800',
  },
  {
    id: 'payload',
    label: 'Heavy detail',
    term: 'Payload',
    plain: 'A loadable piece that can stay off until you need it.',
    Icon: Download,
    color: 'border-amber-200 bg-amber-50 text-amber-800',
  },
];

const BEGINNER_TERMS = ['Stage', 'Layer', 'Prim', 'Attribute', 'Relationship', 'Schema', 'Composition Arc', 'Variant Set', 'Payload'];

const LESSON_GROUPS: {
  title: string;
  subtitle: string;
  moduleIds: string[];
  color: string;
}[] = [
  {
    title: 'Foundation',
    subtitle: 'Learn what OpenUSD is and what words to recognize first.',
    moduleIds: ['orientation', 'stage-setting', 'scene-description-blueprints'],
    color: 'border-cyan-200 bg-cyan-50 text-cyan-900',
  },
  {
    title: 'How scenes combine',
    subtitle: 'Understand the core idea behind layers, opinions, variants, and composition.',
    moduleIds: ['composition-basics', 'beyond-basics', 'creating-composition-arcs'],
    color: 'border-violet-200 bg-violet-50 text-violet-900',
  },
  {
    title: 'Production thinking',
    subtitle: 'Study assets, data exchange, scale, instancing, and pipeline decisions.',
    moduleIds: ['asset-structure', 'data-exchange', 'asset-modularity-instancing'],
    color: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  },
];

const READINESS_CHECKS = [
  'I can explain OpenUSD without starting with file extensions.',
  'I can describe stage, layer, prim, attribute, schema, and variant in plain English.',
  'I can explain why composition matters when multiple files or teams contribute.',
  'I can connect each certification domain to at least one Learn OpenUSD lesson.',
  'I can answer practice questions by reasoning from the source material.',
];

const RESOURCE_LINKS = [
  {
    label: 'NVIDIA Learn OpenUSD',
    body: 'Official curriculum with modules, exercises, glossary, and study resources.',
    href: learnOpenUSDSourceUrl,
    Icon: BookOpen,
  },
  {
    label: 'Certification page',
    body: 'Official exam details, blueprint topics, registration, and policies.',
    href: certificationUrl,
    Icon: GraduationCap,
  },
  {
    label: 'Certification study guide',
    body: 'The deeper study companion for preparing toward the NCP-OUSD exam.',
    href: studyGuideUrl,
    Icon: Download,
  },
  {
    label: 'OpenUSD video series',
    body: 'A watch path for visual learners who want another way into the concepts.',
    href: VIDEO_PLAYLIST_URL,
    Icon: Film,
  },
];

function pct(done: number, total: number) {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

function findModule(id: string) {
  return openUSDLearningModules.find(module => module.id === id) ?? openUSDLearningModules[0];
}

function ProgressBar({ value, color = 'bg-emerald-500' }: { value: number; color?: string }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
      <div className={clsx('h-full rounded-full transition-all duration-300', color)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

function SourceLink({
  href,
  children,
  variant = 'dark',
}: {
  href: string;
  children: ReactNode;
  variant?: 'dark' | 'light';
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-black transition-colors',
        variant === 'dark'
          ? 'bg-gray-950 text-white hover:bg-gray-800'
          : 'border border-gray-200 bg-white text-gray-800 hover:bg-gray-50',
      )}
    >
      {children}
      <ExternalLink size={15} />
    </a>
  );
}

function JourneyNav({ activeView, onChange }: { activeView: View; onChange: (view: View) => void }) {
  return (
    <nav className="tab-bar flex gap-2 overflow-x-auto rounded-lg border border-gray-200 bg-white p-1" aria-label="OpenUSD learning journey">
      {JOURNEY_STEPS.map((step, index) => {
        const active = step.id === activeView;
        const Icon = step.Icon;
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onChange(step.id)}
            title={step.promise}
            className={clsx(
              'inline-flex min-w-[150px] flex-1 items-center gap-2 rounded-md px-3 py-2 text-left transition-colors',
              active ? 'bg-gray-950 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
            )}
          >
            <span className={clsx('flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md', active ? 'bg-white text-gray-950' : 'bg-gray-100 text-gray-500')}>
              <Icon size={16} />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-black uppercase tracking-wide">{index + 1}. {step.label}</span>
              <span className={clsx('block truncate text-xs font-semibold', active ? 'text-white/70' : 'text-gray-400')}>{step.short}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function TeachingLoop() {
  return (
    <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
      {TEACHING_LOOP.map((item, index) => {
        const Icon = item.Icon;
        return (
          <div key={item.title} className={clsx('rounded-lg border p-4', item.color)}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/80">
                <Icon size={18} />
              </div>
              <span className="text-xs font-black opacity-60">0{index + 1}</span>
            </div>
            <h3 className="mt-4 text-base font-black">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed opacity-85">{item.body}</p>
          </div>
        );
      })}
    </section>
  );
}

function PipelineInfographic() {
  const steps = [
    { label: 'Tools', sub: 'Art, CAD, simulation, data', Icon: Wrench, color: 'border-blue-200 bg-blue-50 text-blue-800' },
    { label: 'USD layers', sub: 'Separate contributions', Icon: Layers, color: 'border-cyan-200 bg-cyan-50 text-cyan-800' },
    { label: 'Choices', sub: 'Variants and overrides', Icon: Puzzle, color: 'border-violet-200 bg-violet-50 text-violet-800' },
    { label: 'Stage', sub: 'One composed view', Icon: Eye, color: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  ];

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-cyan-700">Visual map</p>
          <h2 className="mt-1 text-xl font-black text-gray-900">How OpenUSD helps a 3D scene travel</h2>
        </div>
        <SourceLink href={learnOpenUSDSourceUrl} variant="light">Official curriculum</SourceLink>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-stretch">
        {steps.map((step, index) => {
          const Icon = step.Icon;
          return (
            <div key={step.label} className="contents">
              <div className={clsx('min-h-[132px] rounded-lg border p-4', step.color)}>
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/80">
                  <Icon size={18} />
                </div>
                <p className="mt-4 text-base font-black">{step.label}</p>
                <p className="mt-1 text-sm font-semibold opacity-80">{step.sub}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden items-center justify-center text-gray-300 lg:flex">
                  <ArrowRight size={20} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function StartView({ onOpenModel, onOpenLessons, onOpenPlan }: { onOpenModel: () => void; onOpenLessons: () => void; onOpenPlan: () => void }) {
  const [pace, setPace] = useState<PaceId>('steady');
  const selectedPace = PACE_OPTIONS[pace];

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-5 rounded-lg border border-gray-200 bg-white p-5 lg:grid-cols-[1fr_420px] lg:items-center">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-wide text-cyan-700">Beginner guide</p>
          <h1 className="mt-2 text-3xl font-black leading-tight text-gray-950 sm:text-4xl">Learn OpenUSD one picture at a time.</h1>
          <p className="mt-3 text-base leading-relaxed text-gray-600">
            This app turns NVIDIA Learn OpenUSD into a guided path for non-technical learners: quick explanations, visual metaphors, small checks, and a calm route toward certification prep.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onOpenModel}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-gray-950 px-4 py-2 text-sm font-black text-white hover:bg-gray-800"
            >
              Start with the visual <Eye size={16} />
            </button>
            <button
              type="button"
              onClick={onOpenLessons}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-black text-gray-800 hover:bg-gray-50"
            >
              See the lesson map <Map size={16} />
            </button>
          </div>
        </div>
        <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4">
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-wide text-cyan-700">One mental model</p>
              <Layers size={18} className="text-cyan-700" />
            </div>
            <div className="mt-5 space-y-2">
              {['layout.usd', 'asset.usd', 'materials.usd'].map((layer, index) => (
                <div
                  key={layer}
                  className={clsx(
                    'rounded-md border px-3 py-2 text-sm font-black',
                    index === 0 && 'border-blue-200 bg-blue-50 text-blue-800',
                    index === 1 && 'border-emerald-200 bg-emerald-50 text-emerald-800',
                    index === 2 && 'border-amber-200 bg-amber-50 text-amber-800',
                  )}
                >
                  {layer}
                </div>
              ))}
            </div>
            <div className="my-4 flex items-center gap-2 text-sm font-black text-gray-400">
              <ArrowRight size={16} />
              compose
            </div>
            <div className="rounded-md border border-gray-900 bg-gray-950 px-3 py-3 text-white">
              <p className="text-sm font-black">Stage</p>
              <p className="mt-1 text-xs text-gray-300">the final scene you inspect</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {START_OUTCOMES.map(item => {
          const Icon = item.Icon;
          return (
            <div key={item.title} className={clsx('rounded-lg border p-4', item.color)}>
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/80">
                <Icon size={18} />
              </div>
              <h2 className="mt-4 text-base font-black">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed opacity-85">{item.body}</p>
            </div>
          );
        })}
      </section>

      <TeachingLoop />

      <section className="grid grid-cols-1 gap-5 rounded-lg border border-gray-200 bg-white p-5 lg:grid-cols-[340px_1fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-gray-400">Choose your pace</p>
          <h2 className="mt-1 text-xl font-black text-gray-900">Start from where you are.</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            A good learning journey gives you a next step, not a giant list.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {(Object.keys(PACE_OPTIONS) as PaceId[]).map(optionId => {
            const option = PACE_OPTIONS[optionId];
            const active = optionId === pace;
            return (
              <button
                key={optionId}
                type="button"
                onClick={() => setPace(optionId)}
                className={clsx(
                  'rounded-lg border p-4 text-left transition-colors',
                  active ? 'border-gray-950 bg-gray-950 text-white' : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100',
                )}
              >
                <p className="text-sm font-black">{option.label}</p>
                <p className={clsx('mt-1 text-xs font-semibold', active ? 'text-white/70' : 'text-gray-500')}>{option.time}</p>
              </button>
            );
          })}
        </div>
        <div className="lg:col-start-2">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-black text-gray-900">{selectedPace.note}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedPace.path.map((stop, index) => (
                <span key={stop} className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-black text-gray-700">
                  {index + 1}. {stop}
                </span>
              ))}
            </div>
            {pace === 'cert' && (
              <button
                type="button"
                onClick={onOpenPlan}
                className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 py-2 text-xs font-black text-white hover:bg-emerald-800"
              >
                Open certification planner <GraduationCap size={14} />
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function SceneToy({ activePieces }: { activePieces: ScenePieceId[] }) {
  const has = (piece: ScenePieceId) => activePieces.includes(piece);
  const assetOn = has('asset');
  const materialOn = has('material');
  const variantOn = has('variant');
  const payloadOn = has('payload');
  const lightOn = has('light');

  return (
    <div className="relative min-h-[390px] overflow-hidden rounded-lg border border-cyan-200 bg-cyan-50">
      <div
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage: 'linear-gradient(rgba(14, 165, 233, 0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(14, 165, 233, 0.14) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />
      {lightOn && <div className="absolute left-1/2 top-8 h-24 w-72 -translate-x-1/2 rounded-full bg-yellow-200 blur-2xl" />}
      <div className="absolute left-5 top-5 rounded-md border border-cyan-200 bg-white px-3 py-2">
        <p className="text-[11px] font-black uppercase tracking-wide text-cyan-700">Stage</p>
        <p className="text-xs font-semibold text-gray-600">the full scene view</p>
      </div>
      <div className="absolute right-5 top-5 rounded-md border border-cyan-200 bg-white px-3 py-2 text-right">
        <p className="text-[11px] font-black uppercase tracking-wide text-cyan-700">Active pieces</p>
        <p className="text-xs font-semibold text-gray-600">{activePieces.length} of {SCENE_PIECES.length}</p>
      </div>

      <div className="relative z-10 flex min-h-[390px] items-center justify-center px-6 pt-20">
        {!assetOn ? (
          <div className="flex h-36 w-44 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white/75 text-center">
            <p className="px-4 text-sm font-black text-gray-400">Turn on Asset to place something in the scene</p>
          </div>
        ) : (
          <div className={clsx('relative transition-all duration-300', variantOn ? 'scale-110' : 'scale-100')}>
            <div
              className="relative h-32 w-40 rounded-lg border-4 border-white shadow-xl"
              style={{ backgroundColor: materialOn ? '#ef4444' : '#94a3b8' }}
            >
              <div
                className="absolute -top-12 left-1/2 h-0 w-0 -translate-x-1/2"
                style={{
                  borderLeft: '86px solid transparent',
                  borderRight: '86px solid transparent',
                  borderBottom: `${variantOn ? 56 : 44}px solid ${materialOn ? '#facc15' : '#cbd5e1'}`,
                }}
              />
              <div className="absolute left-5 top-7 h-8 w-8 rounded-md bg-white/80" />
              <div className="absolute right-5 top-7 h-8 w-8 rounded-md bg-white/80" />
              <div className="absolute bottom-0 left-1/2 h-14 w-10 -translate-x-1/2 rounded-t-md bg-gray-950/80" />
            </div>
            {payloadOn && (
              <div className="absolute -right-8 bottom-2 grid grid-cols-2 gap-1 rounded-md border border-gray-200 bg-white p-2 shadow-sm">
                {[0, 1, 2, 3].map(dot => (
                  <span key={dot} className="h-3 w-3 rounded-sm bg-gray-950" />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-emerald-200/70 to-transparent" />
    </div>
  );
}

function MentalModelView({ onOpenLessons, onOpenPractice }: { onOpenLessons: () => void; onOpenPractice: () => void }) {
  const [activePieces, setActivePieces] = useState<ScenePieceId[]>(['asset', 'material', 'light']);
  const [focusedPiece, setFocusedPiece] = useState<ScenePieceId>('asset');
  const focused = SCENE_PIECES.find(piece => piece.id === focusedPiece) ?? SCENE_PIECES[0];

  const togglePiece = (pieceId: ScenePieceId) => {
    setFocusedPiece(pieceId);
    setActivePieces(prev => (prev.includes(pieceId) ? prev.filter(id => id !== pieceId) : [...prev, pieceId]));
  };

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-2xl">
              <p className="text-xs font-black uppercase tracking-wide text-cyan-700">Mental model</p>
              <h1 className="mt-1 text-2xl font-black leading-tight text-gray-950">OpenUSD is a way to compose a scene from useful pieces.</h1>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Turn pieces on and off. The visual is intentionally simple: each button is one contribution to the final stage.
              </p>
            </div>
            <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-black text-gray-700">
              {activePieces.length}/{SCENE_PIECES.length} active
            </div>
          </div>
          <SceneToy activePieces={activePieces} />
        </div>

        <aside className="space-y-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-wide text-gray-400">Scene controls</p>
            <div className="mt-3 grid grid-cols-1 gap-2">
              {SCENE_PIECES.map(piece => {
                const Icon = piece.Icon;
                const active = activePieces.includes(piece.id);
                return (
                  <button
                    key={piece.id}
                    type="button"
                    onClick={() => togglePiece(piece.id)}
                    className={clsx('min-h-[64px] rounded-lg border px-3 py-2 text-left transition-colors', active ? piece.color : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100')}
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-white/80">
                        <Icon size={18} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-black">{piece.label}</span>
                        <span className="block text-xs font-semibold opacity-75">{piece.term}</span>
                      </span>
                      <span className="ml-auto flex-shrink-0">{active ? <CheckCircle2 size={18} /> : <Circle size={18} />}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg bg-gray-950 p-4 text-white">
            <p className="text-xs font-black uppercase tracking-wide text-cyan-300">What this means</p>
            <h2 className="mt-2 text-xl font-black">{focused.term}</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-300">{focused.plain}</p>
          </div>
        </aside>
      </section>

      <PipelineInfographic />

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-amber-700">Microlearning checkpoint</p>
            <h2 className="mt-1 text-xl font-black text-amber-950">Say it back in one sentence.</h2>
            <p className="mt-2 text-sm leading-relaxed text-amber-900">
              OpenUSD keeps scene contributions separate enough to manage, then composes them into one stage people and tools can inspect.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onOpenLessons}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-amber-700 px-4 py-2 text-sm font-black text-white hover:bg-amber-800"
            >
              Continue to lessons <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={onOpenPractice}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-amber-200 bg-white px-4 py-2 text-sm font-black text-amber-800 hover:bg-amber-100"
            >
              Try a check <FileQuestion size={16} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function LessonCard({
  module,
  complete,
  onToggle,
}: {
  module: OpenUSDLearningModule;
  complete: boolean;
  onToggle: () => void;
}) {
  return (
    <article className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-gray-500">
              {module.moduleNumber ? `Module ${module.moduleNumber}` : 'Primer'}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-500">
              <Clock3 size={12} /> {module.estimatedHours}h
            </span>
          </div>
          <h3 className="mt-3 text-base font-black leading-tight text-gray-900">{module.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">{module.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={clsx(
            'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border transition-colors',
            complete ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-200 bg-white text-gray-300 hover:border-emerald-300 hover:text-emerald-600',
          )}
          title={complete ? 'Marked complete' : 'Mark complete'}
        >
          {complete ? <Check size={16} /> : <Circle size={14} />}
        </button>
      </div>
      <div className="mt-4 border-l-2 border-cyan-300 pl-3">
        <p className="text-xs font-black uppercase tracking-wide text-cyan-700">Why it matters</p>
        <p className="mt-1 text-sm leading-relaxed text-gray-700">{module.whyItMatters}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {module.examDomains.map(domainId => {
          const domain = examBlueprintDomains.find(item => item.id === domainId);
          return domain ? (
            <span key={domainId} className={clsx('rounded-md border px-2 py-1 text-[10px] font-black', domainVisualMeta[domainId].color)}>
              {domain.shortLabel}
            </span>
          ) : null;
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <SourceLink href={module.docsUrl} variant="light">Open lesson</SourceLink>
      </div>
    </article>
  );
}

function LessonsView({
  completedModuleIds,
  toggleModule,
  knownTermIds,
  toggleTerm,
  onOpenPractice,
}: {
  completedModuleIds: string[];
  toggleModule: (id: string) => void;
  knownTermIds: string[];
  toggleTerm: (id: string) => void;
  onOpenPractice: () => void;
}) {
  const progress = pct(completedModuleIds.length, openUSDLearningModules.length);
  const beginnerTerms = openUSDGlossaryTerms.filter(term => BEGINNER_TERMS.includes(term.term));

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-5 rounded-lg border border-gray-200 bg-white p-5 lg:grid-cols-[1fr_320px]">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-cyan-700">Learn path</p>
          <h1 className="mt-1 text-2xl font-black leading-tight text-gray-950">The official curriculum, broken into beginner-friendly steps.</h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            NVIDIA Learn OpenUSD includes modules from "What Is OpenUSD?" through composition, asset structure, data exchange, and instancing. This path keeps the order but softens the entry point.
          </p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Your progress</p>
          <p className="mt-2 text-3xl font-black text-emerald-950">{progress}%</p>
          <p className="mt-1 text-sm font-semibold text-emerald-900">{completedModuleIds.length} of {openUSDLearningModules.length} lessons marked complete</p>
          <div className="mt-4">
            <ProgressBar value={progress} color="bg-emerald-600" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {LESSON_GROUPS.map(group => (
          <div key={group.title} className="space-y-3">
            <div className={clsx('rounded-lg border p-4', group.color)}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black">{group.title}</h2>
                  <p className="mt-1 text-sm font-semibold opacity-80">{group.subtitle}</p>
                </div>
                <Route size={20} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
              {group.moduleIds.map(moduleId => {
                const module = findModule(moduleId);
                return (
                  <LessonCard
                    key={module.id}
                    module={module}
                    complete={completedModuleIds.includes(module.id)}
                    onToggle={() => toggleModule(module.id)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-gray-400">First vocabulary set</p>
            <h2 className="mt-1 text-xl font-black text-gray-900">Learn these words after the visual, not before.</h2>
          </div>
          <p className="text-sm font-black text-gray-500">{knownTermIds.length} marked familiar</p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {beginnerTerms.map(term => {
            const known = knownTermIds.includes(term.id);
            return (
              <button
                key={term.id}
                type="button"
                onClick={() => toggleTerm(term.id)}
                className={clsx(
                  'rounded-lg border p-4 text-left transition-colors',
                  known ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-black text-gray-900">{term.term}</h3>
                  {known ? <CheckCircle2 size={18} className="text-emerald-700" /> : <Circle size={18} className="text-gray-300" />}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{term.plainEnglish}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-cyan-200 bg-cyan-50 p-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-cyan-700">Next teaching move</p>
            <h2 className="mt-1 text-xl font-black text-cyan-950">Do one small recall check before reading more.</h2>
            <p className="mt-2 text-sm leading-relaxed text-cyan-900">
              Short practice keeps the journey active. This is not an exam dump; it is source-linked self-checking.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenPractice}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-cyan-800 px-4 py-2 text-sm font-black text-white hover:bg-cyan-900"
          >
            Open practice <FileQuestion size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}

function PracticeView({ quizAnswers, setQuizAnswers, onOpenPlan }: {
  quizAnswers: Record<string, number>;
  setQuizAnswers: (value: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)) => void;
  onOpenPlan: () => void;
}) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const question = practiceQuestions[questionIndex % practiceQuestions.length];
  const selected = quizAnswers[question.id];
  const answered = selected !== undefined;
  const correct = selected === question.answerIndex;
  const answeredCount = practiceQuestions.filter(item => quizAnswers[item.id] !== undefined).length;
  const correctCount = practiceQuestions.filter(item => quizAnswers[item.id] === item.answerIndex).length;
  const domain = examBlueprintDomains.find(item => item.id === question.domainId);
  const module = findModule(question.moduleId);

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-5 rounded-lg border border-gray-200 bg-white p-5 lg:grid-cols-[1fr_280px]">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-cyan-700">Practice</p>
          <h1 className="mt-1 text-2xl font-black leading-tight text-gray-950">Practice by reasoning, not memorizing.</h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            These are concept checks that point back to the public Learn OpenUSD material. Use the explanation to learn, not just score yourself.
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-gray-400">Practice progress</p>
          <p className="mt-2 text-2xl font-black text-gray-900">{correctCount}/{answeredCount || 0}</p>
          <p className="mt-1 text-sm font-semibold text-gray-500">correct after answering</p>
          <div className="mt-4">
            <ProgressBar value={pct(answeredCount, practiceQuestions.length)} color="bg-cyan-600" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {domain && (
            <span className={clsx('rounded-md border px-2.5 py-1 text-xs font-black', domainVisualMeta[domain.id].color)}>
              {domain.shortLabel} domain
            </span>
          )}
          <span className="text-xs font-black text-gray-400">Question {questionIndex + 1} of {practiceQuestions.length}</span>
        </div>
        <h2 className="text-xl font-black leading-tight text-gray-950">{question.prompt}</h2>
        <div className="mt-5 space-y-2">
          {question.choices.map((choice, choiceIndex) => {
            const isSelected = selected === choiceIndex;
            const isAnswer = question.answerIndex === choiceIndex;
            return (
              <button
                key={choice}
                type="button"
                onClick={() => setQuizAnswers(prev => ({ ...prev, [question.id]: choiceIndex }))}
                className={clsx(
                  'w-full rounded-lg border px-4 py-3 text-left text-sm font-bold leading-snug transition-colors',
                  !answered && 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100',
                  answered && isAnswer && 'border-emerald-300 bg-emerald-50 text-emerald-900',
                  answered && isSelected && !isAnswer && 'border-rose-300 bg-rose-50 text-rose-900',
                  answered && !isSelected && !isAnswer && 'border-gray-200 bg-gray-50 text-gray-400',
                )}
              >
                {choice}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className={clsx('mt-5 rounded-lg border p-4', correct ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50')}>
            <p className={clsx('text-sm font-black', correct ? 'text-emerald-900' : 'text-amber-900')}>
              {correct ? 'Yes. That is the idea.' : 'Almost. Here is the part to notice.'}
            </p>
            <p className={clsx('mt-2 text-sm leading-relaxed', correct ? 'text-emerald-900' : 'text-amber-900')}>{question.explanation}</p>
            <p className="mt-3 text-xs font-bold text-gray-500">Source hint: {question.sourceHint}</p>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <SourceLink href={module.docsUrl} variant="light">Review source lesson</SourceLink>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setQuestionIndex(prev => (prev + 1) % practiceQuestions.length)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-gray-950 px-4 py-2 text-sm font-black text-white hover:bg-gray-800"
            >
              Next question <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={onOpenPlan}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-black text-gray-800 hover:bg-gray-50"
            >
              Open cert plan <GraduationCap size={16} />
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl rounded-lg border border-violet-200 bg-violet-50 p-5">
        <p className="text-xs font-black uppercase tracking-wide text-violet-700">Reflection prompt</p>
        <h2 className="mt-1 text-xl font-black text-violet-950">Explain the answer to a friend.</h2>
        <p className="mt-2 text-sm leading-relaxed text-violet-900">
          If you can explain why the correct answer is practical in a real pipeline, you are learning the concept instead of memorizing a phrase.
        </p>
      </section>
    </div>
  );
}

function CertificationPlanView({ completedReadiness, toggleReadiness }: {
  completedReadiness: string[];
  toggleReadiness: (item: string) => void;
}) {
  const sortedDomains = useMemo(() => [...examBlueprintDomains].sort((a, b) => b.weight - a.weight), []);
  const readinessProgress = pct(completedReadiness.length, READINESS_CHECKS.length);

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-5 rounded-lg border border-gray-200 bg-white p-5 lg:grid-cols-[1fr_320px]">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-cyan-700">Certification planner</p>
          <h1 className="mt-1 text-2xl font-black leading-tight text-gray-950">Use the exam blueprint as a study compass.</h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            NVIDIA lists the OpenUSD Development certification as a professional, online proctored exam with 60-70 questions and a 120-minute time limit. This planner turns that into study focus areas.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <SourceLink href={certificationUrl}>Exam page</SourceLink>
            <SourceLink href={studyGuideUrl} variant="light">Study guide</SourceLink>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-gray-400">Official exam snapshot</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <span className="font-semibold text-gray-500">Name</span><span className="text-right font-black text-gray-900">{examSnapshot.name}</span>
            <span className="font-semibold text-gray-500">Level</span><span className="text-right font-black text-gray-900">{examSnapshot.level}</span>
            <span className="font-semibold text-gray-500">Duration</span><span className="text-right font-black text-gray-900">{examSnapshot.duration}</span>
            <span className="font-semibold text-gray-500">Questions</span><span className="text-right font-black text-gray-900">{examSnapshot.questionCount}</span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-gray-400">Blueprint focus</p>
              <h2 className="mt-1 text-xl font-black text-gray-900">Study heavier domains first.</h2>
            </div>
            <Compass size={22} className="text-cyan-700" />
          </div>
          <div className="space-y-3">
            {sortedDomains.map(domain => {
              const Icon = DOMAIN_ICONS[domain.id];
              return (
                <div key={domain.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className={clsx('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border', domainVisualMeta[domain.id].color)}>
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-black text-gray-900">{domain.label}</h3>
                        <span className="text-sm font-black text-gray-900">{domain.weight}%</span>
                      </div>
                      <div className="mt-2">
                        <ProgressBar value={domain.weight * 3.1} color={domainVisualMeta[domain.id].barColor} />
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-gray-600">{domain.summary}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Readiness checklist</p>
            <p className="mt-2 text-2xl font-black text-emerald-950">{readinessProgress}%</p>
            <div className="mt-3">
              <ProgressBar value={readinessProgress} color="bg-emerald-600" />
            </div>
          </div>
          <div className="space-y-2">
            {READINESS_CHECKS.map(item => {
              const complete = completedReadiness.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleReadiness(item)}
                  className={clsx(
                    'w-full rounded-lg border p-3 text-left text-sm font-bold leading-snug transition-colors',
                    complete ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
                  )}
                >
                  <span className="flex gap-2">
                    {complete ? <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" /> : <Circle size={16} className="mt-0.5 flex-shrink-0 text-gray-300" />}
                    {item}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>
      </section>
    </div>
  );
}

function ResourcesView() {
  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <p className="text-xs font-black uppercase tracking-wide text-cyan-700">Resources</p>
        <h1 className="mt-1 text-2xl font-black leading-tight text-gray-950">Use official materials as the source of truth.</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600">
          This app is a teaching companion. When you are ready for depth, follow the official curriculum, study guide, and certification page.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {RESOURCE_LINKS.map(resource => {
          const Icon = resource.Icon;
          return (
            <a
              key={resource.label}
              href={resource.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-gray-950 text-white">
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-gray-900">{resource.label}</h2>
                    <ExternalLink size={14} className="text-gray-300 transition-colors group-hover:text-gray-600" />
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">{resource.body}</p>
                </div>
              </div>
            </a>
          );
        })}
      </section>

      <section className="rounded-lg border border-violet-200 bg-violet-50 p-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-violet-700">How to study</p>
            <h2 className="mt-1 text-xl font-black text-violet-950">A beginner-friendly routine</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              ['Before reading', 'Look at the app visual and say what you think the lesson is about.'],
              ['While reading', 'Write down one term and one real-world reason it matters.'],
              ['After reading', 'Answer one question or explain the idea out loud in plain English.'],
            ].map(([title, body]) => (
              <div key={title} className="rounded-lg border border-violet-200 bg-white/80 p-4">
                <p className="text-sm font-black text-violet-950">{title}</p>
                <p className="mt-2 text-sm leading-relaxed text-violet-900">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function OpenUSDCertificationCoach() {
  const [view, setView] = useState<View>('start');
  const [completedModuleIds, setCompletedModuleIds] = usePersistedState<string[]>('openusd_v2_completed_modules', []);
  const [knownTermIds, setKnownTermIds] = usePersistedState<string[]>('openusd_v2_known_terms', []);
  const [quizAnswers, setQuizAnswers] = usePersistedState<Record<string, number>>('openusd_v2_quiz_answers', {});
  const [completedReadiness, setCompletedReadiness] = usePersistedState<string[]>('openusd_v2_readiness', []);

  const toggleModule = (id: string) => {
    setCompletedModuleIds(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
  };

  const toggleTerm = (id: string) => {
    setKnownTermIds(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
  };

  const toggleReadiness = (item: string) => {
    setCompletedReadiness(prev => (prev.includes(item) ? prev.filter(value => value !== item) : [...prev, item]));
  };

  return (
    <div className="space-y-5">
      <JourneyNav activeView={view} onChange={setView} />
      <div className="tab-fade">
        {view === 'start' && (
          <StartView
            onOpenModel={() => setView('model')}
            onOpenLessons={() => setView('lessons')}
            onOpenPlan={() => setView('plan')}
          />
        )}
        {view === 'model' && (
          <MentalModelView
            onOpenLessons={() => setView('lessons')}
            onOpenPractice={() => setView('practice')}
          />
        )}
        {view === 'lessons' && (
          <LessonsView
            completedModuleIds={completedModuleIds}
            toggleModule={toggleModule}
            knownTermIds={knownTermIds}
            toggleTerm={toggleTerm}
            onOpenPractice={() => setView('practice')}
          />
        )}
        {view === 'practice' && (
          <PracticeView
            quizAnswers={quizAnswers}
            setQuizAnswers={setQuizAnswers}
            onOpenPlan={() => setView('plan')}
          />
        )}
        {view === 'plan' && (
          <CertificationPlanView
            completedReadiness={completedReadiness}
            toggleReadiness={toggleReadiness}
          />
        )}
        {view === 'resources' && <ResourcesView />}
      </div>
    </div>
  );
}
