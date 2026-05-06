import { useState, useEffect, useCallback } from 'react';

// Per-data-type configuration: where the live data should come from,
// or pasted JSON override, or fall back to bundled static data.

export type DataKey = 'communities' | 'conferences' | 'meetups' | 'speakers' | 'shows' | 'discordChannels' | 'hotTopics' | 'influencers' | 'githubRepos';

export interface DataSourceConfig {
  /** A Google Sheet ID that has been "Published to web" — gviz JSON works without auth */
  sheetId?: string;
  /** A specific tab/sheet name within that workbook */
  sheetName?: string;
  /** Last time this source was successfully refreshed */
  lastRefreshed?: string;
  /** User-pasted JSON override; if present, takes priority over sheet & bundled */
  jsonOverride?: unknown[];
}

export type DataSourceMap = Partial<Record<DataKey, DataSourceConfig>>;

const DATA_SOURCE_KEY = 'physicalai_data_sources_v1';

function loadConfig(): DataSourceMap {
  try {
    const raw = localStorage.getItem(DATA_SOURCE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

let cache: DataSourceMap | null = null;
let listeners: (() => void)[] = [];

function persist(next: DataSourceMap) {
  cache = next;
  try { localStorage.setItem(DATA_SOURCE_KEY, JSON.stringify(next)); } catch {}
  listeners.forEach(l => l());
}

export function useDataSourceConfig() {
  const [config, setConfig] = useState<DataSourceMap>(() => {
    if (!cache) cache = loadConfig();
    return cache;
  });

  useEffect(() => {
    const l = () => cache && setConfig({ ...cache });
    listeners.push(l);
    return () => { listeners = listeners.filter(x => x !== l); };
  }, []);

  const updateKey = useCallback((key: DataKey, patch: Partial<DataSourceConfig>) => {
    const next = { ...(cache ?? {}) };
    next[key] = { ...(next[key] ?? {}), ...patch };
    persist(next);
  }, []);

  const clearKey = useCallback((key: DataKey) => {
    const next = { ...(cache ?? {}) };
    delete next[key];
    persist(next);
  }, []);

  return { config, updateKey, clearKey };
}

// ─── Resolved data hook ─────────────────────────────────────────────────────
//
// Priority order:
//   1. JSON override (user-pasted) — instant, fully offline
//   2. Live Google Sheet fetch (if configured)
//   3. Bundled static fallback
//
// Components wire it like:
//   const communities = useDataSource('communities', BUNDLED_COMMUNITIES);

export interface ResolvedData<T> {
  data: T[];
  source: 'override' | 'sheet' | 'bundled';
  refresh: () => Promise<void>;
  loading: boolean;
  error?: string;
  lastRefreshed?: string;
}

export function useDataSource<T>(key: DataKey, fallback: T[]): ResolvedData<T> {
  const { config } = useDataSourceConfig();
  const cfg = config[key];
  const [sheetData, setSheetData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const fetchSheet = useCallback(async () => {
    if (!cfg?.sheetId) return;
    setLoading(true);
    setError(undefined);
    try {
      // Google Visualization API JSON — works on any "Published to web" sheet without auth
      // Format: https://docs.google.com/spreadsheets/d/{id}/gviz/tq?tqx=out:json&sheet={tabName}
      const sheetParam = cfg.sheetName ? `&sheet=${encodeURIComponent(cfg.sheetName)}` : '';
      const url = `https://docs.google.com/spreadsheets/d/${cfg.sheetId}/gviz/tq?tqx=out:json${sheetParam}`;
      const res = await fetch(url);
      const text = await res.text();
      // gviz returns JSONP-wrapped response: /*O_o*/\ngoogle.visualization.Query.setResponse({...});
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      const json = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
      if (json.status === 'error') throw new Error(json.errors?.[0]?.detailed_message ?? 'Sheet fetch failed');
      const cols: string[] = json.table.cols.map((c: { label?: string; id?: string }) => c.label || c.id || '');
      const rows = json.table.rows.map((r: { c: ({ v?: unknown } | null)[] }) => {
        const obj: Record<string, unknown> = {};
        r.c.forEach((cell, i) => {
          if (!cols[i]) return;
          let val = cell?.v;
          // Normalize comma-separated arrays for fields whose names suggest plurality
          if (typeof val === 'string' && val.includes(',') && /topics|domains|tags|sources/i.test(cols[i])) {
            val = val.split(',').map(s => s.trim()).filter(Boolean);
          }
          obj[cols[i]] = val ?? '';
        });
        return obj as T;
      });
      setSheetData(rows);
      // Save lastRefreshed
      const next = { ...(cache ?? {}) };
      next[key] = { ...(next[key] ?? {}), lastRefreshed: new Date().toISOString() };
      persist(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [cfg?.sheetId, cfg?.sheetName, key]);

  // Auto-fetch on mount when sheet is configured but not yet loaded
  useEffect(() => {
    if (cfg?.sheetId && !sheetData && !loading) fetchSheet();
    // Reset sheet data if config changes to no-sheet
    if (!cfg?.sheetId && sheetData) setSheetData(null);
  }, [cfg?.sheetId, cfg?.sheetName, sheetData, loading, fetchSheet]);

  // Resolve which source wins
  if (cfg?.jsonOverride && Array.isArray(cfg.jsonOverride) && cfg.jsonOverride.length > 0) {
    return {
      data: cfg.jsonOverride as T[],
      source: 'override',
      refresh: async () => {},
      loading: false,
      lastRefreshed: cfg.lastRefreshed,
    };
  }
  if (sheetData && sheetData.length > 0) {
    return {
      data: sheetData,
      source: 'sheet',
      refresh: fetchSheet,
      loading,
      error,
      lastRefreshed: cfg?.lastRefreshed,
    };
  }
  return {
    data: fallback,
    source: 'bundled',
    refresh: fetchSheet,
    loading,
    error,
    lastRefreshed: cfg?.lastRefreshed,
  };
}
