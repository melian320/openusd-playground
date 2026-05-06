import { X, ExternalLink } from 'lucide-react';

export interface CompareItem {
  id: string;
  type: string;
  name: string;
  href?: string;
  metrics: { label: string; value: string | number; emphasis?: boolean }[];
  tags?: string[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  items: CompareItem[];
  title?: string;
}

export function CompareModal({ open, onClose, items, title = 'Compare' }: Props) {
  if (!open) return null;
  if (items.length === 0) return null;

  // Collect all unique metric labels across items, in display order
  const labels: string[] = [];
  for (const item of items) {
    for (const m of item.metrics) {
      if (!labels.includes(m.label)) labels.push(m.label);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 flex items-center gap-2">
          <h2 className="text-sm font-bold text-white flex-1">{title} — {items.length} items side-by-side</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1.5 rounded hover:bg-white/10">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {/* Item header row */}
          <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: `140px repeat(${items.length}, minmax(0, 1fr))` }}>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider self-end pb-2">Metric</div>
            {items.map(item => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-3 hover:border-gray-300 transition-all">
                <p className="text-[9px] font-bold uppercase tracking-wide text-violet-600 mb-1">{item.type}</p>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-sm text-gray-900 hover:text-blue-600 inline-flex items-center gap-1"
                >
                  {item.name}
                  {item.href && <ExternalLink size={10} className="opacity-40" />}
                </a>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {item.tags.slice(0, 4).map(t => (
                      <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Metric rows */}
          <div className="space-y-1">
            {labels.map(label => {
              const values = items.map(item => item.metrics.find(m => m.label === label));
              // Find the highest numeric value to highlight as the "winner"
              const numericValues = values.map(v => {
                if (!v) return null;
                const n = typeof v.value === 'number' ? v.value : parseFloat(String(v.value).replace(/[^\d.-]/g, ''));
                return isNaN(n) ? null : n;
              });
              const maxValue = Math.max(...(numericValues.filter(n => n !== null) as number[]));

              return (
                <div
                  key={label}
                  className="grid gap-3 items-center py-2 border-b border-gray-100 last:border-b-0"
                  style={{ gridTemplateColumns: `140px repeat(${items.length}, minmax(0, 1fr))` }}
                >
                  <div className="text-xs font-semibold text-gray-500">{label}</div>
                  {values.map((v, i) => {
                    const isMax = numericValues[i] !== null && numericValues[i] === maxValue && maxValue > 0;
                    return (
                      <div
                        key={i}
                        className={
                          v?.emphasis
                            ? 'text-sm font-bold text-violet-700'
                            : isMax
                              ? 'text-sm font-bold text-emerald-600'
                              : 'text-sm text-gray-700'
                        }
                      >
                        {v?.value ?? '—'}
                        {isMax && <span className="ml-1 text-[10px] font-semibold text-emerald-500">★</span>}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-gray-200 px-5 py-2.5 bg-gray-50 text-[11px] text-gray-500 italic">
          ★ marks the highest value per row · click any name to open the source
        </div>
      </div>
    </div>
  );
}
