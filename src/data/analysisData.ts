// Physical AI Community Hub — Analysis & Monthly Intelligence Data
// Last updated: May 2026

export interface TabInsight {
  summary: string;
  trends: string[];
  gaps: string[];
  recommendations: string[];
  focusAreas: string[];
  urgentWatch: string;
  lastUpdated: string;
}

export const TAB_INSIGHTS: Record<string, TabInsight> = {
  topics: {
    summary:
      "Physical AI discourse is converging around sim-to-real transfer and foundation model grounding, with Isaac Lab and MuJoCo emerging as the dominant simulation backends for policy training. World foundation models (Genie 2, GROOT N1) are fueling a wave of generalist robot policy research that is rapidly moving from arXiv preprints to open-source releases. The OpenUSD ecosystem is quietly becoming the connective tissue linking robotics simulation, industrial digital twins, and Vision AI pipelines.",
    trends: [
      "Diffusion-based robot policies (Diffusion Policy, π0) gaining traction for dexterous manipulation beyond pick-and-place",
      "Isaac Lab replacing Isaac Gym as the community standard for GPU-accelerated RL — tutorial demand up sharply",
      "OpenUSD-as-data-format narrative spreading beyond Omniverse into non-NVIDIA simulation stacks",
      "Edge AI inference optimization (INT4 quantization, speculative decoding on Jetson) drawing significant community interest",
    ],
    gaps: [
      "Sparse coverage of industrial deployment case studies — most content stays at research prototype level",
      "Hardware-in-the-loop testing workflows are rarely discussed despite being a major bottleneck for practitioners",
      "Safety and reliability engineering for autonomous systems (formal verification, runtime monitoring) almost absent",
      "Cross-domain conversations between robotics and industrial digital twin practitioners are rare",
    ],
    recommendations: [
      "Commission a 'Sim-to-Real Reality Check' long-form post documenting failure modes practitioners actually hit in Isaac Lab and MuJoCo",
      "Run a community poll on the top 3 deployment blockers to surface practitioner pain points beyond research benchmarks",
      "Create a structured topic map linking OpenUSD, digital twins, and robotics to show community members the connective tissue",
      "Invite an industrial partner (automotive, logistics, semiconductor fab) to do a 30-min AMA on real deployment experience",
    ],
    focusAreas: [
      "Sim-to-real transfer tooling and workflow content — highest practitioner demand signal right now",
      "OpenUSD ecosystem literacy — tutorials and explainers for robotics engineers new to the format",
    ],
    urgentWatch:
      "GROOT N1 open-source release timeline — community anticipation is high and first-mover content will dominate search for months",
    lastUpdated: "May 2026",
  },

  communities: {
    summary:
      "The Physical AI community is distributed across a fragmented landscape: Hugging Face's LeRobot Discord, the Robotics Worldwide mailing list, Reddit r/robotics, and a handful of private Slack groups are the main hubs. No single community owns the Physical AI identity yet, which represents a significant opportunity. NVIDIA's Omniverse Discord has a strong technical base but skews toward enterprise digital twin users rather than robotics researchers.",
    trends: [
      "Hugging Face LeRobot Discord fastest-growing community channel for open-source robot learning — crossed 8K members",
      "Autonomous vehicle communities migrating from CARLA forums to more curated Discord/Slack spaces",
      "Academic robotics labs (CMU, MIT CSAIL, Stanford ARM) increasingly sharing code and datasets publicly, building followings",
      "Industrial IoT and digital twin communities starting to intersect with robotics ML communities around edge inference",
    ],
    gaps: [
      "No strong Physical AI community hub that spans both research and industry — most spaces are one or the other",
      "Practitioners in manufacturing and logistics are largely absent from online communities despite being the biggest deployment audience",
      "Non-English-speaking communities (China, Germany, Japan) have significant Physical AI activity that is rarely surfaced in English-language spaces",
      "Women and underrepresented groups in robotics lack dedicated community resources compared to software ML spaces",
    ],
    recommendations: [
      "Map the top 10 Physical AI community spaces with size, activity level, and audience type to identify partnership opportunities",
      "Establish a presence in LeRobot Discord as a community partner — cross-post relevant content and attend their events",
      "Identify 3–5 active practitioners in manufacturing/logistics who could be community anchors and invite them to contribute",
      "Launch a 'Physical AI Community Map' as a public resource — drives SEO and positions the hub as the meta-community",
    ],
    focusAreas: [
      "Hugging Face / LeRobot ecosystem — fastest-growing practitioner base for open-source robot learning",
      "Bridging research and industry practitioner audiences — the gap is a differentiator if closed well",
    ],
    urgentWatch:
      "Whether Hugging Face launches its own dedicated Physical AI community hub — could disintermediate this space quickly if it happens",
    lastUpdated: "May 2026",
  },

  conferences: {
    summary:
      "ICRA 2026 (Rotterdam, May) is the dominant near-term event, with CoRL 2026 (November) and NeurIPS 2026 (December) as the key end-of-year moments for Physical AI research. NVIDIA GTC remains the highest-value industry event for the Omniverse/Isaac/DRIVE ecosystem. Several new practitioner-focused events (Embodied AI Summit, Robot Learning Workshop series) are emerging as alternatives to traditional academic venues.",
    trends: [
      "Workshop density at ICRA and CoRL increasing around robot learning, sim-to-real, and foundation models — competition for slots intense",
      "Hybrid event formats now standard — virtual attendance driving 3–5x reach vs. in-person alone",
      "Industry-track sessions at academic conferences gaining prominence as company research labs publish openly",
      "New 'practitioner day' formats appearing alongside academic programs to serve deployment-focused attendees",
    ],
    gaps: [
      "No comprehensive event calendar for the intersection of Physical AI, digital twins, and edge computing",
      "European and Asian Physical AI conference coverage is thin — significant activity at IROS, ICDL, and regional robotics events goes untracked",
      "CFP deadlines are often missed — community members learning about workshops after submission windows close",
      "No post-conference synthesis content to capture key insights for members who could not attend",
    ],
    recommendations: [
      "Publish a 'Physical AI Conference Calendar H2 2026' covering ICRA workshops, CoRL, NeurIPS, IROS, and key GTC events with CFP deadlines",
      "Assign a community correspondent for ICRA 2026 Rotterdam to produce daily highlights and LinkedIn content",
      "Create a CFP alert system — a simple newsletter or Discord bot tracking submission deadlines for Physical AI-adjacent workshops",
      "Produce post-conference synthesis posts for the top 3 conferences summarizing key papers, demos, and debates",
    ],
    focusAreas: [
      "ICRA 2026 content pipeline — highest concentration of Physical AI research in one place this month",
      "CoRL 2026 preparation — best venue for robot learning community and worth building presence early",
    ],
    urgentWatch:
      "ICRA 2026 workshop schedules — several foundation model for robotics workshops will set the community research agenda for H2 2026",
    lastUpdated: "May 2026",
  },

  speakers: {
    summary:
      "The Physical AI speaker landscape spans academic PIs (Chelsea Finn, Pieter Abbeel, Sergey Levine), industry researchers (Jim Fan at NVIDIA, Pete Florence at Google DeepMind), and a smaller but growing cohort of practitioners who are building and deploying systems in production. The latter group is underrepresented on the conference circuit relative to their value to a practitioner-focused community.",
    trends: [
      "Foundation model researchers (previously NLP-focused) increasingly speaking on embodied AI and robot learning",
      "NVIDIA researchers (Jim Fan, Linxi Fan, Yuke Zhu) very active on social media and conference circuits — strong amplification potential",
      "Practitioners from logistics and warehouse automation (Covariant, Machina Labs, Apptronik) getting more speaking slots",
      "International speakers from Chinese robotics unicorns (Unitree, AgileX) gaining visibility at global venues",
    ],
    gaps: [
      "Few speakers bridging digital twin methodology and robot learning — the cross-domain gap is visible on stage too",
      "Safety and reliability engineers from autonomous vehicle and industrial robot deployments are rarely platformed",
      "Academic researchers in formal verification, control theory, and robot planning are underrepresented vs. ML-heavy speakers",
      "No curated 'emerging voices' program for early-career researchers and engineers who are doing standout work",
    ],
    recommendations: [
      "Build a speaker database of 50+ Physical AI practitioners and researchers with bios, talk history, and contact info",
      "Identify 5 'emerging voices' (PhDs, early-career engineers) doing standout Physical AI work and feature them in a dedicated series",
      "Reach out to 3 practitioners from manufacturing/logistics deployments for AMA-style community sessions",
      "Coordinate with NVIDIA DevRel to co-promote speakers from the Isaac/Omniverse ecosystem who are doing public talks",
    ],
    focusAreas: [
      "Practitioner speakers from real deployments — highest community value, lowest current representation",
      "Emerging voices program — builds loyalty with next generation and creates content differentiation",
    ],
    urgentWatch:
      "Jim Fan's public roadmap communications around GROOT and foundation models — signal for where NVIDIA is heading and major amplification opportunity",
    lastUpdated: "May 2026",
  },

  podcasts: {
    summary:
      "The podcast landscape for Physical AI is thin but growing: Robot Brains (Pieter Abbeel), The Robot Report Podcast, and Lex Fridman remain the most-listened general robotics shows. Specialized shows on autonomous vehicles (Autonocast, Self-Driving Cars with Lernous) have steady audiences. There is a clear gap for a practitioner-focused Physical AI podcast that covers deployment, tooling, and the simulation-to-deployment pipeline in depth.",
    trends: [
      "Episode length trending shorter (30–45 min) for engineering-focused content vs. long-form philosophical discussions",
      "Video podcast format dominant — YouTube is now the primary discovery channel even for audio-first shows",
      "Cross-over episodes between robotics and LLM/AI podcasts increasing as embodied AI bridges the communities",
      "Founder-led startup podcasts covering Physical AI commercialization gaining audiences (1X Technologies, Figure AI founders)",
    ],
    gaps: [
      "No podcast specifically covering the OpenUSD and digital twin ecosystem for technical practitioners",
      "Edge AI inference and embedded systems content almost absent from existing robotics shows",
      "Non-English Physical AI podcasts are not tracked or surfaced to the community",
      "Practitioner case studies (how a real deployment was built and what failed) are rare across all shows",
    ],
    recommendations: [
      "Curate a 'Physical AI Podcast Starter Pack' of 10 essential episodes across existing shows, published as a community resource",
      "Pilot a monthly 'Community Roundtable' audio/video session covering the month's top Physical AI developments — low production cost, high value",
      "Identify 5 episodes from non-obvious sources (industrial IoT, autonomous vehicles, edge AI shows) relevant to the community and cross-post to Discord",
      "Track new Physical AI podcast launches and feature them in the newsletter to support the ecosystem",
    ],
    focusAreas: [
      "Originating short-form audio/video roundtable content — fills a real gap and builds community habit",
      "Podcast discovery and curation — members want guidance on what to listen to, not just a list",
    ],
    urgentWatch:
      "Whether any major AI lab (Google DeepMind, OpenAI, NVIDIA) launches a dedicated robotics/Physical AI podcast — would quickly dominate the space",
    lastUpdated: "May 2026",
  },

  discord: {
    summary:
      "The NVIDIA Omniverse Discord is the primary managed community space, with strong engagement in Isaac Lab, Omniverse developer, and digital twin channels. Signal-to-noise ratio is high in technical channels but onboarding for new members is fragile — many arrive from conference demos or social media without a clear path to the right channel. Cross-channel discovery and structured weekly programming would meaningfully improve retention.",
    trends: [
      "Isaac Lab channel activity growing fastest — reflects broader community shift toward GPU-accelerated RL training",
      "OpenUSD questions appearing in general channels from members who discovered the format through non-NVIDIA contexts",
      "Members self-organizing study groups around specific papers (Diffusion Policy, π0, GROOT) — organic learning cohorts forming",
      "Voice channel usage for weekly office hours proving more engaging than text-only Q&A for complex technical questions",
    ],
    gaps: [
      "No structured onboarding flow — new members drop into #general without guidance to specialized channels",
      "Cross-pollination between robotics, digital twin, and edge AI channels is minimal despite significant topic overlap",
      "Community showcase content (member projects, deployments, experiments) is ad hoc and gets buried quickly",
      "Non-English member engagement is low despite international community interest — no localization or multilingual support",
    ],
    recommendations: [
      "Design a 3-step onboarding flow with a welcome bot that routes new members to relevant channels based on self-identified role (researcher, engineer, student, enterprise)",
      "Launch a weekly #showcase-friday channel for members to share projects — pins top entries and drives retention",
      "Create a #resources-isaac-lab channel with pinned setup guides, common error resolutions, and a curated tutorial list",
      "Host a monthly cross-channel 'town hall' voice session covering activity highlights and upcoming events across all Physical AI domains",
    ],
    focusAreas: [
      "Onboarding experience redesign — reduces churn for the members who are most valuable (new practitioners exploring the ecosystem)",
      "Structured weekly programming — office hours, showcases, reading groups — to build habit and increase DAU/WAU ratio",
    ],
    urgentWatch:
      "Member retention after the first 7 days — current drop-off is likely high given absence of structured onboarding; instrument this now before community scales further",
    lastUpdated: "May 2026",
  },

  papers: {
    summary:
      "arXiv cs.RO and cs.LG are the primary paper sources, with roughly 30–50 Physical AI-relevant preprints per week during peak periods. The signal-to-noise ratio is dropping as the space attracts more submissions, making curation a genuine community service. HuggingFace Papers and Papers With Code are increasingly the discovery layer that practitioners use rather than raw arXiv feeds.",
    trends: [
      "Vision-language-action (VLA) models dominating the robot learning paper landscape — RT-2 successors multiplying rapidly",
      "Synthetic data generation for robotics (domain randomization, procedural scene generation with OpenUSD) growing as a sub-field",
      "Hardware co-design papers emerging — joint optimization of robot morphology and learning policy gaining traction",
      "Benchmarks and evaluation frameworks for generalist robot policies becoming a research area in their own right",
    ],
    gaps: [
      "Industrial robotics and manufacturing-focused papers receive far less community attention than research-lab demos despite higher deployment relevance",
      "Papers on failure modes, safety, and out-of-distribution robustness are underrepresented in community discussions",
      "Reproducibility papers and negative results are rarely surfaced — community gets a skewed view of the frontier",
      "Conference papers (vs. arXiv preprints) from ICRA, IROS, and CoRL are not systematically tracked in community resources",
    ],
    recommendations: [
      "Launch a weekly 'Paper of the Week' featuring one deep-dive with structured summary (problem, method, results, what it means for practitioners) — target 800-word format",
      "Create a 'Physical AI Reading List' on HuggingFace or a public Notion page, organized by domain, updated monthly",
      "Build a lightweight arXiv monitoring workflow (RSS + keyword filtering) for the 7 core domains and pipe daily summaries to a Discord channel",
      "Surface one 'industry-relevant' paper per week specifically chosen for deployment implications rather than benchmark performance",
    ],
    focusAreas: [
      "Weekly paper curation with practitioner-oriented commentary — highest leverage content for technical community members",
      "Reproducibility and tooling papers — undervalued by community but high signal for practitioners who need reliable methods",
    ],
    urgentWatch:
      "Any preprint from NVIDIA Research on GROOT N1 follow-on work or from Google DeepMind on RT-X successors — will set the research agenda for the community for months",
    lastUpdated: "May 2026",
  },

  influencers: {
    summary:
      "Physical AI influence is concentrated among a small cohort of researcher-practitioners who are active on X/Twitter and LinkedIn: Jim Fan, Pieter Abbeel, Chelsea Finn, Sergey Levine, and Pete Florence collectively drive a large fraction of community discourse. A second tier of 20–30 active voices (PhD students, startup founders, engineers) is where the freshest signal lives and where community building efforts have the highest leverage.",
    trends: [
      "LinkedIn surpassing X/Twitter as the primary distribution channel for Physical AI content reaching industry practitioners",
      "Short-form video demos on LinkedIn and YouTube Shorts outperforming text posts for robot learning content",
      "PhD students and postdocs building significant audiences by posting research in accessible formats — influential with peers",
      "Startup founders (1X, Figure, Apptronik, Covariant) increasingly posting technical content to attract engineering talent",
    ],
    gaps: [
      "Industrial robotics practitioners with deployment experience are underrepresented in the influencer landscape vs. research lab voices",
      "Women researchers and engineers doing Physical AI work are not amplified proportionally to their output and expertise",
      "Edge AI and embedded systems practitioners have almost no social media presence despite growing importance",
      "International voices (especially Japanese, Korean, German robotics researchers) are barely visible in English-language discourse",
    ],
    recommendations: [
      "Build a 'Physical AI 50' list of top influencers with monthly engagement tracking — use as editorial calendar input",
      "Create a 'Spotlight' series amplifying underrepresented voices: women in robotics, international researchers, practitioners in industry",
      "Develop a consistent re-share and commentary strategy for top-tier influencer posts to build reciprocal relationships",
      "Identify 10 'rising voices' (under 5K followers) doing standout work and feature them monthly to build loyalty and differentiation",
    ],
    focusAreas: [
      "Rising voices program — highest leverage for community differentiation and building relationships before they become hard to reach",
      "LinkedIn as primary channel — audience skews more practitioner and enterprise than X/Twitter, better fit for this community",
    ],
    urgentWatch:
      "Jim Fan's X/Twitter and LinkedIn cadence around GTC announcements — his posts reliably drive community discussion spikes and are the best amplification opportunities in the ecosystem",
    lastUpdated: "May 2026",
  },

  meetups: {
    summary:
      "Physical AI meetups are concentrated in a handful of cities: San Francisco Bay Area, Boston, Seattle, Austin, and London. Meetup quality varies widely — the best events (organized around CMU Robotics Institute, Stanford HAI, and MIT CSAIL alumni) have strong technical content and community retention; many others are thinly disguised recruiting events. Virtual meetup infrastructure from the COVID era has mostly been abandoned, leaving a gap for distributed community members.",
    trends: [
      "Hackathon format gaining popularity for Physical AI — LeRobot hackathons, Isaac Lab challenges, and CARLA autonomous driving challenges driving engagement",
      "University lab open houses attracting broader community beyond academics — practical exposure to real hardware",
      "Company-hosted technical meetups (NVIDIA, Boston Dynamics, Covariant) scaling as recruiting and brand-building tools",
      "Online hackathons with real hardware prizes (Jetson Orin, SO-ARM100 kits) proving effective for global participation",
    ],
    gaps: [
      "No regular meetup series outside the Bay Area and Boston — enormous geographic gap for a global technology",
      "Virtual meetup formats have not kept pace with quality of in-person events — remote participation feels second-class",
      "Student and early-career meetup pathways are absent — students face high barriers to entering practitioner networks",
      "Hardware access remains a barrier for many community members who want to participate in hands-on hackathons",
    ],
    recommendations: [
      "Partner with 3–5 university robotics labs in non-Bay-Area cities (Atlanta, Pittsburgh, Toronto, Berlin) to co-host local Physical AI meetups in Q3",
      "Design a virtual hackathon format with remote hardware (Jetson cloud instances, simulated environments in Isaac Lab) that delivers hands-on experience globally",
      "Create a 'Meetup Starter Kit' — slide templates, speaker coordination guide, sponsorship pitch — to lower the barrier for community members to start local chapters",
      "Launch a quarterly online 'Physical AI Build Night' with a specific challenge (train a policy in Isaac Lab, deploy on Jetson, build a USD scene) to drive global participation",
    ],
    focusAreas: [
      "Hackathon programming — highest engagement format for practitioners and strongest pipeline to active community members",
      "Geographic expansion beyond Bay Area and Boston — captures latent community that currently has no home",
    ],
    urgentWatch:
      "Hugging Face's LeRobot hackathon series cadence — they are ahead on hackathon format and could establish the default community gathering point if not matched",
    lastUpdated: "May 2026",
  },

  stories: {
    summary:
      "Community storytelling is the weakest area of the hub: most content is technical reference or event announcements rather than narrative-driven stories about people building Physical AI systems. The highest-performing content across comparable communities tells the story of a person, a project, or a problem — not a technology. There is substantial raw material in the community (project showcases, AMA threads, conference talks) that has not been shaped into shareable stories.",
    trends: [
      "Founder and researcher origin stories performing well across LinkedIn and Substack — audience appetite for 'how we built this' narratives",
      "Short-form video case studies (2–4 min, showing hardware in motion) consistently outperform text on all platforms",
      "Community member spotlights driving strong engagement when they focus on journey and obstacle-solving vs. credential listing",
      "Deployment stories from practitioners — especially honest about failures — getting high engagement and trust signals",
    ],
    gaps: [
      "No structured process for identifying and developing community member stories — they surface ad hoc or not at all",
      "Failure and lesson-learned stories are almost entirely absent — the community only sees polished successes",
      "Stories from outside the US and Europe (India, China, Japan, Brazil robotics scenes) are not represented",
      "Long-form technical project narratives (e.g., building a manipulation system from scratch over 6 months) are not being produced",
    ],
    recommendations: [
      "Launch a 'Builder Spotlight' monthly feature: a 600-word profile of a community member with a project in progress — specific, honest, not a press release",
      "Create a 'Lessons Learned' story format: structured interviews with practitioners about a specific failure or setback and what they changed",
      "Build a story sourcing pipeline — a simple form in Discord and the newsletter asking members to nominate themselves or others for spotlight coverage",
      "Produce one long-form 'How We Built This' case study per quarter: a full project narrative from problem definition through deployment, told as journalism",
    ],
    focusAreas: [
      "Builder Spotlight series — low production cost, high community value, strong retention and discovery driver",
      "Failure and lessons-learned content — rare, trusted, and highly shareable across the Physical AI practitioner audience",
    ],
    urgentWatch:
      "Whether competing communities (HuggingFace, Weights & Biases) launch practitioner storytelling series — first mover in this format builds durable audience loyalty",
    lastUpdated: "May 2026",
  },
};

// ---------------------------------------------------------------------------
// Monthly Intelligence — May 2026
// ---------------------------------------------------------------------------

export interface MonthlySection {
  id: string;
  title: string;
  icon: string;
  score: number;
  headline: string;
  wins: string[];
  gaps: string[];
  actions: string[];
  priority: "high" | "medium" | "low";
}

export const MONTHLY_SECTIONS: MonthlySection[] = [
  {
    id: "topics",
    title: "Hot Topics",
    icon: "🔥",
    score: 78,
    headline:
      "Sim-to-real transfer and VLA models are dominating discourse — the community wants practitioner signal, not just research papers.",
    wins: [
      "Isaac Lab adoption accelerating — strong search and Discord traffic for setup tutorials and RL training guides",
      "OpenUSD narrative gaining ground outside Omniverse; community members discovering it through non-NVIDIA contexts",
      "Diffusion Policy and π0 generating genuine technical debate, not just hype — a sign of community maturity",
    ],
    gaps: [
      "Deployment and production content is almost absent — community skews heavily toward research-stage discussion",
      "Safety, reliability, and failure mode content is a major blind spot across all topic areas",
    ],
    actions: [
      "Publish a 'Practitioner's Guide to Isaac Lab Sim-to-Real' with documented failure modes and workarounds",
      "Commission a 'State of OpenUSD for Robotics Engineers' explainer targeting non-Omniverse users",
      "Add a weekly 'Deployment Signal' roundup to the newsletter covering real-world Physical AI in production",
    ],
    priority: "high",
  },
  {
    id: "communities",
    title: "Communities",
    icon: "🏘️",
    score: 61,
    headline:
      "The Physical AI community landscape is fragmented and no hub owns the identity — a clear opportunity to establish leadership.",
    wins: [
      "Omniverse Discord technical channels maintain high signal quality and expert engagement",
      "Cross-community relationships forming organically with LeRobot and HuggingFace ecosystems",
    ],
    gaps: [
      "No systematic presence in key adjacent communities (LeRobot Discord, Robotics Worldwide, r/robotics)",
      "Industry practitioner audiences (manufacturing, logistics, healthcare robotics) are unreached",
    ],
    actions: [
      "Establish an official presence in LeRobot Discord — introduce the hub, cross-post content, attend community events",
      "Map the top 15 Physical AI community spaces with audience size, activity, and fit score",
      "Identify and invite 5 manufacturing/logistics practitioners to join the community as 'industry anchors'",
    ],
    priority: "high",
  },
  {
    id: "conferences",
    title: "Events",
    icon: "📅",
    score: 70,
    headline:
      "ICRA 2026 is happening now — this is the highest-value week of the year for Physical AI content and community presence.",
    wins: [
      "Conference calendar coverage for ICRA, CoRL, and GTC is solid",
      "NVIDIA GTC recap content performed well and set a template for future event coverage",
    ],
    gaps: [
      "CFP deadline tracking is reactive — community members missed ICRA workshop submissions in February",
      "Post-conference synthesis content has not been produced for any major event yet this year",
    ],
    actions: [
      "Publish ICRA 2026 daily highlights from Rotterdam via LinkedIn and Discord this week",
      "Produce a post-ICRA synthesis post covering top papers, demos, and debates within 2 weeks of the conference",
      "Build a CFP deadline calendar for H2 2026 (CoRL, NeurIPS, IROS workshops) and publish it as a community resource",
    ],
    priority: "high",
  },
  {
    id: "speakers",
    title: "Speakers",
    icon: "🎙️",
    score: 65,
    headline:
      "Strong research speaker pipeline but practitioner voices are missing — the biggest gap in the speaker roster.",
    wins: [
      "Strong relationships with NVIDIA Research speakers (Jim Fan, Linxi Fan) for AMA and livestream sessions",
      "Academic PI pipeline (Chelsea Finn, Pieter Abbeel network) well-developed through conference relationships",
    ],
    gaps: [
      "No practitioners from manufacturing or logistics deployments in the speaker pipeline",
      "No emerging voices program for early-career researchers — speaker roster skews toward established names",
    ],
    actions: [
      "Build a speaker database of 50 Physical AI voices with bios, talk history, contact info, and availability notes",
      "Reach out to 3 engineers at Covariant, Machina Labs, or Apptronik for a practitioner AMA in June",
      "Identify and feature 3 early-career researchers (PhD students, postdocs) doing standout work for a May/June spotlight",
    ],
    priority: "medium",
  },
  {
    id: "podcasts",
    title: "Podcasts",
    icon: "🎧",
    score: 55,
    headline:
      "Podcast coverage is light and opportunity is clear — the Physical AI practitioner podcast niche is wide open.",
    wins: [
      "Robot Brains and The Robot Report Podcast tracked and regularly surfaced to the community",
      "Cross-over episodes with AI/ML podcasts identified and shared when Physical AI content appears",
    ],
    gaps: [
      "No original community audio/video content — entirely dependent on third-party shows",
      "Edge AI, embedded systems, and OpenUSD topics have no podcast coverage to reference",
    ],
    actions: [
      "Pilot a monthly 30-minute 'Physical AI Roundtable' video session with 3 community members — post to YouTube and Discord",
      "Publish a curated 'Physical AI Podcast Starter Pack' of 10 essential episodes with annotations for each domain",
      "Track and feature 2 new Physical AI podcast episodes per week in the newsletter with 2-sentence summaries",
    ],
    priority: "medium",
  },
  {
    id: "discord",
    title: "Discord",
    icon: "💬",
    score: 68,
    headline:
      "Active technical channels but onboarding is broken — new members are dropping off before finding value.",
    wins: [
      "Isaac Lab and Omniverse developer channels consistently high-quality with expert answers to technical questions",
      "Voice channel office hours proving more engaging than text-only Q&A for complex technical topics",
    ],
    gaps: [
      "No structured onboarding — new members arrive in #general with no guidance to relevant channels",
      "Community showcase content gets buried with no dedicated space or recurring cadence",
    ],
    actions: [
      "Design and deploy a 3-step onboarding flow: welcome bot with role selection routing to relevant channels",
      "Launch #showcase-friday as a pinned recurring channel for member project sharing",
      "Create a #resources-isaac-lab channel with pinned setup guides and curated tutorials — pin it in the onboarding flow",
    ],
    priority: "high",
  },
  {
    id: "papers",
    title: "Papers",
    icon: "📄",
    score: 72,
    headline:
      "Paper volume is high but curation is weak — members want signal, not firehose.",
    wins: [
      "arXiv monitoring workflow in place for cs.RO and cs.LG — key papers surfaced within 24–48 hours of publication",
      "HuggingFace Papers integration provides a second discovery layer and social engagement signal",
    ],
    gaps: [
      "No practitioner-oriented paper commentary — papers shared without context about what they mean for deployment",
      "Conference papers from ICRA, IROS, and CoRL not systematically tracked alongside preprints",
    ],
    actions: [
      "Launch 'Paper of the Week' feature: one deep-dive with problem/method/results/practitioner implications — 800 words, weekly cadence",
      "Build a Physical AI Reading List on HuggingFace organized by domain (Robotics, Digital Twins, Edge AI, etc.) — publish by end of May",
      "Add conference paper tracking to the monitoring workflow — ICRA 2026 proceedings are releasing now",
    ],
    priority: "medium",
  },
  {
    id: "influencers",
    title: "Influencers",
    icon: "📣",
    score: 74,
    headline:
      "Good awareness of top-tier influencers but no systematic amplification strategy or rising-voices program.",
    wins: [
      "Jim Fan, Linxi Fan, and Yuke Zhu relationships active — content regularly surfaced and amplified",
      "LinkedIn identified as higher-value channel than X/Twitter for practitioner audience reach",
    ],
    gaps: [
      "No rising voices program — missing the cohort of 20–30 active voices who will be tomorrow's top influencers",
      "International and underrepresented voices are not systematically amplified",
    ],
    actions: [
      "Build 'Physical AI 50' list with monthly engagement tracking — complete by end of May",
      "Identify 10 rising voices (under 5K followers, high technical quality) and launch a monthly spotlight feature",
      "Develop a re-share and commentary playbook for top-tier influencer posts — 3–5 posts per week with added community context",
    ],
    priority: "medium",
  },
  {
    id: "meetups",
    title: "Meetups & Hackathons",
    icon: "🤝",
    score: 58,
    headline:
      "Hackathon format is the strongest engagement lever — needs investment to match what LeRobot is building.",
    wins: [
      "NVIDIA-hosted Isaac Lab challenge attracted strong participation and generated quality community content",
      "University lab partnerships emerging in Boston (MIT, Northeastern) for co-hosted events",
    ],
    gaps: [
      "No meetup presence outside Bay Area and Boston — enormous geographic coverage gap",
      "Virtual hackathon format for global community members not yet developed",
    ],
    actions: [
      "Design a virtual hackathon format using Isaac Lab cloud instances — launch June or July with a specific policy training challenge",
      "Publish a 'Meetup Starter Kit' for community members to launch local chapters — targeting 3 new cities by Q3",
      "Partner with 2 European university robotics labs (ETH Zurich, TU Berlin) for co-hosted Physical AI meetups in Q3",
    ],
    priority: "medium",
  },
  {
    id: "stories",
    title: "Community Stories",
    icon: "📖",
    score: 45,
    headline:
      "Stories are the weakest area — the community has compelling people and projects but no pipeline to surface them.",
    wins: [
      "AMA format producing strong raw material — direct quotes and project details that can be developed into stories",
      "Member showcase posts in Discord occasionally surface compelling project narratives worth developing",
    ],
    gaps: [
      "No structured story sourcing process — interesting people and projects go undiscovered",
      "Failure and lessons-learned stories are entirely absent — all content is success-framed",
    ],
    actions: [
      "Launch 'Builder Spotlight' monthly series in May: 600-word profile of a community member with a project in progress",
      "Add a story nomination form to Discord and the newsletter — 'Know someone doing interesting Physical AI work? Tell us.'",
      "Commission one 'Lessons Learned' interview in May with a practitioner willing to discuss a specific failure and what changed",
    ],
    priority: "high",
  },
];

export const MONTHLY_SUMMARY = {
  month: "May 2026",
  overallScore: 67,
  headline:
    "ICRA week is here — the community has momentum but storytelling and onboarding are leaving value on the table.",
  topOpportunity:
    "ICRA 2026 Rotterdam is happening this week: first-mover daily highlights content, practitioner interviews on the ground, and a post-conference synthesis post will drive the highest organic reach of the year and establish the hub as the Physical AI conference intelligence source.",
  topRisk:
    "Hugging Face's LeRobot community is growing faster than any other Physical AI hub — if they launch structured programming (hackathons, weekly paper reads, showcase events) before this community does, they will own practitioner loyalty and be very hard to displace.",
  bigBets: [
    "Isaac Lab content series: sim-to-real tutorials, failure mode guides, and policy training walkthroughs — highest practitioner demand in the ecosystem right now",
    "Hackathon program: invest in a virtual Isaac Lab challenge format that can serve the global community, not just Bay Area attendees",
    "Builder Spotlight storytelling series: a consistent monthly feature that surfaces real people and projects will build the durable audience identity no other Physical AI community has",
  ],
  quickWins: [
    "Post ICRA 2026 Day 1 highlights to LinkedIn and Discord today — high reach, low effort, immediate community signal",
    "Deploy the Discord onboarding bot with role-selection routing this week — stops new member churn immediately",
    "Publish the 'Physical AI Conference Calendar H2 2026' with CFP deadlines — evergreen resource, high SEO value, takes one afternoon to build",
  ],
};
