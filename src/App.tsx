import { useState, useMemo, useRef, useEffect } from 'react';
import { BookOpen, Globe, Zap, BarChart3, Search, X, SearchX, ArrowRight, Sparkles, HelpCircle, Rows3, Rows4, Sun, Moon } from 'lucide-react';
import { StoriesDashboard } from './components/StoriesDashboard';
import { CommunityIntel, type CommunityIntelTab } from './components/CommunityIntel';
import { MonthlyAnalysis } from './components/MonthlyAnalysis';
import { AskAssistant } from './components/AskAssistant';
import { OnboardingTour } from './components/OnboardingTour';
import { communities, conferences, speakers, hotTopics, shows, discordChannels, influencers, meetupsHackathons } from './data/communityData';
import { mergeHotTopics } from './data/autoMerge';
import clsx from 'clsx';
import type { PersonaFilter } from './types/community';
import { useSettings, useOnboarding } from './hooks/useSettings';

export const APP_VERSION = 'v3.5.0';
export type { PersonaFilter };

type Tab = 'monthly' | 'intel' | 'stories';

const TIER1_TABS: { id: Tab; label: string; icon: React.ReactNode; fullscreen?: boolean }[] = [
  { id: 'monthly', label: 'Monthly Analysis',   icon: <BarChart3 size={14} /> },
  { id: 'intel',   label: 'Landscape Intel',    icon: <Globe size={14} /> },
  { id: 'stories', label: 'Community Stories',  icon: <BookOpen size={14} /> },
];

type Category = 'Communities' | 'Events' | 'Meetups' | 'Speakers' | 'Topics' | 'Podcasts' | 'Discord' | 'Influencers';
interface SearchHit {
  category: Category;
  label: string;
  sub: string;
  description?: string;
  url?: string;
  meta?: string;
  tab: Tab;
  /** Tier-2 subtab inside Landscape Intel */
    intelSubTab?: CommunityIntelTab;
}

const CATEGORY_META: Record<Category, { color: string; emoji: string }> = {
  Communities: { color: 'bg-blue-50 text-blue-700 border-blue-200',         emoji: '👥' },
  Events:      { color: 'bg-violet-50 text-violet-700 border-violet-200',   emoji: '📅' },
  Meetups:     { color: 'bg-teal-50 text-teal-700 border-teal-200',         emoji: '⚡' },
  Speakers:    { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', emoji: '🎤' },
  Topics:      { color: 'bg-orange-50 text-orange-700 border-orange-200',   emoji: '🔥' },
  Podcasts:    { color: 'bg-pink-50 text-pink-700 border-pink-200',         emoji: '🎙' },
  Discord:     { color: 'bg-indigo-50 text-indigo-700 border-indigo-200',   emoji: '💬' },
  Influencers: { color: 'bg-rose-50 text-rose-700 border-rose-200',         emoji: '⭐' },
};

function useGlobalSearch(query: string) {
  return useMemo(() => {
    const empty = { grouped: {} as Record<Category, SearchHit[]>, total: 0 };
    if (!query || query.trim().length < 2) return empty;
    const q = query.toLowerCase();

    const grouped: Record<Category, SearchHit[]> = {
      Communities: [], Events: [], Meetups: [], Speakers: [], Topics: [], Podcasts: [], Discord: [], Influencers: [],
    };

    communities.filter(c => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.topics.some(t => t.toLowerCase().includes(q)))
      .forEach(c => grouped.Communities.push({
        category: 'Communities', label: c.name, sub: `${c.platform} · ${c.members.toLocaleString()} members`,
        description: c.description, url: c.url, meta: c.region ?? '', tab: 'intel', intelSubTab: 'communities',
      }));

    conferences.filter(c => c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q) || c.topics.some(t => t.toLowerCase().includes(q)))
      .forEach(c => grouped.Events.push({
        category: 'Events', label: c.name, sub: `${c.type} · ${c.location}`,
        description: c.description, url: c.url, meta: new Date(c.startDate).toLocaleDateString(), tab: 'intel', intelSubTab: 'conferences',
      }));

    meetupsHackathons.filter(m => m.name.toLowerCase().includes(q) || m.location.toLowerCase().includes(q) || m.topics.some(t => t.toLowerCase().includes(q)))
      .forEach(m => grouped.Meetups.push({
        category: 'Meetups', label: m.name, sub: `${m.type} · ${m.location}`,
        description: m.description, url: m.lumaUrl ?? m.url, meta: new Date(m.startDate).toLocaleDateString(), tab: 'intel', intelSubTab: 'meetups',
      }));

    speakers.filter(s => s.name.toLowerCase().includes(q) || s.company.toLowerCase().includes(q) || s.topics.some(t => t.toLowerCase().includes(q)))
      .forEach(s => grouped.Speakers.push({
        category: 'Speakers', label: s.name, sub: `${s.title} · ${s.company}`,
        description: s.bio, url: s.linkedinUrl, meta: `Klout ${s.kloutScore}`, tab: 'intel', intelSubTab: 'speakers',
      }));

    mergeHotTopics(hotTopics).filter(t => t.topic.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
      .forEach(t => grouped.Topics.push({
        category: 'Topics', label: t.topic, sub: t.sources.slice(0, 3).join(' · '),
        description: t.description, meta: `Priority ${t.priorityScore ?? t.buzzScore} · buzz ${t.buzzScore} · ${t.trend}`, tab: 'intel', intelSubTab: 'topics',
      }));

    shows.filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.host.toLowerCase().includes(q))
      .forEach(s => grouped.Podcasts.push({
        category: 'Podcasts', label: s.name, sub: `Hosted by ${s.host}`,
        description: s.description, url: s.url, meta: s.subscribers ? `${(s.subscribers / 1000).toFixed(0)}k subs` : '', tab: 'intel', intelSubTab: 'podcasts',
      }));

    discordChannels.filter(d => d.channel.toLowerCase().includes(q) || d.server.toLowerCase().includes(q) || d.topic.toLowerCase().includes(q))
      .forEach(d => grouped.Discord.push({
        category: 'Discord', label: `#${d.channel}`, sub: d.server,
        description: d.topic, url: d.serverUrl, meta: `${d.weeklyMessages.toLocaleString()}/wk`, tab: 'intel', intelSubTab: 'discord',
      }));

    influencers.filter(i => i.name.toLowerCase().includes(q) || i.company.toLowerCase().includes(q) || i.topics.some(t => t.toLowerCase().includes(q)))
      .forEach(i => grouped.Influencers.push({
        category: 'Influencers', label: i.name, sub: `${i.title} · ${i.company}`,
        description: i.bio, url: i.linkedinUrl, meta: `Klout ${i.kloutScore}`, tab: 'intel', intelSubTab: 'influencers',
      }));

    const total = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0);
    return { grouped, total };
  }, [query]);
}

const ALL_PERSONA: PersonaFilter = 'all';

function SearchResultsPage({
  query,
  grouped,
  total,
  onClear,
  onJump,
}: {
  query: string;
  grouped: Record<Category, SearchHit[]>;
  total: number;
  onClear: () => void;
  onJump: (h: SearchHit) => void;
}) {
  const filledCategories = (Object.keys(grouped) as Category[]).filter(k => grouped[k].length > 0);

  if (total === 0) {
    return (
      <div>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Search results</h1>
            <p className="text-sm text-gray-500 mt-0.5">Searching for "<span className="font-semibold text-gray-700">{query}</span>" across all tabs.</p>
          </div>
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <X size={12} /> Clear search
          </button>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl py-20 px-6 flex flex-col items-center text-gray-400">
          <SearchX size={48} className="mb-4 opacity-40" />
          <p className="text-base font-bold text-gray-700 mb-1">No results found</p>
          <p className="text-sm text-gray-500 max-w-sm text-center">
            Nothing matches <span className="font-mono font-semibold text-gray-800">"{query}"</span> across Communities, Events, Meetups, Speakers, Topics, Podcasts, Discord, or Influencers.
          </p>
          <p className="text-xs text-gray-400 mt-4 max-w-sm text-center">
            Try a different keyword, product name (e.g. <span className="font-mono">Isaac Lab</span>, <span className="font-mono">GR00T</span>), company, or person.
          </p>
          <button
            onClick={onClear}
            className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Search results</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            <span className="font-semibold text-blue-600">{total}</span> {total === 1 ? 'match' : 'matches'} for "<span className="font-semibold text-gray-900">{query}</span>" across <span className="font-semibold text-gray-700">{filledCategories.length}</span> {filledCategories.length === 1 ? 'category' : 'categories'}
          </p>
        </div>
        <button
          onClick={onClear}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <X size={12} /> Clear search
        </button>
      </div>

      {/* Category jump-bar */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {filledCategories.map(cat => {
          const meta = CATEGORY_META[cat];
          return (
            <a
              key={cat}
              href={`#cat-${cat}`}
              className={clsx('text-xs px-2.5 py-1 rounded-full font-semibold border transition-all hover:opacity-80', meta.color)}
            >
              {meta.emoji} {cat} <span className="opacity-70">{grouped[cat].length}</span>
            </a>
          );
        })}
      </div>

      {/* Result groups */}
      <div className="space-y-6">
        {filledCategories.map(cat => {
          const meta = CATEGORY_META[cat];
          const items = grouped[cat];
          return (
            <section key={cat} id={`cat-${cat}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className={clsx('text-sm px-2.5 py-1 rounded-lg font-bold border', meta.color)}>
                  {meta.emoji} {cat}
                </span>
                <span className="text-sm text-gray-500 font-medium">
                  {items.length} {items.length === 1 ? 'result' : 'results'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {items.map((h, i) => (
                  <div
                    key={i}
                    className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-gray-300 transition-all flex flex-col"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-sm text-gray-900 leading-tight flex-1">{h.label}</h3>
                      {h.meta && <span className="text-xs text-gray-400 flex-shrink-0">{h.meta}</span>}
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{h.sub}</p>
                    {h.description && (
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 mb-3">{h.description}</p>
                    )}
                    <div className="mt-auto flex items-center gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => onJump(h)}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Open in Landscape Intel <ArrowRight size={11} />
                      </button>
                      {h.url && (
                        <a
                          href={h.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto text-xs text-gray-400 hover:text-gray-600"
                        >
                          External link ↗
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('monthly');
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchMode, setSearchMode] = useState(false);
  const [intelSubTab, setIntelSubTab] = useState<CommunityIntelTab | undefined>();
  const [tourOpen, setTourOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const { settings, update } = useSettings();
  const { completed: onboardingDone, complete: completeOnboarding } = useOnboarding();

  const isFullscreen = TIER1_TABS.find(t => t.id === activeTab)?.fullscreen && !searchMode;
  const { grouped, total } = useGlobalSearch(globalSearch);

  // Apply dark mode to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  // Show onboarding on first visit
  useEffect(() => {
    if (!onboardingDone) {
      const t = setTimeout(() => setTourOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [onboardingDone]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      // ⌘K — focus search
      if (meta && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      // ⌘/ — open Ask the Hub (dispatch a custom event)
      if (meta && e.key === '/') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('open-ask-hub'));
        return;
      }
      // Esc — close drawers
      if (e.key === 'Escape') {
        setTourOpen(false);
        if (searchMode) {
          setSearchMode(false);
          setGlobalSearch('');
        }
        return;
      }
      // Don't trigger 1-5 if user is typing
      if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) return;
      const tabIndex = parseInt(e.key);
      if (!isNaN(tabIndex) && tabIndex >= 1 && tabIndex <= TIER1_TABS.length) {
        setActiveTab(TIER1_TABS[tabIndex - 1].id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchMode]);

  const submitSearch = () => {
    if (globalSearch.trim().length >= 2) {
      setSearchMode(true);
      searchRef.current?.blur();
    }
  };

  const clearSearch = () => {
    setGlobalSearch('');
    setSearchMode(false);
    searchRef.current?.focus();
  };

  const handleResultClick = (h: SearchHit) => {
    if (h.intelSubTab) setIntelSubTab(h.intelSubTab);
    setActiveTab(h.tab);
    setSearchMode(false);
    setGlobalSearch('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-14 gap-3">

            {/* Brand */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center">
                <Zap size={14} className="text-white" />
              </div>
              <span className="font-bold text-gray-900 text-sm tracking-tight hidden sm:block">Physical AI Community Hub</span>
              <span className="text-xs text-gray-300 font-mono">{APP_VERSION}</span>
            </div>

            {/* Global search */}
            <form
              onSubmit={e => { e.preventDefault(); submitSearch(); }}
              className="relative flex-1 min-w-[200px] max-w-md"
            >
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                value={globalSearch}
                onChange={e => setGlobalSearch(e.target.value)}
                placeholder="Search everything… (press Enter)"
                className="w-full pl-8 pr-7 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {globalSearch && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                >
                  <X size={12} />
                </button>
              )}
            </form>

            {/* Tier 1 nav */}
            <nav className="tab-bar scroll-snap-x flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto flex-shrink-0">
              {TIER1_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSearchMode(false); }}
                  className={clsx(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap',
                    activeTab === tab.id && !searchMode
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Right cluster: display, language, help, live */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Theme toggle (dark/light) */}
              <button
                onClick={() => update({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
                title={`Theme: ${settings.theme} — click to toggle`}
                className="inline-flex items-center p-1 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
              >
                {settings.theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
              </button>
              {/* Density toggle */}
              <button
                onClick={() => update({ density: settings.density === 'compact' ? 'comfortable' : 'compact' })}
                title={`Density: ${settings.density} — click to toggle`}
                className="inline-flex items-center p-1 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
              >
                {settings.density === 'compact' ? <Rows4 size={13} /> : <Rows3 size={13} />}
              </button>
              {/* Gen Z mode toggle */}
              <button
                onClick={() => update({ genZMode: !settings.genZMode, genZUnlocked: true })}
                title={settings.genZMode ? 'Switch to standard mode' : 'Switch to Gen Z mode ✨'}
                className={clsx(
                  'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-all',
                  settings.genZMode
                    ? 'bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-violet-600 hover:bg-violet-50'
                )}
              >
                <Sparkles size={11} className={settings.genZMode ? 'animate-pulse' : ''} />
                <span className="hidden md:inline">{settings.genZMode ? 'slay' : 'pro'}</span>
              </button>
              {/* Help */}
              <button
                onClick={() => setTourOpen(true)}
                title="Show tour"
                className="inline-flex items-center p-1 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
              >
                <HelpCircle size={13} />
              </button>
              <div className="hidden md:flex items-center gap-1.5 ml-1">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-gray-400">Live</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search mode banner */}
        {searchMode && (
          <div className="bg-gradient-to-r from-blue-600 to-violet-600 text-white text-xs px-6 py-1.5 flex items-center gap-2">
            <Search size={11} />
            <span>Search results for <strong>"{globalSearch}"</strong> — <span className="opacity-90">{total} {total === 1 ? 'match' : 'matches'} across all tabs</span></span>
            <button onClick={clearSearch} className="ml-auto inline-flex items-center gap-1 underline opacity-90 hover:opacity-100">
              <X size={11} /> Exit search
            </button>
          </div>
        )}
      </header>

      {/* Main */}
      <main className={clsx(
        'flex-1 w-full',
        isFullscreen ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 py-6',
        settings.density === 'compact' && 'density-compact'
      )}>
        {searchMode ? (
          <SearchResultsPage
            query={globalSearch}
            grouped={grouped}
            total={total}
            onClear={clearSearch}
            onJump={handleResultClick}
          />
        ) : (
          <div key={activeTab} className="tab-fade">
            {!isFullscreen && (
              <div className="mb-5">
                {activeTab === 'monthly' && (
                  <div>
                    <h1 className="text-lg font-bold text-gray-900">Monthly Analysis — May 2026</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Dashboard health by section, gaps and blind spots, and what to focus on next month.</p>
                  </div>
                )}
                {activeTab === 'intel' && (
                  <div>
                    <h1 className="text-lg font-bold text-gray-900">Physical AI Landscape Intelligence</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Where the community gathers, who's speaking, what events are coming, and what's generating buzz.</p>
                  </div>
                )}
                {activeTab === 'stories' && (
                  <div>
                    <h1 className="text-lg font-bold text-gray-900">Community Stories</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Pulled from{' '}
                      {['#physical-ai-community','#omni-news','#omni-pm','#robotics-ecosystem-news','#auto-marketing'].map(ch => (
                        <span key={ch} className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 mr-1">{ch}</span>
                      ))}
                      — social content only, with recommended amplification copy.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'monthly' && <MonthlyAnalysis />}
            {activeTab === 'intel'   && <CommunityIntel persona={ALL_PERSONA} initialTab={intelSubTab} />}
            {activeTab === 'stories' && <StoriesDashboard persona={ALL_PERSONA} />}
          </div>
        )}
      </main>

      {/* AI Assistant — floating button + drawer */}
      <AskAssistant />

      {/* Onboarding tour */}
      {tourOpen && (
        <OnboardingTour onClose={() => { setTourOpen(false); completeOnboarding(); }} />
      )}

      {/* Gen Z mode banner — global indicator */}
      {settings.genZMode && (
        <div className="fixed bottom-6 left-6 z-30 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-600 text-white text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-pulse">
          <Sparkles size={11} />
          <span className="font-semibold">slay mode active</span>
        </div>
      )}
    </div>
  );
}
