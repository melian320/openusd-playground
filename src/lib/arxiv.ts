import { Story, StoryTag } from '../types/story';

export interface ArxivPaper {
  arxivId: string;
  title: string;
  authors: string[];
  abstract: string;
  published: string; // ISO
  url: string;
  pdfUrl?: string;
  categories: string[];
  tags: StoryTag[];
  venue?: string;
  citationCount?: number;
  isStarred?: boolean;
  // Social signals
  hfUpvotes?: number;
  hfComments?: number;
  socialSources?: SocialSource[]; // which platforms are buzzing
  // NVIDIA relevance
  nvidiaTerms?: string[]; // matched NVIDIA products/hardware
  // Source metadata
  source?: PaperSource;
  pwcStars?: number;       // GitHub stars from Papers with Code
  pwcCodeUrl?: string;     // GitHub repo link
  openreviewVenue?: string; // e.g. "CoRL 2025", "NeurIPS 2025"
  // Physical AI topic taxonomy
  paperTopics?: string[];  // IDs from PAPER_TOPICS
}

export type PaperSource = 'semantic_scholar' | 'huggingface' | 'paperswithcode' | 'openreview' | 'arxiv_rss';

// ─── 15 Physical AI topic taxonomy ───────────────────────────────────────────

export interface PaperTopic {
  id: string;
  label: string;
  short: string;       // for chips
  color: string;       // tailwind bg+text
  border: string;      // tailwind border
  pattern: RegExp;
  /** Best search query per source to surface this topic */
  queries: {
    hf: string;
    pwc: string;
    s2: string;        // Semantic Scholar
    arxiv: string;     // arXiv category most relevant
  };
}

export const PAPER_TOPICS: PaperTopic[] = [
  {
    id: 'vla',
    label: 'Vision-Language-Action (VLA) Foundation Models',
    short: 'VLA',
    color: 'bg-violet-100 text-violet-800',
    border: 'border-violet-300',
    pattern: /\bvla\b|vision.language.action|language.conditioned.robot|rt-2\b|openvla|octo\b|π0\b|pi0\b|generalist.*policy|robot.*foundation model|foundation.*robot.*policy/i,
    queries: { hf: 'vision language action VLA robot policy', pwc: 'vision language action robot', s2: 'vision language action VLA robot foundation model', arxiv: 'cs.RO' },
  },
  {
    id: 'sim2real',
    label: 'Sim-to-Real Transfer',
    short: 'Sim-to-Real',
    color: 'bg-emerald-100 text-emerald-800',
    border: 'border-emerald-300',
    pattern: /sim.to.real|sim2real|simulation.to.real|domain.random|transfer.*from.*sim|synthetic.to.real|reality.gap|zero.shot.*real/i,
    queries: { hf: 'sim-to-real transfer', pwc: 'sim-to-real robotics', s2: 'sim-to-real transfer reinforcement learning robotics', arxiv: 'cs.RO' },
  },
  {
    id: 'world-models',
    label: 'World Models',
    short: 'World Models',
    color: 'bg-blue-100 text-blue-800',
    border: 'border-blue-300',
    pattern: /world.model|latent.world|dreamer|imagination.*planning|model.based.*robot|predictive.model.*plan|video.*world.model|generative.*world/i,
    queries: { hf: 'world model robot planning', pwc: 'world model reinforcement learning', s2: 'world model robot planning embodied', arxiv: 'cs.LG' },
  },
  {
    id: 'cross-embodiment',
    label: 'Cross-Embodiment Generalization',
    short: 'Cross-Embodiment',
    color: 'bg-pink-100 text-pink-800',
    border: 'border-pink-300',
    pattern: /cross.embodiment|embodiment.agnostic|generalist.robot|multi.embodiment|morphology.agnostic|open.x.embodiment|embodiment.transfer/i,
    queries: { hf: 'cross-embodiment generalization robot', pwc: 'cross embodiment robot', s2: 'cross embodiment generalization robot policy', arxiv: 'cs.RO' },
  },
  {
    id: 'multimodal',
    label: 'Multimodal Perception & Sensor Fusion',
    short: 'Sensor Fusion',
    color: 'bg-cyan-100 text-cyan-800',
    border: 'border-cyan-300',
    pattern: /sensor.fusion|multimodal.percep|lidar.*camera|point.cloud.*rgb|depth.*fusion|tactile.*vision|propriocep|multi.modal.*sensor|radar.*camera/i,
    queries: { hf: 'multimodal perception sensor fusion robot', pwc: 'sensor fusion lidar camera robot', s2: 'multimodal perception sensor fusion robotics', arxiv: 'cs.CV' },
  },
  {
    id: 'industrial',
    label: 'Industrial Automation & Manufacturing',
    short: 'Industrial',
    color: 'bg-orange-100 text-orange-800',
    border: 'border-orange-300',
    pattern: /industrial.automat|manufactur|assembly.robot|warehouse.robot|logistics.robot|factory.automat|bin.picking|pick.and.place|cnc|weld/i,
    queries: { hf: 'industrial automation robot manufacturing', pwc: 'industrial robot manipulation assembly', s2: 'industrial automation robot manufacturing assembly', arxiv: 'cs.RO' },
  },
  {
    id: 'healthcare',
    label: 'Healthcare Robotics',
    short: 'Healthcare',
    color: 'bg-red-100 text-red-800',
    border: 'border-red-300',
    pattern: /surgical.robot|medical.robot|rehabilitat|prosthetic|assistive.robot|hospital.robot|healthcare.robot|minimally.invasive|da.vinci/i,
    queries: { hf: 'surgical robot medical robotics', pwc: 'medical robot surgical', s2: 'surgical robot medical automation healthcare', arxiv: 'cs.RO' },
  },
  {
    id: 'agricultural',
    label: 'Agricultural Robotics',
    short: 'AgriRobotics',
    color: 'bg-lime-100 text-lime-800',
    border: 'border-lime-300',
    pattern: /agricultur|agri.robot|farming.robot|harvest.robot|crop.robot|field.robot|precision.agri|greenhouse.robot|fruit.pick/i,
    queries: { hf: 'agricultural robot farming harvest', pwc: 'agricultural robot crop harvesting', s2: 'agricultural robotics precision farming', arxiv: 'cs.RO' },
  },
  {
    id: 'extreme-env',
    label: 'Underwater & Extreme Environment Robotics',
    short: 'Extreme Env.',
    color: 'bg-teal-100 text-teal-800',
    border: 'border-teal-300',
    pattern: /underwater.robot|aquatic.robot|marine.robot|deep.sea.robot|extreme.environment|subterranean|aerial.robot|uav.robot|disaster.robot|nuclear.robot/i,
    queries: { hf: 'underwater robot extreme environment', pwc: 'underwater marine robot', s2: 'underwater robot extreme environment autonomous', arxiv: 'cs.RO' },
  },
  {
    id: 'deployment-safety',
    label: 'Observability & Deployment Safety',
    short: 'Deploy Safety',
    color: 'bg-amber-100 text-amber-800',
    border: 'border-amber-300',
    pattern: /deployment.safety|robot.*monitor|anomaly.detect.*robot|fault.detect.*robot|safe.deploy|out.of.distribution.*robot|uncertainty.*robot|robustness.*deploy/i,
    queries: { hf: 'robot safety deployment monitoring', pwc: 'safe robot deployment monitoring', s2: 'robot safety deployment observability', arxiv: 'cs.RO' },
  },
  {
    id: 'hri',
    label: 'Human-Robot Interaction (HRI)',
    short: 'HRI',
    color: 'bg-fuchsia-100 text-fuchsia-800',
    border: 'border-fuchsia-300',
    pattern: /human.robot.interact|\bhri\b|social.robot|shared.autonomy|teleoperat|human.in.the.loop.*robot|cobots?|collaborative.robot/i,
    queries: { hf: 'human robot interaction collaboration', pwc: 'human robot interaction', s2: 'human robot interaction social robot collaboration', arxiv: 'cs.RO' },
  },
  {
    id: 'edge-ai',
    label: 'Edge AI & Real-Time Inference',
    short: 'Edge AI',
    color: 'bg-sky-100 text-sky-800',
    border: 'border-sky-300',
    pattern: /edge.ai|edge.*infer|real.time.*infer|embedded.*neural|on.device.*learn|tinyml|efficient.*robot.*infer|neural.*compress.*robot|model.pruning.*robot|quantiz.*robot/i,
    queries: { hf: 'edge AI real-time inference robot embedded', pwc: 'edge inference efficient robot', s2: 'edge AI real-time inference embedded robot', arxiv: 'cs.RO' },
  },
  {
    id: 'ethics',
    label: 'Ethics, Safety & Policy',
    short: 'Ethics & Policy',
    color: 'bg-slate-100 text-slate-700',
    border: 'border-slate-300',
    pattern: /robot.*ethic|ai.*ethic|robot.*polic|autonomous.*weapon|robot.*governance|robot.*bias|robot.*fairness|robot.*accountability|safe.*ai.*robot/i,
    queries: { hf: 'AI ethics robot safety policy', pwc: 'robot safety ethics', s2: 'robot AI ethics safety policy governance', arxiv: 'cs.AI' },
  },
  {
    id: 'sci-discovery',
    label: 'AI-Accelerated Scientific Discovery',
    short: 'AI Discovery',
    color: 'bg-indigo-100 text-indigo-800',
    border: 'border-indigo-300',
    pattern: /ai.*scientific.discovery|ai.*drug.discovery|ai.*materials|ai.*protein|ai.*molecule|neural.*force.field|foundation.*science|scientific.*ai/i,
    queries: { hf: 'AI scientific discovery materials protein', pwc: 'AI scientific discovery', s2: 'AI accelerated scientific discovery drug materials', arxiv: 'cs.LG' },
  },
  {
    id: 'physics-ai',
    label: 'Physics-Informed AI Models',
    short: 'Physics AI',
    color: 'bg-rose-100 text-rose-800',
    border: 'border-rose-300',
    pattern: /physics.informed|physics.based.*neural|differentiable.sim|rigid.body.*learn|contact.dynamics.*learn|neural.*physics|physx|mujoco|genesis.*sim|newton.*physics.*learn/i,
    queries: { hf: 'physics-informed neural network robot simulation', pwc: 'physics informed neural robot', s2: 'physics informed AI robot simulation contact dynamics', arxiv: 'cs.RO' },
  },
];

/** Detect which of the 15 Physical AI topics a paper covers */
export function detectTopics(title: string, abstract: string): string[] {
  const text = title + ' ' + abstract;
  return PAPER_TOPICS.filter(t => t.pattern.test(text)).map(t => t.id);
}

export type SocialSource = 'huggingface' | 'x' | 'reddit' | 'linkedin';

// --- NVIDIA technology detection ---

const NVIDIA_TERMS: { pattern: RegExp; label: string }[] = [
  // Software / platforms
  { pattern: /\bisaac\s?sim\b/i,          label: 'Isaac Sim' },
  { pattern: /\bisaac\s?lab\b/i,          label: 'Isaac Lab' },
  { pattern: /\bisaac\s?ros\b/i,          label: 'Isaac ROS' },
  { pattern: /\bisaac\b/i,                label: 'Isaac' },
  { pattern: /\bomniverse\b/i,            label: 'Omniverse' },
  { pattern: /\bopenusd\b|open\s?usd\b/i, label: 'OpenUSD' },
  { pattern: /\bgr00t\b/i,                label: 'GR00T' },
  { pattern: /\bnewton\s(physics|engine)\b|\bnewton\b.*\bphysics\b/i, label: 'Newton' },
  { pattern: /\bcosmos\b.*\bworld\s?model|\bworld\s?model\b.*\bcosmos\b/i, label: 'Cosmos' },
  { pattern: /\bcosmos\b/i,               label: 'Cosmos' },
  { pattern: /\balpamayo\b/i,             label: 'Alpamayo' },
  { pattern: /\bmetropolis\b/i,           label: 'Metropolis' },
  { pattern: /\bhalos\b/i,               label: 'Halos' },
  { pattern: /\bnurec\b/i,               label: 'NuRec' },
  { pattern: /\bdriveos\b/i,             label: 'DriveOS' },
  { pattern: /\bdgx\b/i,                 label: 'DGX' },
  { pattern: /\bcuda\b/i,                label: 'CUDA' },
  { pattern: /\btensorrt\b/i,            label: 'TensorRT' },
  // Hardware
  { pattern: /\bjetson\b/i,              label: 'Jetson' },
  { pattern: /\bjeton\s?orin\b/i,        label: 'Jetson Orin' },
  { pattern: /\bh100\b/i,                label: 'H100' },
  { pattern: /\ba100\b/i,                label: 'A100' },
  { pattern: /\bb200\b|\bgb200\b/i,      label: 'GB200' },
  { pattern: /\bdgx\s?spark\b/i,         label: 'DGX Spark' },
  { pattern: /\bthor\s?(soc|chip|gpu)\b|\bsoc\b.*\bthor\b/i, label: 'Thor SoC' },
  // General brand
  { pattern: /\bnvidia\b/i,              label: 'NVIDIA' },
];

/** Returns deduplicated list of matched NVIDIA term labels, or empty array if none */
export function detectNvidiaTerms(title: string, abstract: string): string[] {
  const text = title + ' ' + abstract;
  const found = new Set<string>();
  for (const { pattern, label } of NVIDIA_TERMS) {
    if (pattern.test(text)) found.add(label);
  }
  // If only "NVIDIA" matched but also a specific product, drop the generic one
  if (found.size > 1) found.delete('NVIDIA');
  // If only "Isaac" matched but also a specific Isaac product, drop the generic one
  if (found.size > 1 && (found.has('Isaac Sim') || found.has('Isaac Lab') || found.has('Isaac ROS'))) {
    found.delete('Isaac');
  }
  return Array.from(found);
}

// --- Tag inference ---

function inferTags(title: string, abstract: string, fieldsOfStudy: string[]): StoryTag[] {
  const text = (title + ' ' + abstract).toLowerCase();
  const tags = new Set<StoryTag>();

  if (fieldsOfStudy.some(f => /computer science|engineering/i.test(f))) tags.add('research');

  if (/humanoid|biped|bipedal/.test(text)) tags.add('humanoids');
  if (/sim.to.real|sim2real|simulation.to.real/.test(text)) tags.add('simulation');
  if (/\bsimulat/.test(text)) tags.add('simulation');
  if (/digital twin/.test(text)) tags.add('digital-twins');
  if (/embodied|embodiment/.test(text)) tags.add('embodied-ai');
  if (/\bvla\b|vision.language.action|language.conditioned/.test(text)) tags.add('embodied-ai');
  if (/foundation model|world model|generalist policy/.test(text)) tags.add('embodied-ai');
  if (/manipulat|gripper|grasping|dexterous/.test(text)) tags.add('robotics');
  if (/locomotion|legged|quadruped|walking|running gait/.test(text)) tags.add('robotics');
  if (/autonomous vehicle|self.driving|autonomous driving/.test(text)) tags.add('robotics');
  if (/robot/.test(text)) tags.add('robotics');

  if (tags.size === 0) tags.add('research');
  return Array.from(tags);
}

// --- Semantic Scholar API ---

interface S2Paper {
  paperId: string;
  title: string;
  abstract?: string;
  authors?: { name: string }[];
  publicationDate?: string;
  year?: number;
  externalIds?: { ArXiv?: string; DOI?: string };
  openAccessPdf?: { url: string };
  url?: string;
  fieldsOfStudy?: string[];
  venue?: string;
  citationCount?: number;
}

const S2_BASE = 'https://api.semanticscholar.org/graph/v1';
const S2_FIELDS = 'title,abstract,authors,publicationDate,year,externalIds,openAccessPdf,url,fieldsOfStudy,venue,citationCount';

export async function searchArxiv(query: string, maxResults = 15): Promise<ArxivPaper[]> {
  const params = new URLSearchParams({
    query,
    limit: String(maxResults),
    fields: S2_FIELDS,
  });

  const res = await fetch(`${S2_BASE}/paper/search?${params}`, {
    headers: { 'Accept': 'application/json' },
  });

  if (!res.ok) throw new Error(`Semantic Scholar API error: ${res.status}`);

  const json = await res.json() as { data: S2Paper[] };
  const papers = json.data ?? [];

  return papers
    .filter(p => p.title && p.abstract)
    .map(p => {
      const arxivId = p.externalIds?.ArXiv ?? p.paperId;
      const absUrl = p.externalIds?.ArXiv
        ? `https://arxiv.org/abs/${p.externalIds.ArXiv}`
        : (p.url ?? `https://www.semanticscholar.org/paper/${p.paperId}`);
      const published = p.publicationDate
        ? new Date(p.publicationDate).toISOString()
        : new Date(`${p.year ?? 2024}-01-01`).toISOString();
      const authors = (p.authors ?? []).map(a => a.name);
      const fieldsOfStudy = p.fieldsOfStudy ?? [];
      const tags = inferTags(p.title, p.abstract ?? '', fieldsOfStudy);

      const nvidiaTerms = detectNvidiaTerms(p.title, p.abstract ?? '');
      const paperTopics = detectTopics(p.title, p.abstract ?? '');
      return {
        arxivId,
        title: p.title,
        authors,
        abstract: p.abstract ?? '',
        published,
        url: absUrl,
        pdfUrl: p.openAccessPdf?.url,
        categories: fieldsOfStudy,
        tags,
        venue: p.venue,
        citationCount: p.citationCount,
        nvidiaTerms: nvidiaTerms.length > 0 ? nvidiaTerms : undefined,
        paperTopics: paperTopics.length > 0 ? paperTopics : undefined,
      };
    });
}

export function paperToStory(paper: ArxivPaper): Omit<Story, 'id'> {
  const firstAuthor = paper.authors[0] ?? 'Unknown';
  const authorDisplay = paper.authors.length > 2
    ? `${firstAuthor} et al.`
    : paper.authors.join(', ');

  return {
    title: paper.title,
    summary: paper.abstract.length > 420
      ? paper.abstract.slice(0, 417) + '…'
      : paper.abstract,
    source: 'arxiv',
    channel: paper.categories[0] ?? 'cs.RO',
    author: authorDisplay,
    date: paper.published,
    url: paper.url,
    tags: paper.tags,
    engagementScore: paper.citationCount,
    isStarred: false,
  };
}

export const PRESET_QUERIES = [
  { label: 'Physical AI & Embodied AI', query: 'physical AI embodied AI robotics' },
  { label: 'Humanoid Robots', query: 'humanoid robot learning locomotion' },
  { label: 'Vision-Language-Action', query: 'vision language action VLA robot policy' },
  { label: 'Sim-to-Real Transfer', query: 'sim-to-real transfer reinforcement learning robotics' },
  { label: 'World Models for Robotics', query: 'world model robot planning embodied' },
  { label: 'Dexterous Manipulation', query: 'dexterous manipulation grasping robot learning' },
  { label: 'Digital Twins & Simulation', query: 'digital twin simulation robotics Isaac' },
];

// --- HuggingFace Papers API ---
// HF Papers is the primary place researchers share & celebrate new papers —
// upvotes reflect social buzz from the ML/robotics community (and map to X activity)

interface HFPaper {
  id: string;          // arxiv ID like "2503.12345"
  title: string;
  summary?: string;
  upvotes: number;
  numComments?: number;
  publishedAt: string; // ISO
  authors?: { user?: { fullname?: string; name?: string }; name?: string }[];
  mediaUrl?: string;
}

interface HFDailyEntry {
  paper: HFPaper;
}

function hfToArxivPaper(hf: HFPaper): ArxivPaper {
  const arxivId = hf.id;
  const url = `https://arxiv.org/abs/${arxivId}`;
  const pdfUrl = `https://arxiv.org/pdf/${arxivId}`;
  const authors = (hf.authors ?? []).map(
    a => a.user?.fullname ?? a.user?.name ?? a.name ?? 'Unknown'
  ).filter(Boolean);
  const abstract = hf.summary ?? '';
  const tags = inferTags(hf.title, abstract, []);
  const socialSources: SocialSource[] = ['huggingface'];
  if (hf.upvotes >= 20) socialSources.push('x');
  if (hf.upvotes >= 50) socialSources.push('reddit');
  const nvidiaTerms = detectNvidiaTerms(hf.title, abstract);
  const paperTopics = detectTopics(hf.title, abstract);

  return {
    arxivId,
    title: hf.title,
    authors,
    abstract,
    published: hf.publishedAt,
    url,
    pdfUrl,
    categories: [],
    tags,
    hfUpvotes: hf.upvotes,
    hfComments: hf.numComments,
    socialSources,
    nvidiaTerms: nvidiaTerms.length > 0 ? nvidiaTerms : undefined,
    paperTopics: paperTopics.length > 0 ? paperTopics : undefined,
  };
}

/** Fetch today's trending papers from HuggingFace Papers */
export async function getTrendingHFPapers(): Promise<ArxivPaper[]> {
  const res = await fetch('https://huggingface.co/api/daily_papers?limit=30', {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`HF API error: ${res.status}`);
  const json = await res.json() as HFDailyEntry[];
  return json
    .map(entry => hfToArxivPaper(entry.paper))
    .filter(p => p.title)
    .sort((a, b) => (b.hfUpvotes ?? 0) - (a.hfUpvotes ?? 0));
}

/** Search HuggingFace Papers by keyword */
export async function searchHFPapers(query: string, limit = 20): Promise<ArxivPaper[]> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  const res = await fetch(`https://huggingface.co/api/papers?${params}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`HF API error: ${res.status}`);
  const json = await res.json() as HFPaper[];
  return (Array.isArray(json) ? json : [])
    .map(hfToArxivPaper)
    .filter(p => p.title)
    .sort((a, b) => (b.hfUpvotes ?? 0) - (a.hfUpvotes ?? 0));
}

export const HF_PRESET_QUERIES = [
  { label: 'Physical AI', query: 'physical AI' },
  { label: 'Humanoid Robots', query: 'humanoid robot' },
  { label: 'VLA / Robot Policy', query: 'vision language action robot' },
  { label: 'Sim-to-Real', query: 'sim-to-real' },
  { label: 'Dexterous Manipulation', query: 'dexterous manipulation' },
  { label: 'World Models', query: 'world model robotics' },
  { label: 'GR00T / Foundation Models', query: 'robot foundation model' },
];

// ─── Papers with Code ────────────────────────────────────────────────────────
// Shows which papers researchers are actually USING — ranked by GitHub stars.
// Free public API, no key required.

interface PWCPaper {
  id: string;
  arxiv_id?: string;
  title: string;
  abstract?: string;
  authors?: string[];
  published?: string;
  url_abs?: string;
  url_pdf?: string;
  github_star_count?: number;
  repository?: { url: string; stars: number } | null;
  conference?: string | null;
}

export async function searchPapersWithCode(query: string, limit = 20): Promise<ArxivPaper[]> {
  const params = new URLSearchParams({
    q: query,
    page_size: String(limit),
    ordering: '-github_star_count',
  });
  const res = await fetch(`https://paperswithcode.com/api/v1/papers/?${params}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Papers with Code API error: ${res.status}`);
  const json = await res.json() as { results: PWCPaper[] };
  return (json.results ?? [])
    .filter(p => p.title)
    .map(p => {
      const arxivId = p.arxiv_id ?? p.id;
      const url = p.url_abs ?? (p.arxiv_id ? `https://arxiv.org/abs/${p.arxiv_id}` : `https://paperswithcode.com/paper/${p.id}`);
      const pdfUrl = p.url_pdf ?? (p.arxiv_id ? `https://arxiv.org/pdf/${p.arxiv_id}` : undefined);
      const stars = p.github_star_count ?? p.repository?.stars ?? 0;
      const abstract = p.abstract ?? '';
      const tags = inferTags(p.title, abstract, []);
      const nvidiaTerms = detectNvidiaTerms(p.title, abstract);
      const paperTopics = detectTopics(p.title, abstract);
      const socialSources: SocialSource[] = [];
      if (stars >= 100) socialSources.push('x');
      if (stars >= 500) socialSources.push('reddit');
      return {
        arxivId,
        title: p.title,
        authors: p.authors ?? [],
        abstract,
        published: p.published ?? new Date().toISOString(),
        url,
        pdfUrl,
        categories: [],
        tags,
        venue: p.conference ?? undefined,
        source: 'paperswithcode' as PaperSource,
        pwcStars: stars > 0 ? stars : undefined,
        pwcCodeUrl: p.repository?.url,
        nvidiaTerms: nvidiaTerms.length > 0 ? nvidiaTerms : undefined,
        paperTopics: paperTopics.length > 0 ? paperTopics : undefined,
        socialSources,
      };
    });
}

export async function getTrendingPapersWithCode(topic = 'robotics'): Promise<ArxivPaper[]> {
  const params = new URLSearchParams({
    q: topic,
    page_size: '30',
    ordering: '-published',
  });
  const res = await fetch(`https://paperswithcode.com/api/v1/papers/?${params}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Papers with Code API error: ${res.status}`);
  const json = await res.json() as { results: PWCPaper[] };
  return (json.results ?? [])
    .filter(p => p.title)
    .map(p => {
      const arxivId = p.arxiv_id ?? p.id;
      const url = p.url_abs ?? (p.arxiv_id ? `https://arxiv.org/abs/${p.arxiv_id}` : `https://paperswithcode.com/paper/${p.id}`);
      const abstract = p.abstract ?? '';
      const tags = inferTags(p.title, abstract, []);
      const nvidiaTerms = detectNvidiaTerms(p.title, abstract);
      const paperTopics = detectTopics(p.title, abstract);
      const stars = p.github_star_count ?? 0;
      return {
        arxivId,
        title: p.title,
        authors: p.authors ?? [],
        abstract,
        published: p.published ?? new Date().toISOString(),
        url,
        pdfUrl: p.url_pdf ?? (p.arxiv_id ? `https://arxiv.org/pdf/${p.arxiv_id}` : undefined),
        categories: [],
        tags,
        venue: p.conference ?? undefined,
        source: 'paperswithcode' as PaperSource,
        pwcStars: stars > 0 ? stars : undefined,
        pwcCodeUrl: p.repository?.url,
        nvidiaTerms: nvidiaTerms.length > 0 ? nvidiaTerms : undefined,
        paperTopics: paperTopics.length > 0 ? paperTopics : undefined,
        socialSources: stars >= 100 ? (['x'] as SocialSource[]) : [],
      };
    });
}

// ─── OpenReview ───────────────────────────────────────────────────────────────
// Ground truth for accepted conference papers: CoRL, NeurIPS, ICML, ICLR, ICRA
// Public API, no key required.

interface ORNote {
  id: string;
  content: {
    title?: { value?: string } | string;
    abstract?: { value?: string } | string;
    authors?: { value?: string[] } | string[];
    keywords?: { value?: string[] } | string[];
    pdf?: { value?: string } | string;
  };
  cdate: number; // ms timestamp
  venue?: string;
  venueid?: string;
}

function orStr(v: { value?: string } | string | undefined): string {
  if (!v) return '';
  if (typeof v === 'string') return v;
  return v.value ?? '';
}
function orArr(v: { value?: string[] } | string[] | undefined): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return v.value ?? [];
}

const OR_VENUES: { id: string; label: string }[] = [
  { id: 'CoRL.cc/2025/Conference', label: 'CoRL 2025' },
  { id: 'CoRL.cc/2024/Conference', label: 'CoRL 2024' },
  { id: 'robot-learning.org/CoRL/2025/Conference', label: 'CoRL 2025' },
  { id: 'NeurIPS.cc/2025/Conference', label: 'NeurIPS 2025' },
  { id: 'ICML.cc/2025/Conference', label: 'ICML 2025' },
  { id: 'ICLR.cc/2025/Conference', label: 'ICLR 2025' },
];

export async function searchOpenReview(query: string, venueId?: string): Promise<ArxivPaper[]> {
  const venue = venueId ?? OR_VENUES[0].id;
  const params = new URLSearchParams({
    'content.title': query,
    invitation: `${venue}/-/Submission`,
    limit: '25',
    offset: '0',
    details: 'replyCount',
  });
  const res = await fetch(`https://api2.openreview.net/notes?${params}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`OpenReview API error: ${res.status}`);
  const json = await res.json() as { notes: ORNote[] };
  const venueLabel = OR_VENUES.find(v => v.id === venue)?.label ?? venue.split('/')[0];
  return (json.notes ?? [])
    .filter(n => orStr(n.content.title))
    .map(n => {
      const title = orStr(n.content.title);
      const abstract = orStr(n.content.abstract);
      const authors = orArr(n.content.authors);
      const pdfVal = orStr(n.content.pdf);
      const pdfUrl = pdfVal ? `https://openreview.net${pdfVal}` : undefined;
      const nvidiaTerms = detectNvidiaTerms(title, abstract);
      return {
        arxivId: n.id,
        title,
        authors,
        abstract,
        published: new Date(n.cdate).toISOString(),
        url: `https://openreview.net/forum?id=${n.id}`,
        pdfUrl,
        categories: orArr(n.content.keywords).slice(0, 3),
        tags: inferTags(title, abstract, []),
        venue: venueLabel,
        source: 'openreview' as PaperSource,
        openreviewVenue: venueLabel,
        nvidiaTerms: nvidiaTerms.length > 0 ? nvidiaTerms : undefined,
        paperTopics: detectTopics(title, abstract),
        socialSources: [],
      };
    });
}

// ─── arXiv RSS (direct) ───────────────────────────────────────────────────────
// Real-time feed straight from arXiv — newest papers before social picks them up.
// Categories useful for Physical AI: cs.RO, cs.AI, cs.CV, cs.LG, eess.SY

const ARXIV_CATEGORIES = [
  { id: 'cs.RO', label: 'Robotics (cs.RO)' },
  { id: 'cs.AI', label: 'AI (cs.AI)' },
  { id: 'cs.LG', label: 'Machine Learning (cs.LG)' },
  { id: 'cs.CV', label: 'Computer Vision (cs.CV)' },
  { id: 'eess.SY', label: 'Systems & Control (eess.SY)' },
];
export { ARXIV_CATEGORIES };

export async function fetchArxivRSS(category = 'cs.RO', maxResults = 25): Promise<ArxivPaper[]> {
  // Use arXiv query API (JSON-friendly) via Semantic Scholar category filter
  // Direct arXiv RSS returns XML; we use the search API for the same freshness
  const params = new URLSearchParams({
    query: `cat:${category}`,
    limit: String(maxResults),
    sort: 'submittedDate',
    sortOrder: 'desc',
    fields: S2_FIELDS,
  });
  const res = await fetch(`${S2_BASE}/paper/search?${params}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`arXiv feed error: ${res.status}`);
  const json = await res.json() as { data: S2Paper[] };
  return (json.data ?? [])
    .filter(p => p.title && p.abstract)
    .map(p => {
      const arxivId = p.externalIds?.ArXiv ?? p.paperId;
      const url = p.externalIds?.ArXiv
        ? `https://arxiv.org/abs/${p.externalIds.ArXiv}`
        : (p.url ?? `https://www.semanticscholar.org/paper/${p.paperId}`);
      const abstract = p.abstract ?? '';
      const tags = inferTags(p.title, abstract, p.fieldsOfStudy ?? []);
      const nvidiaTerms = detectNvidiaTerms(p.title, abstract);
      const paperTopics = detectTopics(p.title, abstract);
      return {
        arxivId,
        title: p.title,
        authors: (p.authors ?? []).map(a => a.name),
        abstract,
        published: p.publicationDate
          ? new Date(p.publicationDate).toISOString()
          : new Date(`${p.year ?? 2025}-01-01`).toISOString(),
        url,
        pdfUrl: p.openAccessPdf?.url,
        categories: p.fieldsOfStudy ?? [category],
        tags,
        venue: p.venue,
        citationCount: p.citationCount,
        source: 'arxiv_rss' as PaperSource,
        nvidiaTerms: nvidiaTerms.length > 0 ? nvidiaTerms : undefined,
        paperTopics: paperTopics.length > 0 ? paperTopics : undefined,
        socialSources: [],
      };
    });
}

export { OR_VENUES };
export const PWC_PRESET_QUERIES = [
  { label: 'Robotics', query: 'robotics' },
  { label: 'Humanoid', query: 'humanoid robot' },
  { label: 'Isaac Sim / Sim-to-Real', query: 'sim-to-real isaac' },
  { label: 'VLA Policy', query: 'vision language action policy' },
  { label: 'Manipulation', query: 'robot manipulation' },
  { label: 'NVIDIA / CUDA', query: 'NVIDIA CUDA GPU robot' },
];
