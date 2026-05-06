import { useState } from 'react';
import { X } from 'lucide-react';
import { Story, StorySource, StoryTag } from '../types/story';
import clsx from 'clsx';

const ALL_SOURCES: StorySource[] = ['slack', 'email', 'discord', 'twitter', 'linkedin', 'manual'];
const ALL_TAGS: StoryTag[] = [
  'robotics', 'humanoids', 'embodied-ai', 'digital-twins', 'simulation',
  'community', 'event', 'research', 'product', 'funding', 'tutorial', 'announcement', 'discussion', 'job',
];

type FormData = {
  title: string;
  summary: string;
  source: StorySource;
  channel: string;
  author: string;
  authorHandle: string;
  date: string;
  url: string;
  tags: StoryTag[];
  engagementScore: string;
};

function toIso(dateStr: string): string {
  return dateStr ? new Date(dateStr).toISOString() : new Date().toISOString();
}

function fromStory(story: Story): FormData {
  return {
    title: story.title,
    summary: story.summary,
    source: story.source,
    channel: story.channel ?? '',
    author: story.author,
    authorHandle: story.authorHandle ?? '',
    date: story.date.slice(0, 10),
    url: story.url ?? '',
    tags: [...story.tags],
    engagementScore: story.engagementScore?.toString() ?? '',
  };
}

const EMPTY: FormData = {
  title: '', summary: '', source: 'slack', channel: '', author: '',
  authorHandle: '', date: new Date().toISOString().slice(0, 10),
  url: '', tags: [], engagementScore: '',
};

interface Props {
  initial?: Story;
  onSave: (data: Omit<Story, 'id'>) => void;
  onClose: () => void;
}

export function StoryForm({ initial, onSave, onClose }: Props) {
  const [form, setForm] = useState<FormData>(initial ? fromStory(initial) : EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  const toggleTag = (tag: StoryTag) =>
    set('tags', form.tags.includes(tag) ? form.tags.filter(t => t !== tag) : [...form.tags, tag]);

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.summary.trim()) e.summary = 'Summary is required';
    if (!form.author.trim()) e.author = 'Author is required';
    if (form.tags.length === 0) e.tags = 'Select at least one tag';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      title: form.title.trim(),
      summary: form.summary.trim(),
      source: form.source,
      channel: form.channel.trim() || undefined,
      author: form.author.trim(),
      authorHandle: form.authorHandle.trim() || undefined,
      date: toIso(form.date),
      url: form.url.trim() || undefined,
      tags: form.tags,
      engagementScore: form.engagementScore ? parseInt(form.engagementScore) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {initial ? 'Edit Story' : 'Add Story'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Story headline…"
              className={clsx('w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500', errors.title ? 'border-red-300' : 'border-gray-200')}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* Summary */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Summary <span className="text-red-400">*</span></label>
            <textarea
              value={form.summary}
              onChange={e => set('summary', e.target.value)}
              placeholder="What happened, why it matters…"
              rows={3}
              className={clsx('w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none', errors.summary ? 'border-red-300' : 'border-gray-200')}
            />
            {errors.summary && <p className="text-xs text-red-500 mt-1">{errors.summary}</p>}
          </div>

          {/* Source + Channel row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Source</label>
              <select
                value={form.source}
                onChange={e => set('source', e.target.value as StorySource)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white capitalize"
              >
                {ALL_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Channel / List</label>
              <input
                type="text"
                value={form.channel}
                onChange={e => set('channel', e.target.value)}
                placeholder="#general or digest@…"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Author + Handle row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Author <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={form.author}
                onChange={e => set('author', e.target.value)}
                placeholder="Full name"
                className={clsx('w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500', errors.author ? 'border-red-300' : 'border-gray-200')}
              />
              {errors.author && <p className="text-xs text-red-500 mt-1">{errors.author}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Handle</label>
              <input
                type="text"
                value={form.authorHandle}
                onChange={e => set('authorHandle', e.target.value)}
                placeholder="@username"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Date + Engagement row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date Published</label>
              <input
                type="date"
                value={form.date}
                onChange={e => set('date', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Engagement Score</label>
              <input
                type="number"
                value={form.engagementScore}
                onChange={e => set('engagementScore', e.target.value)}
                placeholder="reactions + replies"
                min="0"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* URL */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">URL (optional)</label>
            <input
              type="url"
              value={form.url}
              onChange={e => set('url', e.target.value)}
              placeholder="https://…"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Tags <span className="text-red-400">*</span></label>
            <div className="flex flex-wrap gap-2">
              {ALL_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={clsx(
                    'px-3 py-1 text-xs rounded-full border font-medium transition-colors',
                    form.tags.includes(tag)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
            {errors.tags && <p className="text-xs text-red-500 mt-1">{errors.tags}</p>}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {initial ? 'Save changes' : 'Add story'}
          </button>
        </div>
      </div>
    </div>
  );
}
