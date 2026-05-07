import { useMemo, useState } from 'react';
import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, isSameDay, isSameMonth, startOfMonth } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, ExternalLink, MapPin } from 'lucide-react';
import clsx from 'clsx';
import type { GlobalSourceRecord } from '../data/globalSourceRegistry';

interface ParsedGlobalEvent {
  source: GlobalSourceRecord;
  start: Date;
  end: Date;
}

const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

const STATUS_STYLES: Record<GlobalSourceRecord['status'], string> = {
  verified: 'bg-emerald-600 hover:bg-emerald-700',
  candidate: 'bg-blue-600 hover:bg-blue-700',
  unchecked: 'bg-gray-500 hover:bg-gray-600',
  stale: 'bg-amber-500 hover:bg-amber-600',
  dead: 'bg-red-500 hover:bg-red-600',
  unavailable: 'bg-red-500 hover:bg-red-600',
};

function monthFromToken(token: string): number | null {
  return MONTH_INDEX[token.toLowerCase()] ?? MONTH_INDEX[token.toLowerCase().slice(0, 3)] ?? null;
}

function asDate(year: number, month: number, day: number): Date {
  return new Date(year, month, day);
}

export function parseGlobalEventDateRange(label?: string): { start: Date; end: Date } | null {
  if (!label) return null;
  const normalized = label
    .replace(/[–—]/g, '-')
    .replace(/\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const yearMatch = normalized.match(/\b(20\d{2})\b/);
  if (!yearMatch) return null;
  const year = Number(yearMatch[1]);
  const body = normalized.replace(/,?\s*20\d{2}.*$/, '').trim();

  const crossMonth = body.match(/^([A-Za-z]+)\s+(\d{1,2})\s*-\s*([A-Za-z]+)\s+(\d{1,2})$/);
  if (crossMonth) {
    const startMonth = monthFromToken(crossMonth[1]);
    const endMonth = monthFromToken(crossMonth[3]);
    if (startMonth === null || endMonth === null) return null;
    return {
      start: asDate(year, startMonth, Number(crossMonth[2])),
      end: asDate(year, endMonth, Number(crossMonth[4])),
    };
  }

  const sameMonth = body.match(/^([A-Za-z]+)\s+(\d{1,2})\s*-\s*(\d{1,2})$/);
  if (sameMonth) {
    const month = monthFromToken(sameMonth[1]);
    if (month === null) return null;
    return {
      start: asDate(year, month, Number(sameMonth[2])),
      end: asDate(year, month, Number(sameMonth[3])),
    };
  }

  const singleDay = body.match(/^([A-Za-z]+)\s+(\d{1,2})$/);
  if (singleDay) {
    const month = monthFromToken(singleDay[1]);
    if (month === null) return null;
    const day = Number(singleDay[2]);
    return {
      start: asDate(year, month, day),
      end: asDate(year, month, day),
    };
  }

  return null;
}

function eventRangeLabel(event: ParsedGlobalEvent): string {
  if (isSameDay(event.start, event.end)) return format(event.start, 'MMM d');
  if (isSameMonth(event.start, event.end)) return `${format(event.start, 'MMM d')}-${format(event.end, 'd')}`;
  return `${format(event.start, 'MMM d')}-${format(event.end, 'MMM d')}`;
}

function isSourceEvent(source: GlobalSourceRecord): boolean {
  return source.type === 'event' || source.type === 'meetup';
}

export function GlobalEventsCalendar({ sources }: { sources: GlobalSourceRecord[] }) {
  const parsedEvents = useMemo<ParsedGlobalEvent[]>(() => sources
    .filter(isSourceEvent)
    .map(source => {
      const parsed = parseGlobalEventDateRange(source.eventDate);
      return parsed ? { source, ...parsed } : null;
    })
    .filter((event): event is ParsedGlobalEvent => Boolean(event))
    .sort((a, b) => a.start.getTime() - b.start.getTime() || a.source.name.localeCompare(b.source.name)),
  [sources]);

  const today = new Date();
  const initialMonth = parsedEvents.find(event => event.end >= today)?.start ?? parsedEvents[0]?.start ?? today;
  const [cursor, setCursor] = useState(() => startOfMonth(initialMonth));
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const padding = Array(getDay(monthStart)).fill(null);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, ParsedGlobalEvent[]>();
    parsedEvents.forEach(event => {
      eachDayOfInterval({ start: event.start, end: event.end }).forEach(day => {
        const key = format(day, 'yyyy-MM-dd');
        map.set(key, [...(map.get(key) ?? []), event]);
      });
    });
    return map;
  }, [parsedEvents]);

  const monthEvents = parsedEvents.filter(event => isSameMonth(event.start, cursor));
  const verifiedMonthEvents = monthEvents.filter(event => event.source.status === 'verified').length;

  if (parsedEvents.length === 0) {
    return (
      <div className="border border-gray-200 rounded-lg bg-white p-8 text-center">
        <CalendarDays size={28} className="mx-auto text-gray-300 mb-2" />
        <p className="text-sm font-medium text-gray-600">No dated Global View events match this filter.</p>
        <p className="text-xs text-gray-400 mt-1">Calendar view uses source-backed events with imported dates.</p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg bg-white p-4">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCursor(current => addMonths(current, -1))}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={15} />
          </button>
          <h3 className="text-sm font-bold text-gray-900 min-w-[132px] text-center">{format(cursor, 'MMMM yyyy')}</h3>
          <button
            onClick={() => setCursor(current => addMonths(current, 1))}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={15} />
          </button>
          <button
            onClick={() => setCursor(startOfMonth(initialMonth))}
            className="text-xs px-2 py-1 rounded-md border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-800 transition-colors"
          >
            Next event
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span><span className="font-semibold text-gray-700">{monthEvents.length}</span> events this month</span>
          <span><span className="font-semibold text-emerald-700">{verifiedMonthEvents}</span> verified</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-4">
        <div className="overflow-x-auto pb-1">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-[10px] font-bold text-gray-400 uppercase tracking-wide text-center pb-1">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {padding.map((_, index) => <div key={`pad-${index}`} />)}
              {days.map(day => {
                const dayKey = format(day, 'yyyy-MM-dd');
                const dayEvents = eventsByDay.get(dayKey) ?? [];
                const isToday = isSameDay(day, today);
                return (
                  <div
                    key={dayKey}
                    className={clsx(
                      'min-h-[96px] border rounded-md p-1.5 overflow-hidden transition-colors',
                      isToday ? 'border-blue-400 bg-blue-50/50' : 'border-gray-100 bg-white hover:border-gray-300'
                    )}
                  >
                    <div className={clsx('text-[10px] font-bold mb-1', isToday ? 'text-blue-600' : 'text-gray-400')}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map(event => (
                        <a
                          key={`${event.source.id}-${dayKey}`}
                          href={event.source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`${event.source.name} · ${event.source.location ?? event.source.region}`}
                          className={clsx(
                            'block text-[9px] font-semibold rounded px-1 py-0.5 truncate text-white transition-colors',
                            STATUS_STYLES[event.source.status]
                          )}
                        >
                          {event.source.name}
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
          </div>
        </div>

        <aside className="border border-gray-100 rounded-lg p-3 bg-gray-50/60">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h4 className="text-xs font-bold text-gray-800">Month Agenda</h4>
            <span className="text-[10px] text-gray-400">{format(cursor, 'MMM yyyy')}</span>
          </div>
          <div className="space-y-2 max-h-[430px] overflow-y-auto pr-1">
            {monthEvents.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No dated events this month.</p>
            ) : monthEvents.map(event => (
              <a
                key={event.source.id}
                href={event.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-md border border-gray-200 bg-white p-2 hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-xs font-semibold text-gray-900 leading-snug">{event.source.name}</p>
                  <ExternalLink size={10} className="text-gray-300 flex-shrink-0 mt-0.5" />
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-gray-500">
                  <span>{eventRangeLabel(event)}</span>
                  {event.source.location && (
                    <span className="inline-flex items-center gap-0.5">
                      <MapPin size={9} />
                      {event.source.location}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <span className={clsx('text-[10px] px-1.5 py-0.5 rounded-full text-white capitalize', STATUS_STYLES[event.source.status])}>
                    {event.source.status === 'unavailable' ? 'dead' : event.source.status}
                  </span>
                  {event.source.products.slice(0, 2).map(product => (
                    <span key={product} className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">{product}</span>
                  ))}
                </div>
              </a>
            ))}
          </div>
        </aside>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-gray-500">
        {(['verified', 'candidate', 'unchecked', 'stale', 'dead'] as const).map(status => (
          <span key={status} className="inline-flex items-center gap-1 capitalize">
            <span className={clsx('inline-block w-2 h-2 rounded-full', STATUS_STYLES[status])} />
            {status}
          </span>
        ))}
      </div>
    </div>
  );
}
