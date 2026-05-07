export type HotTopicPriorityTier = 'must-win' | 'move-now' | 'monitor' | 'archive';

export interface HotTopicPriorityInput {
  topic?: string;
  description?: string;
  buzzScore?: number;
  trend?: 'rising' | 'stable' | 'falling';
  productTags?: string[];
  sectorTags?: string[];
  signalCount?: number;
  confidence?: number;
  whatPeopleAreSaying?: string;
  whyItMatters?: string;
  nvidiaRelevance?: string;
  recommendedAction?: string;
}

export interface HotTopicPriorityResult {
  priorityScore: number;
  priorityTier: HotTopicPriorityTier;
  priorityReason: string;
  influenceRisk: string;
}

const PRIORITY_LANES = [
  {
    label: 'Cosmos / world models',
    weight: 34,
    terms: ['cosmos', 'world model', 'world foundation model', 'foundation model', 'physical reasoning', 'synthetic data', 'sim-to-real', 'gr00t', 'groot', 'vla'],
  },
  {
    label: 'Robotics',
    weight: 30,
    terms: ['robot', 'robotics', 'humanoid', 'manipulation', 'locomotion', 'embodied', 'isaac sim', 'isaac lab', 'isaac ros', 'jetson', 'newton', 'ros'],
  },
  {
    label: 'OpenUSD',
    weight: 26,
    terms: ['openusd', 'open usd', 'omniverse', 'usd', 'universal scene description', 'hydra', 'usd composer'],
  },
  {
    label: 'Industrial digital twins',
    weight: 26,
    terms: ['industrial digital twin', 'digital twin', 'industrial', 'manufacturing', 'factory', 'warehouse', 'metropolis', 'siemens', 'abb', 'rockwell', 'predictive maintenance'],
  },
];

const INFLUENCE_RISK_TERMS = [
  'benchmark',
  'standard',
  'open source',
  'ecosystem',
  'developer',
  'framework',
  'platform',
  'paper',
  'release',
  'safety',
  'simulation',
  'workflow',
];

export function clampPriorityScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function priorityText(topic: HotTopicPriorityInput): string {
  return [
    topic.topic,
    topic.description,
    topic.whatPeopleAreSaying,
    topic.whyItMatters,
    topic.nvidiaRelevance,
    topic.recommendedAction,
    topic.productTags?.join(' '),
    topic.sectorTags?.join(' '),
  ].filter(Boolean).join(' ').toLowerCase();
}

export function scoreHotTopicPriority(topic: HotTopicPriorityInput): HotTopicPriorityResult {
  const text = priorityText(topic);
  const matchedLanes = PRIORITY_LANES
    .map(lane => ({
      ...lane,
      hits: lane.terms.filter(term => text.includes(term)),
    }))
    .filter(lane => lane.hits.length > 0);
  const strategicFit = Math.min(45, matchedLanes.reduce((sum, lane) => sum + Math.min(lane.weight, 12 + lane.hits.length * 5), 0));
  const buzz = Number(topic.buzzScore ?? 50);
  const momentum = Math.min(18, (buzz / 100) * 12 + Math.min(Number(topic.signalCount ?? 0), 8) * 0.75);
  const riskHits = INFLUENCE_RISK_TERMS.filter(term => text.includes(term));
  const influenceRiskScore = Math.min(20, riskHits.length * 3 + matchedLanes.length * 3);
  const urgency = topic.trend === 'rising' ? 10 : topic.trend === 'stable' ? 5 : 1;
  const confidenceBoost = Math.min(7, Number(topic.confidence ?? 60) / 100 * 7);
  const priorityScore = clampPriorityScore(strategicFit + momentum + influenceRiskScore + urgency + confidenceBoost);
  const priorityTier: HotTopicPriorityTier =
    priorityScore >= 85 ? 'must-win' :
      priorityScore >= 70 ? 'move-now' :
        priorityScore >= 50 ? 'monitor' :
          'archive';
  const laneLabels = matchedLanes.map(lane => lane.label);
  const priorityReason = laneLabels.length > 0
    ? `Matches ${laneLabels.join(', ')} with ${topic.trend ?? 'stable'} momentum and ${Math.round(buzz)} buzz.`
    : 'Lower strategic fit for the priority lanes; monitor unless the evidence strengthens.';
  const influenceRisk = priorityTier === 'must-win'
    ? `Missing this could let another ecosystem define the developer narrative, benchmarks, or standards around ${laneLabels[0] ?? 'Physical AI'}.`
    : priorityTier === 'move-now'
      ? 'Late response could cost influence with developers currently choosing tools, workflows, or community venues.'
      : priorityTier === 'monitor'
        ? 'Keep watching for stronger evidence before committing campaign energy.'
        : 'Archive unless it resurfaces with stronger priority-lane evidence.';

  return { priorityScore, priorityTier, priorityReason, influenceRisk };
}
