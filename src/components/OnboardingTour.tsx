import { useState } from 'react';
import { Search, Sparkles, Filter, Download, X, ArrowRight, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';

interface Step {
  title: string;
  body: string;
  icon: React.ReactNode;
  hint?: string;
}

const STEPS: Step[] = [
  {
    title: 'Welcome to Physical AI Community Hub',
    body: 'Track communities, events, speakers, repos, and content across the Physical AI ecosystem — all in one dashboard.',
    icon: <Sparkles size={28} className="text-violet-500" />,
    hint: 'Press Esc anytime to close this tour.',
  },
  {
    title: 'Search anything, instantly',
    body: 'Type 2+ characters in the top search and hit Enter. You\'ll get a full-page filtered view across communities, events, speakers, topics, podcasts, Discord, and influencers.',
    icon: <Search size={28} className="text-blue-500" />,
    hint: 'Shortcut: ⌘K (or Ctrl+K) to focus search.',
  },
  {
    title: 'Filter, score, and tag',
    body: 'Each tab has Region, Domain, Score (Trending/High/Medium/Low), and Tag filters. They persist as you navigate. Click "Clear filters" in any empty state to reset.',
    icon: <Filter size={28} className="text-emerald-500" />,
    hint: 'Save a community, speaker, or repo with the ★ button on any card.',
  },
  {
    title: 'Export & ask the AI',
    body: 'Every list has Export to Excel/PDF that respects your active filters. Or click "Ask the Hub" (bottom-right) for persona-tailored recommendations.',
    icon: <Download size={28} className="text-rose-500" />,
    hint: 'Shortcut: ⌘/ (or Ctrl+/) to open Ask the Hub.',
  },
];

export function OnboardingTour({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Progress dots */}
        <div className="bg-gradient-to-r from-violet-50 to-blue-50 px-6 pt-5 pb-3 flex items-center justify-between">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={clsx(
                  'h-1.5 rounded-full transition-all',
                  i === step ? 'w-8 bg-violet-600' : i < step ? 'w-3 bg-violet-300' : 'w-3 bg-gray-200'
                )}
              />
            ))}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1 rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-7 pt-6 pb-7">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-50 to-blue-50 mx-auto mb-4">
            {current.icon}
          </div>
          <h2 className="text-lg font-bold text-gray-900 text-center mb-2">{current.title}</h2>
          <p className="text-sm text-gray-600 text-center leading-relaxed mb-3">{current.body}</p>
          {current.hint && (
            <p className="text-xs text-gray-400 text-center italic">💡 {current.hint}</p>
          )}
        </div>

        <div className="border-t border-gray-100 px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className={clsx(
              'inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded transition-colors',
              step === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-gray-900'
            )}
          >
            <ArrowLeft size={11} /> Back
          </button>
          <span className="text-xs text-gray-400">{step + 1} / {STEPS.length}</span>
          <button
            onClick={() => isLast ? onClose() : setStep(s => s + 1)}
            className="inline-flex items-center gap-1 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            {isLast ? 'Get started' : 'Next'} {!isLast && <ArrowRight size={11} />}
          </button>
        </div>
      </div>
    </div>
  );
}
