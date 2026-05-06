export type StorySource = 'slack' | 'email' | 'discord' | 'twitter' | 'linkedin' | 'manual' | 'arxiv';

export type StoryTag =
  | 'robotics'
  | 'humanoids'
  | 'embodied-ai'
  | 'digital-twins'
  | 'simulation'
  | 'community'
  | 'event'
  | 'research'
  | 'product'
  | 'funding'
  | 'tutorial'
  | 'announcement'
  | 'discussion'
  | 'job';

export type NvidiaProduct =
  | 'omniverse'
  | 'isaac-sim'
  | 'isaac-lab'
  | 'isaac-ros'
  | 'groot'
  | 'newton'
  | 'alpamayo'
  | 'cosmos'
  | 'igx-thor'
  | 'data-factory-blueprint'
  | 'metropolis'
  | 'jetson';

export const NVIDIA_PRODUCT_LABELS: Record<NvidiaProduct, string> = {
  'omniverse': 'Omniverse',
  'isaac-sim': 'Isaac Sim',
  'isaac-lab': 'Isaac Lab',
  'isaac-ros': 'Isaac ROS',
  'groot': 'GR00T',
  'newton': 'Newton',
  'alpamayo': 'Alpamayo',
  'cosmos': 'Cosmos',
  'igx-thor': 'IGX Thor',
  'data-factory-blueprint': 'Data Factory BP',
  'metropolis': 'Metropolis',
  'jetson': 'Jetson',
};

export interface Story {
  id: string;
  title: string;
  summary: string;
  source: StorySource;
  channel?: string; // Slack channel, email list, Discord server
  author: string;
  authorHandle?: string;
  date: string; // ISO
  tags: StoryTag[];
  products?: NvidiaProduct[];
  url?: string;
  engagementScore?: number; // reactions + replies
  isStarred?: boolean;
  rawSnippet?: string;
}
