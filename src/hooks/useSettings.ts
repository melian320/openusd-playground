import { useState, useEffect, useCallback } from 'react';

const SETTINGS_KEY = 'physicalai_settings_v1';
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
