import { useState, useEffect } from 'react';
import { X, Search, FileText, CheckSquare, Square, Loader2, Download, ExternalLink, ChevronDown, ChevronUp, TrendingUp, Heart, Github, BookOpen } from 'lucide-react';
import {
  searchArxiv, searchHFPapers, getTrendingHFPapers,
  searchPapersWithCode, getTrendingPapersWithCode,
  searchOpenReview, fetchArxivRSS,
  PAPER_TOPICS,
  OR_VENUES, ARXIV_CATEGORIES,
  ArxivPaper,
} from '../lib/arxiv';
import clsx from 'clsx';
import { format } from 'date-fns';

const TAG_COLORS: Record<string, string> = {
  robotics: 'bg-orange-50 text-orange-700',
  humanoids: 'bg-red-50 text-red-700',
  'embodied-ai': 'bg-violet-50 text-violet-700',
  'digital-twins': 'bg-teal-50 text-teal-700',
  simulation: 'bg-emerald-50 text-emerald-700',
  research: 'bg-blue-50 text-blue-700',
};

type SourceTab = 'social' | 'pwc' | 'openreview' | 'arxiv';

interface Props {
  onImport: (papers: ArxivPaper[]) => void;
  onClose: () => void;
}

const SOURCES: { id: SourceTab; label: string; sublabel: string; color: string }[] = [
  { id: 'social',     label: '🤗 HF · 𝕏',       sublabel: 'Trending social',       color: 'border-rose-500 text-rose-600 bg-rose-50/50' },
  { id: 'pwc',        label: '⚙ With Code',      sublabel: 'GitHub star ranked',    color: 'border-emerald-500 text-emerald-700 bg-emerald-50/50' },
  { id: 'openreview', label: '🎓 Conferences',    sublabel: 'CoRL · NeurIPS · ICLR', color: 'border-violet-500 text-violet-700 bg-violet-50/50' },
  { id: 'arxiv',      label: '📄 arXiv RSS',      sublabel: 'Newest submissions',    color: 'border-blue-500 text-blue-600 bg-blue-50/50' },
];

export function PaperImport({ onImport, onClose }: Props) {
  const [sourceTab, setSourceTab] = useState<SourceTab>('social');
  const [query, setQuery] = useState('');
  const [orVenue, setOrVenue] = useState(OR_VENUES[0].id);
  const [arxivCat, setArxivCat] = useState(ARXIV_CATEGORIES[0].id);
  const [results, setResults] = useState<ArxivPaper[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  // Auto-load defaults when tab opens
  useEffect(() => {
    if (results.length === 0 && !searched) {
      if (sourceTab === 'social') loadTrending();
      else if (sourceTab === 'pwc') loadPWCTrending();
      else if (sourceTab === 'arxiv') loadArxivFeed(arxivCat);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceTab]);

  const resetState = () => {
    setResults([]);
    setSelected(new Set());
    setExpanded(new Set());
    setSearched(false);
    setError(null);
    setQuery('');
  };

  const switchTab = (tab: SourceTab) => {
    setSourceTab(tab);
    resetState();
  };

  const loadTrending = async () => {
    setLoading(true); setError(null); setResults([]); setSelected(new Set()); setExpanded(new Set()); setSearched(true);
    try { setResults(await getTrendingHFPapers()); }
    catch { setError('Could not load HuggingFace trending. Check connection.'); }
    finally { setLoading(false); }
  };

  const loadPWCTrending = async () => {
    setLoading(true); setError(null); setResults([]); setSelected(new Set()); setExpanded(new Set()); setSearched(true);
    try { setResults(await getTrendingPapersWithCode('robotics physical AI')); }
    catch { setError('Could not load Papers with Code. Check connection.'); }
    finally { setLoading(false); }
  };

  const loadArxivFeed = async (cat: string) => {
    setLoading(true); setError(null); setResults([]); setSelected(new Set()); setExpanded(new Set()); setSearched(true);
    try { setResults(await fetchArxivRSS(cat)); }
    catch { setError('Could not load arXiv feed. Check connection.'); }
    finally { setLoading(false); }
  };

  const runSearch = async (q: string) => {
    if (!q.trim() && sourceTab !== 'openreview') return;
    setLoading(true); setError(null); setResults([]); setSelected(new Set()); setExpanded(new Set()); setSearched(true);
    try {
      let papers: ArxivPaper[];
      if (sourceTab === 'social')      papers = await searchHFPapers(q.trim(), 20);
      else if (sourceTab === 'pwc')    papers = await searchPapersWithCode(q.trim(), 20);
      else if (sourceTab === 'openreview') papers = await searchOpenReview(q.trim() || 'robot', orVenue);
      else                             papers = await searchArxiv(q.trim(), 15);
      setResults(papers);
    } catch {
      setError('Failed to fetch papers. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleExpand = (id: string) =>
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const selectAll = () => setSelected(new Set(results.map(p => p.arxivId)));
  const selectNone = () => setSelected(new Set());

  const handleImport = () => {
    onImport(results.filter(p => selected.has(p.arxivId)));
  };

  const activeSrc = SOURCES.find(s => s.id === sourceTab)!;
  // Topic presets — pick the right query per source tab
  const topicPresets = PAPER_TOPICS.map(t => ({
    id: t.id,
    label: t.short,
    color: t.color,
    query: sourceTab === 'social' ? t.queries.hf
         : sourceTab === 'pwc'    ? t.queries.pwc
         : sourceTab === 'arxiv'  ? ''            // handled by category selector
         :                          t.queries.s2,
  }));

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-rose-500" />
            <h2 className="text-base font-semibold text-gray-900">Import Research Papers</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Source tabs */}
        <div className="flex gap-1 px-4 pt-3">
          {SOURCES.map(src => (
            <button
              key={src.id}
              onClick={() => switchTab(src.id)}
              className={clsx(
                'flex flex-col items-start px-3 py-2 rounded-t-lg text-xs font-semibold border-b-2 transition-colors flex-1',
                sourceTab === src.id ? src.color : 'border-transparent text-gray-400 hover:text-gray-600'
              )}
            >
              <span>{src.label}</span>
              <span className="font-normal text-gray-400 text-[10px]">{src.sublabel}</span>
            </button>
          ))}
        </div>
        <div className="mx-4 border-b border-gray-100" />

        {/* Controls */}
        <div className="px-6 py-3 border-b border-gray-100 space-y-2">

          {/* Source-specific description + quick-load */}
          {sourceTab === 'social' && (
            <p className="text-xs text-gray-400">
              Papers celebrated by researchers on 🤗 HuggingFace &amp; 𝕏 — sorted by upvotes.{' '}
              <button onClick={loadTrending} className="text-rose-500 hover:underline font-medium">Load today's trending</button>
            </p>
          )}
          {sourceTab === 'pwc' && (
            <p className="text-xs text-gray-400">
              Papers with working code — GitHub stars = community adoption.{' '}
              <button onClick={loadPWCTrending} className="text-emerald-600 hover:underline font-medium">Load trending robotics</button>
            </p>
          )}
          {sourceTab === 'openreview' && (
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500 font-medium">Conference:</p>
              <select
                value={orVenue}
                onChange={e => setOrVenue(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-violet-400"
              >
                {OR_VENUES.map(v => (
                  <option key={v.id} value={v.id}>{v.label}</option>
                ))}
              </select>
            </div>
          )}
          {sourceTab === 'arxiv' && (
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs text-gray-500 font-medium">Category:</p>
              {ARXIV_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setArxivCat(cat.id); loadArxivFeed(cat.id); }}
                  className={clsx(
                    'text-xs px-2 py-0.5 rounded-full transition-colors',
                    arxivCat === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                  )}
                >
                  {cat.id}
                </button>
              ))}
            </div>
          )}

          {/* Search row (hidden for arXiv RSS) */}
          {sourceTab !== 'arxiv' && (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && runSearch(query)}
                  placeholder={
                    sourceTab === 'social' ? 'Search HuggingFace Papers…' :
                    sourceTab === 'pwc'    ? 'Search Papers with Code…' :
                                            'Search in selected conference…'
                  }
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>
              <button
                onClick={() => runSearch(query)}
                disabled={loading}
                className="px-4 py-1.5 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : 'Search'}
              </button>
            </div>
          )}

          {/* Topic chips */}
          {sourceTab !== 'arxiv' && (
            <div className="flex flex-wrap gap-1">
              {topicPresets.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setQuery(t.query); runSearch(t.query); }}
                  className={clsx('text-xs px-2 py-0.5 rounded-full transition-all hover:opacity-80 font-medium', t.color)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 size={24} className="animate-spin mr-3" />
              <span className="text-sm">Fetching papers…</span>
            </div>
          )}

          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {!loading && !searched && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <TrendingUp size={28} className="mb-2 opacity-30" />
              <p className="text-sm font-medium text-gray-500 mb-1">Loading…</p>
            </div>
          )}

          {!loading && searched && results.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <FileText size={28} className="mb-2 opacity-40" />
              <p className="text-sm">No papers found. Try a different query.</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <>
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-2 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  <span className="font-semibold text-gray-700">{results.length}</span> results ·{' '}
                  <span className="font-semibold text-rose-600">{selected.size}</span> selected
                </p>
                <div className="flex gap-3 text-xs">
                  <button onClick={selectAll} className="text-blue-500 hover:underline">Select all</button>
                  <button onClick={selectNone} className="text-gray-400 hover:underline">None</button>
                </div>
              </div>

              <ul className="divide-y divide-gray-100">
                {results.map(paper => {
                  const isSelected = selected.has(paper.arxivId);
                  const isExpanded = expanded.has(paper.arxivId);
                  return (
                    <li
                      key={paper.arxivId}
                      className={clsx('px-6 py-3 transition-colors', isSelected ? 'bg-rose-50/40' : 'hover:bg-gray-50')}
                    >
                      <div className="flex items-start gap-3">
                        <button onClick={() => toggleSelect(paper.arxivId)} className="flex-shrink-0 mt-0.5 text-gray-300 hover:text-rose-500 transition-colors">
                          {isSelected ? <CheckSquare size={16} className="text-rose-500" /> : <Square size={16} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-gray-900 leading-snug">{paper.title}</p>
                            <a href={paper.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex-shrink-0 text-gray-300 hover:text-blue-500 transition-colors">
                              <ExternalLink size={12} />
                            </a>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 ? ' et al.' : ''}
                            {' · '}{format(new Date(paper.published), 'MMM d, yyyy')}
                            {paper.venue && <span className="italic ml-1">· {paper.venue}</span>}
                            {paper.arxivId && !paper.arxivId.includes('-') && <span className="font-mono ml-1">· {paper.arxivId}</span>}
                          </p>

                          {/* Badges */}
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {paper.tags.map(t => (
                              <span key={t} className={clsx('text-xs px-1.5 py-0.5 rounded-full', TAG_COLORS[t] ?? 'bg-gray-100 text-gray-600')}>{t}</span>
                            ))}
                            {paper.categories.slice(0, 2).map(c => (
                              <span key={c} className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-mono">{c}</span>
                            ))}
                            {paper.hfUpvotes !== undefined && (
                              <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600 font-medium">
                                <Heart size={9} /> {paper.hfUpvotes} 🤗
                              </span>
                            )}
                            {paper.pwcStars !== undefined && (
                              <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                                ★ {paper.pwcStars.toLocaleString()} stars
                              </span>
                            )}
                            {paper.openreviewVenue && (
                              <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700 font-medium">
                                <BookOpen size={9} /> {paper.openreviewVenue}
                              </span>
                            )}
                            {paper.socialSources?.includes('x') && (
                              <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-900 text-white font-medium">𝕏</span>
                            )}
                            {paper.socialSources?.includes('reddit') && (
                              <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">Reddit</span>
                            )}
                            {paper.nvidiaTerms && paper.nvidiaTerms.length > 0 && paper.nvidiaTerms.slice(0, 2).map(term => (
                              <span key={term} className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ background: '#76B900', color: '#fff' }}>
                                ⬡ {term}
                              </span>
                            ))}
                          </div>

                          <button
                            onClick={() => toggleExpand(paper.arxivId)}
                            className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mt-1.5 transition-colors"
                          >
                            {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                            {isExpanded ? 'Hide abstract' : 'Show abstract'}
                          </button>
                          {isExpanded && (
                            <p className="text-xs text-gray-500 leading-relaxed mt-1.5 bg-gray-50 rounded-lg p-2">
                              {paper.abstract}
                            </p>
                          )}
                          {paper.pwcCodeUrl && (
                            <a href={paper.pwcCodeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:underline mt-1">
                              <Github size={10} /> View code
                            </a>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            {sourceTab === 'social'      && <>🤗 <a href="https://huggingface.co/papers" target="_blank" rel="noopener noreferrer" className="underline">HuggingFace Papers</a> · upvotes = social buzz</>}
            {sourceTab === 'pwc'         && <>⚙ <a href="https://paperswithcode.com" target="_blank" rel="noopener noreferrer" className="underline">Papers with Code</a> · GitHub stars = adoption</>}
            {sourceTab === 'openreview'  && <>🎓 <a href="https://openreview.net" target="_blank" rel="noopener noreferrer" className="underline">OpenReview</a> · peer-reviewed conference papers</>}
            {sourceTab === 'arxiv'       && <>📄 <a href="https://arxiv.org" target="_blank" rel="noopener noreferrer" className="underline">arXiv</a> via Semantic Scholar · newest first</>}
          </p>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
            <button
              onClick={handleImport}
              disabled={selected.size === 0}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <Download size={14} />
              Import {selected.size > 0 ? `${selected.size} paper${selected.size > 1 ? 's' : ''}` : 'selected'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
