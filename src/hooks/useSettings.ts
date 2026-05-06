import { useState, useEffect, useCallback } from 'react';

const SETTINGS_KEY = 'physicalai_settings_v1';
const SAVED_ITEMS_KEY = 'physicalai_saved_v1';
const ONBOARDING_KEY = 'physicalai_onboarded_v1';

export interface AppSettings {
  genZMode: boolean;
  genZUnlocked: boolean;
  density: 'compact' | 'comfortable';
  theme: 'light' | 'dark';
  /** Calendar vs list view per relevant tab */
  eventsView: 'list' | 'calendar';
}

const DEFAULTS: AppSettings = {
  genZMode: false,
  genZUnlocked: false,
  density: 'comfortable',
  theme: 'light',
  eventsView: 'list',
};

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULTS;
}

function persistSettings(s: AppSettings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch {}
}

let listeners: (() => void)[] = [];
let cached: AppSettings | null = null;

/** Global app settings — stays in sync across components via a tiny pub/sub */
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    if (!cached) cached = loadSettings();
    return cached;
  });

  useEffect(() => {
    const listener = () => cached && setSettings({ ...cached });
    listeners.push(listener);
    return () => { listeners = listeners.filter(l => l !== listener); };
  }, []);

  const update = useCallback((patch: Partial<AppSettings>) => {
    cached = { ...(cached ?? DEFAULTS), ...patch };
    persistSettings(cached);
    listeners.forEach(l => l());
  }, []);

  return { settings, update };
}

// ── Saved / pinned items ─────────────────────────────────────────────
export type SavedItemType = 'community' | 'event' | 'meetup' | 'speaker' | 'video' | 'topic' | 'github' | 'influencer' | 'discord' | 'podcast' | 'paper';
export interface SavedItem {
  id: string;
  type: SavedItemType;
  label: string;
  sub?: string;
  href?: string;
  savedAt: string;
}

function loadSaved(): SavedItem[] {
  try {
    const raw = localStorage.getItem(SAVED_ITEMS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

let savedCache: SavedItem[] | null = null;
let savedListeners: (() => void)[] = [];

export function useSavedItems() {
  const [items, setItems] = useState<SavedItem[]>(() => {
    if (!savedCache) savedCache = loadSaved();
    return savedCache;
  });

  useEffect(() => {
    const listener = () => savedCache && setItems([...savedCache]);
    savedListeners.push(listener);
    return () => { savedListeners = savedListeners.filter(l => l !== listener); };
  }, []);

  const persist = useCallback((next: SavedItem[]) => {
    savedCache = next;
    try { localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(next)); } catch {}
    savedListeners.forEach(l => l());
  }, []);

  const isSaved = useCallback((id: string) => (savedCache ?? []).some(x => x.id === id), []);

  const toggle = useCallback((item: Omit<SavedItem, 'savedAt'>) => {
    const current = savedCache ?? [];
    const exists = current.some(x => x.id === item.id);
    if (exists) {
      persist(current.filter(x => x.id !== item.id));
    } else {
      persist([{ ...item, savedAt: new Date().toISOString() }, ...current]);
    }
  }, [persist]);

  const remove = useCallback((id: string) => {
    persist((savedCache ?? []).filter(x => x.id !== id));
  }, [persist]);

  const clear = useCallback(() => persist([]), [persist]);

  return { items, isSaved, toggle, remove, clear };
}

// ── Onboarding ─────────────────────────────────────────────
export function useOnboarding() {
  const [completed, setCompleted] = useState<boolean>(() => {
    try { return localStorage.getItem(ONBOARDING_KEY) === 'done'; } catch { return false; }
  });
  const complete = useCallback(() => {
    try { localStorage.setItem(ONBOARDING_KEY, 'done'); } catch {}
    setCompleted(true);
  }, []);
  const reset = useCallback(() => {
    try { localStorage.removeItem(ONBOARDING_KEY); } catch {}
    setCompleted(false);
  }, []);
  return { completed, complete, reset };
}

// ── Annotations: per-section notes on Monthly Analysis ──────────────
const ANNOTATIONS_KEY = 'physicalai_annotations_v1';
let annotationsCache: Record<string, string> | null = null;
let annotationsListeners: (() => void)[] = [];

function loadAnnotations(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(ANNOTATIONS_KEY) ?? '{}'); }
  catch { return {}; }
}

export function useAnnotations() {
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    if (!annotationsCache) annotationsCache = loadAnnotations();
    return annotationsCache;
  });
  useEffect(() => {
    const l = () => annotationsCache && setNotes({ ...annotationsCache });
    annotationsListeners.push(l);
    return () => { annotationsListeners = annotationsListeners.filter(x => x !== l); };
  }, []);
  const set = useCallback((sectionId: string, text: string) => {
    annotationsCache = { ...(annotationsCache ?? {}), [sectionId]: text };
    if (!text.trim()) delete annotationsCache[sectionId];
    try { localStorage.setItem(ANNOTATIONS_KEY, JSON.stringify(annotationsCache)); } catch {}
    annotationsListeners.forEach(l => l());
  }, []);
  return { notes, set };
}

// ── Tasks: derived from recommended actions, persisted with done state ──────
const TASKS_KEY = 'physicalai_tasks_v1';
export interface Task {
  id: string;
  text: string;
  source: string;          // e.g. 'Monthly: GitHub' or 'Hot Topic: World Models'
  done: boolean;
  createdAt: string;
  doneAt?: string;
}
let tasksCache: Task[] | null = null;
let tasksListeners: (() => void)[] = [];

function loadTasks(): Task[] {
  try { return JSON.parse(localStorage.getItem(TASKS_KEY) ?? '[]'); }
  catch { return []; }
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (!tasksCache) tasksCache = loadTasks();
    return tasksCache;
  });
  useEffect(() => {
    const l = () => tasksCache && setTasks([...tasksCache]);
    tasksListeners.push(l);
    return () => { tasksListeners = tasksListeners.filter(x => x !== l); };
  }, []);
  const persist = useCallback((next: Task[]) => {
    tasksCache = next;
    try { localStorage.setItem(TASKS_KEY, JSON.stringify(next)); } catch {}
    tasksListeners.forEach(l => l());
  }, []);
  const add = useCallback((text: string, source: string) => {
    const id = `task_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
    persist([{ id, text, source, done: false, createdAt: new Date().toISOString() }, ...(tasksCache ?? [])]);
  }, [persist]);
  const has = useCallback((text: string, source: string) =>
    (tasksCache ?? []).some(t => t.text === text && t.source === source),
    []);
  const toggle = useCallback((id: string) => {
    persist((tasksCache ?? []).map(t => t.id === id
      ? { ...t, done: !t.done, doneAt: !t.done ? new Date().toISOString() : undefined }
      : t));
  }, [persist]);
  const remove = useCallback((id: string) => {
    persist((tasksCache ?? []).filter(t => t.id !== id));
  }, [persist]);
  const clearDone = useCallback(() => {
    persist((tasksCache ?? []).filter(t => !t.done));
  }, [persist]);
  return { tasks, add, has, toggle, remove, clearDone };
}

// ── Multi-select for bulk actions ─────────────────────────────────────
let selectionCache: Set<string> | null = null;
let selectionListeners: (() => void)[] = [];

export function useSelection() {
  const [selected, setSelected] = useState<Set<string>>(() => {
    if (!selectionCache) selectionCache = new Set();
    return selectionCache;
  });
  useEffect(() => {
    const l = () => selectionCache && setSelected(new Set(selectionCache));
    selectionListeners.push(l);
    return () => { selectionListeners = selectionListeners.filter(x => x !== l); };
  }, []);
  const persist = (next: Set<string>) => {
    selectionCache = next;
    selectionListeners.forEach(l => l());
  };
  const toggle = useCallback((id: string) => {
    const next = new Set(selectionCache ?? []);
    next.has(id) ? next.delete(id) : next.add(id);
    persist(next);
  }, []);
  const selectAll = useCallback((ids: string[]) => {
    persist(new Set([...(selectionCache ?? []), ...ids]));
  }, []);
  const clear = useCallback(() => persist(new Set()), []);
  const isSelected = useCallback((id: string) => (selectionCache ?? new Set()).has(id), []);
  return { selected, toggle, selectAll, clear, isSelected };
}

// ── Filter persistence helper ─────────────────────────────────────────
export function usePersistedState<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const storageKey = `physicalai_filter_${key}`;
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw);
    } catch {}
    return initial;
  });
  const set = useCallback((v: T | ((prev: T) => T)) => {
    setValue(prev => {
      const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v;
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [storageKey]);
  return [value, set];
}
