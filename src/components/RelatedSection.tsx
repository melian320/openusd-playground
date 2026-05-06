import { useState } from 'react';
import { Link2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { RelatedItem, TYPE_COLOR } from '../lib/relatedItems';
import clsx from 'clsx';

export function RelatedSection({ items, label = 'Related across the dashboard' }: { items: RelatedItem[]; label?: string }) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;
  return (
    <div className="mt-2 border-t border-gray-100 pt-2">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 text-[10px] font-bold text-violet-700 uppercase tracking-wider hover:text-violet-900 transition-colors"
      >
        <span className="inline-flex items-center gap-1">
          <Link2 size={9} /> {label}
          <span className="ml-1 px-1 py-0.5 rounded bg-violet-100 text-violet-700 font-bold">{items.length}</span>
        </span>
        {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>
      {open && (
        <div className="mt-1.5 space-y-1">
          {items.map((r, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-violet-50/40 transition-colors text-xs">
              <span className={clsx('text-[9px] font-bold uppercase px-1.5 py-0.5 rounded', TYPE_COLOR[r.type])}>
                {r.type}
              </span>
              <span className="font-medium text-gray-800 flex-1 truncate">{r.label}</span>
              {r.meta && <span className="text-[10px] text-gray-400 flex-shrink-0">{r.meta}</span>}
              {r.href && (
                <a href={r.href} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-blue-500 flex-shrink-0">
                  <ExternalLink size={10} />
                </a>
              )}
              <span className="text-[9px] text-violet-500 italic flex-shrink-0">{r.reason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
