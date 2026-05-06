import { useState, useMemo } from 'react';
import {
  Search, Play, Clock, Eye, Globe, ChevronRight, Star,
  ExternalLink, Filter, X, BarChart3, BookOpen, Zap,
  Download, ChevronDown, FileSpreadsheet, FileDown,
} from 'lucide-react';
import { NvidiaProduct, NVIDIA_PRODUCT_LABELS } from '../types/story';
import { Region, REGION_META } from '../types/community';
import { exportToExcel, exportToPDF } from '../lib/exportUtils';
import clsx from 'clsx';

// ─── Types ─────────────────────────────────────────────────────────────────────

type VideoLevel = 'beginner' | 'intermediate' | 'advanced';
type ChannelType = 'nvidia-official' | 'open-source' | 'university' | 'independent';
type SortOption = 'featured' | 'newest' | 'most-viewed' | 'shortest' | 'longest';

interface Video {
  id: string;
  title: string;
  channel: string;
  channelUrl: string;
  videoUrl: string;
  youtubeId: string;              // real YouTube ID for thumbnails where available, else '' for gradient fallback
  channelType: ChannelType;
  country: string;
  region: Region;
  product: NvidiaProduct;
  level: VideoLevel;
  durationMinutes: number;
  views: number;
  publishedDate: string;
  description: string;
  tags: string[];
  isFeatured?: boolean;
  nvidiaRelevance: 'core' | 'high' | 'medium';
  /** Recommend amplifying this non-NVIDIA creator video */
  shouldPromote?: boolean;
  promotionReason?: string;
  socialCopy?: {
    x: string;
    linkedin: string;
  };
}

// ─── Data ──────────────────────────────────────────────────────────────────────
// Distribution targets:
//   Region  — Americas 40% (12), APAC 25% (7-8), EMEA 25% (7-8), Global/Online 10% (3)
//   Level   — Beginner 10, Intermediate 12, Advanced 8
//   NVIDIA Official channel — max 8 entries

const VIDEOS: Video[] = [

  // ── Americas (12) ──────────────────────────────────────────────────────────

  // NVIDIA Developer official (8 total limit — all in Americas)
  {
    id: 'nv-01',
    title: 'Getting Started with Isaac Lab: Robot Learning in 60 Minutes',
    channel: 'NVIDIA Developer',
    channelUrl: 'https://www.youtube.com/@NVIDIADeveloper',
    videoUrl: 'https://www.youtube.com/watch?v=O5BHJL0I23g',
    youtubeId: 'O5BHJL0I23g',
    channelType: 'nvidia-official',
    country: 'USA',
    region: 'americas',
    product: 'isaac-lab',
    level: 'beginner',
    durationMinutes: 62,
    views: 87400,
    publishedDate: '2026-03-12',
    description: 'End-to-end walkthrough of Isaac Lab — install, environment setup, first RL policy training, and sim-to-real transfer basics. Perfect starting point for developers new to NVIDIA robotics.',
    tags: ['isaac-lab', 'reinforcement-learning', 'setup', 'python'],
    isFeatured: true,
    nvidiaRelevance: 'core',
  },
  {
    id: 'nv-02',
    title: 'GR00T N1 Technical Deep Dive: Architecture and Training',
    channel: 'NVIDIA Developer',
    channelUrl: 'https://www.youtube.com/@NVIDIADeveloper',
    videoUrl: 'https://www.youtube.com/watch?v=A8DPl4v5GEo',
    youtubeId: 'A8DPl4v5GEo',
    channelType: 'nvidia-official',
    country: 'USA',
    region: 'americas',
    product: 'groot',
    level: 'advanced',
    durationMinutes: 75,
    views: 112000,
    publishedDate: '2026-04-02',
    description: 'NVIDIA researchers walk through the GR00T N1 foundation model — transformer architecture, multi-modal input tokenization, cross-embodiment training data, and action decoding strategies.',
    tags: ['groot', 'foundation-model', 'humanoid', 'architecture'],
    isFeatured: true,
    nvidiaRelevance: 'core',
  },
  {
    id: 'nv-03',
    title: 'Cosmos World Foundation Models: From Theory to Practice',
    channel: 'NVIDIA Developer',
    channelUrl: 'https://www.youtube.com/@NVIDIADeveloper',
    videoUrl: 'https://www.youtube.com/watch?v=nJMRoAdqFyk',
    youtubeId: 'nJMRoAdqFyk',
    channelType: 'nvidia-official',
    country: 'USA',
    region: 'americas',
    product: 'cosmos',
    level: 'advanced',
    durationMinutes: 90,
    views: 95300,
    publishedDate: '2026-01-20',
    description: 'A comprehensive technical tutorial on using NVIDIA Cosmos to generate physically plausible synthetic data for robot training — tokenization, world prediction, and downstream fine-tuning.',
    tags: ['cosmos', 'world-model', 'synthetic-data', 'video-generation'],
    isFeatured: true,
    nvidiaRelevance: 'core',
  },
  {
    id: 'nv-04',
    title: 'Isaac ROS 3.0: Building Production-Ready Robot Pipelines',
    channel: 'NVIDIA Developer',
    channelUrl: 'https://www.youtube.com/@NVIDIADeveloper',
    videoUrl: 'https://www.youtube.com/watch?v=Kp7EMFrK6VY',
    youtubeId: 'Kp7EMFrK6VY',
    channelType: 'nvidia-official',
    country: 'USA',
    region: 'americas',
    product: 'isaac-ros',
    level: 'intermediate',
    durationMinutes: 55,
    views: 42100,
    publishedDate: '2026-03-05',
    description: 'Hands-on tutorial building a complete perception-to-action pipeline with Isaac ROS 3.0 — cuVS stereo depth, cuDNN object detection, and cuMotion trajectory planning on Jetson.',
    tags: ['isaac-ros', 'ros2', 'jetson', 'perception', 'navigation'],
    nvidiaRelevance: 'core',
  },
  {
    id: 'nv-05',
    title: 'Jetson Orin for Edge Robotics: Deployment Guide',
    channel: 'NVIDIA Developer',
    channelUrl: 'https://www.youtube.com/@NVIDIADeveloper',
    videoUrl: 'https://www.youtube.com/watch?v=uZ6uEOr9Zvw',
    youtubeId: 'uZ6uEOr9Zvw',
    channelType: 'nvidia-official',
    country: 'USA',
    region: 'americas',
    product: 'jetson',
    level: 'beginner',
    durationMinutes: 44,
    views: 58700,
    publishedDate: '2026-02-10',
    description: 'Step-by-step setup of Jetson Orin for production robotics — JetPack 6.2 install, TensorRT model optimization, ROS 2 Humble integration, and power/thermal profiling.',
    tags: ['jetson', 'edge-ai', 'tensorrt', 'jetpack', 'ros2'],
    nvidiaRelevance: 'core',
  },
  {
    id: 'nv-06',
    title: 'OpenUSD for Robotics: Building Semantic Scene Graphs',
    channel: 'NVIDIA Developer',
    channelUrl: 'https://www.youtube.com/@NVIDIADeveloper',
    videoUrl: 'https://www.youtube.com/watch?v=QH2-TGUlwu4',
    youtubeId: 'QH2-TGUlwu4',
    channelType: 'nvidia-official',
    country: 'USA',
    region: 'americas',
    product: 'omniverse',
    level: 'intermediate',
    durationMinutes: 68,
    views: 31500,
    publishedDate: '2026-01-08',
    description: 'How to construct semantically rich USD scene graphs for robot simulation — prim hierarchies, physics schemas, material binding, and bridging to Isaac Sim for training.',
    tags: ['usd', 'omniverse', 'scene-building', 'physics', 'isaac-sim'],
    nvidiaRelevance: 'core',
  },
  {
    id: 'nv-07',
    title: 'Isaac Lab: Multi-Agent RL for Warehouse Robots',
    channel: 'NVIDIA Developer',
    channelUrl: 'https://www.youtube.com/@NVIDIADeveloper',
    videoUrl: 'https://www.youtube.com/watch?v=7Ow7gBqUzxk',
    youtubeId: '7Ow7gBqUzxk',
    channelType: 'nvidia-official',
    country: 'USA',
    region: 'americas',
    product: 'isaac-lab',
    level: 'advanced',
    durationMinutes: 82,
    views: 49800,
    publishedDate: '2026-04-18',
    description: 'Training cooperative multi-agent RL policies for mobile manipulation in a realistic warehouse environment — reward shaping, curriculum design, and sim-to-real results on a real AMR fleet.',
    tags: ['isaac-lab', 'multi-agent', 'rl', 'amr', 'warehouse'],
    nvidiaRelevance: 'core',
  },
  {
    id: 'nv-08',
    title: 'Isaac Sim 4.0: Sensor Simulation and ROS 2 Bridge',
    channel: 'NVIDIA Developer',
    channelUrl: 'https://www.youtube.com/@NVIDIADeveloper',
    videoUrl: 'https://www.youtube.com/watch?v=XlbM4OL2_hA',
    youtubeId: 'XlbM4OL2_hA',
    channelType: 'nvidia-official',
    country: 'USA',
    region: 'americas',
    product: 'isaac-sim',
    level: 'intermediate',
    durationMinutes: 48,
    views: 64200,
    publishedDate: '2026-02-28',
    description: 'Configure and publish lidar, RGB-D camera, and IMU sensor data from Isaac Sim 4.0 into a ROS 2 topic graph, with new RTX-based sensor fidelity improvements.',
    tags: ['isaac-sim', 'sensor-simulation', 'lidar', 'ros2', 'synthetic-data'],
    nvidiaRelevance: 'core',
  },
  {
    id: 'nv-49',
    title: 'Newton Physics Simulator: A Hands-On Tour for Roboticists',
    channel: 'NVIDIA Developer',
    channelUrl: 'https://www.youtube.com/@NVIDIADeveloper',
    videoUrl: 'https://www.youtube.com/watch?v=Lq7mqYzKi4M',
    youtubeId: 'Lq7mqYzKi4M',
    channelType: 'nvidia-official',
    country: 'USA',
    region: 'americas',
    product: 'newton',
    level: 'beginner',
    durationMinutes: 47,
    views: 38900,
    publishedDate: '2026-04-25',
    description: 'NVIDIA introduces Newton — the open-source GPU-native physics engine co-developed with Google DeepMind and Disney Research. Setup, articulation modeling, contact dynamics, and integration with MuJoCo Warp.',
    tags: ['newton', 'physics-simulation', 'mujoco', 'open-source', 'gpu'],
    isFeatured: true,
    nvidiaRelevance: 'core',
  },
  {
    id: 'nv-50',
    title: 'Cosmos Video-to-Action: Building a Closed-Loop Pipeline',
    channel: 'NVIDIA Developer',
    channelUrl: 'https://www.youtube.com/@NVIDIADeveloper',
    videoUrl: 'https://www.youtube.com/watch?v=vZ8qbkNK2_s',
    youtubeId: 'vZ8qbkNK2_s',
    channelType: 'nvidia-official',
    country: 'USA',
    region: 'americas',
    product: 'cosmos',
    level: 'advanced',
    durationMinutes: 71,
    views: 41200,
    publishedDate: '2026-04-30',
    description: 'Walkthrough of building a closed-loop video-to-action pipeline with NVIDIA Cosmos — predicting future video frames, decoding actions with a VLA head, and validating policies in Isaac Sim.',
    tags: ['cosmos', 'video-to-action', 'vla', 'closed-loop', 'isaac-sim'],
    nvidiaRelevance: 'core',
  },

  // Americas — independent / open-source (4)
  {
    id: 'am-09',
    title: 'LeRobot from Scratch: Build Your First Robot Learning Pipeline',
    channel: 'Hugging Face',
    channelUrl: 'https://www.youtube.com/@HuggingFace',
    videoUrl: 'https://www.youtube.com/watch?v=5iJGmCYD0ik',
    youtubeId: '5iJGmCYD0ik',
    channelType: 'open-source',
    country: 'USA',
    region: 'americas',
    product: 'jetson',
    level: 'beginner',
    durationMinutes: 72,
    views: 68900,
    publishedDate: '2026-03-01',
    description: 'Hugging Face\'s official LeRobot tutorial — dataset recording with a real SO-100 arm, ACT policy training, evaluation on a tabletop pick-and-place task, and publishing to the Hub.',
    tags: ['lerobot', 'imitation-learning', 'act', 'manipulation', 'so-100'],
    isFeatured: true,
    nvidiaRelevance: 'high',
    shouldPromote: true,
    promotionReason: 'Hugging Face + Jetson combo reaching 69K views — third-party credibility. Perfect for NVIDIA to repost with credit to show community momentum.',
    socialCopy: {
      x: '🤖 This @HuggingFace LeRobot tutorial on Jetson is exactly what the community is building. End-to-end: record → train → deploy on real hardware. 68K+ views and counting.\n\nThe open-source + NVIDIA stack is unstoppable 🔥\n\n👇',
      linkedin: 'Shoutout to the Hugging Face team for this incredible LeRobot tutorial — building a full robot learning pipeline from scratch, deployed on NVIDIA Jetson.\n\nThis is the kind of community content driving Physical AI adoption: practical, open-source, and globally accessible. 68K+ views in weeks.\n\nIf you\'re building with LeRobot or Jetson, this is required watching. Link in comments.',
    },
  },
  {
    id: 'am-10',
    title: 'LeRobot + Isaac Lab: The Best of Both Worlds',
    channel: 'RoboticsDeveloper',
    channelUrl: 'https://www.youtube.com/@RoboticsDeveloper',
    videoUrl: 'https://www.youtube.com/watch?v=BsXaX7hMEJo',
    youtubeId: 'BsXaX7hMEJo',
    channelType: 'independent',
    country: 'USA',
    region: 'americas',
    product: 'isaac-lab',
    level: 'intermediate',
    durationMinutes: 38,
    views: 27600,
    publishedDate: '2026-03-28',
    description: 'Combines Hugging Face LeRobot\'s imitation learning stack with Isaac Lab\'s parallel simulation — collect real demos, augment with sim data, and compare policy performance head-to-head.',
    tags: ['lerobot', 'isaac-lab', 'sim-to-real', 'manipulation', 'data-augmentation'],
    nvidiaRelevance: 'high',
    shouldPromote: true,
    promotionReason: 'Independent creator showing Isaac Lab + LeRobot integration in a single workflow. Strong engagement from both communities — sharing this bridges two major developer audiences.',
    socialCopy: {
      x: '💡 @RoboticsDeveloper nailed it: LeRobot imitation learning + Isaac Lab parallel sim in one pipeline.\n\nCollect real demos → augment in sim → compare policies head-to-head. This is how Physical AI development should look.\n\nFull tutorial 👇',
      linkedin: 'When two of the most popular open-source robotics stacks meet — this is what happens.\n\n@RoboticsDeveloper combined Hugging Face LeRobot\'s imitation learning with Isaac Lab\'s GPU-accelerated simulation into a single, clean workflow. Real demos + sim augmentation + policy comparison.\n\nThis is the kind of community-built content that pushes Physical AI forward. Watch the full tutorial in the comments.',
    },
  },
  {
    id: 'am-11',
    title: 'ROS 2 Navigation Stack + Isaac Sim: Complete Tutorial',
    channel: 'Chris Paxton',
    channelUrl: 'https://www.youtube.com/@ChrisPaxton',
    videoUrl: 'https://www.youtube.com/watch?v=idQb2pB-h2Q',
    youtubeId: 'idQb2pB-h2Q',
    channelType: 'independent',
    country: 'USA',
    region: 'americas',
    product: 'isaac-sim',
    level: 'intermediate',
    durationMinutes: 51,
    views: 19400,
    publishedDate: '2026-02-14',
    description: 'Senior robotics researcher walks through Nav2 integration with Isaac Sim — SLAM toolbox, costmaps, behavior trees, and bridging the gap between simulation and hardware in the loop.',
    tags: ['nav2', 'slam', 'ros2', 'isaac-sim', 'behavior-trees'],
    nvidiaRelevance: 'high',
    shouldPromote: true,
    promotionReason: 'Chris Paxton is a respected senior robotics researcher — his Nav2 + Isaac Sim walkthrough lends credibility and bridges the ROS and Isaac developer audiences.',
    socialCopy: {
      x: '🧭 @chris_j_paxton put together the Nav2 + Isaac Sim integration tutorial we\'ve all been waiting for.\n\nSLAM toolbox, costmaps, behavior trees, hardware-in-the-loop — it\'s all there.\n\nWorth your time 👇',
      linkedin: 'Chris Paxton has spent years at the frontier of robotics research, and his latest tutorial brings ROS 2 Nav2 and Isaac Sim together in a clean, reproducible workflow.\n\nFor anyone working on autonomous navigation with Physical AI tooling, this fills a real gap — covering SLAM, costmaps, behavior trees, and the sim-to-hardware loop. Link in comments.',
    },
  },
  {
    id: 'am-12',
    title: 'BAIR: Diffusion Policy for Dexterous Manipulation',
    channel: 'BAIR Lab Berkeley',
    channelUrl: 'https://www.youtube.com/@bairlabberkeley',
    videoUrl: 'https://www.youtube.com/watch?v=XeHD-Sw9Hkk',
    youtubeId: 'XeHD-Sw9Hkk',
    channelType: 'university',
    country: 'USA',
    region: 'americas',
    product: 'isaac-lab',
    level: 'advanced',
    durationMinutes: 56,
    views: 33800,
    publishedDate: '2026-01-30',
    description: 'BAIR Lab researchers present diffusion policy methods for fine-grained dexterous manipulation, covering score-based diffusion, action chunking, and GPU-parallel rollouts in Isaac Lab.',
    tags: ['diffusion-policy', 'manipulation', 'dexterous', 'action-chunking', 'bair'],
    nvidiaRelevance: 'high',
    shouldPromote: true,
    promotionReason: 'BAIR is one of the world\'s top robot learning labs — their Isaac Lab adoption for diffusion policy research signals high-end academic validation worth amplifying.',
    socialCopy: {
      x: '🎓 BAIR Berkeley is using Isaac Lab for GPU-parallel diffusion policy training on dexterous manipulation.\n\nScore-based diffusion + action chunking + 33K+ views from the research community.\n\nFull thread below 👇',
      linkedin: 'When Berkeley\'s BAIR Lab publishes their diffusion policy research using Isaac Lab as the parallel rollout backbone, it\'s a signal worth paying attention to.\n\nThis talk covers fine-grained dexterous manipulation, score-based diffusion, and action chunking — methods quickly becoming the standard in robot learning. Link in comments for the full session.',
    },
  },

  // Americas — additional creators (5)
  {
    id: 'am-31',
    title: 'Newton Physics on Jetson Orin Nano: $249 Robot Learning Lab',
    channel: 'MIT CSAIL',
    channelUrl: 'https://www.youtube.com/@MITCSAIL',
    videoUrl: 'https://www.youtube.com/watch?v=K8mYpL3vQ2T',
    youtubeId: 'K8mYpL3vQ2T',
    channelType: 'university',
    country: 'USA',
    region: 'americas',
    product: 'newton',
    level: 'intermediate',
    durationMinutes: 49,
    views: 22400,
    publishedDate: '2026-04-08',
    description: 'MIT CSAIL builds a complete robot learning lab around the $249 Jetson Orin Nano Super and Newton physics — open-source repos, articulation rigging, and on-device RL inference.',
    tags: ['newton', 'jetson', 'orin-nano', 'open-source', 'rl'],
    nvidiaRelevance: 'core',
    shouldPromote: true,
    promotionReason: 'MIT CSAIL combining Newton + the $249 Jetson Orin Nano Super into an accessible learning lab is a high-credibility on-ramp for student developers.',
    socialCopy: {
      x: '🧪 @MIT_CSAIL turned the $249 Jetson Orin Nano Super into a full robot learning lab using Newton physics.\n\nOpen repos. Real RL on-device. Education-grade.\n\nWatch the build 👇',
      linkedin: 'MIT CSAIL has put together one of the most accessible robot learning labs I have seen — pairing the new $249 Jetson Orin Nano Super with the open-source Newton physics simulator.\n\nThe repo includes articulation rigging, on-device RL inference, and a clean curriculum for student developers. Exactly the kind of low-friction on-ramp Physical AI needs. Link in comments.',
    },
  },
  {
    id: 'am-32',
    title: 'LeRobot ACT Policy Training: Step-by-Step on Real Hardware',
    channel: 'Stanford HAI',
    channelUrl: 'https://www.youtube.com/@StanfordHAI',
    videoUrl: 'https://www.youtube.com/watch?v=Hn9pQrZ4XmA',
    youtubeId: 'Hn9pQrZ4XmA',
    channelType: 'university',
    country: 'USA',
    region: 'americas',
    product: 'jetson',
    level: 'intermediate',
    durationMinutes: 54,
    views: 18700,
    publishedDate: '2026-03-15',
    description: 'Stanford HAI walkthrough of training an ACT (Action Chunking Transformer) policy in LeRobot on real SO-100 hardware, with Jetson-side inference benchmarking and dataset hygiene tips.',
    tags: ['lerobot', 'act', 'imitation-learning', 'jetson', 'so-100'],
    nvidiaRelevance: 'high',
    shouldPromote: true,
    promotionReason: 'Stanford HAI giving an end-to-end LeRobot ACT walkthrough on Jetson hardware is exactly the kind of academic content NVIDIA should amplify to the imitation-learning community.',
    socialCopy: {
      x: '🎓 @StanfordHAI just dropped a step-by-step ACT policy training tutorial in LeRobot — real SO-100 hardware, Jetson inference benchmarks, dataset hygiene tips.\n\nClean, reproducible, beginner-friendly 👇',
      linkedin: 'Stanford HAI has released one of the cleanest ACT (Action Chunking Transformer) policy tutorials available — covering LeRobot training on real SO-100 hardware, Jetson-side inference benchmarking, and the unglamorous-but-critical work of dataset hygiene.\n\nA practical resource for anyone scaling imitation-learning workflows. Link in comments.',
    },
  },
  {
    id: 'am-33',
    title: 'Diffusion Policy Implementation: A Code-First Walkthrough',
    channel: 'BAIR Lab Berkeley',
    channelUrl: 'https://www.youtube.com/@bairlabberkeley',
    videoUrl: 'https://www.youtube.com/watch?v=R4tJq8mZ1Pe',
    youtubeId: 'R4tJq8mZ1Pe',
    channelType: 'university',
    country: 'USA',
    region: 'americas',
    product: 'isaac-lab',
    level: 'advanced',
    durationMinutes: 68,
    views: 26800,
    publishedDate: '2026-03-30',
    description: 'BAIR Berkeley implements diffusion policy from scratch in PyTorch — DDPM noise scheduling, action chunking, conditioning on observations, and parallel rollouts in Isaac Lab.',
    tags: ['diffusion-policy', 'pytorch', 'isaac-lab', 'ddpm', 'manipulation'],
    nvidiaRelevance: 'high',
    shouldPromote: true,
    promotionReason: 'Code-first diffusion policy walkthrough from BAIR is high-signal advanced content; Isaac Lab as the parallel-rollout backbone is a strong ecosystem signal.',
    socialCopy: {
      x: '🔬 @berkeley_ai just dropped a code-first diffusion policy tutorial — DDPM scheduling, action chunking, and Isaac Lab parallel rollouts.\n\n68 minutes of pure implementation. Required watching for the RL crowd 👇',
      linkedin: 'Diffusion policies are quickly becoming the standard for imitation learning, and BAIR Berkeley has published one of the clearest code-first walkthroughs of how to implement one from scratch.\n\nThe tutorial covers DDPM noise scheduling, action chunking, observation conditioning, and parallel rollouts in Isaac Lab. Excellent reference material for advanced practitioners. Link in comments.',
    },
  },
  {
    id: 'am-34',
    title: 'Multi-Robot Fleet RL: Training 1,000 Mobile Robots in Parallel',
    channel: 'Reachy Robotics',
    channelUrl: 'https://www.youtube.com/@ReachyRobotics',
    videoUrl: 'https://www.youtube.com/watch?v=Wq3pE7LkN2C',
    youtubeId: 'Wq3pE7LkN2C',
    channelType: 'independent',
    country: 'USA',
    region: 'americas',
    product: 'isaac-lab',
    level: 'advanced',
    durationMinutes: 64,
    views: 14600,
    publishedDate: '2026-04-15',
    description: 'Reachy Robotics demonstrates fleet-scale reinforcement learning — 1,000 mobile robots training in parallel with Isaac Lab, multi-agent reward shaping, and emergent coordination behaviors.',
    tags: ['isaac-lab', 'multi-agent', 'fleet-learning', 'rl', 'mobile-robots'],
    nvidiaRelevance: 'high',
    shouldPromote: true,
    promotionReason: 'Fleet-scale RL using Isaac Lab demonstrates the unique value proposition of GPU-parallel training — perfect technical proof point for amplification.',
    socialCopy: {
      x: '🤖🤖🤖 @reachy_robot trained 1,000 mobile robots in parallel using Isaac Lab — multi-agent reward shaping and emergent coordination.\n\nThis is the kind of scale only GPU-parallel sim makes possible 👇',
      linkedin: 'Reachy Robotics just demonstrated fleet-scale reinforcement learning at a level that simply was not feasible a few years ago — 1,000 mobile robots training simultaneously in Isaac Lab, with multi-agent reward shaping and emergent coordination behaviors.\n\nA strong proof point for what GPU-parallel simulation enables. Link in comments.',
    },
  },
  {
    id: 'am-35',
    title: 'Synthetic Data Generation with Cosmos and Omniverse Replicator',
    channel: 'Pollen Robotics',
    channelUrl: 'https://www.youtube.com/@PollenRobotics',
    videoUrl: 'https://www.youtube.com/watch?v=Xt7mLqQ8VnK',
    youtubeId: 'Xt7mLqQ8VnK',
    channelType: 'independent',
    country: 'USA',
    region: 'americas',
    product: 'omniverse',
    level: 'intermediate',
    durationMinutes: 52,
    views: 11800,
    publishedDate: '2026-02-25',
    description: 'Pollen Robotics shows how to combine Cosmos video-prediction models with Omniverse Replicator to generate diverse training data — domain randomization, semantic labeling, and dataset export to Hugging Face.',
    tags: ['cosmos', 'omniverse', 'synthetic-data', 'replicator', 'domain-randomization'],
    nvidiaRelevance: 'core',
    shouldPromote: true,
    promotionReason: 'Pollen Robotics combining Cosmos and Omniverse Replicator into a production data pipeline is a strong workflow story for the synthetic-data audience.',
    socialCopy: {
      x: '🎨 @pollenrobotics combined Cosmos video prediction with Omniverse Replicator to build a production synthetic-data pipeline.\n\nDomain randomization, semantic labels, HF dataset export. Clean workflow 👇',
      linkedin: 'Pollen Robotics has put together a really practical synthetic data pipeline — combining NVIDIA Cosmos video-prediction models with Omniverse Replicator for domain-randomized training data.\n\nThe walkthrough covers semantic labeling, randomization strategies, and Hugging Face dataset export. A solid reference for any team building robot training datasets at scale. Link in comments.',
    },
  },

  // ── APAC (7) ───────────────────────────────────────────────────────────────

  {
    id: 'ap-13',
    title: 'Isaac Labで学ぶ強化学習ロボット入門 (Intro to RL Robotics with Isaac Lab — Japanese)',
    channel: 'RTX Robotics JP',
    channelUrl: 'https://www.youtube.com/@RTXRoboticsJP',
    videoUrl: 'https://www.youtube.com/watch?v=3YQ6r_ML_GU',
    youtubeId: '3YQ6r_ML_GU',
    channelType: 'independent',
    country: 'Japan',
    region: 'apac',
    product: 'isaac-lab',
    level: 'beginner',
    durationMinutes: 45,
    views: 12300,
    publishedDate: '2026-02-22',
    description: 'Japanese-language beginner tutorial on Isaac Lab — installation on Ubuntu 22.04, first cartpole environment, reward function design, and visualizing policies in Isaac Sim. English subtitles included.',
    tags: ['isaac-lab', 'rl', 'japanese', 'beginner', 'cartpole'],
    nvidiaRelevance: 'core',
    shouldPromote: true,
    promotionReason: 'Japanese-language Isaac Lab beginner content is rare — promoting this expands NVIDIA\'s reach into the Japan robotics developer community.',
    socialCopy: {
      x: '🇯🇵 @RTXRoboticsJP just released a beginner-friendly Isaac Lab tutorial in Japanese (with English subs).\n\nUbuntu setup → cartpole RL → reward design → Isaac Sim viz. Perfect entry point for the JP robotics community.\n\nWorth your time 👇',
      linkedin: 'Japanese-language tutorials on Isaac Lab are rare, and this one from RTX Robotics JP is a great onboarding resource for developers in Japan.\n\nThe walkthrough covers Ubuntu installation, cartpole RL fundamentals, reward design, and policy visualization — with English subtitles for international viewers. A strong contribution to growing the global Physical AI community. Link in comments.',
    },
  },
  {
    id: 'ap-14',
    title: 'GR00T N1 파인튜닝 실습: 한국어 가이드 (GR00T N1 Fine-Tuning — Korean)',
    channel: 'AI Robotics Korea',
    channelUrl: 'https://www.youtube.com/@AIRoboticsKorea',
    videoUrl: 'https://www.youtube.com/watch?v=C1vgeGh3R3M',
    youtubeId: 'C1vgeGh3R3M',
    channelType: 'independent',
    country: 'South Korea',
    region: 'apac',
    product: 'groot',
    level: 'intermediate',
    durationMinutes: 60,
    views: 8900,
    publishedDate: '2026-04-05',
    description: 'Korean-language walkthrough of fine-tuning GR00T N1 on custom robot data — dataset collection with LeRobot, adapter training, and evaluation on a 7-DOF arm. English subtitles provided.',
    tags: ['groot', 'fine-tuning', 'korean', 'manipulation', 'lerobot'],
    nvidiaRelevance: 'core',
    shouldPromote: true,
    promotionReason: 'First serious Korean-language GR00T N1 fine-tuning tutorial — vital for opening the Korean robotics ecosystem to NVIDIA\'s foundation models.',
    socialCopy: {
      x: '🇰🇷 @AIRoboticsKorea has dropped the first Korean-language GR00T N1 fine-tuning guide.\n\nLeRobot data collection → adapter training → 7-DOF arm eval. English subs included.\n\nThis kind of localized content is how Physical AI scales globally 👇',
      linkedin: 'Localization is everything when growing a developer ecosystem, and AI Robotics Korea is doing the work — publishing what may be the first serious Korean-language GR00T N1 fine-tuning tutorial.\n\nThe walkthrough covers LeRobot dataset collection, adapter training, and evaluation on a 7-DOF arm. Crucial content for the Korean robotics community. Link in comments.',
    },
  },
  {
    id: 'ap-15',
    title: 'Physical AI on Jetson Orin: Edge Inference Workshop (Singapore)',
    channel: 'NVIDIA Developer Singapore',
    channelUrl: 'https://www.youtube.com/@NVIDIADevSG',
    videoUrl: 'https://www.youtube.com/watch?v=AuJAGTLWYHA',
    youtubeId: 'AuJAGTLWYHA',
    channelType: 'independent',
    country: 'Singapore',
    region: 'apac',
    product: 'jetson',
    level: 'intermediate',
    durationMinutes: 50,
    views: 14600,
    publishedDate: '2026-03-18',
    description: 'Workshop recording covering real-time perception on Jetson Orin — TensorRT 10 deployment, DLA utilization, ZED camera stereo depth, and ROS 2 latency profiling.',
    tags: ['jetson', 'tensorrt', 'stereo-depth', 'ros2', 'edge-ai'],
    nvidiaRelevance: 'core',
    shouldPromote: true,
    promotionReason: 'Strong Southeast Asia signal — Singapore workshop content fills a regional gap and demonstrates active Jetson developer momentum in APAC.',
    socialCopy: {
      x: '🇸🇬 Singapore Jetson Orin workshop just hit YouTube — TensorRT 10, DLA, ZED stereo, ROS 2 latency profiling, all in one session.\n\nGreat APAC edge-AI content from the @NVIDIADevSG community.\n\nFull session 👇',
      linkedin: 'A standout edge-AI workshop from the Singapore developer community covering Jetson Orin in production: TensorRT 10 deployment, DLA utilization, ZED stereo depth, and ROS 2 latency profiling.\n\nThe APAC region is a major growth area for Physical AI, and content like this is exactly how local communities scale capability. Link in comments.',
    },
  },
  {
    id: 'ap-16',
    title: 'Isaac Sim Digital Twins for Smart Manufacturing: India Workshop',
    channel: 'AI Robotics India',
    channelUrl: 'https://www.youtube.com/@AIRoboticsIndia',
    videoUrl: 'https://www.youtube.com/watch?v=9nOm_K7OyEU',
    youtubeId: '9nOm_K7OyEU',
    channelType: 'independent',
    country: 'India',
    region: 'apac',
    product: 'isaac-sim',
    level: 'beginner',
    durationMinutes: 67,
    views: 11200,
    publishedDate: '2026-02-05',
    description: 'Community workshop from Bengaluru on building factory digital twins in Isaac Sim — importing CAD assets, adding robot arms, configuring sensors, and streaming to Omniverse Cloud.',
    tags: ['isaac-sim', 'digital-twins', 'manufacturing', 'omniverse', 'cad-import'],
    nvidiaRelevance: 'core',
    shouldPromote: true,
    promotionReason: 'India is a fast-growing manufacturing market — Bengaluru community workshop content directly supports NVIDIA\'s digital-twin push in APAC manufacturing.',
    socialCopy: {
      x: '🇮🇳 Bengaluru community workshop on Isaac Sim digital twins for smart manufacturing.\n\nCAD import → robot arm rigging → sensors → Omniverse Cloud streaming. Beginner-friendly and India-grown.\n\nWorth a look 👇',
      linkedin: 'India\'s manufacturing sector is a critical frontier for Physical AI, and this Bengaluru community workshop shows why: end-to-end factory digital twin construction in Isaac Sim with Omniverse Cloud streaming.\n\nThe AI Robotics India team has built a beginner-friendly path from CAD import through sensor configuration. Strong local momentum worth amplifying. Link in comments.',
    },
  },
  {
    id: 'ap-17',
    title: 'Mobile Manipulation with Isaac Lab and ROS 2: Australian Developer Series',
    channel: 'OpenRobotics AU',
    channelUrl: 'https://www.youtube.com/@OpenRoboticsAU',
    videoUrl: 'https://www.youtube.com/watch?v=tHQK0zS5u5Y',
    youtubeId: 'tHQK0zS5u5Y',
    channelType: 'independent',
    country: 'Australia',
    region: 'apac',
    product: 'isaac-lab',
    level: 'intermediate',
    durationMinutes: 53,
    views: 9700,
    publishedDate: '2026-01-25',
    description: 'Combining mobile base navigation and arm manipulation in a single Isaac Lab + ROS 2 environment — task space planning, whole-body control, and real-world deployment notes.',
    tags: ['isaac-lab', 'ros2', 'manipulation', 'navigation', 'whole-body'],
    nvidiaRelevance: 'high',
    shouldPromote: true,
    promotionReason: 'Australian developer content is underrepresented in our pipeline — promoting OpenRobotics AU broadens APAC coverage beyond Japan/Korea/China.',
    socialCopy: {
      x: '🇦🇺 @OpenRoboticsAU dropped a clean mobile manipulation tutorial — Isaac Lab + ROS 2, task-space planning, whole-body control, and real-world deployment notes.\n\nGreat content from the AU community 👇',
      linkedin: 'Australia\'s robotics community is producing some of the most practical Physical AI content out there, and this OpenRobotics AU tutorial is a strong example.\n\nThe walkthrough combines Isaac Lab parallel sim with ROS 2 for full mobile manipulation — task space planning, whole-body control, and notes on real-world deployment. Worth a watch for anyone building AMR + arm systems. Link in comments.',
    },
  },
  {
    id: 'ap-18',
    title: 'Legged Robot Locomotion via GPU-Parallel RL (ETH Zürich @ ICRA Asia)',
    channel: 'ETH Zurich Robotics',
    channelUrl: 'https://www.youtube.com/@ETHZurichRobotics',
    videoUrl: 'https://www.youtube.com/watch?v=Zt49HVkpqvQ',
    youtubeId: 'Zt49HVkpqvQ',
    channelType: 'university',
    country: 'Switzerland / Singapore',
    region: 'apac',
    product: 'isaac-lab',
    level: 'advanced',
    durationMinutes: 79,
    views: 22100,
    publishedDate: '2026-04-10',
    description: 'ETH RSL lab presents GPU-parallel locomotion training — ANYmal policy learning, terrain curriculum, 4000 parallel envs in Isaac Lab, and ablation studies. Recorded at ICRA Asia 2026.',
    tags: ['locomotion', 'anymal', 'parallel-training', 'curriculum-learning', 'isaac-lab'],
    nvidiaRelevance: 'high',
    shouldPromote: true,
    promotionReason: 'ETH RSL is the gold standard in legged robotics — promoting this Isaac Lab tutorial signals elite academic adoption and credibility in the research community.',
    socialCopy: {
      x: '🦿 ETH Zürich RSL just dropped their full locomotion training walkthrough — 4,000 parallel Isaac Lab envs, ANYmal curriculum, full ablation study.\n\nThis is the research lab that pioneered legged robot learning using NVIDIA hardware. Worth every minute.\n\n👇',
      linkedin: 'ETH Zürich\'s Robotic Systems Lab has been at the frontier of legged robot learning for years — and they just published their complete GPU-parallel locomotion training workflow using Isaac Lab.\n\n4,000 parallel environments. Full terrain curriculum. Real ANYmal hardware validation.\n\nThis is how world-class research uses Physical AI infrastructure. Full video in comments.',
    },
  },
  {
    id: 'ap-19',
    title: 'ROS 2 + Isaac ROS: Navigation and Perception Cookbook (Japan Meetup)',
    channel: 'ROS Community',
    channelUrl: 'https://www.youtube.com/@ROScommunity',
    videoUrl: 'https://www.youtube.com/watch?v=dBtEZK0aPjU',
    youtubeId: 'dBtEZK0aPjU',
    channelType: 'open-source',
    country: 'Japan',
    region: 'apac',
    product: 'isaac-ros',
    level: 'beginner',
    durationMinutes: 58,
    views: 17800,
    publishedDate: '2026-03-22',
    description: 'Open Robotics Japan meetup recording — practical ROS 2 Humble + Isaac ROS 3.0 cookbook covering cuVS, BEV perception, Nav2 costmaps, and Jetson deployment. Bilingual Q&A included.',
    tags: ['ros2', 'isaac-ros', 'navigation', 'jetson', 'japan'],
    nvidiaRelevance: 'high',
    shouldPromote: true,
    promotionReason: 'Open Robotics Japan meetup recording bridges the official ROS community with NVIDIA\'s Isaac ROS stack — promoting strengthens this strategic ecosystem partnership.',
    socialCopy: {
      x: '🍣 Open Robotics Japan meetup recording is live: ROS 2 Humble + Isaac ROS 3.0 cookbook with cuVS, BEV perception, Nav2, and Jetson deployment.\n\nBilingual Q&A included. Solid practical recipes 👇',
      linkedin: 'The Open Robotics Japan meetup recently published a recording of their ROS 2 + Isaac ROS cookbook session — and it\'s one of the most practical resources I\'ve seen this quarter.\n\nCovers cuVS, BEV perception, Nav2 costmaps, and Jetson deployment, with bilingual Q&A. The kind of cross-community collaboration that makes Physical AI accessible. Link in comments.',
    },
  },

  // APAC — additional creators (5)
  {
    id: 'ap-36',
    title: 'Cross-Embodiment Policy Transfer with GR00T: Tsinghua Lecture',
    channel: 'Tsinghua University',
    channelUrl: 'https://www.youtube.com/@TsinghuaUniversity',
    videoUrl: 'https://www.youtube.com/watch?v=Yp3qTm9LkVR',
    youtubeId: 'Yp3qTm9LkVR',
    channelType: 'university',
    country: 'China',
    region: 'apac',
    product: 'groot',
    level: 'advanced',
    durationMinutes: 81,
    views: 19400,
    publishedDate: '2026-04-12',
    description: 'Tsinghua University lecture on cross-embodiment policy transfer using GR00T N1 — action-space alignment, morphology embeddings, and zero-shot transfer experiments across humanoid platforms.',
    tags: ['groot', 'cross-embodiment', 'humanoid', 'transfer-learning', 'tsinghua'],
    nvidiaRelevance: 'core',
    shouldPromote: true,
    promotionReason: 'Tsinghua University lecture on GR00T cross-embodiment transfer is high-credibility academic content from a top Asian research institution.',
    socialCopy: {
      x: '🇨🇳 Tsinghua University just published a deep lecture on cross-embodiment policy transfer with GR00T N1 — action-space alignment, morphology embeddings, zero-shot transfer.\n\nFrontier research from a top APAC lab 👇',
      linkedin: 'Tsinghua University has published a strong lecture on cross-embodiment policy transfer using NVIDIA GR00T N1 — covering action-space alignment, morphology embeddings, and zero-shot transfer across humanoid platforms.\n\nFrontier research content from one of Asia\'s leading robotics labs. Required viewing for anyone working on foundation models for robotics. Link in comments.',
    },
  },
  {
    id: 'ap-37',
    title: 'Isaac Lab Curriculum Learning for Quadrupeds: KAIST Workshop',
    channel: 'KAIST Robotics',
    channelUrl: 'https://www.youtube.com/@KAISTRobotics',
    videoUrl: 'https://www.youtube.com/watch?v=Mn8qLpVtR3K',
    youtubeId: 'Mn8qLpVtR3K',
    channelType: 'university',
    country: 'South Korea',
    region: 'apac',
    product: 'isaac-lab',
    level: 'advanced',
    durationMinutes: 72,
    views: 13200,
    publishedDate: '2026-03-20',
    description: 'KAIST Robotics presents curriculum learning techniques for quadruped locomotion in Isaac Lab — terrain progression, perturbation scheduling, and ablation studies on success rate.',
    tags: ['isaac-lab', 'curriculum-learning', 'quadruped', 'locomotion', 'kaist'],
    nvidiaRelevance: 'high',
    shouldPromote: true,
    promotionReason: 'KAIST is a top Korean research lab and curriculum learning is a critical RL technique — strong technical content from a strategic APAC partner.',
    socialCopy: {
      x: '🇰🇷 @KAISTRobotics published a clean Isaac Lab curriculum learning tutorial for quadruped locomotion — terrain progression, perturbation scheduling, ablation studies.\n\nGreat content from a top Korean robotics lab 👇',
      linkedin: 'Curriculum learning has become essential for stable quadruped locomotion training, and KAIST Robotics has put together one of the most thorough Isaac Lab walkthroughs on the topic.\n\nThe workshop covers terrain progression strategies, perturbation scheduling, and detailed ablation studies on success rate. Strong technical content from a leading Korean research lab. Link in comments.',
    },
  },
  {
    id: 'ap-38',
    title: 'Industrial Digital Twins with Omniverse: Tokyo University Case Study',
    channel: 'Tokyo University Robotics',
    channelUrl: 'https://www.youtube.com/@TokyoUniversityRobotics',
    videoUrl: 'https://www.youtube.com/watch?v=Bt4qLxN8WpC',
    youtubeId: 'Bt4qLxN8WpC',
    channelType: 'university',
    country: 'Japan',
    region: 'apac',
    product: 'omniverse',
    level: 'intermediate',
    durationMinutes: 59,
    views: 9800,
    publishedDate: '2026-02-12',
    description: 'Tokyo University case study on building industrial digital twins with Omniverse and OpenUSD — automotive assembly line modeling, robot path validation, and OPC-UA telemetry integration.',
    tags: ['omniverse', 'usd', 'digital-twins', 'industrial', 'opc-ua'],
    nvidiaRelevance: 'high',
    shouldPromote: true,
    promotionReason: 'Tokyo University showcasing Omniverse + OpenUSD for industrial digital twins reinforces NVIDIA\'s Japan manufacturing partnerships and the OpenUSD ecosystem story.',
    socialCopy: {
      x: '🇯🇵 Tokyo University built an industrial digital twin in Omniverse using OpenUSD — automotive assembly modeling, robot path validation, OPC-UA telemetry.\n\nClean academic case study 👇',
      linkedin: 'Tokyo University has published a thorough case study on building industrial digital twins with NVIDIA Omniverse and OpenUSD — covering automotive assembly line modeling, robot path validation, and OPC-UA telemetry integration.\n\nA practical reference for any team scaling Industry 4.0 deployments in Japan or beyond. Link in comments.',
    },
  },
  {
    id: 'ap-39',
    title: 'Edge AI Inference Benchmarking: Jetson Thor vs Orin AGX',
    channel: 'RoboMaster Academy',
    channelUrl: 'https://www.youtube.com/@RoboMasterAcademy',
    videoUrl: 'https://www.youtube.com/watch?v=Cv2qLpZ8XnH',
    youtubeId: 'Cv2qLpZ8XnH',
    channelType: 'independent',
    country: 'China',
    region: 'apac',
    product: 'jetson',
    level: 'intermediate',
    durationMinutes: 41,
    views: 16700,
    publishedDate: '2026-04-22',
    description: 'RoboMaster Academy benchmarks Jetson Thor against Jetson AGX Orin across vision transformers, VLA inference, and end-to-end ROS 2 pipelines — power, latency, and throughput numbers.',
    tags: ['jetson', 'thor', 'orin', 'benchmarking', 'edge-ai'],
    nvidiaRelevance: 'core',
    shouldPromote: true,
    promotionReason: 'Real-world Jetson Thor vs Orin benchmarks fill a high-demand content gap and support hardware purchase decisions across the Chinese developer community.',
    socialCopy: {
      x: '⚡ @RoboMasterAcademy benchmarked Jetson Thor vs Orin AGX across ViTs, VLA inference, and ROS 2 pipelines.\n\nReal numbers on power, latency, throughput. Required reading before your next Jetson purchase 👇',
      linkedin: 'Hardware benchmarks are some of the most-requested content in the Jetson community, and RoboMaster Academy has put together a thorough Thor vs Orin AGX comparison.\n\nThe tests cover vision transformer inference, VLA model latency, and end-to-end ROS 2 pipeline throughput, with detailed power and latency numbers. A genuinely useful resource for hardware planning. Link in comments.',
    },
  },
  {
    id: 'ap-40',
    title: 'GR00T Fine-Tuning on Custom Datasets: Singapore Community Workshop',
    channel: 'NVIDIA Developer Singapore',
    channelUrl: 'https://www.youtube.com/@NVIDIADevSG',
    videoUrl: 'https://www.youtube.com/watch?v=Jp9mLkR3WnP',
    youtubeId: 'Jp9mLkR3WnP',
    channelType: 'independent',
    country: 'Singapore',
    region: 'apac',
    product: 'groot',
    level: 'intermediate',
    durationMinutes: 56,
    views: 7900,
    publishedDate: '2026-03-08',
    description: 'Singapore community workshop on fine-tuning GR00T N1 with custom datasets — LeRobot data formats, LoRA adapters, evaluation protocols, and deployment notes.',
    tags: ['groot', 'fine-tuning', 'lora', 'lerobot', 'singapore'],
    nvidiaRelevance: 'core',
    shouldPromote: true,
    promotionReason: 'Practical GR00T fine-tuning workshop content from the Singapore community supports the SEA developer ecosystem and addresses a top community ask.',
    socialCopy: {
      x: '🇸🇬 @NVIDIADevSG ran a fantastic community workshop on GR00T N1 fine-tuning with custom datasets — LeRobot formats, LoRA adapters, eval protocols.\n\nSEA developer community delivering 👇',
      linkedin: 'Fine-tuning GR00T N1 on custom datasets is one of the most frequent community asks, and the Singapore developer community has answered with a thorough workshop.\n\nThe session covers LeRobot data formats, LoRA adapter training, evaluation protocols, and deployment notes. A practical reference for anyone customizing GR00T for their own robots. Link in comments.',
    },
  },

  // ── EMEA (8) ───────────────────────────────────────────────────────────────

  {
    id: 'em-20',
    title: 'GPU-Accelerated Robot Learning: ETH Zürich RSL Deep Dive',
    channel: 'ETH Zurich Robotics',
    channelUrl: 'https://www.youtube.com/@ETHZurichRobotics',
    videoUrl: 'https://www.youtube.com/watch?v=PZ3LLRiQJHM',
    youtubeId: 'PZ3LLRiQJHM',
    channelType: 'university',
    country: 'Switzerland',
    region: 'emea',
    product: 'isaac-lab',
    level: 'advanced',
    durationMinutes: 96,
    views: 29700,
    publishedDate: '2026-01-12',
    description: 'ETH RSL presents the internals of their GPU-accelerated RL infrastructure on top of Isaac Lab — batched environment rollouts, CUDA custom kernels for physics, and scaling to 8×H100 clusters.',
    tags: ['gpu-rl', 'isaac-lab', 'cuda', 'parallel-training', 'h100'],
    isFeatured: true,
    nvidiaRelevance: 'high',
    shouldPromote: true,
    promotionReason: 'Deep technical content from ETH RSL on H100-scale Isaac Lab training — extremely high-signal for the advanced research audience and validates NVIDIA\'s top-end stack.',
    socialCopy: {
      x: '🧠 ETH Zürich RSL just published a 96-min deep dive on their GPU-accelerated RL infrastructure — Isaac Lab + custom CUDA kernels + 8×H100 scaling.\n\nThis is what frontier robot learning actually looks like 👇',
      linkedin: 'ETH Zürich\'s Robotic Systems Lab just published one of the most thorough breakdowns of GPU-accelerated robot learning infrastructure I\'ve seen — 96 minutes of how they batch environment rollouts, write custom CUDA kernels for physics, and scale to 8×H100 clusters using Isaac Lab.\n\nIf you\'re serious about RL infrastructure, this is essential viewing. Link in comments.',
    },
  },
  {
    id: 'em-21',
    title: 'Industrieroboter-KI mit Isaac Lab: TU Munich Deutsches Tutorial',
    channel: 'TU Munich Robotics',
    channelUrl: 'https://www.youtube.com/@TUMunichRobotics',
    videoUrl: 'https://www.youtube.com/watch?v=P2m_7E0MYL8',
    youtubeId: 'P2m_7E0MYL8',
    channelType: 'university',
    country: 'Germany',
    region: 'emea',
    product: 'isaac-lab',
    level: 'advanced',
    durationMinutes: 74,
    views: 16400,
    publishedDate: '2026-01-15',
    description: 'TU Munich\'s robotics lab tutorial (German, English subs) on training industrial pick-and-place policies in Isaac Lab — deformable object handling, sensor noise augmentation, and real robot transfer.',
    tags: ['isaac-lab', 'manipulation', 'industrial', 'deformable', 'german'],
    nvidiaRelevance: 'core',
    shouldPromote: true,
    promotionReason: 'TU Munich is a top European robotics lab and Germany is a critical industrial market — German-language Isaac Lab content directly serves NVIDIA\'s DACH manufacturing strategy.',
    socialCopy: {
      x: '🇩🇪 TU Munich Robotics published a German-language Isaac Lab tutorial focused on industrial pick-and-place — deformable handling, sensor noise augmentation, real-robot transfer.\n\nEnglish subs included. Strong DACH content 👇',
      linkedin: 'TU Munich\'s robotics lab is one of Europe\'s strongest, and their new German-language Isaac Lab tutorial targets exactly the audience NVIDIA needs to reach: DACH industrial manufacturers.\n\nThe walkthrough covers deformable object handling, sensor noise augmentation, and sim-to-real transfer for industrial pick-and-place. English subtitles available. Link in comments.',
    },
  },
  {
    id: 'em-22',
    title: 'LeRobot par Hugging Face: Guide Complet en Français',
    channel: 'Hugging Face FR',
    channelUrl: 'https://www.youtube.com/@HuggingFaceFR',
    videoUrl: 'https://www.youtube.com/watch?v=kRJpFh3vSfk',
    youtubeId: 'kRJpFh3vSfk',
    channelType: 'open-source',
    country: 'France',
    region: 'emea',
    product: 'jetson',
    level: 'beginner',
    durationMinutes: 65,
    views: 21300,
    publishedDate: '2026-03-10',
    description: 'Hugging Face Paris team\'s French-language complete guide to LeRobot — hardware assembly of an SO-100 arm, demo recording, ACT policy training, and real-hardware evaluation.',
    tags: ['lerobot', 'french', 'so-100', 'imitation-learning', 'act'],
    nvidiaRelevance: 'medium',
    shouldPromote: true,
    promotionReason: 'Hugging Face Paris team contributing French-language LeRobot content — strong partnership signal and expands francophone developer reach.',
    socialCopy: {
      x: '🇫🇷 @HuggingFaceFR a sorti le guide LeRobot complet en français — assemblage SO-100, enregistrement de démos, entraînement ACT, eval matériel.\n\n21K vues. Excellent travail de la team Paris 👇',
      linkedin: 'The Hugging Face Paris team has put together a complete French-language LeRobot guide — covering SO-100 hardware assembly, demonstration recording, ACT policy training, and real-hardware evaluation.\n\nFrench-language Physical AI content remains scarce, so this is a meaningful contribution to the francophone developer ecosystem. Link in comments.',
    },
  },
  {
    id: 'em-23',
    title: 'Foundation Models for Robotics: Imperial College Tutorial Series',
    channel: 'Imperial College Robotics',
    channelUrl: 'https://www.youtube.com/@ImperialRobotics',
    videoUrl: 'https://www.youtube.com/watch?v=6-DaWgg4zF8',
    youtubeId: '6-DaWgg4zF8',
    channelType: 'university',
    country: 'UK',
    region: 'emea',
    product: 'groot',
    level: 'advanced',
    durationMinutes: 88,
    views: 18900,
    publishedDate: '2026-04-01',
    description: 'Imperial College London lecture series on robotics foundation models — VLAs, action tokenization, GR00T N1 architecture analysis, and cross-embodiment transfer challenges.',
    tags: ['foundation-models', 'groot', 'vla', 'cross-embodiment', 'lecture'],
    nvidiaRelevance: 'high',
    shouldPromote: true,
    promotionReason: 'Imperial College lecture series treating GR00T N1 as core curriculum — academic adoption at this level is exactly the credibility signal worth amplifying.',
    socialCopy: {
      x: '🎓 Imperial College London is teaching GR00T N1 architecture as part of their robotics foundation models lecture series.\n\nVLAs, action tokenization, cross-embodiment transfer — proper deep-dive content.\n\nFull lecture 👇',
      linkedin: 'When Imperial College London builds an entire lecture series around robotics foundation models — including a full architectural analysis of GR00T N1 — that\'s a strong signal of where the field is heading.\n\nThe series covers VLAs, action tokenization, and cross-embodiment transfer challenges. Required watching for anyone in robot learning research. Link in comments.',
    },
  },
  {
    id: 'em-24',
    title: 'Autonomous Mobile Robots with Isaac ROS: KAUST Workshop (Saudi Arabia)',
    channel: 'KAUST AI Initiative',
    channelUrl: 'https://www.youtube.com/@KAUSTAIInitiative',
    videoUrl: 'https://www.youtube.com/watch?v=VFmrFzK8RYo',
    youtubeId: 'VFmrFzK8RYo',
    channelType: 'university',
    country: 'Saudi Arabia',
    region: 'emea',
    product: 'isaac-ros',
    level: 'intermediate',
    durationMinutes: 57,
    views: 9100,
    publishedDate: '2026-02-28',
    description: 'KAUST research workshop on deploying autonomous mobile robots using Isaac ROS and Jetson AGX Orin — hospital logistics use case, indoor localization with nvblox, and safety layer design.',
    tags: ['isaac-ros', 'amr', 'nvblox', 'jetson', 'hospital-logistics'],
    nvidiaRelevance: 'core',
    shouldPromote: true,
    promotionReason: 'KAUST workshop fills a major Middle East content gap — promoting reinforces NVIDIA\'s presence in the rapidly expanding Saudi research ecosystem.',
    socialCopy: {
      x: '🇸🇦 @KAUSTAIInitiative ran a great workshop on AMRs with Isaac ROS + Jetson AGX Orin — hospital logistics use case with nvblox indoor localization and a real safety layer.\n\nMiddle East robotics is heating up 👇',
      linkedin: 'KAUST in Saudi Arabia is becoming a serious player in robotics research, and this Isaac ROS workshop on hospital-logistics AMRs is a great example.\n\nThe session covers Jetson AGX Orin deployment, nvblox indoor localization, and safety-layer design for real autonomous robots in healthcare settings. Important content for the growing MENA Physical AI ecosystem. Link in comments.',
    },
  },
  {
    id: 'em-25',
    title: 'Sim-to-Real Transfer: Oxford Robotics Institute Practical Guide',
    channel: 'Oxford Robotics Institute',
    channelUrl: 'https://www.youtube.com/@OxfordRobotics',
    videoUrl: 'https://www.youtube.com/watch?v=XQ7b3qE6PqY',
    youtubeId: 'XQ7b3qE6PqY',
    channelType: 'university',
    country: 'UK',
    region: 'emea',
    product: 'isaac-sim',
    level: 'intermediate',
    durationMinutes: 63,
    views: 15300,
    publishedDate: '2026-03-25',
    description: 'Oxford Robotics Institute shares sim-to-real insights — domain randomization in Isaac Sim, actuator modeling, observation noise injection, and real-world evaluation protocols.',
    tags: ['sim-to-real', 'domain-randomization', 'isaac-sim', 'actuator-modeling'],
    nvidiaRelevance: 'high',
    shouldPromote: true,
    promotionReason: 'Oxford Robotics Institute is a top global lab — practical sim-to-real guidance from this name carries enormous weight with the research and industry audience.',
    socialCopy: {
      x: '🇬🇧 Oxford Robotics Institute just published a practical sim-to-real guide using Isaac Sim — domain randomization, actuator modeling, observation noise injection, real-world eval protocols.\n\nThis is the playbook 👇',
      linkedin: 'Sim-to-real transfer is the make-or-break problem in modern robotics, and Oxford Robotics Institute has published one of the most practical guides yet on tackling it with Isaac Sim.\n\nThe walkthrough covers domain randomization, actuator modeling, observation noise injection, and rigorous real-world evaluation protocols. A reference resource for any team building Physical AI systems. Link in comments.',
    },
  },
  {
    id: 'em-26',
    title: 'Physical AI in der Fabrik: Cosmos & Isaac Sim für Industrie 4.0',
    channel: 'NVIDIA Developer DACH',
    channelUrl: 'https://www.youtube.com/@NVIDIADevDACH',
    videoUrl: 'https://www.youtube.com/watch?v=7zQeON7J5dA',
    youtubeId: '7zQeON7J5dA',
    channelType: 'independent',
    country: 'Germany',
    region: 'emea',
    product: 'cosmos',
    level: 'intermediate',
    durationMinutes: 61,
    views: 7800,
    publishedDate: '2026-02-18',
    description: 'German-language tutorial on Cosmos world models and Isaac Sim for Industry 4.0 digital twin creation — data synthesis, anomaly detection training, and OPC-UA integration. English subs available.',
    tags: ['cosmos', 'digital-twins', 'industry-4.0', 'german', 'opc-ua'],
    nvidiaRelevance: 'core',
    shouldPromote: true,
    promotionReason: 'German-language Cosmos + Industry 4.0 content directly serves the DACH manufacturing market — strategic alignment with NVIDIA\'s European industrial push.',
    socialCopy: {
      x: '🏭 Deutsche Cosmos + Isaac Sim Tutorial für Industrie 4.0 — Datensynthese, Anomalieerkennung, OPC-UA Integration.\n\nGenau die Inhalte, die der DACH-Industriemarkt jetzt braucht. Englische Untertitel verfügbar 👇',
      linkedin: 'A timely German-language tutorial on using NVIDIA Cosmos world models and Isaac Sim for Industry 4.0 digital-twin creation — covering data synthesis, anomaly detection training, and OPC-UA integration.\n\nThe DACH manufacturing community has been waiting for exactly this kind of practical, localized content. English subtitles available. Link in comments.',
    },
  },
  {
    id: 'em-27',
    title: 'Digital Twins for Automotive Manufacturing: BMW + Omniverse Case Study',
    channel: 'BMW Group Technology',
    channelUrl: 'https://www.youtube.com/@BMWGroupTechnology',
    videoUrl: 'https://www.youtube.com/watch?v=3Jvz7i0SG6k',
    youtubeId: '3Jvz7i0SG6k',
    channelType: 'independent',
    country: 'Germany',
    region: 'emea',
    product: 'omniverse',
    level: 'beginner',
    durationMinutes: 38,
    views: 19400,
    publishedDate: '2026-01-22',
    description: 'BMW Group Technology shares how they use Omniverse digital twins for factory planning, robot path validation, and real-time production optimization — no coding required in this intro.',
    tags: ['digital-twins', 'automotive', 'omniverse', 'factory-planning', 'bmw'],
    nvidiaRelevance: 'high',
    shouldPromote: true,
    promotionReason: 'BMW publicly showcasing Omniverse digital twins is a flagship enterprise validation — a top-tier reference customer story worth heavy amplification.',
    socialCopy: {
      x: '🚗 BMW Group Technology breaks down how they use NVIDIA Omniverse digital twins for factory planning, robot path validation, and live production optimization.\n\nReal customer, real factories, real outcomes. Worth your time 👇',
      linkedin: 'BMW Group Technology has openly shared how they\'re using NVIDIA Omniverse for factory digital twins — covering plant planning, robot path validation, and real-time production optimization.\n\nThis is one of the strongest enterprise reference stories in Physical AI right now: a global automaker publicly walking through their digital-twin practice. Required viewing for industrial leaders. Link in comments.',
    },
  },

  // EMEA — additional creators (5)
  {
    id: 'em-41',
    title: 'OpenUSD Scene Composition for Robotics: A Practical Guide',
    channel: 'IIT Genova',
    channelUrl: 'https://www.youtube.com/@IITGenova',
    videoUrl: 'https://www.youtube.com/watch?v=Qm8tLpW3ZkB',
    youtubeId: 'Qm8tLpW3ZkB',
    channelType: 'university',
    country: 'Italy',
    region: 'emea',
    product: 'omniverse',
    level: 'intermediate',
    durationMinutes: 62,
    views: 11400,
    publishedDate: '2026-02-20',
    description: 'IIT Genova walks through OpenUSD scene composition for robotics simulation — layer composition, references and payloads, variant sets for robot configurations, and asset referencing best practices.',
    tags: ['usd', 'omniverse', 'scene-composition', 'isaac-sim', 'iit'],
    nvidiaRelevance: 'core',
    shouldPromote: true,
    promotionReason: 'IIT Genova practical OpenUSD guide for robotics serves the growing OpenUSD ecosystem and Italian/EU robotics research community.',
    socialCopy: {
      x: '🇮🇹 @IITGenova put together a practical OpenUSD scene composition guide for robotics — layers, references, payloads, variant sets, asset referencing.\n\nExactly what the OpenUSD-curious roboticists need 👇',
      linkedin: 'OpenUSD is becoming foundational to modern robotics simulation, and IIT Genova has put together one of the most practical guides to scene composition I have seen.\n\nThe walkthrough covers layer composition, references and payloads, variant sets for robot configurations, and asset referencing best practices. Strong reference material for any team adopting USD-based workflows. Link in comments.',
    },
  },
  {
    id: 'em-42',
    title: 'Newton Physics + MuJoCo Warp: Open-Source Simulation Deep Dive',
    channel: 'ETH Zurich Robotics',
    channelUrl: 'https://www.youtube.com/@ETHZurichRobotics',
    videoUrl: 'https://www.youtube.com/watch?v=Tn7qLrZ8WkV',
    youtubeId: 'Tn7qLrZ8WkV',
    channelType: 'university',
    country: 'Switzerland',
    region: 'emea',
    product: 'newton',
    level: 'advanced',
    durationMinutes: 76,
    views: 17300,
    publishedDate: '2026-04-05',
    description: 'ETH Zürich technical deep dive into the Newton open-source physics engine and its MuJoCo Warp backend — solver internals, contact dynamics, and benchmarking against existing simulators.',
    tags: ['newton', 'mujoco', 'physics', 'open-source', 'eth'],
    nvidiaRelevance: 'core',
    shouldPromote: true,
    promotionReason: 'ETH Zürich technical deep dive into Newton physics engine validates the open-source initiative and reaches the elite simulation research community.',
    socialCopy: {
      x: '🇨🇭 ETH Zürich just dropped a 76-min deep dive into Newton physics + MuJoCo Warp — solver internals, contact dynamics, benchmarks.\n\nThe most thorough Newton walkthrough out there 👇',
      linkedin: 'ETH Zürich has published one of the most thorough technical deep dives on the new open-source Newton physics engine, including its MuJoCo Warp backend.\n\nThe lecture covers solver internals, contact dynamics, and direct benchmarks against established simulators. Essential viewing for anyone serious about robotics simulation infrastructure. Link in comments.',
    },
  },
  {
    id: 'em-43',
    title: 'ROS 2 Humble + Isaac ROS Bridge: ROS-Industrial Workshop',
    channel: 'ROS Industrial',
    channelUrl: 'https://www.youtube.com/@ROSIndustrial',
    videoUrl: 'https://www.youtube.com/watch?v=Yp4qMnL8VkR',
    youtubeId: 'Yp4qMnL8VkR',
    channelType: 'open-source',
    country: 'Germany',
    region: 'emea',
    product: 'isaac-ros',
    level: 'intermediate',
    durationMinutes: 67,
    views: 14200,
    publishedDate: '2026-03-12',
    description: 'ROS-Industrial consortium workshop on bridging ROS 2 Humble with Isaac ROS 3.0 — message conversion, transform synchronization, GPU-accelerated perception nodes, and industrial use cases.',
    tags: ['ros2', 'isaac-ros', 'industrial', 'open-source', 'perception'],
    nvidiaRelevance: 'high',
    shouldPromote: true,
    promotionReason: 'ROS-Industrial consortium content bridging ROS 2 with Isaac ROS reaches the entire industrial robotics community and validates the open-source partnership.',
    socialCopy: {
      x: '🏭 @ROSIndustrial workshop on bridging ROS 2 Humble with Isaac ROS 3.0 — message conversion, TF sync, GPU perception nodes, real industrial use cases.\n\nThe official ROS community recommending Isaac ROS 👇',
      linkedin: 'The ROS-Industrial consortium has published a strong workshop on bridging ROS 2 Humble with NVIDIA Isaac ROS 3.0 — covering message conversion, transform synchronization, GPU-accelerated perception nodes, and real industrial use cases.\n\nWhen the official ROS-Industrial group recommends Isaac ROS for production workflows, that is a meaningful ecosystem signal. Link in comments.',
    },
  },
  {
    id: 'em-44',
    title: 'VLA Model Deployment on Jetson: Oxford Robotics Best Practices',
    channel: 'Oxford Robotics Institute',
    channelUrl: 'https://www.youtube.com/@OxfordRobotics',
    videoUrl: 'https://www.youtube.com/watch?v=Wn3qLpV8XkM',
    youtubeId: 'Wn3qLpV8XkM',
    channelType: 'university',
    country: 'UK',
    region: 'emea',
    product: 'jetson',
    level: 'advanced',
    durationMinutes: 58,
    views: 12800,
    publishedDate: '2026-04-18',
    description: 'Oxford Robotics Institute presents best practices for deploying vision-language-action models on Jetson Thor — TensorRT-LLM quantization, KV-cache optimization, and end-to-end latency tuning.',
    tags: ['vla', 'jetson', 'thor', 'tensorrt', 'quantization'],
    nvidiaRelevance: 'core',
    shouldPromote: true,
    promotionReason: 'VLA deployment best practices from Oxford Robotics fill a critical gap as more teams move foundation models to Jetson Thor in production.',
    socialCopy: {
      x: '🇬🇧 Oxford Robotics Institute published VLA deployment best practices on Jetson Thor — TensorRT-LLM quantization, KV-cache optimization, end-to-end latency tuning.\n\nProduction-grade reference content 👇',
      linkedin: 'Deploying vision-language-action models efficiently on edge hardware is one of the hardest engineering problems in robotics today, and Oxford Robotics Institute has published a strong best-practices guide for Jetson Thor.\n\nThe talk covers TensorRT-LLM quantization, KV-cache optimization, and end-to-end latency tuning. Essential reference for any team productionizing VLAs. Link in comments.',
    },
  },
  {
    id: 'em-45',
    title: 'Isaac Sim Synthetic Data Pipeline: Pollen Robotics + Reachy 2',
    channel: 'Pollen Robotics',
    channelUrl: 'https://www.youtube.com/@PollenRobotics',
    videoUrl: 'https://www.youtube.com/watch?v=Hn5qLpZ8VkN',
    youtubeId: 'Hn5qLpZ8VkN',
    channelType: 'independent',
    country: 'France',
    region: 'emea',
    product: 'isaac-sim',
    level: 'beginner',
    durationMinutes: 44,
    views: 10100,
    publishedDate: '2026-02-08',
    description: 'Pollen Robotics walks through their Isaac Sim synthetic data pipeline for the Reachy 2 humanoid — USD asset import, randomization, semantic masks, and dataset publishing for community use.',
    tags: ['isaac-sim', 'synthetic-data', 'reachy', 'humanoid', 'pollen'],
    nvidiaRelevance: 'core',
    shouldPromote: true,
    promotionReason: 'Pollen Robotics open-sourcing their Reachy 2 synthetic data pipeline strengthens the open humanoid ecosystem and showcases Isaac Sim adoption in EU.',
    socialCopy: {
      x: '🇫🇷 @pollenrobotics open-sourced their Isaac Sim synthetic data pipeline for the Reachy 2 humanoid — USD imports, randomization, semantic masks, public dataset.\n\nLove to see open humanoid work 👇',
      linkedin: 'Pollen Robotics has shared the synthetic data pipeline they built in Isaac Sim for their Reachy 2 humanoid — covering USD asset import, randomization strategies, semantic mask generation, and public dataset publishing.\n\nOpen, reproducible humanoid workflows like this are exactly what the community needs to accelerate Physical AI research. Link in comments.',
    },
  },

  // ── Global / Online (3) ────────────────────────────────────────────────────

  {
    id: 'gl-28',
    title: 'Isaac Lab para Robótica: Tutorial Completo em Português (Brazil)',
    channel: 'Robotica Brasil',
    channelUrl: 'https://www.youtube.com/@RoboticaBrasil',
    videoUrl: 'https://www.youtube.com/watch?v=1LPbc6MJq_k',
    youtubeId: '1LPbc6MJq_k',
    channelType: 'independent',
    country: 'Brazil',
    region: 'global',
    product: 'isaac-lab',
    level: 'beginner',
    durationMinutes: 58,
    views: 8400,
    publishedDate: '2026-04-12',
    description: 'Portuguese-language full Isaac Lab tutorial from the Brazilian robotics community — installation, first RL environment, reward engineering, and deploying to ROS 2. English subtitles available.',
    tags: ['isaac-lab', 'portuguese', 'brazil', 'beginner', 'ros2'],
    nvidiaRelevance: 'core',
    shouldPromote: true,
    promotionReason: 'Portuguese-language Isaac Lab content is virtually nonexistent — promoting Robotica Brasil opens a new LATAM developer audience for NVIDIA.',
    socialCopy: {
      x: '🇧🇷 @RoboticaBrasil acaba de lançar um tutorial completo de Isaac Lab em português — instalação, primeiro RL env, reward engineering, deploy ROS 2.\n\nLegendas em inglês também. Conteúdo LATAM forte 👇',
      linkedin: 'Latin America is one of the most underserved regions for Physical AI educational content, and Robotica Brasil is changing that with a complete Portuguese-language Isaac Lab tutorial.\n\nThe walkthrough covers installation, reinforcement learning environment design, reward engineering, and ROS 2 deployment. A meaningful contribution to growing the LATAM robotics community. Link in comments.',
    },
  },
  {
    id: 'gl-29',
    title: 'ROS 2 Humble: Complete Beginner\'s Guide to Physical AI',
    channel: 'ROS Community',
    channelUrl: 'https://www.youtube.com/@ROScommunity',
    videoUrl: 'https://www.youtube.com/watch?v=idQb2pB-h2Q',
    youtubeId: 'idQb2pB-h2Q',
    channelType: 'open-source',
    country: 'Global',
    region: 'global',
    product: 'isaac-ros',
    level: 'beginner',
    durationMinutes: 120,
    views: 54200,
    publishedDate: '2026-01-05',
    description: 'Open Robotics\' community-maintained mega-tutorial covering ROS 2 Humble foundations through Isaac ROS integration — nodes, topics, services, transforms, sensor drivers, and bridging to Isaac Sim.',
    tags: ['ros2', 'isaac-ros', 'beginner', 'navigation', 'transforms'],
    isFeatured: true,
    nvidiaRelevance: 'high',
    shouldPromote: true,
    promotionReason: '54K views on a 2-hour ROS 2 + Isaac ROS mega-tutorial proves real demand for foundational Physical AI content from the open-source community.',
    socialCopy: {
      x: '📚 The Open Robotics community-maintained ROS 2 Humble + Isaac ROS mega-tutorial is at 54K views — and it\'s easy to see why.\n\n2 hours covering nodes, topics, transforms, sensor drivers, and Isaac Sim bridging. The definitive beginner guide 👇',
      linkedin: 'The Open Robotics community has built what may be the definitive ROS 2 + Isaac ROS beginner resource — a 2-hour mega-tutorial that\'s already at 54K views.\n\nIt covers ROS 2 Humble fundamentals (nodes, topics, services, transforms), sensor drivers, and bridging to Isaac Sim. If you\'re onboarding to Physical AI, this is where to start. Link in comments.',
    },
  },
  {
    id: 'gl-30',
    title: 'Diffusion Policies & VLAs: A Hands-On Survey with LeRobot (Global Stream)',
    channel: 'Hugging Face',
    channelUrl: 'https://www.youtube.com/@HuggingFace',
    videoUrl: 'https://www.youtube.com/watch?v=tSPq7d2n_8c',
    youtubeId: 'tSPq7d2n_8c',
    channelType: 'open-source',
    country: 'Global',
    region: 'global',
    product: 'groot',
    level: 'intermediate',
    durationMinutes: 83,
    views: 41700,
    publishedDate: '2026-04-20',
    description: 'Hugging Face\'s survey of modern robot learning paradigms — BC, diffusion policy, ACT, Pi-0, and GR00T — with live code demos in LeRobot and discussion of Isaac Lab as a data augmentation backend.',
    tags: ['diffusion-policy', 'vla', 'lerobot', 'groot', 'imitation-learning'],
    nvidiaRelevance: 'high',
    shouldPromote: true,
    promotionReason: 'Hugging Face survey explicitly positions Isaac Lab as a data-augmentation backend for GR00T-style policies — high-credibility ecosystem alignment we should amplify.',
    socialCopy: {
      x: '🌐 @HuggingFace just dropped an 83-min hands-on survey of modern robot learning — BC, diffusion policy, ACT, Pi-0, GR00T — with live LeRobot demos and Isaac Lab as the data-aug backend.\n\n41K views. Required watching 👇',
      linkedin: 'Hugging Face has published one of the best survey talks on modern robot learning paradigms I\'ve seen this year — 83 minutes covering BC, diffusion policy, ACT, Pi-0, and GR00T, with live LeRobot demos.\n\nNotably, the talk positions Isaac Lab as a data-augmentation backend for these policies — a strong ecosystem signal. 41K views and growing. Link in comments.',
    },
  },
  {
    id: 'gl-46',
    title: 'OpenUSD for Physical AI: Open Robotics Global Stream',
    channel: 'Open Robotics',
    channelUrl: 'https://www.youtube.com/@OpenRobotics',
    videoUrl: 'https://www.youtube.com/watch?v=Vr8mLpZ3WkX',
    youtubeId: 'Vr8mLpZ3WkX',
    channelType: 'open-source',
    country: 'Global',
    region: 'global',
    product: 'omniverse',
    level: 'beginner',
    durationMinutes: 71,
    views: 24800,
    publishedDate: '2026-03-28',
    description: 'Open Robotics global community stream introducing OpenUSD for Physical AI — why it matters, how it integrates with ROS 2 and Isaac, and a live walkthrough of a multi-robot scene.',
    tags: ['usd', 'open-source', 'ros2', 'omniverse', 'community'],
    isFeatured: true,
    nvidiaRelevance: 'high',
    shouldPromote: true,
    promotionReason: 'Open Robotics community stream on OpenUSD reaches the entire global ROS audience and broadens the OpenUSD ecosystem narrative beyond NVIDIA channels.',
    socialCopy: {
      x: '🌐 @OpenRoboticsOrg ran a global community stream on OpenUSD for Physical AI — why it matters, ROS 2 integration, multi-robot scene walkthrough.\n\nThe ROS community embracing USD is huge 👇',
      linkedin: 'Open Robotics has run a global community stream introducing OpenUSD to the Physical AI audience — covering why it matters, how it integrates with ROS 2 and Isaac, and a live walkthrough of a multi-robot scene.\n\nWhen the steward of the ROS ecosystem actively educates on OpenUSD, that is a meaningful step for the entire robotics community. Link in comments.',
    },
  },
  {
    id: 'gl-47',
    title: 'Community Challenge Recap: GR00T Hackathon Winners Showcase',
    channel: 'Hugging Face',
    channelUrl: 'https://www.youtube.com/@HuggingFace',
    videoUrl: 'https://www.youtube.com/watch?v=Mp8qLrZ4VkB',
    youtubeId: 'Mp8qLrZ4VkB',
    channelType: 'open-source',
    country: 'Global',
    region: 'global',
    product: 'groot',
    level: 'intermediate',
    durationMinutes: 92,
    views: 31600,
    publishedDate: '2026-04-28',
    description: 'Recap of the global GR00T community hackathon — winning projects across cross-embodiment transfer, fine-tuning, and creative deployment, with live demos from teams in 14 countries.',
    tags: ['groot', 'community', 'hackathon', 'open-source', 'showcase'],
    nvidiaRelevance: 'core',
    shouldPromote: true,
    promotionReason: 'GR00T global hackathon recap is high-energy community proof: real builders, real demos, real diversity — perfect amplification fuel.',
    socialCopy: {
      x: '🏆 The global GR00T hackathon recap is here — winning projects from 14 countries across cross-embodiment transfer, fine-tuning, and creative deployments.\n\nThe community is shipping incredible work 👇',
      linkedin: 'The global GR00T community hackathon recap is live — featuring winning projects from teams across 14 countries spanning cross-embodiment transfer, fine-tuning, and creative deployments.\n\nThis is the kind of energy and creativity Physical AI needs to scale globally. Massive credit to Hugging Face and the community organizers. Link in comments.',
    },
  },
  {
    id: 'gl-48',
    title: 'Isaac Lab + Newton: A Side-by-Side Tutorial for New Users',
    channel: 'Open Robotics',
    channelUrl: 'https://www.youtube.com/@OpenRobotics',
    videoUrl: 'https://www.youtube.com/watch?v=Bn2qLpV8XkR',
    youtubeId: 'Bn2qLpV8XkR',
    channelType: 'open-source',
    country: 'Global',
    region: 'global',
    product: 'newton',
    level: 'beginner',
    durationMinutes: 53,
    views: 18900,
    publishedDate: '2026-04-22',
    description: 'Side-by-side tutorial introducing both Isaac Lab and the new Newton physics simulator — when to use each, how they integrate, and a beginner-friendly walkthrough of a shared cartpole environment.',
    tags: ['isaac-lab', 'newton', 'open-source', 'beginner', 'physics'],
    nvidiaRelevance: 'core',
    shouldPromote: true,
    promotionReason: 'Side-by-side Isaac Lab and Newton tutorial from Open Robotics is the clearest community on-ramp into the new open-source physics stack.',
    socialCopy: {
      x: '🆕 @OpenRoboticsOrg made the side-by-side Isaac Lab + Newton tutorial new users have been asking for — when to use each, how they integrate, shared cartpole walkthrough.\n\nThe friendliest entry point yet 👇',
      linkedin: 'Open Robotics has put together what may be the friendliest entry point yet to the new open-source physics stack — a side-by-side tutorial covering both Isaac Lab and Newton.\n\nThe walkthrough explains when to use each, how they integrate, and works through a shared cartpole environment that beginners can run end-to-end. Excellent on-ramp for new contributors. Link in comments.',
    },
  },
];

// ─── Constants ──────────────────────────────────────────────────────────────────

const ALL_PRODUCTS: NvidiaProduct[] = [
  'isaac-sim', 'isaac-lab', 'isaac-ros', 'groot', 'cosmos', 'jetson', 'omniverse',
];

const ALL_LEVELS: VideoLevel[] = ['beginner', 'intermediate', 'advanced'];

const ALL_REGIONS = Object.keys(REGION_META) as Region[];

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'featured',    label: 'Featured first' },
  { id: 'newest',      label: 'Newest'         },
  { id: 'most-viewed', label: 'Most views'     },
  { id: 'shortest',    label: 'Shortest'       },
  { id: 'longest',     label: 'Longest'        },
];

const LEVEL_STYLE: Record<VideoLevel, { badge: string; dot: string; label: string }> = {
  beginner:     { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400', label: 'Beginner'     },
  intermediate: { badge: 'bg-amber-100 text-amber-700 border-amber-200',       dot: 'bg-amber-400',   label: 'Intermediate' },
  advanced:     { badge: 'bg-red-100 text-red-700 border-red-200',             dot: 'bg-red-400',     label: 'Advanced'     },
};

const CHANNEL_TYPE_STYLE: Record<ChannelType, string> = {
  'nvidia-official': 'bg-[#76B900]/15 text-[#3d6300] border-[#76B900]/30',
  'open-source':     'bg-yellow-50 text-yellow-700 border-yellow-200',
  'university':      'bg-violet-50 text-violet-700 border-violet-200',
  'independent':     'bg-blue-50 text-blue-700 border-blue-200',
};

const CHANNEL_TYPE_LABEL: Record<ChannelType, string> = {
  'nvidia-official': 'NVIDIA Official',
  'open-source':     'Open Source',
  'university':      'University Lab',
  'independent':     'Independent',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ProductBadge({ product }: { product: NvidiaProduct }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded bg-[#76B900] text-white leading-none">
      {NVIDIA_PRODUCT_LABELS[product]}
    </span>
  );
}

function LevelBadge({ level }: { level: VideoLevel }) {
  const s = LEVEL_STYLE[level];
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded border leading-none capitalize', s.badge)}>
      <span className={clsx('inline-block w-1.5 h-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  );
}

function RegionBadge({ region, country }: { region: Region; country: string }) {
  const meta = REGION_META[region];
  return (
    <span className={clsx('inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-medium rounded leading-none', meta.color)}>
      {meta.emoji} {country}
    </span>
  );
}

function ChannelTypeBadge({ type }: { type: ChannelType }) {
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded border leading-none', CHANNEL_TYPE_STYLE[type])}>
      {CHANNEL_TYPE_LABEL[type]}
    </span>
  );
}

// Featured compact card (horizontal scroll row)
function FeaturedCard({ video }: { video: Video }) {
  const thumbnail = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
  return (
    <a
      href={video.videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-none w-64 bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all group"
    >
      <div className="relative">
        <img src={thumbnail} alt={video.title} className="w-full h-36 object-cover" />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-white/90 rounded-full p-2">
            <Play size={16} className="text-gray-800 fill-gray-800" />
          </div>
        </div>
        <div className="absolute bottom-1.5 right-1.5 bg-black/75 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
          {formatDuration(video.durationMinutes)}
        </div>
        {video.nvidiaRelevance === 'core' && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#76B900] to-emerald-400" />
        )}
      </div>
      <div className="p-3 space-y-1.5">
        <p className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
          {video.title}
        </p>
        <p className="text-[10px] text-gray-500">{video.channel} · {video.country}</p>
        <div className="flex items-center gap-1 flex-wrap">
          <ProductBadge product={video.product} />
          <LevelBadge level={video.level} />
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          <span className="flex items-center gap-0.5"><Eye size={9} /> {formatViews(video.views)}</span>
          <span>{formatDate(video.publishedDate)}</span>
        </div>
      </div>
    </a>
  );
}

// Standard list card
function SocialCopyBlock({ copy }: { copy: { x: string; linkedin: string } }) {
  const [copied, setCopied] = useState<'x' | 'linkedin' | null>(null);
  const copyText = (text: string, platform: 'x' | 'linkedin') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(platform);
      setTimeout(() => setCopied(null), 1800);
    });
  };
  return (
    <div className="mt-2 border-t border-gray-100 pt-2 space-y-1.5">
      <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide">Recommended social copy</p>
      {(['x', 'linkedin'] as const).map(platform => (
        <div key={platform} className="bg-gray-50 rounded-lg p-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-gray-500 uppercase">{platform === 'x' ? '𝕏 Twitter' : 'LinkedIn'}</span>
            <button
              onClick={() => copyText(platform === 'x' ? copy.x : copy.linkedin, platform)}
              className="text-[10px] px-1.5 py-0.5 bg-white border border-gray-200 rounded text-gray-500 hover:text-blue-600 hover:border-blue-300 transition-colors"
            >
              {copied === platform ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-[10px] text-gray-600 leading-relaxed whitespace-pre-line line-clamp-4">
            {platform === 'x' ? copy.x : copy.linkedin}
          </p>
        </div>
      ))}
    </div>
  );
}

function VideoCard({ video }: { video: Video }) {
  const [showCopy, setShowCopy] = useState(false);
  const thumbnail = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
  return (
    <div className={clsx(
      'bg-white border rounded-xl overflow-hidden hover:shadow-sm transition-all group relative',
      video.nvidiaRelevance === 'core'
        ? 'border-[#76B900]/30 hover:border-[#76B900]/60'
        : 'border-gray-200 hover:border-gray-300'
    )}>
      {video.nvidiaRelevance === 'core' && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#76B900] to-emerald-400" />
      )}
      <div className="flex gap-0">
        {/* Thumbnail */}
        <a
          href={video.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative flex-none w-40 sm:w-48"
        >
          <img src={thumbnail} alt={video.title} className="w-full h-full object-cover min-h-[100px]" />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-white/90 rounded-full p-1.5">
              <Play size={14} className="text-gray-800 fill-gray-800" />
            </div>
          </div>
          <div className="absolute bottom-1 right-1 bg-black/75 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
            {formatDuration(video.durationMinutes)}
          </div>
        </a>

        {/* Info */}
        <div className="flex-1 p-3 min-w-0 flex flex-col justify-between">
          <div className="space-y-1">
            <a
              href={video.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm font-semibold text-gray-800 leading-snug line-clamp-2 hover:text-blue-600 transition-colors"
            >
              {video.title}
            </a>
            <div className="flex items-center gap-1.5 flex-wrap">
              <a
                href={video.channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-blue-500 transition-colors inline-flex items-center gap-0.5"
              >
                {video.channel}
                <ExternalLink size={8} className="opacity-40" />
              </a>
            </div>
            <p className="text-xs text-gray-400 line-clamp-1 leading-snug">{video.description}</p>
          </div>

          <div className="mt-2 space-y-1.5">
            <div className="flex items-center gap-1 flex-wrap">
              <ProductBadge product={video.product} />
              <LevelBadge level={video.level} />
              <ChannelTypeBadge type={video.channelType} />
              <RegionBadge region={video.region} country={video.country} />
              {(() => {
                const text = `${video.title} ${video.description} ${video.tags.join(' ')} ${video.product}`.toLowerCase();
                const isOpenUSD = /openusd|usd composer|omniverse|scene description|pixar usd|hydra/.test(text);
                return isOpenUSD ? (
                  <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">🔷 OpenUSD</span>
                ) : null;
              })()}
            </div>
            <div className="flex items-center gap-2.5 text-[10px] text-gray-400">
              <span className="flex items-center gap-0.5"><Eye size={9} /> {formatViews(video.views)} views</span>
              <span className="flex items-center gap-0.5"><Clock size={9} /> {formatDate(video.publishedDate)}</span>
            </div>
            {video.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {video.tags.slice(0, 4).map(tag => (
                  <span key={tag} className="px-1.5 py-0.5 text-[9px] font-medium bg-gray-100 text-gray-500 rounded">
                    {tag}
                  </span>
                ))}
                {video.tags.length > 4 && (
                  <span className="text-[9px] text-gray-400">+{video.tags.length - 4}</span>
                )}
              </div>
            )}
            {video.shouldPromote && (
              <div className="mt-1.5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ⭐ Promote
                  </span>
                  {video.socialCopy && (
                    <button
                      onClick={() => setShowCopy(v => !v)}
                      className="text-[10px] text-blue-500 hover:text-blue-700 font-medium"
                    >
                      {showCopy ? 'Hide copy ▲' : 'Social copy ▼'}
                    </button>
                  )}
                </div>
                {video.promotionReason && (
                  <p className="text-[10px] text-emerald-700 mt-0.5 leading-relaxed">{video.promotionReason}</p>
                )}
                {showCopy && video.socialCopy && <SocialCopyBlock copy={video.socialCopy} />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

function VideoExportButton({ videos }: { videos: Video[] }) {
  const [open, setOpen] = useState(false);
  if (videos.length === 0) return null;
  const columns = [
    { header: 'Title',         accessor: (v: Video) => v.title, width: 60 },
    { header: 'Channel',       accessor: (v: Video) => v.channel, width: 32 },
    { header: 'Channel Type',  accessor: (v: Video) => v.channelType, width: 22 },
    { header: 'Country',       accessor: (v: Video) => v.country, width: 22 },
    { header: 'Region',        accessor: (v: Video) => v.region, width: 16 },
    { header: 'Product',       accessor: (v: Video) => NVIDIA_PRODUCT_LABELS[v.product], width: 22 },
    { header: 'Level',         accessor: (v: Video) => v.level, width: 18 },
    { header: 'Duration (min)',accessor: (v: Video) => v.durationMinutes, width: 18 },
    { header: 'Views',         accessor: (v: Video) => v.views, width: 18 },
    { header: 'Published',     accessor: (v: Video) => v.publishedDate, width: 22 },
    { header: 'Featured',      accessor: (v: Video) => v.isFeatured ? 'Yes' : '', width: 14 },
    { header: 'Should Promote',accessor: (v: Video) => v.shouldPromote ? 'Yes' : '', width: 18 },
    { header: 'Promote Reason',accessor: (v: Video) => v.promotionReason ?? '', width: 70 },
    { header: 'X Copy',        accessor: (v: Video) => v.socialCopy?.x ?? '', width: 80 },
    { header: 'LinkedIn Copy', accessor: (v: Video) => v.socialCopy?.linkedin ?? '', width: 100 },
    { header: 'Tags',          accessor: (v: Video) => v.tags.join(', '), width: 50 },
    { header: 'Description',   accessor: (v: Video) => v.description, width: 100 },
    { header: 'Video URL',     accessor: (v: Video) => v.videoUrl, width: 50 },
  ];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border font-medium bg-white text-gray-600 border-gray-200 hover:border-gray-400 transition-all"
      >
        <Download size={12} />
        Export <span className="text-gray-400 font-normal">({videos.length})</span>
        <ChevronDown size={11} className={clsx('transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
            <button
              onClick={() => { exportToExcel({ filename: 'dev_videos', sheetName: 'Dev Videos', data: videos, columns }); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 text-left transition-colors"
            >
              <FileSpreadsheet size={14} className="text-emerald-600" />
              <div>
                <p className="font-semibold">Excel (.xlsx)</p>
                <p className="text-[10px] text-gray-400">Auto-sized columns</p>
              </div>
            </button>
            <button
              onClick={() => { exportToPDF({ filename: 'dev_videos', title: 'Developer Videos & Tutorials', data: videos, columns }); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-rose-50 hover:text-rose-700 text-left transition-colors border-t border-gray-100"
            >
              <FileDown size={14} className="text-rose-600" />
              <div>
                <p className="font-semibold">PDF (.pdf)</p>
                <p className="text-[10px] text-gray-400">Landscape A4 with table</p>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function VideosDashboard({ persona: _persona }: { persona?: string } = {}) {
  const [search, setSearch]               = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Set<NvidiaProduct>>(new Set());
  const [selectedLevel, setSelectedLevel] = useState<VideoLevel | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedType, setSelectedType]   = useState<ChannelType | null>(null);
  const [openUSDOnly, setOpenUSDOnly]     = useState(false);
  const [ossOnly, setOssOnly]             = useState(false);
  const [sortBy, setSortBy]               = useState<SortOption>('featured');
  const [showFilters, setShowFilters]     = useState(false);

  const toggleProduct = (product: NvidiaProduct) => {
    setSelectedProducts(prev => {
      const next = new Set(prev);
      next.has(product) ? next.delete(product) : next.add(product);
      return next;
    });
  };

  const featured = useMemo(() => VIDEOS.filter(v => v.isFeatured), []);

  const allFiltered = useMemo(() => {
    let result = VIDEOS.filter(v => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const hit =
          v.title.toLowerCase().includes(q) ||
          v.description.toLowerCase().includes(q) ||
          v.channel.toLowerCase().includes(q) ||
          v.country.toLowerCase().includes(q) ||
          v.tags.some(t => t.includes(q)) ||
          NVIDIA_PRODUCT_LABELS[v.product].toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (selectedProducts.size > 0 && !selectedProducts.has(v.product)) return false;
      if (selectedLevel && v.level !== selectedLevel) return false;
      if (selectedRegion && v.region !== selectedRegion) return false;
      if (selectedType && v.channelType !== selectedType) return false;
      if (openUSDOnly) {
        const text = `${v.title} ${v.description} ${v.tags.join(' ')} ${v.product}`.toLowerCase();
        const isOpenUSD = /openusd|usd composer|omniverse|scene description|pixar usd|hydra/.test(text);
        if (!isOpenUSD) return false;
      }
      if (ossOnly) {
        const text = `${v.title} ${v.description} ${v.tags.join(' ')} ${v.channel}`.toLowerCase();
        const isOSS = v.channelType === 'open-source' || /open-source|open source|github|lerobot|ros|mujoco|hugging face/.test(text);
        if (!isOSS) return false;
      }
      return true;
    });

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'featured': {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return  1;
          return b.views - a.views;
        }
        case 'newest':      return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
        case 'most-viewed': return b.views - a.views;
        case 'shortest':    return a.durationMinutes - b.durationMinutes;
        case 'longest':     return b.durationMinutes - a.durationMinutes;
        default:            return 0;
      }
    });

    return result;
  }, [search, selectedProducts, selectedLevel, selectedRegion, selectedType, openUSDOnly, ossOnly, sortBy]);

  const hasFilters = selectedProducts.size > 0 || selectedLevel !== null
    || selectedRegion !== null || selectedType !== null || openUSDOnly || ossOnly || search.trim().length > 0;

  const clearFilters = () => {
    setSearch('');
    setSelectedProducts(new Set());
    setSelectedLevel(null);
    setSelectedRegion(null);
    setSelectedType(null);
    setOpenUSDOnly(false);
    setOssOnly(false);
  };

  // Count helpers
  const levelCounts = useMemo(() => {
    const c: Partial<Record<VideoLevel, number>> = {};
    VIDEOS.forEach(v => { c[v.level] = (c[v.level] ?? 0) + 1; });
    return c;
  }, []);

  const regionCounts = useMemo(() => {
    const c: Partial<Record<Region, number>> = {};
    VIDEOS.forEach(v => { c[v.region] = (c[v.region] ?? 0) + 1; });
    return c;
  }, []);

  return (
    <div className="flex flex-col space-y-5">

      {/* Header row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Developer Videos &amp; Tutorials</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {VIDEOS.length} curated Physical AI tutorials from global creators — NVIDIA official, open-source, university labs, and independent developers.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={clsx(
              'inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border font-medium transition-all',
              showFilters
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            )}
          >
            <Filter size={12} />
            Filters
            {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
          </button>

          {/* Export */}
          <VideoExportButton videos={allFiltered} />

          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-red-500 underline transition-colors">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search videos, channels, countries, topics…"
          className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Product filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {ALL_PRODUCTS.map(product => (
          <button
            key={product}
            onClick={() => toggleProduct(product)}
            className={clsx(
              'px-3 py-1 text-xs rounded-full border font-medium transition-colors',
              selectedProducts.has(product)
                ? 'bg-[#76B900] text-white border-[#76B900]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-[#76B900]/50 hover:bg-[#76B900]/5'
            )}
          >
            {NVIDIA_PRODUCT_LABELS[product]}
          </button>
        ))}
      </div>

      {/* Expanded filter panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
          {/* Level */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Skill Level</p>
            <div className="flex flex-wrap gap-1.5">
              {ALL_LEVELS.map(level => {
                const s = LEVEL_STYLE[level];
                return (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(selectedLevel === level ? null : level)}
                    className={clsx(
                      'text-xs px-3 py-1 rounded-full font-medium transition-all border',
                      selectedLevel === level ? s.badge + ' ring-1 ring-inset ring-current' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                    )}
                  >
                    <span className={clsx('inline-block w-1.5 h-1.5 rounded-full mr-1', s.dot)} />
                    {s.label} ({levelCounts[level] ?? 0})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Region */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Region</p>
            <div className="flex flex-wrap gap-1.5">
              {ALL_REGIONS.map(r => {
                const meta = REGION_META[r];
                return (
                  <button
                    key={r}
                    onClick={() => setSelectedRegion(selectedRegion === r ? null : r)}
                    className={clsx(
                      'text-xs px-3 py-1 rounded-full font-medium transition-all',
                      selectedRegion === r ? meta.color + ' ring-1 ring-inset ring-current' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {meta.emoji} {meta.short} ({regionCounts[r] ?? 0})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Creator type */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Creator Type</p>
            <div className="flex flex-wrap gap-1.5">
              {(Object.entries(CHANNEL_TYPE_LABEL) as [ChannelType, string][]).map(([type, label]) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(selectedType === type ? null : type)}
                  className={clsx(
                    'text-xs px-3 py-1 rounded-full font-medium transition-all border',
                    selectedType === type
                      ? CHANNEL_TYPE_STYLE[type] + ' ring-1 ring-inset ring-current'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags row */}
          <div>
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tags</div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setOpenUSDOnly(v => !v)}
                className={clsx(
                  'inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold border transition-all',
                  openUSDOnly ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100'
                )}
              >
                🔷 OpenUSD
              </button>
              <button
                onClick={() => setOssOnly(v => !v)}
                className={clsx(
                  'inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold border transition-all',
                  ossOnly ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                )}
              >
                ⚡ OSS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Distribution insight bar */}
      {!hasFilters && (
        <div className="bg-blue-50/60 border border-blue-100 rounded-lg px-4 py-2.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-blue-700">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <BarChart3 size={11} /> Global distribution
          </span>
          <span>🌎 Americas 40%</span>
          <span>🌏 APAC 23%</span>
          <span>🌍 EMEA 27%</span>
          <span>🌐 Global 10%</span>
          <span className="ml-auto text-blue-500 font-medium">
            🟢 Beginner {levelCounts.beginner} · 🟡 Intermediate {levelCounts.intermediate} · 🔴 Advanced {levelCounts.advanced}
          </span>
        </div>
      )}

      {/* Featured row — hidden when any filter is active */}
      {!hasFilters && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Star size={13} className="text-amber-400 fill-amber-400" />
              Featured Picks
            </h3>
            <span className="text-xs text-gray-400">{featured.length} videos</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
            {featured.map(video => (
              <FeaturedCard key={video.id} video={video} />
            ))}
            <div className="flex-none w-14 flex items-center justify-center text-gray-200 hover:text-gray-400 transition-colors cursor-default">
              <ChevronRight size={20} />
            </div>
          </div>
        </section>
      )}

      {/* Result count */}
      <div className="flex items-center justify-between px-0.5">
        <p className="text-xs text-gray-500">
          <span className="font-semibold text-gray-700">{allFiltered.length}</span>{' '}
          {hasFilters ? 'results' : 'videos'}
          {hasFilters && <span className="text-blue-600 ml-1">(filtered)</span>}
        </p>
      </div>

      {/* Main video list */}
      {allFiltered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <BookOpen size={32} className="mb-3 opacity-30" />
          <p className="text-sm font-medium text-gray-500">No videos match your filters</p>
          <button onClick={clearFilters} className="mt-3 text-xs text-blue-500 hover:underline">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 pb-6">
          {allFiltered.map(video => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}

      {/* Attribution footer */}
      <div className="border-t border-gray-100 pt-3 text-[10px] text-gray-400 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1">
          <Globe size={9} />
          <strong className="text-gray-500">Creators:</strong> NVIDIA Developer · Hugging Face · ROS Community · ETH Zürich · TU Munich · Imperial College · BAIR Lab · KAUST · Oxford Robotics · RTX Robotics JP · AI Robotics Korea · AI Robotics India · OpenRobotics AU · Robotica Brasil · BMW Group Technology + more
        </span>
        <span className="ml-auto inline-flex items-center gap-1">
          <Zap size={9} className="text-[#76B900]" />
          Curated May 2026
        </span>
      </div>
    </div>
  );
}
