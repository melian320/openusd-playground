import { useState, useEffect, useCallback } from 'react';
import { Story } from '../types/story';
import { mockStories } from '../data/mockStories';

const STORAGE_KEY = 'physicalai_stories_v2';

function load(): Story[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Story[];
  } catch {}
  // Seed with mock data on first load
  const seeded = mockStories;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

function persist(stories: Story[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
}

export function useStoriesRepository() {
  const [stories, setStories] = useState<Story[]>(load);

  const sync = useCallback((updater: (prev: Story[]) => Story[]) => {
    setStories(prev => {
      const next = updater(prev);
      persist(next);
      return next;
    });
  }, []);

  const addStory = useCallback((story: Omit<Story, 'id'>) => {
    const newStory: Story = {
      ...story,
      id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    };
    sync(prev => [newStory, ...prev]);
    return newStory;
  }, [sync]);

  const updateStory = useCallback((id: string, patch: Partial<Story>) => {
    sync(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  }, [sync]);

  const deleteStory = useCallback((id: string) => {
    sync(prev => prev.filter(s => s.id !== id));
  }, [sync]);

  const toggleStar = useCallback((id: string) => {
    sync(prev => prev.map(s => s.id === id ? { ...s, isStarred: !s.isStarred } : s));
  }, [sync]);

  const resetToDefaults = useCallback(() => {
    persist(mockStories);
    setStories(mockStories);
  }, []);

  return { stories, addStory, updateStory, deleteStory, toggleStar, resetToDefaults };
}
