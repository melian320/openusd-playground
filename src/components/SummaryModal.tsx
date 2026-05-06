import { useState, useEffect } from 'react';
import { Sparkles, X, Copy, Check } from 'lucide-react';
import { toGenZ } from '../lib/assistantEngine';
import { useSettings } from '../hooks/useSettings';
import clsx from 'clsx';

interface Props<T> {
  open: boolean;
  onClose: () => void;
  /** Tab name for the summary header */
  tabName: string;
  /** The currently filtered list — used to derive insights */
  items: T[];
  /** Total available before filtering */
  totalAvailable: number;
  /** Optional accessor to extract a list of names/titles for surface-level mention */
  describeItem: (item: T) => { name: string; metric?: string };
  /** Optional pre-baked insights to anchor the summary on */
  customInsights?: string[];
}

export function SummaryModal<T>({ open, onClose, tabName, items, totalAvailable, describeItem, customInsights }: Props<T>) {
  const { settings } = useSettings();
  const genZ = settings.genZMode;
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (!open) setCopied(false); }, [open]);

  if (!open) return null;

  // Build a synthesized 3-bullet summary
  const top3 = items.slice(0, 3).map(describeItem);
  const totalText = `${items.length} of ${totalAvailable}`;
  const filterNote = items.length < totalAvailable
    ? `Filtered to ${totalText} entries.`
    : `Full set of ${totalAvailable} entries.`;

  const standardBullets = [
    `**Coverage:** ${filterNote} ${tabName} surfaces are anchored on ${top3.map(t => t.name).join(', ')}.`,
    customInsights?.[0] ?? `**Concentration:** Buzz is concentrated in the top ${Math.min(items.length, 5)} items, with the highest-signal entries clustered around the leading topic and persona signals.`,
    customInsights?.[1] ?? `**Action:** Prioritize outreach or amplification on the top 3 entries this week. Use the Export buttons to ship the filtered list to Excel/PDF for downstream workflows.`,
  ];

  const bullets = genZ ? standardBullets.map(toGenZ) : standardBullets;
  const fullText = `${tabName} — Executive Summary\n${filterNote}\n\n` + bullets.map((b, i) => `${i + 1}. ${b.replace(/\*\*/g, '')}`).join('\n\n');

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <div className={clsx(
          'px-5 py-4 flex items-center gap-2',
          genZ ? 'bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-600' : 'bg-gradient-to-r from-violet-600 to-blue-600'
        )}>
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur">
            <Sparkles size={15} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-white">
              {genZ ? '✨ The summary bestie' : 'Executive Summary'}
            </h2>
            <p className="text-[11px] text-white/80">{tabName} · synthesized from {items.length} {items.length === 1 ? 'entry' : 'entries'}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1.5 rounded hover:bg-white/10">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <ol className="space-y-3">
            {bullets.map((b, i) => {
              // Bold inline **markdown**
              const parts = b.split(/(\*\*[^*]+\*\*)/g);
              return (
                <li key={i} className="flex gap-2.5">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <p className="text-sm text-gray-700 leading-relaxed flex-1">
                    {parts.map((p, j) =>
                      p.startsWith('**') && p.endsWith('**')
                        ? <strong key={j} className="text-gray-900">{p.slice(2, -2)}</strong>
                        : <span key={j}>{p}</span>
                    )}
                  </p>
                </li>
              );
            })}
          </ol>
          {top3.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mt-4">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Top 3 surfaced items</p>
              <ol className="space-y-0.5">
                {top3.map((t, i) => (
                  <li key={i} className="text-xs text-gray-700">
                    <span className="text-gray-400 mr-1">{i + 1}.</span>
                    <span className="font-semibold">{t.name}</span>
                    {t.metric && <span className="text-gray-400 ml-2">{t.metric}</span>}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-5 py-3 flex items-center justify-between bg-gray-50">
          <p className="text-[10px] text-gray-400 italic">Synthesized in real time from current filters.</p>
          <button
            onClick={copyToClipboard}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? 'Copied!' : 'Copy summary'}
          </button>
        </div>
      </div>
    </div>
  );
}
