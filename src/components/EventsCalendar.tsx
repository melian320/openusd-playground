import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import clsx from 'clsx';
import { Conference } from '../types/community';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay } from 'date-fns';

const TYPE_COLOR: Record<string, string> = {
  conference: 'bg-blue-500',
  summit:     'bg-purple-500',
  hackathon:  'bg-green-500',
  meetup:     'bg-teal-500',
  workshop:   'bg-amber-500',
  webinar:    'bg-pink-500',
  podcast:    'bg-rose-500',
};

const BUZZ_RING: Record<string, string> = {
  trending: 'ring-2 ring-red-300',
  high:     'ring-2 ring-orange-300',
  medium:   '',
  low:      '',
};

export function EventsCalendar({ events }: { events: Conference[] }) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date('2026-06-01')));

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad start to align with Sunday-first grid
  const startDay = getDay(monthStart);
  const padding = Array(startDay).fill(null);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Conference[]>();
    events.forEach(e => {
      const start = new Date(e.startDate);
      const end = e.endDate ? new Date(e.endDate) : start;
      eachDayOfInterval({ start, end }).forEach(d => {
        const key = format(d, 'yyyy-MM-dd');
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(e);
      });
    });
    return map;
  }, [events]);

  const totalThisMonth = events.filter(e => {
    const start = new Date(e.startDate);
    return isSameMonth(start, cursor);
  }).length;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      {/* Calendar header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCursor(c => addMonths(c, -1))}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <h3 className="text-base font-bold text-gray-900">{format(cursor, 'MMMM yyyy')}</h3>
          <button
            onClick={() => setCursor(c => addMonths(c, 1))}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ChevronRight size={14} />
          </button>
          <button
            onClick={() => setCursor(startOfMonth(new Date('2026-06-01')))}
            className="text-xs text-blue-500 hover:text-blue-700 ml-2 underline"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span><span className="font-semibold text-gray-700">{totalThisMonth}</span> events this month</span>
          <span className="text-gray-300">·</span>
          <span>● Type, ⊙ buzz</span>
        </div>
      </div>

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-[10px] font-bold text-gray-400 uppercase tracking-wide text-center pb-1">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {padding.map((_, i) => <div key={`pad-${i}`} />)}
        {days.map(day => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDay.get(dayKey) ?? [];
          const isToday = isSameDay(day, new Date());
          return (
            <div
              key={dayKey}
              className={clsx(
                'min-h-[80px] border rounded-lg p-1.5 transition-colors',
                isToday ? 'border-blue-400 bg-blue-50/40' : 'border-gray-100 hover:border-gray-300 bg-white'
              )}
            >
              <div className={clsx(
                'text-[10px] font-bold mb-1',
                isToday ? 'text-blue-600' : 'text-gray-400'
              )}>
                {format(day, 'd')}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map(e => (
                  <a
                    key={e.id}
                    href={e.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`${e.name} · ${e.type} · ${e.location}`}
                    className={clsx(
                      'block text-[9px] font-medium rounded px-1 py-0.5 truncate text-white hover:opacity-90 transition-opacity',
                      TYPE_COLOR[e.type] ?? 'bg-gray-500',
                      BUZZ_RING[e.buzzLevel]
                    )}
                  >
                    {e.name}
                  </a>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[9px] text-gray-400 px-1">+{dayEvents.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-gray-500">
        {(['conference', 'summit', 'hackathon', 'meetup', 'workshop'] as const).map(t => (
          <span key={t} className="inline-flex items-center gap-1">
            <span className={clsx('inline-block w-2 h-2 rounded-full', TYPE_COLOR[t])} /> {t}
          </span>
        ))}
        <span className="ml-auto inline-flex items-center gap-1 italic">
          <ExternalLink size={9} /> click any event to open
        </span>
      </div>
    </div>
  );
}
