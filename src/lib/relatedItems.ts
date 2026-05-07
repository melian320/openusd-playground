// Cross-reference engine — finds related items across data sources.
import { communities, conferences, speakers, hotTopics, shows, discordChannels, influencers, meetupsHackathons } from '../data/communityData';

export interface RelatedItem {
  type: 'community' | 'event' | 'meetup' | 'speaker' | 'topic' | 'podcast' | 'discord' | 'influencer' | 'paper';
  label: string;
  sub: string;
  href?: string;
  meta?: string;
  /** Why this is related */
  reason: string;
}

/** Score how strongly two text strings overlap (token-based) */
function overlap(a: string, b: string): number {
  const tokensA = new Set(a.toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 3));
  const tokensB = b.toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 3);
  let hits = 0;
  for (const t of tokensB) if (tokensA.has(t)) hits++;
  return hits;
}

function nameMatch(a: string, b: string): boolean {
  return b.toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(b.toLowerCase());
}

/** Find items related to a Speaker — papers, communities, podcasts, influencer mentions */
export function relatedToSpeaker(speakerId: string): RelatedItem[] {
  const s = speakers.find(x => x.id === speakerId);
  if (!s) return [];
  const out: RelatedItem[] = [];
  const speakerText = `${s.bio} ${s.topics.join(' ')} ${s.title} ${s.company}`;

  // 1. Communities with topic overlap
  const matchedComms = communities
    .map(c => ({ c, score: overlap(speakerText, `${c.name} ${c.description} ${c.topics.join(' ')}`) }))
    .filter(x => x.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  for (const { c, score } of matchedComms) {
    out.push({
      type: 'community',
      label: c.name,
      sub: `${c.platform} · ${c.members.toLocaleString()} members`,
      href: c.url,
      reason: `${score} shared topic${score > 1 ? 's' : ''}`,
    });
  }

  // 2. Influencers in same company OR with topic overlap
  const matchedInfs = influencers
    .filter(i => nameMatch(i.company, s.company) || overlap(speakerText, i.bio + ' ' + i.topics.join(' ')) >= 3)
    .filter(i => i.name !== s.name)
    .slice(0, 3);
  for (const i of matchedInfs) {
    out.push({
      type: 'influencer',
      label: i.name,
      sub: `${i.title} · ${i.company}`,
      href: i.linkedinUrl,
      meta: `Klout ${i.kloutScore}`,
      reason: nameMatch(i.company, s.company) ? `Same company (${s.company})` : 'Topic overlap',
    });
  }

  // 3. Hot Topics matching their work
  const matchedTopics = hotTopics
    .map(t => ({ t, score: overlap(speakerText, `${t.topic} ${t.description}`) }))
    .filter(x => x.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
  for (const { t } of matchedTopics) {
    out.push({
      type: 'topic',
      label: t.topic,
      sub: t.sources.slice(0, 2).join(' · '),
      meta: `Priority ${t.priorityScore ?? t.buzzScore} · buzz ${t.buzzScore}`,
      reason: 'Topic alignment',
    });
  }

  // 4. Podcasts that have hosted them or cover their topic
  const matchedShows = shows
    .filter(sh => sh.recentGuests.some(g => nameMatch(g, s.name)) || overlap(speakerText, sh.description + ' ' + sh.topics.join(' ')) >= 3)
    .slice(0, 2);
  for (const sh of matchedShows) {
    out.push({
      type: 'podcast',
      label: sh.name,
      sub: `Hosted by ${sh.host}`,
      href: sh.url,
      reason: sh.recentGuests.some(g => nameMatch(g, s.name)) ? 'Recent guest' : 'Topic overlap',
    });
  }

  // 5. Upcoming events where they're mentioned
  const matchedEvents = conferences
    .filter(c => (c.notableSpeakers ?? []).some(sp => nameMatch(sp, s.name)) || overlap(speakerText, c.description + ' ' + c.topics.join(' ')) >= 3)
    .slice(0, 2);
  for (const e of matchedEvents) {
    out.push({
      type: 'event',
      label: e.name,
      sub: `${e.location} · ${new Date(e.startDate).toLocaleDateString()}`,
      href: e.url,
      reason: (e.notableSpeakers ?? []).some(sp => nameMatch(sp, s.name)) ? 'Listed speaker' : 'Topic match',
    });
  }

  return out;
}

/** Find items related to a GitHub repo — communities, tutorials, related repos */
export function relatedToRepo(repoOwnerRepo: string, repoName: string, description: string, topics: string[]): RelatedItem[] {
  const out: RelatedItem[] = [];
  const repoText = `${repoName} ${description} ${topics.join(' ')}`.toLowerCase();

  // 1. Communities discussing this repo's topics
  const matchedComms = communities
    .map(c => ({ c, score: overlap(repoText, `${c.name} ${c.description} ${c.topics.join(' ')}`) }))
    .filter(x => x.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  for (const { c, score } of matchedComms) {
    out.push({
      type: 'community',
      label: c.name,
      sub: `${c.platform} · ${c.members.toLocaleString()} members`,
      href: c.url,
      reason: `${score} topic${score > 1 ? 's' : ''} match`,
    });
  }

  // 2. Discord channels actively discussing related topics
  const matchedDiscord = discordChannels
    .filter(d => overlap(repoText, `${d.topic} ${d.recentTopics.join(' ')}`) >= 2)
    .sort((a, b) => b.weeklyMessages - a.weeklyMessages)
    .slice(0, 2);
  for (const d of matchedDiscord) {
    out.push({
      type: 'discord',
      label: `#${d.channel}`,
      sub: d.server,
      href: d.serverUrl,
      meta: `${d.weeklyMessages.toLocaleString()}/wk`,
      reason: 'Active discussion',
    });
  }

  // 3. Hot Topics
  const matchedTopics = hotTopics
    .map(t => ({ t, score: overlap(repoText, `${t.topic} ${t.description}`) }))
    .filter(x => x.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
  for (const { t } of matchedTopics) {
    out.push({
      type: 'topic',
      label: t.topic,
      sub: t.sources.slice(0, 2).join(' · '),
      meta: `Priority ${t.priorityScore ?? t.buzzScore} · buzz ${t.buzzScore}`,
      reason: 'Trending topic',
    });
  }

  // 4. Speakers / Influencers contributing to this space
  const matchedInfs = influencers
    .filter(i => overlap(repoText, i.bio + ' ' + i.topics.join(' ')) >= 3)
    .sort((a, b) => b.kloutScore - a.kloutScore)
    .slice(0, 2);
  for (const i of matchedInfs) {
    out.push({
      type: 'influencer',
      label: i.name,
      sub: `${i.title} · ${i.company}`,
      href: i.linkedinUrl,
      meta: `Klout ${i.kloutScore}`,
      reason: 'Active contributor',
    });
  }

  // 5. Meetups / Events where this repo's tech is featured
  const matchedMeetups = meetupsHackathons
    .filter(m => overlap(repoText, m.name + ' ' + m.description + ' ' + (m.topics ?? []).join(' ')) >= 2)
    .slice(0, 2);
  for (const m of matchedMeetups) {
    out.push({
      type: 'meetup',
      label: m.name,
      sub: `${m.type} · ${m.location}`,
      href: m.lumaUrl ?? m.url,
      meta: new Date(m.startDate).toLocaleDateString(),
      reason: 'Featured tech',
    });
  }

  return out;
}

export const TYPE_COLOR: Record<RelatedItem['type'], string> = {
  community:  'bg-blue-50 text-blue-700',
  event:      'bg-violet-50 text-violet-700',
  meetup:     'bg-teal-50 text-teal-700',
  speaker:    'bg-emerald-50 text-emerald-700',
  topic:      'bg-orange-50 text-orange-700',
  podcast:    'bg-pink-50 text-pink-700',
  discord:    'bg-indigo-50 text-indigo-700',
  influencer: 'bg-rose-50 text-rose-700',
  paper:      'bg-amber-50 text-amber-700',
};
