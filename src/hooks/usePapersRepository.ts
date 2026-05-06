import { useState, useCallback } from 'react';
import { ArxivPaper } from '../lib/arxiv';

const STORAGE_KEY = 'physicalai_papers_v1';

function load(): ArxivPaper[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ArxivPaper[];
  } catch {}
  return [];
}

function persist(papers: ArxivPaper[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(papers));
}

export function usePapersRepository() {
  const [papers, setPapers] = useState<ArxivPaper[]>(load);

  const addPapers = useCallback((incoming: ArxivPaper[]) => {
    setPapers(prev => {
      const existingIds = new Set(prev.map(p => p.arxivId));
      const novel = incoming.filter(p => !existingIds.has(p.arxivId));
      const next = [...novel, ...prev];
      persist(next);
      return next;
    });
  }, []);

  const deletePaper = useCallback((arxivId: string) => {
    setPapers(prev => {
      const next = prev.filter(p => p.arxivId !== arxivId);
      persist(next);
      return next;
    });
  }, []);

  const toggleStar = useCallback((arxivId: string) => {
    setPapers(prev => {
      const next = prev.map(p =>
        p.arxivId === arxivId ? { ...p, isStarred: !p.isStarred } : p
      ) as (ArxivPaper & { isStarred?: boolean })[];
      persist(next);
      return next;
    });
  }, []);

  return { papers, addPapers, deletePaper, toggleStar };
}
