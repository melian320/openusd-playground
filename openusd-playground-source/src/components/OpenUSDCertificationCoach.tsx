import { useMemo, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  BookOpen,
  Box,
  Boxes,
  Brain,
  Bug,
  Car,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  Database,
  Download,
  ExternalLink,
  Eye,
  FileQuestion,
  GitBranch,
  GraduationCap,
  House,
  Layers,
  Lightbulb,
  ListChecks,
  Map,
  MousePointerClick,
  Paintbrush,
  Play,
  Puzzle,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Target,
  Trophy,
  Wrench,
} from 'lucide-react';
import clsx from 'clsx';
import {
  certificationUrl,
  contributionIdeas,
  domainVisualMeta,
  examBlueprintDomains,
  examSnapshot,
  getDomain,
  learnOpenUSDRepoUrl,
  learnOpenUSDSourceUrl,
  openUSDGlossaryTerms,
  openUSDLearningModules,
  practiceQuestions,
  studyGuideUrl,
  type DomainIconMap,
  type OpenUSDDomainId,
  type OpenUSDLearningModule,
} from '../data/openusdCertification';
import { usePersistedState } from '../hooks/useSettings';

type View = 'play' | 'roadmap' | 'practice' | 'glossary' | 'contribute';
type DomainFilter = OpenUSDDomainId | 'all';
type ToyKind = 'block' | 'house' | 'car';
type ToyLayerId = 'body' | 'paint' | 'move' | 'light' | 'variant';

const VIEW_OPTIONS: { id: View; label: string; icon: ReactNode }[] = [
  { id: 'play', label: 'Play', icon: <Play size={14} /> },
  { id: 'roadmap', label: 'Roadmap', icon: <Map size={14} /> },
  { id: 'practice', label: 'Practice', icon: <FileQuestion size={14} /> },
  { id: 'glossary', label: 'Glossary', icon: <BookOpen size={14} /> },
  { id: 'contribute', label: 'Contribute', icon: <GitBranch size={14} /> },
];

const TOY_LAYERS: {
  id: ToyLayerId;
  name: string;
  tinyName: string;
  idea: string;
  detail: string;
  icon: ReactNode;
  color: string;
  activeColor: string;
}[] = [
  {
    id: 'body',
    name: 'Toy body',
    tinyName: 'Prim',
    idea: 'This is the thing in the scene.',
    detail: 'OpenUSD calls a scene thing a prim.',
    icon: <Box size={18} />,
    color: 'border-blue-200 bg-blue-50 text-blue-700',
    activeColor: 'border-blue-400 bg-blue-100 text-blue-900 shadow-sm',
  },
  {
    id: 'paint',
    name: 'Paint',
    tinyName: 'Attribute',
    idea: 'This gives the thing a color.',
    detail: 'A color is an attribute: a value on a prim.',
    icon: <Paintbrush size={18} />,
    color: 'border-rose-200 bg-rose-50 text-rose-700',
    activeColor: 'border-rose-400 bg-rose-100 text-rose-900 shadow-sm',
  },
  {
    id: 'move',
    name: 'Move',
    tinyName: 'Xform',
    idea: 'This moves the thing on the table.',
    detail: 'A transform tells where something sits.',
    icon: <MousePointerClick size={18} />,
    color: 'border-amber-200 bg-amber-50 text-amber-700',
    activeColor: 'border-amber-400 bg-amber-100 text-amber-900 shadow-sm',
  },
  {
    id: 'light',
    name: 'Light',
    tinyName: 'Schema',
    idea: 'This helps us see the scene.',
    detail: 'OpenUSD has schemas for lights, shapes, materials, and more.',
    icon: <Sparkles size={18} />,
    color: 'border-lime-200 bg-lime-50 text-lime-700',
    activeColor: 'border-lime-400 bg-lime-100 text-lime-900 shadow-sm',
  },
  {
    id: 'variant',
    name: 'Choice',
    tinyName: 'Variant',
    idea: 'This lets the same thing have a different version.',
    detail: 'A variant set is a tidy menu of choices.',
    icon: <Puzzle size={18} />,
    color: 'border-violet-200 bg-violet-50 text-violet-700',
    activeColor: 'border-violet-400 bg-violet-100 text-violet-900 shadow-sm',
  },
];

const DOMAIN_ICONS: DomainIconMap = {
  composition: Layers,
  'content-aggregation': Boxes,
  'customizing-usd': Wrench,
  'data-exchange': RefreshCw,
  'data-modeling': Database,
  debugging: Bug,
  'pipeline-development': GitBranch,
  visualization: Eye,
};

function pct(done: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}

function DomainBadge({ domainId, compact = false }: { domainId: OpenUSDDomainId; compact?: boolean }) {
  const domain = getDomain(domainId);
  const Icon = DOMAIN_ICONS[domainId];
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 border rounded-md font-semibold whitespace-nowrap',
      compact ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1',
      domainVisualMeta[domainId].color,
    )}>
      <Icon size={compact ? 10 : 12} />
      {compact ? domain.shortLabel : `${domain.shortLabel} ${domain.weight}%`}
    </span>
  );
}

function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={clsx('h-2 bg-gray-100 rounded-full overflow-hidden', className)}>
      <div
        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
          <p className="text-lg font-bold text-gray-900 leading-tight mt-0.5">{value}</p>
          <p className="text-xs text-gray-500 leading-snug mt-1">{sub}</p>
        </div>
      </div>
    </div>
  );
}

function CompositionVisual() {
  return (
    <div className="bg-gray-950 text-white rounded-lg p-4 overflow-hidden">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-cyan-300 font-bold">Mental model</p>
          <p className="text-sm font-semibold">Many opinions, one composed stage</p>
        </div>
        <Layers size={18} className="text-emerald-300" />
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
        <div className="space-y-2">
          {['layout.usda', 'model.usdc', 'materials.usda'].map((layer, index) => (
            <div key={layer} className="border border-white/15 bg-white/8 rounded-md px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-gray-100">{layer}</span>
                <span className={clsx(
                  'h-1.5 w-10 rounded-full',
                  index === 0 ? 'bg-cyan-400' : index === 1 ? 'bg-emerald-400' : 'bg-amber-400',
                )} />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">authored opinions</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-1 text-gray-500">
          <ArrowRight size={16} />
          <span className="text-[10px] font-bold rotate-90 sm:rotate-0">compose</span>
        </div>

        <div className="border border-emerald-300/40 bg-emerald-400/10 rounded-md p-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-emerald-400 text-gray-950 flex items-center justify-center">
              <Check size={14} />
            </div>
            <div>
              <p className="text-sm font-bold">Stage</p>
              <p className="text-[10px] text-emerald-200">the result you inspect</p>
            </div>
          </div>
          <div className="space-y-1.5 font-mono text-[11px] text-gray-200">
            <div className="pl-0">/World</div>
            <div className="pl-3">/World/Vehicle</div>
            <div className="pl-6 text-cyan-200">.xformOp:translate</div>
            <div className="pl-6 text-amber-200">.material:binding</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToyStage({ toyKind, activeLayerIds }: { toyKind: ToyKind; activeLayerIds: ToyLayerId[] }) {
  const has = (id: ToyLayerId) => activeLayerIds.includes(id);
  const painted = has('paint');
  const moved = has('move');
  const variant = has('variant');
  const bodyColor = painted ? '#ef4444' : '#94a3b8';
  const accentColor = painted ? '#facc15' : '#cbd5e1';

  const toy = (() => {
    if (!has('body')) {
      return (
        <div className="w-36 h-32 rounded-lg border-2 border-dashed border-gray-300 bg-white/60 flex items-center justify-center text-center px-3">
          <p className="text-xs font-bold text-gray-400">empty stage</p>
        </div>
      );
    }

    if (toyKind === 'house') {
      return (
        <div className="flex flex-col items-center">
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: `${variant ? 62 : 48}px solid transparent`,
              borderRight: `${variant ? 62 : 48}px solid transparent`,
              borderBottom: `${variant ? 52 : 40}px solid ${accentColor}`,
            }}
          />
          <div
            className={clsx('relative rounded-t-md border-4 border-white shadow-xl', variant ? 'w-36 h-28' : 'w-28 h-24')}
            style={{ backgroundColor: bodyColor }}
          >
            <div className="absolute left-4 top-5 w-6 h-6 rounded bg-white/80 border border-white" />
            <div className="absolute right-4 top-5 w-6 h-6 rounded bg-white/80 border border-white" />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-8 h-12 rounded-t-md bg-gray-900/75" />
          </div>
        </div>
      );
    }

    if (toyKind === 'car') {
      return (
        <div className={clsx('relative', variant ? 'w-44 h-28' : 'w-36 h-24')}>
          <div
            className="absolute left-8 top-4 w-20 h-10 rounded-t-xl border-4 border-white shadow-md"
            style={{ backgroundColor: accentColor }}
          />
          <div
            className="absolute left-2 right-2 top-10 h-12 rounded-xl border-4 border-white shadow-xl"
            style={{ backgroundColor: bodyColor }}
          />
          <div className="absolute left-7 bottom-1 w-9 h-9 rounded-full bg-gray-900 border-4 border-white" />
          <div className="absolute right-7 bottom-1 w-9 h-9 rounded-full bg-gray-900 border-4 border-white" />
        </div>
      );
    }

    return (
      <div
        className={clsx(
          'relative rounded-lg border-4 border-white shadow-xl rotate-3',
          variant ? 'w-36 h-36' : 'w-28 h-28',
        )}
        style={{ backgroundColor: bodyColor }}
      >
        <div className="absolute inset-x-4 top-4 h-3 rounded-full bg-white/45" />
        <div className="absolute inset-y-4 right-4 w-3 rounded-full bg-black/10" />
        <div className="absolute bottom-4 left-4 right-4 h-3 rounded-full bg-black/10" />
      </div>
    );
  })();

  return (
    <div className="relative min-h-[360px] rounded-lg border border-cyan-200 bg-cyan-50 overflow-hidden">
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage: 'linear-gradient(rgba(14, 165, 233, 0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(14, 165, 233, 0.16) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      {has('light') && (
        <div className="absolute left-1/2 top-4 h-44 w-72 -translate-x-1/2 rounded-full bg-yellow-200/70 blur-2xl" />
      )}
      <div className="absolute left-5 top-5 rounded-md bg-white/90 border border-cyan-200 px-3 py-2 shadow-sm">
        <p className="text-[11px] font-black uppercase tracking-wide text-cyan-700">Stage</p>
        <p className="text-xs font-semibold text-gray-600">the play table</p>
      </div>
      <div className="absolute right-5 top-5 rounded-md bg-white/90 border border-cyan-200 px-3 py-2 shadow-sm text-right">
        <p className="text-[11px] font-black uppercase tracking-wide text-cyan-700">Composed</p>
        <p className="text-xs font-semibold text-gray-600">{activeLayerIds.length} layer{activeLayerIds.length === 1 ? '' : 's'}</p>
      </div>
      <div className="relative z-10 flex min-h-[360px] items-center justify-center px-6 pt-16">
        <div className={clsx('transition-transform duration-500 ease-out', moved ? 'translate-x-8 -translate-y-4' : 'translate-x-0')}>
          {toy}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-emerald-200/80 to-transparent" />
    </div>
  );
}

function TinyConceptCard({ term, tiny, icon }: { term: string; tiny: string; icon: ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="w-10 h-10 rounded-lg bg-gray-900 text-white flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="text-lg font-black text-gray-900">{term}</p>
      <p className="text-sm text-gray-600 leading-relaxed mt-1">{tiny}</p>
    </div>
  );
}

const TINY_QUIZ = [
  {
    prompt: 'What is the big play table called?',
    choices: ['Stage', 'Paint', 'Clock'],
    answer: 0,
    win: 'Yes. The stage is where the whole scene comes together.',
  },
  {
    prompt: 'What is one thing in the scene called?',
    choices: ['Prim', 'Snack', 'Window'],
    answer: 0,
    win: 'Right. A prim is one scene thing, like a toy block, car, light, or house.',
  },
  {
    prompt: 'What gives the toy its color?',
    choices: ['Attribute', 'Stage', 'Folder'],
    answer: 0,
    win: 'Exactly. An attribute is a little value, like color, size, or position.',
  },
];

function PlayView({ onOpenRoadmap, onOpenPractice }: { onOpenRoadmap: () => void; onOpenPractice: () => void }) {
  const [toyKind, setToyKind] = useState<ToyKind>('house');
  const [activeLayerIds, setActiveLayerIds] = useState<ToyLayerId[]>(['body', 'paint', 'light']);
  const [focusedLayerId, setFocusedLayerId] = useState<ToyLayerId>('body');
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);

  const focusedLayer = TOY_LAYERS.find(layer => layer.id === focusedLayerId) ?? TOY_LAYERS[0];
  const activeCount = activeLayerIds.length;
  const quiz = TINY_QUIZ[quizIndex];
  const answeredCorrectly = quizAnswer === quiz.answer;

  const toggleLayer = (id: ToyLayerId) => {
    setFocusedLayerId(id);
    setActiveLayerIds(prev => (
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    ));
  };

  const nextQuiz = () => {
    setQuizAnswer(null);
    setQuizIndex(prev => (prev + 1) % TINY_QUIZ.length);
  };

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-black text-cyan-700 mb-3">
                <Sparkles size={14} /> OpenUSD playground
              </div>
              <h2 className="text-2xl font-black text-gray-900 leading-tight">Build a tiny world from blocks.</h2>
              <p className="text-sm text-gray-600 mt-2 max-w-2xl">
                Tap the buttons on the right. Watch the scene change, then learn the OpenUSD word for what just happened.
              </p>
            </div>
            <div className="flex rounded-lg bg-gray-100 border border-gray-200 p-1">
              {[
                { id: 'house' as ToyKind, label: 'House', icon: <House size={16} /> },
                { id: 'car' as ToyKind, label: 'Car', icon: <Car size={16} /> },
                { id: 'block' as ToyKind, label: 'Block', icon: <Box size={16} /> },
              ].map(option => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setToyKind(option.id)}
                  className={clsx(
                    'inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-bold transition-colors',
                    toyKind === option.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
                  )}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <ToyStage toyKind={toyKind} activeLayerIds={activeLayerIds} />
        </div>

        <aside className="space-y-3">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-black uppercase tracking-wide text-gray-400">Scene buttons</p>
            <p className="text-sm text-gray-600 mt-1">Turn these on and off to change the toy scene.</p>
            <div className="grid grid-cols-1 gap-2 mt-4">
              {TOY_LAYERS.map(layer => {
                const active = activeLayerIds.includes(layer.id);
                return (
                  <button
                    key={layer.id}
                    type="button"
                    onClick={() => toggleLayer(layer.id)}
                    className={clsx(
                      'min-h-[64px] rounded-lg border px-3 py-2 text-left transition-all',
                      active ? layer.activeColor : layer.color,
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-lg bg-white/75 flex items-center justify-center flex-shrink-0">
                        {layer.icon}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-black">{layer.name}</span>
                        <span className="block text-xs font-semibold opacity-75">{layer.tinyName}</span>
                      </span>
                      <span className="ml-auto flex-shrink-0">
                        {active ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-gray-950 text-white rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star size={16} className="text-yellow-300" />
              <p className="text-sm font-black">{focusedLayer.tinyName}</p>
            </div>
            <p className="text-lg font-black leading-tight">{focusedLayer.idea}</p>
            <p className="text-sm text-gray-300 leading-relaxed mt-2">{focusedLayer.detail}</p>
            <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-yellow-300 transition-all" style={{ width: `${activeCount * 20}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-2">{activeCount}/5 blocks on the stage</p>
          </div>
        </aside>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <TinyConceptCard term="Stage" tiny="The big table where the scene appears." icon={<Eye size={18} />} />
          <TinyConceptCard term="Prim" tiny="One thing on the table." icon={<Box size={18} />} />
          <TinyConceptCard term="Layer" tiny="A note that adds or changes something." icon={<Layers size={18} />} />
          <TinyConceptCard term="Attribute" tiny="A small value, like red, tall, or here." icon={<Paintbrush size={18} />} />
          <TinyConceptCard term="Variant" tiny="A neat choice: small or big, red or gray." icon={<Puzzle size={18} />} />
          <TinyConceptCard term="Compose" tiny="Put the notes together and see one scene." icon={<Sparkles size={18} />} />
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileQuestion size={17} className="text-emerald-600" />
            <h3 className="text-base font-black text-gray-900">Tiny check</h3>
          </div>
          <p className="text-lg font-black text-gray-900 leading-tight">{quiz.prompt}</p>
          <div className="grid grid-cols-1 gap-2 mt-4">
            {quiz.choices.map((choice, index) => {
              const selected = quizAnswer === index;
              const correct = quiz.answer === index;
              return (
                <button
                  key={choice}
                  type="button"
                  onClick={() => setQuizAnswer(index)}
                  className={clsx(
                    'rounded-lg border px-4 py-3 text-left text-sm font-black transition-colors',
                    quizAnswer === null && 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100',
                    quizAnswer !== null && correct && 'border-emerald-300 bg-emerald-50 text-emerald-900',
                    quizAnswer !== null && selected && !correct && 'border-rose-300 bg-rose-50 text-rose-900',
                    quizAnswer !== null && !selected && !correct && 'border-gray-200 bg-gray-50 text-gray-400',
                  )}
                >
                  {choice}
                </button>
              );
            })}
          </div>
          {quizAnswer !== null && (
            <div className={clsx(
              'mt-4 rounded-lg border p-3',
              answeredCorrectly ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50',
            )}>
              <p className={clsx('text-sm font-bold leading-relaxed', answeredCorrectly ? 'text-emerald-900' : 'text-amber-900')}>
                {answeredCorrectly ? quiz.win : 'Close. Try the answer that names the OpenUSD idea.'}
              </p>
              <button
                type="button"
                onClick={nextQuiz}
                className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-gray-900 px-3 py-2 text-xs font-bold text-white hover:bg-gray-800"
              >
                Next tiny check <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-center">
          <div>
            <h3 className="text-lg font-black text-gray-900">Ready for the bigger map?</h3>
            <p className="text-sm text-gray-600 leading-relaxed mt-1">
              The same ideas grow into the certification roadmap: stage, prim, layer, attributes, composition arcs, assets, data exchange, and instancing.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onOpenRoadmap}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-700"
            >
              Open roadmap <Map size={16} />
            </button>
            <button
              type="button"
              onClick={onOpenPractice}
              className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-3 text-sm font-black text-gray-700 hover:bg-gray-50"
            >
              Try practice <FileQuestion size={16} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ModuleCard({
  module,
  selected,
  complete,
  onSelect,
  onToggle,
}: {
  module: OpenUSDLearningModule;
  selected: boolean;
  complete: boolean;
  onSelect: () => void;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        'w-full text-left border rounded-lg p-3 transition-all bg-white',
        selected ? 'border-emerald-300 shadow-sm ring-2 ring-emerald-100' : 'border-gray-200 hover:border-gray-300',
      )}
    >
      <div className="flex items-start gap-3">
        <span
          onClick={event => {
            event.stopPropagation();
            onToggle();
          }}
          className={clsx(
            'mt-0.5 w-6 h-6 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors',
            complete ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-300 text-gray-300',
          )}
          role="checkbox"
          aria-checked={complete}
          tabIndex={0}
        >
          {complete ? <Check size={14} /> : <Circle size={11} />}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
              {module.moduleNumber ? `Module ${module.moduleNumber}` : 'Primer'}
            </span>
            <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
              {module.estimatedHours}h
            </span>
          </div>
          <p className="text-sm font-bold text-gray-900 mt-1 leading-tight">{module.title}</p>
          <p className="text-xs text-gray-500 line-clamp-2 mt-1">{module.subtitle}</p>
        </div>
      </div>
    </button>
  );
}

function RoadmapView({
  completedModuleIds,
  selectedModuleId,
  setSelectedModuleId,
  toggleModule,
}: {
  completedModuleIds: string[];
  selectedModuleId: string;
  setSelectedModuleId: (id: string) => void;
  toggleModule: (id: string) => void;
}) {
  const selectedModule = openUSDLearningModules.find(module => module.id === selectedModuleId) ?? openUSDLearningModules[0];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5">
      <div className="space-y-2">
        {openUSDLearningModules.map(module => (
          <ModuleCard
            key={module.id}
            module={module}
            selected={module.id === selectedModule.id}
            complete={completedModuleIds.includes(module.id)}
            onSelect={() => setSelectedModuleId(module.id)}
            onToggle={() => toggleModule(module.id)}
          />
        ))}
      </div>

      <div className="space-y-5 min-w-0">
        <section className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-xs font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md">
                  {selectedModule.difficulty}
                </span>
                <span className="text-xs font-semibold text-gray-500 inline-flex items-center gap-1">
                  <Clock3 size={12} /> {selectedModule.estimatedHours} hours
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">{selectedModule.title}</h2>
              <p className="text-sm text-gray-500 mt-1 max-w-3xl">{selectedModule.subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleModule(selectedModule.id)}
                className={clsx(
                  'inline-flex items-center gap-2 text-xs font-semibold border rounded-md px-3 py-2 transition-colors',
                  completedModuleIds.includes(selectedModule.id)
                    ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50',
                )}
              >
                {completedModuleIds.includes(selectedModule.id) ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                {completedModuleIds.includes(selectedModule.id) ? 'Completed' : 'Mark complete'}
              </button>
              <a
                href={selectedModule.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold bg-gray-900 text-white rounded-md px-3 py-2 hover:bg-gray-800"
              >
                Open docs <ExternalLink size={13} />
              </a>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Why this matters</p>
              <p className="text-sm text-gray-700 leading-relaxed">{selectedModule.whyItMatters}</p>

              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mt-5 mb-2">Core ideas</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedModule.coreIdeas.map(idea => (
                  <div key={idea} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <p className="text-sm text-gray-700 leading-snug">{idea}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Exam domains</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedModule.examDomains.map(domainId => (
                    <DomainBadge key={domainId} domainId={domainId} />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Lessons</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedModule.lessons.map(lesson => (
                    <span key={lesson} className="text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-md px-2 py-1">
                      {lesson}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-700 mb-2 flex items-center gap-1.5">
                  <Lightbulb size={13} /> Checkpoint
                </p>
                <p className="text-sm text-amber-900 leading-relaxed">{selectedModule.checkpoint}</p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Practice prompts</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {selectedModule.practicePrompts.map(prompt => (
                <div key={prompt} className="border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-700 leading-snug">{prompt}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Exam Blueprint Weighting</h3>
              <p className="text-sm text-gray-500">Use the percentages to decide where deeper review pays off.</p>
            </div>
            <a
              href={certificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
            >
              NVIDIA source <ExternalLink size={12} />
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {examBlueprintDomains.map(domain => {
              const Icon = DOMAIN_ICONS[domain.id];
              return (
                <div key={domain.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className={clsx('w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0', domainVisualMeta[domain.id].color)}>
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-gray-900">{domain.label}</h4>
                        <span className="text-sm font-black text-gray-900">{domain.weight}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
                        <div className={clsx('h-full rounded-full', domainVisualMeta[domain.id].barColor)} style={{ width: `${domain.weight * 3.1}%` }} />
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed mt-2">{domain.summary}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function PracticeView({
  quizAnswers,
  setQuizAnswers,
}: {
  quizAnswers: Record<string, number>;
  setQuizAnswers: (value: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)) => void;
}) {
  const [domainFilter, setDomainFilter] = useState<DomainFilter>('all');

  const filteredQuestions = useMemo(() => (
    domainFilter === 'all'
      ? practiceQuestions
      : practiceQuestions.filter(question => question.domainId === domainFilter)
  ), [domainFilter]);

  const answeredQuestions = practiceQuestions.filter(question => quizAnswers[question.id] !== undefined);
  const correctQuestions = answeredQuestions.filter(question => quizAnswers[question.id] === question.answerIndex);
  const filteredAnswered = filteredQuestions.filter(question => quizAnswers[question.id] !== undefined);
  const filteredCorrect = filteredAnswered.filter(question => quizAnswers[question.id] === question.answerIndex);

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          icon={<Brain size={18} />}
          label="Answered"
          value={`${answeredQuestions.length}/${practiceQuestions.length}`}
          sub="questions attempted across all domains"
        />
        <StatCard
          icon={<Trophy size={18} />}
          label="Accuracy"
          value={`${pct(correctQuestions.length, answeredQuestions.length)}%`}
          sub="based on answered questions"
        />
        <StatCard
          icon={<Target size={18} />}
          label="Current Set"
          value={`${pct(filteredCorrect.length, filteredAnswered.length)}%`}
          sub={`${filteredQuestions.length} questions in this view`}
        />
      </section>

      <section className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Practice Questions</h2>
            <p className="text-sm text-gray-500">Short checks with explanations and source hints.</p>
          </div>
          <button
            type="button"
            onClick={() => setQuizAnswers({})}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50"
          >
            <RotateCcw size={13} /> Reset answers
          </button>
        </div>
        <div className="flex gap-1.5 overflow-x-auto tab-bar pb-1">
          <button
            type="button"
            onClick={() => setDomainFilter('all')}
            className={clsx(
              'px-3 py-1.5 rounded-md text-xs font-semibold border whitespace-nowrap',
              domainFilter === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50',
            )}
          >
            All domains
          </button>
          {examBlueprintDomains.map(domain => (
            <button
              key={domain.id}
              type="button"
              onClick={() => setDomainFilter(domain.id)}
              className={clsx(
                'px-3 py-1.5 rounded-md text-xs font-semibold border whitespace-nowrap',
                domainFilter === domain.id ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50',
              )}
            >
              {domain.shortLabel}
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filteredQuestions.map((question, questionIndex) => {
          const selected = quizAnswers[question.id];
          const answered = selected !== undefined;
          const correct = selected === question.answerIndex;
          const module = openUSDLearningModules.find(item => item.id === question.moduleId);
          return (
            <section key={question.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Question {questionIndex + 1}</span>
                    <DomainBadge domainId={question.domainId} compact />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 leading-snug">{question.prompt}</h3>
                </div>
                {answered && (
                  <span className={clsx(
                    'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border flex-shrink-0',
                    correct ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200',
                  )}>
                    {correct ? <CheckCircle2 size={12} /> : <Bug size={12} />}
                    {correct ? 'Correct' : 'Review'}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {question.choices.map((choice, choiceIndex) => {
                  const isSelected = selected === choiceIndex;
                  const isAnswer = question.answerIndex === choiceIndex;
                  return (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => setQuizAnswers(prev => ({ ...prev, [question.id]: choiceIndex }))}
                      className={clsx(
                        'w-full text-left text-sm leading-snug border rounded-lg px-3 py-2 transition-colors break-words',
                        !answered && 'bg-white border-gray-200 hover:bg-gray-50',
                        answered && isAnswer && 'bg-emerald-50 border-emerald-300 text-emerald-900',
                        answered && isSelected && !isAnswer && 'bg-rose-50 border-rose-300 text-rose-900',
                        answered && !isSelected && !isAnswer && 'bg-gray-50 border-gray-200 text-gray-500',
                      )}
                    >
                      <span className="font-semibold mr-2">{String.fromCharCode(65 + choiceIndex)}.</span>
                      {choice}
                    </button>
                  );
                })}
              </div>

              {answered && (
                <div className="mt-4 border-t border-gray-100 pt-3">
                  <p className="text-sm text-gray-700 leading-relaxed">{question.explanation}</p>
                  <div className="flex items-center justify-between gap-2 flex-wrap mt-3">
                    <span className="text-xs text-gray-400">
                      Source hint: <span className="font-semibold text-gray-600">{question.sourceHint}</span>
                    </span>
                    {module && (
                      <a
                        href={module.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Open module <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function GlossaryView({
  masteredTermIds,
  toggleTerm,
}: {
  masteredTermIds: string[];
  toggleTerm: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const filteredTerms = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return openUSDGlossaryTerms;
    return openUSDGlossaryTerms.filter(term => (
      term.term.toLowerCase().includes(q)
      || term.plainEnglish.toLowerCase().includes(q)
      || term.certAngle.toLowerCase().includes(q)
    ));
  }, [query]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">
      <div className="space-y-4">
        <section className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-base font-bold text-gray-900">Plain-English Glossary</h2>
              <p className="text-sm text-gray-500">Certification terms, translated into practical mental models.</p>
            </div>
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search glossary"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredTerms.map(term => {
            const mastered = masteredTermIds.includes(term.id);
            return (
              <section key={term.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-base font-bold text-gray-900">{term.term}</h3>
                  <button
                    type="button"
                    onClick={() => toggleTerm(term.id)}
                    className={clsx(
                      'inline-flex items-center justify-center w-8 h-8 rounded-md border transition-colors flex-shrink-0',
                      mastered ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-200 text-gray-300 hover:text-emerald-600 hover:border-emerald-300',
                    )}
                    title={mastered ? 'Marked as known' : 'Mark as known'}
                  >
                    {mastered ? <Check size={15} /> : <Circle size={14} />}
                  </button>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{term.plainEnglish}</p>
                <div className="mt-3 border-l-2 border-amber-300 pl-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-700 mb-1">Certification angle</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{term.certAngle}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {term.domainIds.map(domainId => (
                    <DomainBadge key={domainId} domainId={domainId} compact />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <aside className="space-y-4">
        <section className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-base font-bold text-gray-900">Term Progress</h3>
          <p className="text-sm text-gray-500 mt-1">{masteredTermIds.length} of {openUSDGlossaryTerms.length} marked as known.</p>
          <ProgressBar value={pct(masteredTermIds.length, openUSDGlossaryTerms.length)} className="mt-3" />
        </section>

        <section className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-base font-bold text-gray-900 mb-3">Concept Stack</h3>
          <div className="space-y-2">
            {[
              ['Stage', 'the composed scene view'],
              ['Layer', 'one source of authored opinions'],
              ['Prim', 'a scene object at a path'],
              ['Property', 'attribute value or relationship target'],
              ['Arc', 'a rule for bringing data together'],
            ].map(([label, sub], index) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-md bg-gray-900 text-white flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-cyan-700 mb-2">Study move</p>
          <p className="text-sm text-cyan-900 leading-relaxed">
            Pick one term, say it in plain English, then explain where it appears in a real asset. That loop is more durable than memorizing definitions.
          </p>
        </section>
      </aside>
    </div>
  );
}

function ContributeView() {
  return (
    <div className="space-y-5">
      <section className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Contribution-Ready Direction</h2>
            <p className="text-sm text-gray-600 leading-relaxed mt-2 max-w-3xl">
              The safest contribution is not an unofficial exam dump. It is a companion layer that helps learners navigate the official curriculum, practice concepts, and trace every answer back to a public source.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
              <a
                href={learnOpenUSDRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <GitBranch size={18} className="text-gray-700 mb-2" />
                <p className="text-sm font-bold text-gray-900">LearnOpenUSD repo</p>
                <p className="text-xs text-gray-500 mt-1">Open issues, contribution guidelines, and docs source.</p>
              </a>
              <a
                href={learnOpenUSDSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <BookOpen size={18} className="text-gray-700 mb-2" />
                <p className="text-sm font-bold text-gray-900">Rendered curriculum</p>
                <p className="text-xs text-gray-500 mt-1">The learner-facing source of truth for modules and exercises.</p>
              </a>
            </div>
          </div>

          <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 mb-2">Guardrails</p>
            <ul className="space-y-2 text-sm text-emerald-900 leading-relaxed">
              <li className="flex gap-2"><Check size={14} className="mt-0.5 flex-shrink-0" /> Keep questions conceptual and source-linked.</li>
              <li className="flex gap-2"><Check size={14} className="mt-0.5 flex-shrink-0" /> Avoid claiming exact exam questions or private exam content.</li>
              <li className="flex gap-2"><Check size={14} className="mt-0.5 flex-shrink-0" /> Use the public NVIDIA blueprint for weights and domains.</li>
              <li className="flex gap-2"><Check size={14} className="mt-0.5 flex-shrink-0" /> Prefer static data that works in Sphinx without accounts or a backend.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {contributionIdeas.map(idea => (
          <div key={idea.title} className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-base font-bold text-gray-900">{idea.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed mt-2">{idea.value}</p>
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Likely files</p>
              <div className="flex flex-wrap gap-1.5">
                {idea.likelyFiles.map(file => (
                  <span key={file} className="text-xs font-mono text-gray-600 bg-gray-100 border border-gray-200 rounded-md px-2 py-1">
                    {file}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-4 border-l-2 border-cyan-300 pl-3">
              <p className="text-xs font-bold uppercase tracking-wide text-cyan-700 mb-1">First step</p>
              <p className="text-sm text-gray-700 leading-relaxed">{idea.firstStep}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="text-base font-bold text-gray-900 mb-3">Suggested PR Shape</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {[
            ['1. Open an issue', 'Propose a certification companion that maps official blueprint domains to public LearnOpenUSD modules.'],
            ['2. Add a small source-backed slice', 'Start with the roadmap and glossary additions before adding a larger practice bank.'],
            ['3. Ask for review on tone', 'Make sure beginner-friendly explanations stay accurate and do not imply inside exam access.'],
          ].map(([title, body]) => (
            <div key={title} className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-bold text-gray-900">{title}</p>
              <p className="text-sm text-gray-600 leading-relaxed mt-2">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function OpenUSDCertificationCoach() {
  const [view, setView] = useState<View>('play');
  const [selectedModuleId, setSelectedModuleId] = useState('orientation');
  const [completedModuleIds, setCompletedModuleIds] = usePersistedState<string[]>('openusd_completed_modules', []);
  const [masteredTermIds, setMasteredTermIds] = usePersistedState<string[]>('openusd_mastered_terms', []);
  const [quizAnswers, setQuizAnswers] = usePersistedState<Record<string, number>>('openusd_quiz_answers', {});

  const completedPercent = pct(completedModuleIds.length, openUSDLearningModules.length);
  const answeredQuestions = practiceQuestions.filter(question => quizAnswers[question.id] !== undefined);
  const correctQuestions = answeredQuestions.filter(question => quizAnswers[question.id] === question.answerIndex);
  const accuracy = pct(correctQuestions.length, answeredQuestions.length);
  const readiness = Math.round((completedPercent * 0.45) + (pct(masteredTermIds.length, openUSDGlossaryTerms.length) * 0.2) + (accuracy * 0.35));

  const nextModule = openUSDLearningModules.find(module => !completedModuleIds.includes(module.id)) ?? openUSDLearningModules[openUSDLearningModules.length - 1];

  const toggleModule = (id: string) => {
    setCompletedModuleIds(prev => (
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    ));
  };

  const toggleTerm = (id: string) => {
    setMasteredTermIds(prev => (
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    ));
  };

  return (
    <div className="space-y-5">
      <section className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_430px] gap-5 items-start">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2.5 py-1 mb-3">
              <GraduationCap size={14} /> Certification companion
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-tight">
              Build a tiny OpenUSD world.
            </h1>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed mt-3 max-w-3xl">
              Start with blocks, colors, lights, and choices. Then connect each playful piece to the real OpenUSD words you need for certification.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
              <StatCard
                icon={<ListChecks size={18} />}
                label="Map"
                value={`${completedModuleIds.length}/${openUSDLearningModules.length}`}
                sub={`${completedPercent}% of the big path done`}
              />
              <StatCard
                icon={<FileQuestion size={18} />}
                label="Checks"
                value={`${correctQuestions.length}/${answeredQuestions.length || 0}`}
                sub={`${accuracy}% tiny-answer score`}
              />
              <StatCard
                icon={<Trophy size={18} />}
                label="Power"
                value={`${readiness}%`}
                sub="study power from play and practice"
              />
            </div>
          </div>

          <CompositionVisual />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Study progress</p>
              <p className="text-sm text-gray-600 mt-0.5">Next up: <span className="font-semibold text-gray-900">{nextModule.title}</span></p>
            </div>
            <span className="text-sm font-black text-gray-900">{completedPercent}%</span>
          </div>
          <ProgressBar value={completedPercent} />
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Exam at a glance</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <span className="text-gray-500">Credential</span><span className="font-semibold text-gray-900 text-right">{examSnapshot.name}</span>
            <span className="text-gray-500">Level</span><span className="font-semibold text-gray-900 text-right">{examSnapshot.level}</span>
            <span className="text-gray-500">Duration</span><span className="font-semibold text-gray-900 text-right">{examSnapshot.duration}</span>
            <span className="text-gray-500">Questions</span><span className="font-semibold text-gray-900 text-right">{examSnapshot.questionCount}</span>
          </div>
        </div>
      </section>

      <nav className="tab-bar flex gap-1 bg-gray-100 border border-gray-200 rounded-lg p-1 overflow-x-auto">
        {VIEW_OPTIONS.map(option => (
          <button
            key={option.id}
            type="button"
            onClick={() => setView(option.id)}
            className={clsx(
              'inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-all whitespace-nowrap',
              view === option.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
            )}
          >
            {option.icon}
            {option.label}
          </button>
        ))}
        <div className="ml-auto hidden md:flex items-center gap-2 pr-2">
          <a href={studyGuideUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600">
            Study guide <Download size={12} />
          </a>
          <a href={certificationUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600">
            Exam page <ExternalLink size={12} />
          </a>
        </div>
      </nav>

      {view === 'play' && (
        <PlayView
          onOpenRoadmap={() => setView('roadmap')}
          onOpenPractice={() => setView('practice')}
        />
      )}
      {view === 'roadmap' && (
        <RoadmapView
          completedModuleIds={completedModuleIds}
          selectedModuleId={selectedModuleId}
          setSelectedModuleId={setSelectedModuleId}
          toggleModule={toggleModule}
        />
      )}
      {view === 'practice' && (
        <PracticeView quizAnswers={quizAnswers} setQuizAnswers={setQuizAnswers} />
      )}
      {view === 'glossary' && (
        <GlossaryView masteredTermIds={masteredTermIds} toggleTerm={toggleTerm} />
      )}
      {view === 'contribute' && <ContributeView />}
    </div>
  );
}
