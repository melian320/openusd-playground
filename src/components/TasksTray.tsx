import { useState } from 'react';
import { CheckSquare, Square, X, Trash2, Plus, ListChecks } from 'lucide-react';
import { useTasks } from '../hooks/useSettings';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function TasksTray({ open, onClose }: Props) {
  const { tasks, add, toggle, remove, clearDone } = useTasks();
  const [newText, setNewText] = useState('');

  const openTasks = tasks.filter(t => !t.done);
  const doneTasks = tasks.filter(t => t.done);

  if (!open) return null;

  const submit = () => {
    if (newText.trim()) {
      add(newText.trim(), 'Manual');
      setNewText('');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[400px] bg-white shadow-2xl border-l border-gray-200 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3 flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur">
            <ListChecks size={15} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-white">Tasks</h2>
            <p className="text-[11px] text-white/80">
              {openTasks.length} open · {doneTasks.length} done
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Quick add */}
        <div className="px-3 py-2 border-b border-gray-100 flex-shrink-0 bg-gray-50">
          <div className="relative">
            <input
              value={newText}
              onChange={e => setNewText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submit(); }}
              placeholder="Add a task…"
              className="w-full pl-3 pr-9 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={submit}
              disabled={!newText.trim()}
              className={clsx(
                'absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded transition-colors',
                newText.trim() ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-300 cursor-not-allowed'
              )}
            >
              <Plus size={12} />
            </button>
          </div>
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-center">
              <ListChecks size={36} className="mb-3 opacity-30" />
              <p className="text-sm font-medium text-gray-600 mb-1">No tasks yet</p>
              <p className="text-xs max-w-xs leading-relaxed">
                Click "Add to tasks" on any recommended action in Monthly Analysis or Hot Topics, or add one manually above.
              </p>
            </div>
          ) : (
            <>
              {openTasks.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-1">Open</p>
                  <div className="space-y-1.5">
                    {openTasks.map(t => (
                      <div key={t.id} className="bg-white border border-gray-200 rounded-lg p-2.5 flex items-start gap-2 hover:border-gray-300 transition-all group">
                        <button onClick={() => toggle(t.id)} className="text-gray-300 hover:text-emerald-500 transition-colors flex-shrink-0 mt-0.5">
                          <Square size={13} />
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-800 leading-snug">{t.text}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{t.source} · {formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}</p>
                        </div>
                        <button onClick={() => remove(t.id)} className="text-gray-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {doneTasks.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5 px-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Done</p>
                    <button onClick={clearDone} className="text-[10px] text-gray-400 hover:text-red-500 underline">Clear done</button>
                  </div>
                  <div className="space-y-1.5">
                    {doneTasks.map(t => (
                      <div key={t.id} className="bg-emerald-50/40 border border-emerald-100 rounded-lg p-2.5 flex items-start gap-2 group">
                        <button onClick={() => toggle(t.id)} className="text-emerald-500 flex-shrink-0 mt-0.5">
                          <CheckSquare size={13} />
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 line-through leading-snug">{t.text}</p>
                          <p className="text-[10px] text-emerald-600 mt-0.5">{t.source} · done {t.doneAt ? formatDistanceToNow(new Date(t.doneAt), { addSuffix: true }) : ''}</p>
                        </div>
                        <button onClick={() => remove(t.id)} className="text-gray-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
