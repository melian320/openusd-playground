// Rule-based assistant engine. Synthesizes responses from dashboard data
// based on persona, detected products, and intent.

import { communities, conferences, speakers, hotTopics, shows, discordChannels, influencers, meetupsHackathons } from '../data/communityData';

export type AssistantPersona = 'technical-marketing' | 'campaign-marketing' | 'product-marketing' | 'product-manager';

export const PERSONAS: { id: AssistantPersona; label: string; emoji: string; focus: string }[] = [
  { id: 'technical-marketing', label: 'Technical Marketing', emoji: '🛠️', focus: 'docs, tutorials, devrel, github, code' },
  { id: 'campaign-marketing',  label: 'Campaign Marketing',  emoji: '📣', focus: 'amplification, social, events, sponsorships' },
  { id: 'product-marketing',   label: 'Product Marketing',   emoji: '🎯', focus: 'positioning, differentiation, narrative, market signals' },
  { id: 'product-manager',     label: 'Product Manager',     emoji: '🧭', focus: 'roadmap, user pain, prs, issues, gaps' },
];

export interface DataRef {
  type: 'community' | 'event' | 'meetup' | 'speaker' | 'video' | 'topic' | 'github' | 'influencer' | 'discord' | 'podcast';
  label: string;
  sub: string;
  meta?: string;
  href?: string;
}

export interface AssistantResponse {
  answer: string;
  dataReferences: DataRef[];
  recommendedActions: string[];
  tabHint?: string;
}

const PRODUCT_KEYWORDS: Record<string, string[]> = {
  'Isaac Lab':  ['isaac lab', 'isaaclab'],
  'Isaac Sim':  ['isaac sim', 'isaac-sim', 'isaacsim'],
  'Isaac ROS':  ['isaac ros', 'isaacros', 'isaac-ros'],
  'GR00T':      ['gr00t', 'groot'],
  'Cosmos':     ['cosmos'],
  'Omniverse':  ['omniverse'],
  'OpenUSD':    ['openusd', 'open usd', 'usd composer'],
  'Newton':     ['newton'],
  'Jetson':     ['jetson', 'orin'],
  'Alpamayo':   ['alpamayo'],
  'nCore':      ['ncore', 'n-core'],
};

const INTENTS = {
  launch:    /\b(launch|release|announce|debut|unveil|introduce)\b/i,
  promote:   /\b(promote|amplify|boost|share|publicize|hype|spread|market)\b/i,
  find:      /\b(find|who|where|which|identify|surface|discover|locate|recommend)\b/i,
  build:     /\b(build|create|grow|develop|expand|scale)\b/i,
  partner:   /\b(partner|collab|collaborate|co-?market|co-?author|outreach)\b/i,
  sponsor:   /\b(sponsor|fund|invest|support)\b/i,
  compete:   /\b(compete|competitor|alternative|vs|versus|comparison)\b/i,
  improve:   /\b(improve|fix|address|gap|weakness|missing|blind spot)\b/i,
  learn:     /\b(learn|teach|tutorial|onboard|education|documentation)\b/i,
  measure:   /\b(measure|metric|kpi|track|score|growth|velocity)\b/i,
  feedback:  /\b(feedback|user|customer|pain|issue|bug|complaint)\b/i,
};

function detectProducts(q: string): string[] {
  const lower = q.toLowerCase();
  const hits: string[] = [];
  for (const [product, keywords] of Object.entries(PRODUCT_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) hits.push(product);
  }
  return hits;
}

function detectIntents(q: string): (keyof typeof INTENTS)[] {
  return (Object.keys(INTENTS) as (keyof typeof INTENTS)[]).filter(k => INTENTS[k].test(q));
}

// Score how strongly a piece of text relates to a product
function relatesTo(text: string, product: string): boolean {
  const lower = text.toLowerCase();
  const keys = PRODUCT_KEYWORDS[product] ?? [product.toLowerCase()];
  return keys.some(k => lower.includes(k));
}

function pickRelevantInfluencers(products: string[], limit = 4): DataRef[] {
  const candidates = influencers.filter(i => {
    if (products.length === 0) return i.shouldEngage;
    const text = `${i.bio} ${i.topics.join(' ')} ${i.title} ${i.company}`;
    return products.some(p => relatesTo(text, p));
  });
  return candidates
    .sort((a, b) => b.kloutScore - a.kloutScore)
    .slice(0, limit)
    .map(i => ({
      type: 'influencer' as const,
      label: i.name,
      sub: `${i.title} · ${i.company}`,
      meta: `Klout ${i.kloutScore} · ${(i.followers / 1000).toFixed(0)}k followers`,
      href: i.linkedinUrl,
    }));
}

function pickRelevantTopics(products: string[], limit = 3): DataRef[] {
  const candidates = hotTopics.filter(t => {
    if (products.length === 0) return t.trend === 'rising' && (t.priorityScore ?? t.buzzScore) >= 70;
    const text = `${t.topic} ${t.description}`;
    return products.some(p => relatesTo(text, p));
  });
  return candidates
    .sort((a, b) => (b.priorityScore ?? b.buzzScore) - (a.priorityScore ?? a.buzzScore) || b.buzzScore - a.buzzScore)
    .slice(0, limit)
    .map(t => ({
      type: 'topic' as const,
      label: t.topic,
      sub: t.sources.slice(0, 2).join(' · '),
      meta: `Priority ${t.priorityScore ?? t.buzzScore} · buzz ${t.buzzScore} · ${t.trend}`,
    }));
}

function pickRelevantEvents(products: string[], limit = 3): DataRef[] {
  const all = [...conferences, ...meetupsHackathons];
  const upcoming = all.filter(e => new Date(e.startDate) >= new Date('2026-05-01'));
  const candidates = upcoming.filter(e => {
    if (products.length === 0) return e.buzzLevel === 'trending' || e.buzzLevel === 'high';
    const text = `${e.name} ${e.description} ${e.topics.join(' ')}`;
    return products.some(p => relatesTo(text, p));
  });
  return candidates
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, limit)
    .map(e => ({
      type: e.type === 'meetup' || e.type === 'hackathon' ? 'meetup' as const : 'event' as const,
      label: e.name,
      sub: `${e.location} · ${e.format}`,
      meta: new Date(e.startDate).toLocaleDateString(),
      href: e.url,
    }));
}

function pickRelevantCommunities(products: string[], limit = 3): DataRef[] {
  const candidates = communities.filter(c => {
    if (products.length === 0) return c.buzzLevel === 'trending' || c.buzzLevel === 'high';
    const text = `${c.name} ${c.description} ${c.topics.join(' ')}`;
    return products.some(p => relatesTo(text, p));
  });
  return candidates
    .sort((a, b) => b.weeklyActivity - a.weeklyActivity)
    .slice(0, limit)
    .map(c => ({
      type: 'community' as const,
      label: c.name,
      sub: `${c.platform} · ${c.members.toLocaleString()} members`,
      meta: c.buzzLevel,
      href: c.url,
    }));
}

function pickRelevantSpeakers(products: string[], limit = 3): DataRef[] {
  const candidates = speakers.filter(s => {
    if (products.length === 0) return s.kloutScore >= 80;
    const text = `${s.bio} ${s.topics.join(' ')} ${s.title} ${s.company}`;
    return products.some(p => relatesTo(text, p));
  });
  return candidates
    .sort((a, b) => b.kloutScore - a.kloutScore)
    .slice(0, limit)
    .map(s => ({
      type: 'speaker' as const,
      label: s.name,
      sub: `${s.title} · ${s.company}`,
      meta: `Klout ${s.kloutScore}`,
      href: s.linkedinUrl,
    }));
}

function pickRelevantPodcasts(products: string[], limit = 2): DataRef[] {
  const candidates = shows.filter(s => {
    if (products.length === 0) return s.buzzLevel === 'trending' || s.buzzLevel === 'high';
    const text = `${s.name} ${s.description} ${s.topics.join(' ')}`;
    return products.some(p => relatesTo(text, p));
  });
  return candidates
    .slice(0, limit)
    .map(s => ({
      type: 'podcast' as const,
      label: s.name,
      sub: `Hosted by ${s.host}`,
      meta: s.subscribers ? `${(s.subscribers / 1000).toFixed(0)}k subs` : '',
      href: s.url,
    }));
}

function pickRelevantDiscord(products: string[], limit = 2): DataRef[] {
  const candidates = discordChannels.filter(d => {
    if (products.length === 0) return d.buzzLevel === 'trending' || d.buzzLevel === 'high';
    const text = `${d.server} ${d.channel} ${d.topic} ${d.recentTopics.join(' ')}`;
    return products.some(p => relatesTo(text, p));
  });
  return candidates
    .sort((a, b) => b.weeklyMessages - a.weeklyMessages)
    .slice(0, limit)
    .map(d => ({
      type: 'discord' as const,
      label: `#${d.channel}`,
      sub: d.server,
      meta: `${d.weeklyMessages.toLocaleString()}/wk`,
      href: d.serverUrl,
    }));
}

// Persona-specific recommended-action templates
function actionsForPersona(persona: AssistantPersona, products: string[], intents: (keyof typeof INTENTS)[]): string[] {
  const productList = products.length > 0 ? products.join(', ') : 'your product';
  const actions: string[] = [];

  if (persona === 'technical-marketing') {
    if (intents.includes('promote') || intents.includes('learn')) {
      actions.push(`Commission a 60-min Dev Video walkthrough for ${productList} with a community creator (Hugging Face, RoboticsDeveloper, ETH Zürich) — barter GPU credits in exchange for the tutorial.`);
      actions.push(`Open an issue in the relevant GitHub repo asking the community to share their integration patterns. Top 5 responses become a "Community Patterns" page in your docs.`);
    }
    if (intents.includes('find') || intents.includes('partner')) {
      actions.push(`Reach out to top 3 GitHub contributors (filtered by recent commit activity) to invite them to NVIDIA Developer Champions or beta cohorts.`);
    }
    if (intents.includes('build') || intents.includes('measure')) {
      actions.push(`Track GitHub stars, forks, PR merge velocity, and contributor count weekly. Alert when stars-growth % drops below 5% week-over-week.`);
    }
    actions.push(`Pair the LearnOpenUSD repo + companion Dev Videos for a structured onboarding path. Link from product README to first 3 videos.`);
  }

  if (persona === 'campaign-marketing') {
    if (intents.includes('promote') || intents.includes('launch')) {
      actions.push(`Build a 3-touch amplification cadence: launch tweet (𝕏) + LinkedIn long-form post + community AMA in top 3 Discord servers within 14 days.`);
      actions.push(`Use the auto-generated social copy in Community Stories — paste straight into your scheduler for the highest-engagement community wins.`);
    }
    if (intents.includes('sponsor') || intents.includes('partner')) {
      actions.push(`Sponsor 2–3 of the top "yes-recommendation" meetups/hackathons this quarter — high signal, low cost vs. a single trade-show booth.`);
    }
    if (intents.includes('measure')) {
      actions.push(`Set up keyword alerts for ${productList} mentions across the top 10 Discord servers + LinkedIn weekly reports. Track sentiment month-over-month.`);
    }
    actions.push(`Activate 3 micro-influencers (< 25K followers) and 2 macro-influencers in parallel — micros get higher engagement rates, macros give credibility halo.`);
  }

  if (persona === 'product-marketing') {
    if (intents.includes('compete') || intents.includes('find')) {
      actions.push(`Watch the World Foundation Models hot-topic cluster — community is actively benchmarking ${productList} against open alternatives. Get ahead with a "How we compare" technical post.`);
    }
    if (intents.includes('promote') || intents.includes('launch')) {
      actions.push(`Anchor positioning on the 3 highest-buzz hot topics relevant to ${productList}. Borrow community language directly from forum/Discord conversations — don't invent new terms.`);
    }
    actions.push(`Identify 2 customer case studies from the influencer engagement list. Co-author a blog with their byline + your distribution.`);
    actions.push(`Map ${productList} to the top 3 rising trends. If there is no fit, that is a positioning gap to address with PMs before the next launch.`);
  }

  if (persona === 'product-manager') {
    if (intents.includes('feedback') || intents.includes('improve')) {
      actions.push(`Triage the top 20 GitHub issues by reaction count for ${productList}. Cross-reference with community Discord to identify recurring user pain.`);
      actions.push(`Spend 30 minutes reading the top 10 community-built forks/tools. What are users building around your product that could be a roadmap signal?`);
    }
    if (intents.includes('measure')) {
      actions.push(`Track weekly: GitHub PR merge time, open issue count, contributor count, stars growth, Discord weekly message volume. Set a quarterly target on each.`);
    }
    if (intents.includes('partner') || intents.includes('find')) {
      actions.push(`Schedule 5 user interviews/month with top community contributors and high-engagement Discord users. Include rising-talent watchlist names for fresh perspective.`);
    }
    actions.push(`Review the Monthly Analysis tab's "Gaps & Blind Spots" for ${productList} — these are pre-prioritized roadmap inputs.`);
  }

  return actions;
}

export function answerQuestion(question: string, persona: AssistantPersona): AssistantResponse {
  const products = detectProducts(question);
  const intents = detectIntents(question);

  // Build the answer text
  const personaInfo = PERSONAS.find(p => p.id === persona)!;
  let answer = '';
  if (products.length > 0) {
    answer = `Looking at the dashboard signal for **${products.join(', ')}** through a ${personaInfo.label.toLowerCase()} lens.\n\n`;
  } else {
    answer = `Here's what the dashboard is surfacing right now, viewed through a ${personaInfo.label.toLowerCase()} lens.\n\n`;
  }

  // Compose data references based on persona priorities
  const dataReferences: DataRef[] = [];
  let tabHint: string | undefined;

  if (persona === 'technical-marketing') {
    dataReferences.push(...pickRelevantTopics(products, 2));
    dataReferences.push(...pickRelevantSpeakers(products, 2));
    dataReferences.push(...pickRelevantCommunities(products, 2));
    dataReferences.push(...pickRelevantPodcasts(products, 1));
    tabHint = 'GitHub';
    answer += 'Surfacing the technical leaders, key communities, and rising topics relevant to your product. Focus areas: tutorials, GitHub repo health, and developer relations.';
  } else if (persona === 'campaign-marketing') {
    dataReferences.push(...pickRelevantInfluencers(products, 3));
    dataReferences.push(...pickRelevantEvents(products, 3));
    dataReferences.push(...pickRelevantTopics(products, 2));
    dataReferences.push(...pickRelevantDiscord(products, 1));
    tabHint = 'Influencers';
    answer += 'Surfacing high-signal influencers, sponsorship-ready events, and active social channels for amplification.';
  } else if (persona === 'product-marketing') {
    dataReferences.push(...pickRelevantTopics(products, 3));
    dataReferences.push(...pickRelevantInfluencers(products, 2));
    dataReferences.push(...pickRelevantSpeakers(products, 2));
    dataReferences.push(...pickRelevantPodcasts(products, 1));
    tabHint = 'Hot Topics';
    answer += 'Surfacing market signals, narrative anchors, and external voices that can validate or challenge your positioning.';
  } else if (persona === 'product-manager') {
    dataReferences.push(...pickRelevantTopics(products, 2));
    dataReferences.push(...pickRelevantCommunities(products, 2));
    dataReferences.push(...pickRelevantDiscord(products, 2));
    dataReferences.push(...pickRelevantInfluencers(products, 2));
    tabHint = 'Monthly Analysis';
    answer += 'Surfacing user-pain signals, community feedback channels, and active conversations to inform roadmap. Check Monthly Analysis for pre-prioritized gaps.';
  }

  // Recommended actions based on persona + intents
  const recommendedActions = actionsForPersona(persona, products, intents);

  return { answer, dataReferences, recommendedActions, tabHint };
}

// ─── Gen Z Easter Egg Translator ────────────────────────────────────────
// Triggers: "/genz", "slay mode", "speak my language", "no cap", "fr fr",
// "bestie", "say it gen z", "say it ungovernably", "say less"
const GENZ_TRIGGERS = [
  '/genz', '/slay', 'slay mode', 'speak my language', 'no cap',
  'say less', 'fr fr', 'bestie tell me', 'gen z mode', 'say it ungovernably',
  'say it gen z', 'say it in gen z', 'translate to gen z', 'in gen z',
];

export function detectGenZTrigger(question: string): boolean {
  const lower = question.toLowerCase();
  return GENZ_TRIGGERS.some(t => lower.includes(t));
}

// Phrase-level rewrites — matched longest first so longer phrases win.
const GENZ_PHRASE_RULES: Array<[RegExp, string]> = [
  [/\bhigh[- ]?priority\b/gi,                       'main character energy'],
  [/\bhigh-?signal\b/gi,                            'lowkey unmatched'],
  [/\bhighly recommend(ed)?\b/gi,                   'fr fr you need to'],
  [/\bsignificant opportunity\b/gi,                 'a whole vibe of an opportunity'],
  [/\bgreat opportunity\b/gi,                       'big W energy'],
  [/\bcompetitive advantage\b/gi,                   "the giveaway you've been looking for"],
  [/\bmarket signals?\b/gi,                         'the tea'],
  [/\bcommunity (members?|engagement)\b/gi,         'the girlies in the community'],
  [/\bdeveloper (adoption|community)\b/gi,          'the dev hive'],
  [/\bvalue proposition\b/gi,                       'the rizz factor'],
  [/\bthought-?leadership\b/gi,                     'main character takes'],
  [/\bdeep[- ]?dive\b/gi,                           'lore drop'],
  [/\bcase stud(y|ies)\b/gi,                        'receipts'],
  [/\bbenchmarks?\b/gi,                             'side-by-sides (no shade)'],
  [/\bvery (good|strong)\b/gi,                      'a slay'],
  [/\bvery (bad|weak)\b/gi,                         "absolutely not it"],
  [/\bextremely\b/gi,                               'highkey'],
  [/\bstrong (signal|growth|momentum)\b/gi,         'a slay $1'],
  [/\bunderleveraged\b/gi,                          'sleeping on this'],
  [/\bblind spots?\b/gi,                            'the lore we missed'],
  [/\bgaps?\b/gi,                                   'the missing rizz'],
  [/\bamazing\b/gi,                                 'fire'],
  [/\bimpressive\b/gi,                              'iconic'],
  [/\bexcellent\b/gi,                               'ate that'],
  [/\bimportant\b/gi,                               'a non-negotiable'],
  [/\bcritical\b/gi,                                'period-pooh critical'],
  [/\bessential\b/gi,                               'a must-have bestie'],
  [/\binteresting\b/gi,                             'kinda fire ngl'],
  [/\binnovative\b/gi,                              'unhinged in the best way'],
  [/\btrending\b/gi,                                'going viral'],
  [/\bgrowing fast\b/gi,                            'eating and leaving no crumbs'],
  [/\baudience\b/gi,                                'the FYP'],
  [/\bengagement\b/gi,                              'the engagement (we love that for us)'],
  [/\bopportunity\b/gi,                             'opportunity (it\'s giving)'],
  [/\busers?\b/gi,                                  'the besties'],
  [/\bcustomers?\b/gi,                              'the customers (the cuties)'],
  [/\bpartners?\b/gi,                               'collab queens'],
  [/\bcollaboration\b/gi,                           'the collab'],
  [/\bcontent\b/gi,                                 'the drops'],
  [/\bcontent strategy\b/gi,                        'content strategy (chef\'s kiss energy)'],
  [/\bnarrative\b/gi,                               'the story arc'],
  [/\bnarrative gaps?\b/gi,                         'lore gaps'],
  [/\bpositioning\b/gi,                             'the angle'],
  [/\bpain points?\b/gi,                            'their L\'s'],
  [/\bmomentum\b/gi,                                'the wave'],
  [/\bdocumentation\b/gi,                           'the docs (read the room please)'],
  [/\btutorials?\b/gi,                              'the tutorials (so we can not flop)'],
  [/\bcompetitors?\b/gi,                            'the haters'],
  [/\bin parallel\b/gi,                             'all at once (we love a multitasker)'],
  [/\bwithin (\d+) days?\b/gi,                      'in $1 days bestie'],
  [/\bwithin (\d+) months?\b/gi,                    'in $1 months bestie'],
  [/\bget ahead\b/gi,                               'pull up first'],
  [/\bget in front of\b/gi,                         'slide into'],
  [/\bdrive(s)? traffic\b/gi,                       'send$1 the besties'],
  [/\bground[- ]?breaking\b/gi,                     'unhinged-in-a-good-way'],
  [/\bproductive\b/gi,                              'bussin\''],
  [/\bdevelopers?\b/gi,                             'devs'],
  [/\bresearchers?\b/gi,                            'the academic baddies'],
  [/\bengineers?\b/gi,                              'the engineering girlies'],
  [/\bteam\b/gi,                                    'the squad'],
  [/\binvest\b/gi,                                  'put coin into'],
  [/\bROI\b/gi,                                     'the receipts'],
  [/\bquickly\b/gi,                                 'real quick (no delay)'],
  [/\bimmediately\b/gi,                             'rn periodt'],
  [/\bovernight\b/gi,                               'in literally one (1) sleep'],
  [/\bcritical mass\b/gi,                           'main character ensemble'],
];

// Sentence-level openers — randomly prefixed for flavor
const GENZ_OPENERS = [
  'ok bestie, ',
  'lowkey, ',
  'no cap, ',
  'okay so peep this — ',
  'fr fr — ',
  'it\'s giving... ',
  'real talk: ',
  'ngl, ',
  'understand the assignment: ',
  'and i oop — ',
];

const GENZ_TAILS = [
  ' (and that\'s the tea ☕)',
  ' (periodt 💅)',
  ' — slay or be slayed.',
  ' (no thoughts, just vibes).',
  ' that\'s the move bestie.',
  ' fr fr.',
  ' iykyk.',
  ' it just hits different.',
];

// Hash-based pseudo-random so the same input always renders the same output
function hashIndex(s: string, max: number): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
  return Math.abs(h) % max;
}

export function toGenZ(text: string): string {
  if (!text) return text;
  let out = text;
  for (const [pattern, replacement] of GENZ_PHRASE_RULES) {
    out = out.replace(pattern, replacement);
  }
  // Add a Gen Z opener with high probability for sentences > 80 chars
  if (out.length > 80) {
    const opener = GENZ_OPENERS[hashIndex(text, GENZ_OPENERS.length)];
    out = opener + out.charAt(0).toLowerCase() + out.slice(1);
  }
  // Add a tail occasionally
  if (out.length > 60 && hashIndex(text + 'tail', 100) > 30) {
    const tail = GENZ_TAILS[hashIndex(text, GENZ_TAILS.length)];
    // Only append if the text already ends with a period/exclamation
    if (/[.!?]$/.test(out)) {
      out = out.slice(0, -1) + tail;
    } else {
      out = out + tail;
    }
  }
  return out;
}

export function genZifyResponse(r: AssistantResponse): AssistantResponse {
  return {
    answer: toGenZ(r.answer),
    dataReferences: r.dataReferences,
    recommendedActions: r.recommendedActions.map(toGenZ),
    tabHint: r.tabHint,
  };
}

// Suggested starter questions per persona
export const SUGGESTED_QUESTIONS: Record<AssistantPersona, string[]> = {
  'technical-marketing': [
    'How do I grow developer adoption of Isaac Lab?',
    'Who are the top community creators for Jetson tutorials?',
    'What are the technical learning gaps for OpenUSD?',
    'Where should I focus DevRel investment for GR00T?',
  ],
  'campaign-marketing': [
    'How should I launch a campaign for Newton?',
    'Which meetups and hackathons should we sponsor for Cosmos?',
    'Who should we engage to amplify Isaac Sim?',
    'What social channels are buzzing about humanoids?',
  ],
  'product-marketing': [
    'How is GR00T being positioned in the community?',
    'What are the top market signals for Cosmos?',
    'Who are the external voices validating Isaac Lab?',
    'What narrative gaps exist for OpenUSD?',
  ],
  'product-manager': [
    'What are the top user pain points for Isaac Lab?',
    'What are developers building on top of GR00T?',
    'Where are the biggest roadmap gaps for Cosmos?',
    'Which community contributors should I interview?',
  ],
};
