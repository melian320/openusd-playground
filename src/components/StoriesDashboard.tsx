import { useState, useMemo } from 'react';
import { Search, RefreshCw, SlidersHorizontal, Filter, Plus, RotateCcw, Tag } from 'lucide-react';
import { StoryCard, hasSocialUrl } from './StoryCard';
import { StoryForm } from './StoryForm';
import { useStoriesRepository } from '../hooks/useStoriesRepository';
import { Story, StorySource, StoryTag, NvidiaProduct, NVIDIA_PRODUCT_LABELS } from '../types/story';
import clsx from 'clsx';

const ALL_SOURCES: StorySource[] = ['slack', 'email', 'discord', 'twitter', 'linkedin', 'manual'];
const ALL_TAGS: StoryTag[] = [
  'robotics', 'humanoids', 'embodied-ai', 'digital-twins', 'simulation',
  'community', 'event', 'research', 'product', 'funding', 'tutorial', 'announcement', 'discussion', 'job'
];
const ALL_PRODUCTS: NvidiaProduct[] = [
  'omniverse', 'isaac-sim', 'isaac-lab', 'isaac-ros', 'groot', 'newton',
  'alpamayo', 'cosmos', 'igx-thor', 'data-factory-blueprint', 'metropolis', 'jetson',
];

type SortOption = 'newest' | 'oldest' | 'most-engaged';

export function StoriesDashboard({ persona: _persona }: { persona?: string } = {}) {
  const { stories, addStory, updateStory, deleteStory, resetToDefaults } = useStoriesRepository();

  const [search, setSearch] = useState('');
  const [selectedSources, setSelectedSources] = useState<Set<StorySource>>(new Set());
  const [selectedTags, setSelectedTags] = useState<Set<StoryTag>>(new Set());
  const [selectedProducts, setSelectedProducts] = useState<Set<NvidiaProduct>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Form modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | undefined>();

  const openAdd = () => { setEditingStory(undefined); setFormOpen(true); };
  const openEdit = (story: Story) => { setEditingStory(story); setFormOpen(true); };
  const closeForm = () => { setFormOpen(false); setEditingStory(undefined); };

  const handleSave = (data: Omit<Story, 'id'>) => {
    if (editingStory) {
      updateStory(editingStory.id, data);
    } else {
      addStory(data);
    }
    closeForm();
  };

  const toggleSource = (source: StorySource) => {
    setSelectedSources(prev => {
      const next = new Set(prev);
      next.has(source) ? next.delete(source) : next.add(source);
      return next;
    });
  };

  const toggleTag = (tag: StoryTag) => {
    setSelectedTags(prev => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  };

  const toggleProduct = (product: NvidiaProduct) => {
    setSelectedProducts(prev => {
      const next = new Set(prev);
      next.has(product) ? next.delete(product) : next.add(product);
      return next;
    });
  };

  const simulateSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1800);
  };

  const filtered = useMemo(() => {
    // Only stories that link to a social asset (LinkedIn, X, YouTube, GitHub, Facebook, etc.)
    let result = stories.filter(s => hasSocialUrl(s.url));
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        s.author.toLowerCase().includes(q) ||
        s.tags.some(t => t.includes(q)) ||
        (s.products ?? []).some(p => NVIDIA_PRODUCT_LABELS[p].toLowerCase().includes(q))
      );
    }
    if (selectedSources.size > 0) result = result.filter(s => selectedSources.has(s.source));
    if (selectedTags.size > 0) result = result.filter(s => s.tags.some(t => selectedTags.has(t)));
    if (selectedProducts.size > 0) {
      result = result.filter(s => (s.products ?? []).some(p => selectedProducts.has(p)));
    }
    result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'most-engaged') return (b.engagementScore ?? 0) - (a.engagementScore ?? 0);
      return 0;
    });
    return result;
  }, [stories, search, selectedSources, selectedTags, selectedProducts, sortBy]);

  const activeFilterCount = selectedSources.size + selectedTags.size + selectedProducts.size;
  const sourceCounts = Object.fromEntries(
    ALL_SOURCES.map(s => [s, stories.filter(x => x.source === s).length])
  );
  const productCounts = Object.fromEntries(
    ALL_PRODUCTS.map(p => [p, stories.filter(x => (x.products ?? []).includes(p)).length])
  );

  const clearAllFilters = () => {
    setSelectedSources(new Set());
    setSelectedTags(new Set());
    setSelectedProducts(new Set());
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search stories, authors, tags, products…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortOption)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="most-engaged">Most engaged</option>
        </select>

        <button
          onClick={() => setShowFilters(v => !v)}
          className={clsx(
            'inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors',
            showFilters || activeFilterCount > 0
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          )}
        >
          <SlidersHorizontal size={14} />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium">
              {activeFilterCount}
            </span>
          )}
        </button>

        <button
          onClick={simulateSync}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
          title="Sync from #physical-ai-coremarketing"
        >
          <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Syncing…' : 'Sync Slack'}
        </button>

        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus size={14} />
          Add story
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 space-y-4">
          {/* Products */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
              <Tag size={11} /> NVIDIA Products
            </p>
            <div className="flex flex-wrap gap-2">
              {ALL_PRODUCTS.map(product => (
                <button
                  key={product}
                  onClick={() => toggleProduct(product)}
                  className={clsx(
                    'px-3 py-1 text-xs rounded-full border font-medium transition-colors',
                    selectedProducts.has(product)
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  )}
                >
                  {NVIDIA_PRODUCT_LABELS[product]}
                  {productCounts[product] > 0 && (
                    <span className="ml-1 opacity-60">({productCounts[product]})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Source */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
              <Filter size={11} /> Source
            </p>
            <div className="flex flex-wrap gap-2">
              {ALL_SOURCES.map(src => (
                <button
                  key={src}
                  onClick={() => toggleSource(src)}
                  className={clsx(
                    'px-3 py-1 text-xs rounded-full border font-medium transition-colors capitalize',
                    selectedSources.has(src)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  )}
                >
                  {src}
                  {sourceCounts[src] > 0 && (
                    <span className="ml-1 opacity-60">({sourceCounts[src]})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tags</p>
            <div className="flex flex-wrap gap-2">
              {ALL_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={clsx(
                    'px-3 py-1 text-xs rounded-full border font-medium transition-colors',
                    selectedTags.has(tag)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-red-500 hover:text-red-700 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Active product pills (always visible when products are selected) */}
      {selectedProducts.size > 0 && !showFilters && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {Array.from(selectedProducts).map(p => (
            <button
              key={p}
              onClick={() => toggleProduct(p)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded-full font-medium hover:bg-green-100 transition-colors"
            >
              {NVIDIA_PRODUCT_LABELS[p]} ×
            </button>
          ))}
        </div>
      )}

      {/* Stats bar */}
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-xs text-gray-500">
          <span className="font-semibold text-gray-700">{filtered.length}</span>
          <span className="text-gray-400"> of {stories.filter(s => hasSocialUrl(s.url)).length} amplification-ready</span>
          {' '}stories
          <span className="ml-2 text-emerald-600">📣 social asset linked</span>
          {activeFilterCount > 0 && <span className="text-blue-600 ml-1">· filtered</span>}
        </p>
        <div className="flex gap-4 items-center text-xs text-gray-400">
          <span><span className="font-medium text-gray-600">{stories.filter(s => s.source === 'slack').length}</span> Slack</span>
          <span><span className="font-medium text-gray-600">{stories.filter(s => s.source === 'email').length}</span> Email</span>
          <button
            onClick={() => { if (confirm('Reset to default stories? This will delete any added stories.')) resetToDefaults(); }}
            className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Reset to defaults"
          >
            <RotateCcw size={11} />
            Reset
          </button>
        </div>
      </div>

      {/* Story grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Search size={32} className="mb-3 opacity-40" />
          <p className="text-sm font-medium text-gray-500">No stories match your filters</p>
          <div className="flex gap-3 mt-3">
            <button
              onClick={() => { setSearch(''); clearAllFilters(); }}
              className="text-xs text-blue-500 hover:underline"
            >
              Clear filters
            </button>
            <span className="text-gray-300">·</span>
            <button onClick={openAdd} className="text-xs text-blue-500 hover:underline">
              Add a story
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 overflow-y-auto pb-4">
          {filtered.map(story => (
            <StoryCard
              key={story.id}
              story={story}
              onEdit={openEdit}
              onDelete={deleteStory}
            />
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      {formOpen && (
        <StoryForm
          initial={editingStory}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}

    </div>
  );
}
