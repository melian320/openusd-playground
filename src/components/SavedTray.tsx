import { Bookmark, X, ExternalLink, Trash2 } from 'lucide-react';
import { useSavedItems, SavedItem } from '../hooks/useSettings';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

const TYPE_COLOR: Record<SavedItem['type'], string> = {
  community:  'bg-blue-50 text-blue-700',
  event:      'bg-violet-50 text-violet-700',
  meetup:     'bg-teal-50 text-teal-700',
  speaker:    'bg-emerald-50 text-emerald-700',
  video:      'bg-orange-50 text-orange-700',
  topic:      'bg-orange-50 text-orange-700',
  github:     'bg-slate-100 text-slate-700',
  influencer: 'bg-rose-50 text-rose-700',
  discord:    'bg-indigo-50 text-indigo-700',
  podcast:    'bg-pink-50 text-pink-700',
  paper:      'bg-amber-50 text-amber-700',
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SavedTray({ open, onClose }: Props) {
  const { items, remove, clear } = useSavedItems();

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[400px] bg-white shadow-2xl border-l border-gray-200 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur">
            <Bookmark size={15} className="text-white fill-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-white">Saved items</h2>
            <p className="text-[11px] text-white/80">{items.length} pinned across your dashboard</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-center">
              <Bookmark size={36} className="mb-3 opacity-30" />
              <p className="text-sm font-medium text-gray-600 mb-1">Nothing saved yet</p>
              <p className="text-xs max-w-xs leading-relaxed">
                Click the ★ icon on any card across communities, speakers, events, repos, or videos to pin it here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map(item => (
                <div
                  key={item.id}
                  className="bg-white border border-gray-200 rounded-xl p-3 hover:border-gray-300 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className={clsx('text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded', TYPE_COLOR[item.type])}>
                      {item.type}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.href && (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-300 hover:text-blue-500 p-1 transition-colors"
                          title="Open external"
                        >
                          <ExternalLink size={11} />
                        </a>
                      )}
                      <button
                        onClick={() => remove(item.id)}
                        className="text-gray-300 hover:text-red-500 p-1 transition-colors"
                        title="Remove"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-gray-900 leading-snug">{item.label}</p>
                  {item.sub && <p className="text-[11px] text-gray-500 mt-0.5">{item.sub}</p>}
                  <p className="text-[10px] text-gray-400 mt-1.5">Saved {formatDistanceToNow(new Date(item.savedAt), { addSuffix: true })}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-gray-200 p-3 flex-shrink-0">
            <button
              onClick={() => { if (confirm('Clear all saved items?')) clear(); }}
              className="text-xs text-gray-400 hover:text-red-500 underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </>
  );
}
