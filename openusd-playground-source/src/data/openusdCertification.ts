import type { LucideIcon } from 'lucide-react';

export type OpenUSDDomainId =
  | 'composition'
  | 'content-aggregation'
  | 'customizing-usd'
  | 'data-exchange'
  | 'data-modeling'
  | 'debugging'
  | 'pipeline-development'
  | 'visualization';

export interface ExamBlueprintDomain {
  id: OpenUSDDomainId;
  label: string;
  weight: number;
  shortLabel: string;
  summary: string;
  studySignals: string[];
  moduleIds: string[];
}

export interface OpenUSDLearningModule {
  id: string;
  moduleNumber?: number;
  title: string;
  subtitle: string;
  docsUrl: string;
  estimatedHours: number;
  difficulty: 'Start Here' | 'Core' | 'Applied' | 'Advanced';
  examDomains: OpenUSDDomainId[];
  whyItMatters: string;
  lessons: string[];
  coreIdeas: string[];
  practicePrompts: string[];
  checkpoint: string;
}

export interface OpenUSDGlossaryTerm {
  id: string;
  term: string;
  plainEnglish: string;
  certAngle: string;
  relatedModuleIds: string[];
  domainIds: OpenUSDDomainId[];
}

export interface PracticeQuestion {
  id: string;
  domainId: OpenUSDDomainId;
  moduleId: string;
  prompt: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
  sourceHint: string;
}

export interface ContributionIdea {
  title: string;
  value: string;
  likelyFiles: string[];
  firstStep: string;
}

export const learnOpenUSDSourceUrl = 'https://docs.nvidia.com/learn-openusd/latest/index.html';
export const learnOpenUSDRepoUrl = 'https://github.com/NVIDIA-Omniverse/LearnOpenUSD';
export const certificationUrl = 'https://www.nvidia.com/en-us/learn/certification/openusd-development-professional/';
export const studyGuideUrl = 'https://nvdam.widen.net/s/6kxsqcsrrw/ncp-openusd-development-study-guide';

export const examSnapshot = {
  name: 'NCP-OpenUSD Development',
  level: 'Professional',
  duration: '120 minutes',
  questionCount: '60-70 questions',
  format: 'Online, remotely proctored',
  validity: '2 years',
  note: 'Verify registration details on NVIDIA before scheduling.',
};

export const examBlueprintDomains: ExamBlueprintDomain[] = [
  {
    id: 'composition',
    label: 'Composition',
    shortLabel: 'Composition',
    weight: 23,
    summary: 'Author, choose, and debug composition arcs, including LIVERPS strength ordering.',
    studySignals: [
      'Explain what each arc does in a production asset.',
      'Trace why one opinion wins over another.',
      'Know when references, payloads, inherits, specializes, variants, and sublayers fit.',
    ],
    moduleIds: ['composition-basics', 'creating-composition-arcs', 'asset-structure'],
  },
  {
    id: 'data-exchange',
    label: 'Data Exchange',
    shortLabel: 'Exchange',
    weight: 15,
    summary: 'Map source data into USD, build import/export logic, validate assets, and transform hierarchy.',
    studySignals: [
      'Describe a source-to-USD mapping document.',
      'Separate extraction, transformation, validation, and export responsibilities.',
      'Know why tests matter in a converter pipeline.',
    ],
    moduleIds: ['data-exchange', 'stage-setting', 'asset-structure'],
  },
  {
    id: 'pipeline-development',
    label: 'Pipeline Development',
    shortLabel: 'Pipeline',
    weight: 14,
    summary: 'Design practical pipeline workflows around versioning, build configs, asset management, and delivery.',
    studySignals: [
      'Reason about asset dependencies and proprietary data removal.',
      'Know what flattening solves and what it gives up.',
      'Connect USD concepts to team workflows, not only file syntax.',
    ],
    moduleIds: ['asset-structure', 'data-exchange', 'beyond-basics'],
  },
  {
    id: 'data-modeling',
    label: 'Data Modeling',
    shortLabel: 'Modeling',
    weight: 13,
    summary: 'Understand Usd and Sdf concepts such as prims, properties, paths, value types, schemas, and time samples.',
    studySignals: [
      'Use the right words for stage, layer, prim, property, attribute, relationship, and metadata.',
      'Recognize built-in schemas and value types.',
      'Explain time-sampled versus default values.',
    ],
    moduleIds: ['stage-setting', 'scene-description-blueprints', 'beyond-basics'],
  },
  {
    id: 'debugging',
    label: 'Debugging and Troubleshooting',
    shortLabel: 'Debug',
    weight: 11,
    summary: 'Inspect stages, explain unexpected composition results, and find poorly authored or slow scene data.',
    studySignals: [
      'Use layer stacks and strength ordering to diagnose results.',
      'Check active state, payload loading, value resolution, and paths.',
      'Connect scene structure choices to performance symptoms.',
    ],
    moduleIds: ['creating-composition-arcs', 'beyond-basics', 'asset-modularity-instancing'],
  },
  {
    id: 'content-aggregation',
    label: 'Content Aggregation',
    shortLabel: 'Aggregation',
    weight: 10,
    summary: 'Build large scenes from modular assets and use instancing strategies for scale.',
    studySignals: [
      'Describe model kinds, components, groups, and assemblies.',
      'Know native instancing versus point instancing.',
      'Explain how to override or refine instanced content safely.',
    ],
    moduleIds: ['asset-structure', 'asset-modularity-instancing', 'creating-composition-arcs'],
  },
  {
    id: 'visualization',
    label: 'Visualization',
    shortLabel: 'Viz',
    weight: 8,
    summary: 'Work with common visual domains including UsdGeom, UsdShade, UsdLux, cameras, meshes, materials, and lights.',
    studySignals: [
      'Recognize common scene-description schemas.',
      'Understand transforms, lights, materials, and primvars at a practical level.',
      'Know enough Hydra vocabulary to orient a rendering discussion.',
    ],
    moduleIds: ['scene-description-blueprints', 'beyond-basics', 'asset-modularity-instancing'],
  },
  {
    id: 'customizing-usd',
    label: 'Customizing USD',
    shortLabel: 'Customize',
    weight: 6,
    summary: 'Understand extension points such as schemas, plugins, custom model kinds, file formats, and fallbacks.',
    studySignals: [
      'Know when a custom schema is more appropriate than loose custom properties.',
      'Understand plugin-level extension points at a conceptual level.',
      'Recognize variant fallback and custom model kind scenarios.',
    ],
    moduleIds: ['scene-description-blueprints', 'beyond-basics', 'data-exchange'],
  },
];

export const openUSDLearningModules: OpenUSDLearningModule[] = [
  {
    id: 'orientation',
    title: 'Orientation: What OpenUSD Is',
    subtitle: 'A shared language for describing complex 3D worlds.',
    docsUrl: 'https://docs.nvidia.com/learn-openusd/latest/what-openusd/index.html',
    estimatedHours: 1,
    difficulty: 'Start Here',
    examDomains: ['data-modeling', 'pipeline-development'],
    whyItMatters: 'This gives you the big picture before the vocabulary gets dense: OpenUSD is not just a file extension, it is a way to compose many opinions about a scene into one reliable result.',
    lessons: ['What Is OpenUSD?', 'Why USD is a scene description system', 'Where USD fits in 3D pipelines'],
    coreIdeas: [
      'USD separates scene description from any single tool.',
      'Many teams can author different layers of the same asset or scene.',
      'The certification expects pipeline reasoning, not memorized syntax alone.',
    ],
    practicePrompts: [
      'Explain OpenUSD to a producer or project manager in three sentences.',
      'Name one problem USD solves that a single exported 3D file does not solve well.',
    ],
    checkpoint: 'You can explain why USD is a pipeline system instead of only a 3D file format.',
  },
  {
    id: 'stage-setting',
    moduleNumber: 1,
    title: 'Setting the Stage',
    subtitle: 'Stages, prims, properties, paths, time, files, modules, and metadata.',
    docsUrl: 'https://docs.nvidia.com/learn-openusd/latest/stage-setting/index.html',
    estimatedHours: 5,
    difficulty: 'Core',
    examDomains: ['data-modeling', 'debugging', 'visualization'],
    whyItMatters: 'This is the vocabulary layer. If stage, layer, prim, attribute, relationship, path, and metadata are fuzzy, every later composition topic will feel harder than it needs to.',
    lessons: ['Stage', 'Prims', 'Properties', 'Attributes', 'Relationships', 'Time Codes and Time Samples', 'Prim and Property Paths', 'OpenUSD File Formats', 'OpenUSD Modules', 'Metadata'],
    coreIdeas: [
      'A stage is the composed view you work with.',
      'Prims are the scene graph objects; properties describe or connect them.',
      'Attributes hold typed values, while relationships target other scene objects.',
      'Paths give stable addresses to prims and properties.',
    ],
    practicePrompts: [
      'Given /World/Car/Wheel.radius, identify the prim path and property name.',
      'Explain when time samples override a default value.',
    ],
    checkpoint: 'You can read a simple USD path and say what object or property it points to.',
  },
  {
    id: 'scene-description-blueprints',
    moduleNumber: 2,
    title: 'Scene Description Blueprints',
    subtitle: 'Schemas and common prim types that structure 3D scenes.',
    docsUrl: 'https://docs.nvidia.com/learn-openusd/latest/scene-description-blueprints/index.html',
    estimatedHours: 4,
    difficulty: 'Core',
    examDomains: ['data-modeling', 'visualization', 'customizing-usd'],
    whyItMatters: 'Schemas are the agreed-upon shapes of scene data. They tell a tool whether a prim is a transform, scope, mesh, light, material, or something with applied behavior.',
    lessons: ['Schemas', 'Scope', 'Xform', 'XformCommonAPI', 'Lights', 'Materials and shaders'],
    coreIdeas: [
      'IsA schemas define what a prim fundamentally is.',
      'API schemas add capabilities to existing prims.',
      'Xformable prims carry transformation operations.',
      'UsdLux, UsdGeom, and UsdShade cover common visual scene needs.',
    ],
    practicePrompts: [
      'Describe the difference between a Scope and an Xform.',
      'Name one reason a schema is better than arbitrary custom properties.',
    ],
    checkpoint: 'You can connect common schema names to what they do in a scene.',
  },
  {
    id: 'composition-basics',
    moduleNumber: 3,
    title: 'Composition Basics',
    subtitle: 'Layers, arcs, specifiers, references, default prims, and variants.',
    docsUrl: 'https://docs.nvidia.com/learn-openusd/latest/composition-basics/index.html',
    estimatedHours: 5,
    difficulty: 'Core',
    examDomains: ['composition', 'data-modeling', 'debugging'],
    whyItMatters: 'Composition is the highest-weight certification area. This module is where USD starts becoming powerful: many authored opinions become one composed result.',
    lessons: ['Layers', 'Composition Arcs and Strength Ordering', 'Specifiers', 'Referencing Basics', 'Default Prim', 'Variant Sets Basics'],
    coreIdeas: [
      'Layers contain authored opinions.',
      'Composition arcs combine scene description from different places.',
      'Specifiers such as def, over, and class affect how prim specs participate.',
      'Default prims make asset references easier and less brittle.',
    ],
    practicePrompts: [
      'Explain why a stronger layer can override a weaker layer.',
      'Describe a case where a variant set is better than duplicating an asset.',
    ],
    checkpoint: 'You can explain the phrase "strongest opinion wins" without turning it into magic.',
  },
  {
    id: 'beyond-basics',
    moduleNumber: 4,
    title: 'Beyond the Basics',
    subtitle: 'Primvars, value resolution, custom properties, active state, model kinds, traversal, Hydra, and units.',
    docsUrl: 'https://docs.nvidia.com/learn-openusd/latest/beyond-basics/index.html',
    estimatedHours: 5,
    difficulty: 'Applied',
    examDomains: ['data-modeling', 'debugging', 'pipeline-development', 'visualization', 'customizing-usd'],
    whyItMatters: 'These are the practical details that make a USD pipeline reliable instead of merely valid. They also show up in debugging and performance questions.',
    lessons: ['Primvars', 'Value Resolution', 'Custom Properties', 'Active and Inactive Prims', 'Model Kinds', 'Stage Traversal', 'Hydra', 'Units in OpenUSD'],
    coreIdeas: [
      'Primvars carry geometry-related data with interpolation rules.',
      'Value resolution decides the final property value after composition.',
      'Inactive prims are pruned without deleting scene description.',
      'Model kinds help tools understand asset hierarchy.',
    ],
    practicePrompts: [
      'Explain the difference between hiding a prim and deactivating it.',
      'Give one reason units should be explicit in a pipeline.',
    ],
    checkpoint: 'You can reason from authored scene data to the final value or traversal result.',
  },
  {
    id: 'creating-composition-arcs',
    moduleNumber: 5,
    title: 'Creating Composition Arcs',
    subtitle: 'Sublayers, references, payloads, encapsulation, variants, inherits, specializes, and LIVERPS.',
    docsUrl: 'https://docs.nvidia.com/learn-openusd/latest/creating-composition-arcs/index.html',
    estimatedHours: 9,
    difficulty: 'Advanced',
    examDomains: ['composition', 'debugging', 'content-aggregation'],
    whyItMatters: 'This is the exam-heavy deep dive. You need to know what each arc is for, how it affects strength, and how to diagnose surprising composed results.',
    lessons: ['What Is Prim Composition?', 'Sublayers', 'References', 'Payloads', 'Encapsulation', 'Variant Sets', 'Inherits', 'Specializes', 'LIVERPS Strength Ordering'],
    coreIdeas: [
      'Sublayers combine layer stacks at the layer level.',
      'References and payloads bring in asset content; payloads can be loaded on demand.',
      'Inherits and specializes reuse opinions in different ways.',
      'LIVERPS helps reason about composition strength ordering.',
    ],
    practicePrompts: [
      'Choose references or payloads for a huge city model and justify your answer.',
      'Trace a value that comes from a sublayer, a reference, and a variant.',
    ],
    checkpoint: 'You can choose an arc based on authoring intent, performance needs, and override behavior.',
  },
  {
    id: 'asset-structure',
    moduleNumber: 6,
    title: 'Asset Structure and Content Aggregation',
    subtitle: 'Asset interfaces, workstreams, parameterization, reference/payload patterns, and model hierarchy.',
    docsUrl: 'https://docs.nvidia.com/learn-openusd/latest/asset-structure/index.html',
    estimatedHours: 8,
    difficulty: 'Advanced',
    examDomains: ['content-aggregation', 'pipeline-development', 'composition', 'data-exchange'],
    whyItMatters: 'This turns USD concepts into production architecture. The exam cares whether you can structure assets for collaboration, reuse, and scale.',
    lessons: ['Principles of Asset Structure', 'Asset Interfaces', 'Your First Asset', 'Workstreams', 'Asset Parameterization', 'Reference/Payload Pattern', 'Model Hierarchy'],
    coreIdeas: [
      'An asset interface is the stable public contract of an asset.',
      'Layer stacks can separate modeling, shading, layout, and other workstreams.',
      'Components, groups, and assemblies provide model hierarchy structure.',
      'References and payloads support scalable asset aggregation.',
    ],
    practicePrompts: [
      'Sketch a component, group, and assembly relationship for a city block.',
      'Explain how an asset interface protects downstream users.',
    ],
    checkpoint: 'You can describe a publishable USD asset in terms of interface, layers, dependencies, and kind.',
  },
  {
    id: 'data-exchange',
    moduleNumber: 7,
    title: 'Developing Data Exchange Pipelines',
    subtitle: 'Data mapping, converters, extraction, materials, validation, testing, and transformation.',
    docsUrl: 'https://docs.nvidia.com/learn-openusd/latest/data-exchange/index.html',
    estimatedHours: 7,
    difficulty: 'Applied',
    examDomains: ['data-exchange', 'pipeline-development', 'debugging', 'customizing-usd'],
    whyItMatters: 'The exam is not only about USD files that already exist. You also need to think like someone moving data between tools and into a shared pipeline.',
    lessons: ['Data Exchange', 'Anatomy of a Converter', 'Data Extraction', 'Extracting Geometry', 'Extracting Materials', 'Asset Validation', 'Testing', 'Data Transformation', 'Export Options'],
    coreIdeas: [
      'A converter should make source-to-USD mapping explicit.',
      'Extraction reads source data; transformation reshapes it into the target structure.',
      'Validation catches missing, malformed, or pipeline-hostile data.',
      'Tests protect converter behavior as source tools and schemas evolve.',
    ],
    practicePrompts: [
      'List the parts of a simple CAD-to-USD converter.',
      'Name two validation checks you would run before publishing a USD asset.',
    ],
    checkpoint: 'You can talk through a converter from source data to validated USD output.',
  },
  {
    id: 'asset-modularity-instancing',
    moduleNumber: 8,
    title: 'Asset Modularity and Instancing',
    subtitle: 'Modular assets, scenegraph instancing, point instancing, and refinement strategies.',
    docsUrl: 'https://docs.nvidia.com/learn-openusd/latest/asset-modularity-instancing/index.html',
    estimatedHours: 7,
    difficulty: 'Advanced',
    examDomains: ['content-aggregation', 'debugging', 'visualization', 'composition'],
    whyItMatters: 'Large USD scenes live or die on scale. Instancing lets you reuse repeated content efficiently, but refinement rules matter when you need variation.',
    lessons: ['Asset Modularity', 'What Is Instancing?', 'Scenegraph Instancing', 'Nested Instancing', 'Scenegraph Instance Refinement', 'Point Instancing', 'Instancing FAQ'],
    coreIdeas: [
      'Instancing lets repeated scene description share data efficiently.',
      'Native scenegraph instances are good for structured repeated assets.',
      'Point instancing is useful for very large populations of repeated prototypes.',
      'Refinement strategies decide where and how instances can vary.',
    ],
    practicePrompts: [
      'Compare scenegraph instancing and point instancing for a forest.',
      'Explain why editing one instance can be more complicated than editing one unique prim.',
    ],
    checkpoint: 'You can choose an instancing strategy and explain the tradeoffs.',
  },
];

export const openUSDGlossaryTerms: OpenUSDGlossaryTerm[] = [
  {
    id: 'stage',
    term: 'Stage',
    plainEnglish: 'The composed scene you open and inspect. It is the working view after USD has combined the relevant layers and arcs.',
    certAngle: 'Many questions start with "what is actually on the stage?" so distinguish the stage from the files that contribute to it.',
    relatedModuleIds: ['stage-setting'],
    domainIds: ['data-modeling', 'debugging'],
  },
  {
    id: 'layer',
    term: 'Layer',
    plainEnglish: 'A container of authored opinions. Think of it as one contributor to the final scene.',
    certAngle: 'Layer strength and layer stacks are the foundation for composition debugging.',
    relatedModuleIds: ['composition-basics', 'creating-composition-arcs'],
    domainIds: ['composition', 'debugging'],
  },
  {
    id: 'prim',
    term: 'Prim',
    plainEnglish: 'A scene graph object, such as a model, transform, scope, mesh, light, or camera.',
    certAngle: 'Know prim paths, prim types, specifiers, model kinds, active state, and schema relationships.',
    relatedModuleIds: ['stage-setting', 'scene-description-blueprints'],
    domainIds: ['data-modeling', 'visualization'],
  },
  {
    id: 'attribute',
    term: 'Attribute',
    plainEnglish: 'A typed value stored on a prim or property, such as a float, token, matrix, color, or time-sampled value.',
    certAngle: 'Attribute defaults, time samples, blocks, and value resolution are common exam material.',
    relatedModuleIds: ['stage-setting', 'beyond-basics'],
    domainIds: ['data-modeling', 'debugging'],
  },
  {
    id: 'relationship',
    term: 'Relationship',
    plainEnglish: 'A connection from one scene object to another, stored as target paths rather than regular values.',
    certAngle: 'Relationships are properties too, but they target other objects instead of storing typed data.',
    relatedModuleIds: ['stage-setting'],
    domainIds: ['data-modeling'],
  },
  {
    id: 'schema',
    term: 'Schema',
    plainEnglish: 'A formal blueprint that defines what properties and behavior a prim type or API capability should have.',
    certAngle: 'Understand IsA schemas, API schemas, and when customization should become a schema.',
    relatedModuleIds: ['scene-description-blueprints'],
    domainIds: ['data-modeling', 'customizing-usd', 'visualization'],
  },
  {
    id: 'primvar',
    term: 'Primvar',
    plainEnglish: 'Geometry-related data that can vary across a primitive, with interpolation rules such as constant, uniform, vertex, or face-varying.',
    certAngle: 'Primvars connect data modeling to rendering and interchange; know why interpolation matters.',
    relatedModuleIds: ['beyond-basics'],
    domainIds: ['data-modeling', 'visualization', 'data-exchange'],
  },
  {
    id: 'composition-arc',
    term: 'Composition Arc',
    plainEnglish: 'A USD mechanism that brings scene description together from another place or under another rule.',
    certAngle: 'Composition is the largest blueprint area, so know every arc by purpose and tradeoff.',
    relatedModuleIds: ['composition-basics', 'creating-composition-arcs'],
    domainIds: ['composition', 'debugging'],
  },
  {
    id: 'sublayer',
    term: 'Sublayer',
    plainEnglish: 'A way to stack whole layers so stronger layers can override weaker layers.',
    certAngle: 'Use sublayers for layer stack composition, not as the default answer for reusable asset assembly.',
    relatedModuleIds: ['composition-basics', 'creating-composition-arcs'],
    domainIds: ['composition'],
  },
  {
    id: 'reference',
    term: 'Reference',
    plainEnglish: 'A way for a prim to bring in scene description from another asset or layer.',
    certAngle: 'References are central to reusable asset assembly and default prim usage.',
    relatedModuleIds: ['composition-basics', 'creating-composition-arcs', 'asset-structure'],
    domainIds: ['composition', 'content-aggregation'],
  },
  {
    id: 'payload',
    term: 'Payload',
    plainEnglish: 'A reference-like arc meant for content that can be loaded or unloaded on demand.',
    certAngle: 'Payloads are a performance and workflow tool for heavy assets and large scenes.',
    relatedModuleIds: ['creating-composition-arcs', 'asset-structure'],
    domainIds: ['composition', 'debugging', 'content-aggregation'],
  },
  {
    id: 'variant-set',
    term: 'Variant Set',
    plainEnglish: 'A controlled menu of alternate authored choices, such as high/low detail, colorways, or model versions.',
    certAngle: 'Know how variants fit into composition and when they are better than duplicate assets.',
    relatedModuleIds: ['composition-basics', 'creating-composition-arcs'],
    domainIds: ['composition', 'pipeline-development'],
  },
  {
    id: 'inherits',
    term: 'Inherits',
    plainEnglish: 'A composition arc for sharing opinions from a class-like source across many prims.',
    certAngle: 'Understand inheritance as reusable shared scene description, especially alongside class specifiers.',
    relatedModuleIds: ['creating-composition-arcs'],
    domainIds: ['composition', 'customizing-usd'],
  },
  {
    id: 'specializes',
    term: 'Specializes',
    plainEnglish: 'A weaker refinement-style composition arc often used to describe a prim as a specialized version of another.',
    certAngle: 'Specializes appears in LIVERPS and can matter in difficult strength-ordering questions.',
    relatedModuleIds: ['creating-composition-arcs'],
    domainIds: ['composition', 'debugging'],
  },
  {
    id: 'liverps',
    term: 'LIVERPS',
    plainEnglish: 'A mnemonic for composition strength ordering: local, inherits, variants, relocates, references, payloads, specializes.',
    certAngle: 'Use it as a tracing aid when multiple arcs offer competing opinions.',
    relatedModuleIds: ['creating-composition-arcs'],
    domainIds: ['composition', 'debugging'],
  },
  {
    id: 'asset-interface',
    term: 'Asset Interface',
    plainEnglish: 'The stable public contract of an asset: what downstream users can rely on without knowing every internal layer.',
    certAngle: 'Asset structure questions often test whether you can protect reuse and collaboration.',
    relatedModuleIds: ['asset-structure'],
    domainIds: ['content-aggregation', 'pipeline-development'],
  },
  {
    id: 'model-kind',
    term: 'Model Kind',
    plainEnglish: 'Metadata that tells USD and tools where a prim fits in a model hierarchy, such as component, group, or assembly.',
    certAngle: 'Model kinds connect asset organization, aggregation, traversal, and pipeline expectations.',
    relatedModuleIds: ['beyond-basics', 'asset-structure'],
    domainIds: ['content-aggregation', 'data-modeling'],
  },
  {
    id: 'instancing',
    term: 'Instancing',
    plainEnglish: 'A way to reuse the same scene description many times without duplicating all of it.',
    certAngle: 'Know native scenegraph instancing, point instancing, and why refinement is constrained.',
    relatedModuleIds: ['asset-modularity-instancing'],
    domainIds: ['content-aggregation', 'debugging'],
  },
  {
    id: 'value-resolution',
    term: 'Value Resolution',
    plainEnglish: 'The process USD uses to decide the final value of a property after considering all authored opinions.',
    certAngle: 'This is the heart of many troubleshooting questions.',
    relatedModuleIds: ['beyond-basics', 'composition-basics'],
    domainIds: ['composition', 'debugging', 'data-modeling'],
  },
  {
    id: 'time-sample',
    term: 'Time Sample',
    plainEnglish: 'An authored value at a particular time code, used for animated or time-varying data.',
    certAngle: 'Know how time samples differ from a timeless default value.',
    relatedModuleIds: ['stage-setting'],
    domainIds: ['data-modeling', 'visualization'],
  },
  {
    id: 'metadata',
    term: 'Metadata',
    plainEnglish: 'Non-property information stored on scene objects or layers, such as documentation, kind, active state, and units.',
    certAngle: 'Metadata drives behavior and organization, so do not dismiss it as comments.',
    relatedModuleIds: ['stage-setting', 'beyond-basics'],
    domainIds: ['data-modeling', 'pipeline-development'],
  },
  {
    id: 'flatten',
    term: 'Flatten',
    plainEnglish: 'Bake the composed result into a single layer, removing many live dependencies and arcs.',
    certAngle: 'Flattening can simplify delivery but gives up editability, provenance, and some pipeline structure.',
    relatedModuleIds: ['beyond-basics', 'data-exchange'],
    domainIds: ['pipeline-development', 'debugging'],
  },
];

export const practiceQuestions: PracticeQuestion[] = [
  {
    id: 'q-stage',
    domainId: 'data-modeling',
    moduleId: 'stage-setting',
    prompt: 'Which description best matches a USD stage?',
    choices: [
      'The final composed scene view created from layers and composition arcs.',
      'A single binary file that always contains every asset dependency.',
      'Only the root prim of a USD scene.',
      'A rendering engine that draws UsdGeom primitives.',
    ],
    answerIndex: 0,
    explanation: 'A stage is the composed view you inspect and author against. It can be backed by many layers and arcs, so it is not the same thing as one file.',
    sourceHint: 'Setting the Stage: Stage',
  },
  {
    id: 'q-properties',
    domainId: 'data-modeling',
    moduleId: 'stage-setting',
    prompt: 'What is the clearest difference between an attribute and a relationship?',
    choices: [
      'An attribute stores typed values; a relationship stores target paths to other scene objects.',
      'An attribute can only be static; a relationship can only be animated.',
      'A relationship is stronger than an attribute during composition.',
      'Attributes exist only on layers, while relationships exist only on stages.',
    ],
    answerIndex: 0,
    explanation: 'Both are properties, but they hold different kinds of information. Attributes store values; relationships point at other objects.',
    sourceHint: 'Setting the Stage: Properties, Attributes, Relationships',
  },
  {
    id: 'q-reference-payload',
    domainId: 'composition',
    moduleId: 'creating-composition-arcs',
    prompt: 'A city scene needs to include many heavy building assets, but artists should be able to open the shot quickly and load details only when needed. Which arc is most likely useful?',
    choices: ['Payloads', 'Custom properties', 'Time samples', 'Relationships'],
    answerIndex: 0,
    explanation: 'Payloads are designed for loadable content. They help large scenes stay manageable because heavy data can be loaded or unloaded on demand.',
    sourceHint: 'Creating Composition Arcs: References and Payloads',
  },
  {
    id: 'q-sublayer-reference',
    domainId: 'composition',
    moduleId: 'composition-basics',
    prompt: 'Which statement best distinguishes sublayers from references?',
    choices: [
      'Sublayers stack whole layers; references bring scene description onto a prim, often from a reusable asset.',
      'Sublayers are only for materials; references are only for transforms.',
      'References are always stronger than every sublayer opinion.',
      'Sublayers can load on demand, while references cannot.',
    ],
    answerIndex: 0,
    explanation: 'Sublayers participate in a layer stack. References are a prim-level way to assemble or reuse content from another asset or layer.',
    sourceHint: 'Composition Basics: Layers and Referencing Basics',
  },
  {
    id: 'q-liverps',
    domainId: 'composition',
    moduleId: 'creating-composition-arcs',
    prompt: 'What is LIVERPS most useful for remembering?',
    choices: [
      'Composition strength ordering across local opinions and arcs.',
      'The order in which USD file formats should be exported.',
      'A list of UsdGeom prim types.',
      'The required steps in a data exchange converter.',
    ],
    answerIndex: 0,
    explanation: 'LIVERPS is a memory aid for composition strength: local, inherits, variants, relocates, references, payloads, specializes.',
    sourceHint: 'Creating Composition Arcs: LIVERPS Strength Ordering',
  },
  {
    id: 'q-variants',
    domainId: 'composition',
    moduleId: 'composition-basics',
    prompt: 'When are variant sets a good fit?',
    choices: [
      'When one asset needs controlled alternate choices such as model, material, or level of detail.',
      'When you need to permanently delete weaker opinions.',
      'When a converter must parse a custom file format.',
      'When a relationship needs to target an attribute.',
    ],
    answerIndex: 0,
    explanation: 'Variants let you author multiple named alternatives and select one. They are useful for planned variation without duplicating a whole asset family.',
    sourceHint: 'Composition Basics: Variant Sets Basics',
  },
  {
    id: 'q-active',
    domainId: 'debugging',
    moduleId: 'beyond-basics',
    prompt: 'What happens when a prim is made inactive?',
    choices: [
      'The prim and its descendants are pruned from the composed stage view without deleting their scene description.',
      'The prim becomes visible but unselectable.',
      'All attributes on the prim are converted to relationships.',
      'The prim is flattened into the strongest layer.',
    ],
    answerIndex: 0,
    explanation: 'Active false behaves like non-destructive pruning. The data can remain in layers, but it does not appear in normal composed traversal.',
    sourceHint: 'Beyond the Basics: Active and Inactive Prims',
  },
  {
    id: 'q-primvars',
    domainId: 'visualization',
    moduleId: 'beyond-basics',
    prompt: 'Why do primvar interpolation rules matter?',
    choices: [
      'They describe how geometry-related data is applied across a primitive, such as per object, face, vertex, or face-vertex.',
      'They decide which composition arc is strongest.',
      'They control whether a layer is binary or text.',
      'They determine if a payload is loaded.',
    ],
    answerIndex: 0,
    explanation: 'Primvars carry data used by geometry, shading, and interchange. Interpolation tells tools how broadly or narrowly each value applies.',
    sourceHint: 'Beyond the Basics: Primvars',
  },
  {
    id: 'q-asset-interface',
    domainId: 'pipeline-development',
    moduleId: 'asset-structure',
    prompt: 'What is the main purpose of an asset interface?',
    choices: [
      'To provide a stable public contract so downstream users can rely on the asset without depending on all internals.',
      'To force every asset into one flattened file.',
      'To prevent artists from using variants.',
      'To replace schemas with comments.',
    ],
    answerIndex: 0,
    explanation: 'A good interface separates what other people can count on from the private details that may change inside the asset.',
    sourceHint: 'Asset Structure: Asset Interface',
  },
  {
    id: 'q-model-kind',
    domainId: 'content-aggregation',
    moduleId: 'asset-structure',
    prompt: 'Which set best reflects model hierarchy ideas?',
    choices: [
      'Component, group, and assembly.',
      'Float, token, and matrix4d.',
      'Stage, crate, and USDA.',
      'Hydra, Storm, and MaterialX.',
    ],
    answerIndex: 0,
    explanation: 'Components are leaf assets, while groups and assemblies help organize larger aggregations of models.',
    sourceHint: 'Asset Structure: Model Hierarchy',
  },
  {
    id: 'q-point-instancing',
    domainId: 'content-aggregation',
    moduleId: 'asset-modularity-instancing',
    prompt: 'Why might point instancing be chosen for a very large population of repeated objects?',
    choices: [
      'It efficiently represents many instances of prototypes using point data.',
      'It makes every copy independently editable by default.',
      'It disables composition strength ordering.',
      'It converts materials into payloads.',
    ],
    answerIndex: 0,
    explanation: 'Point instancing is designed for dense repeated content. The tradeoff is that per-instance uniqueness is more constrained.',
    sourceHint: 'Asset Modularity and Instancing: Point Instancing',
  },
  {
    id: 'q-converter',
    domainId: 'data-exchange',
    moduleId: 'data-exchange',
    prompt: 'What should a USD data exchange pipeline make explicit before writing output?',
    choices: [
      'How source data maps to USD schemas, hierarchy, attributes, materials, and validation rules.',
      'Only the final file extension.',
      'Only the name of the rendering engine.',
      'The strongest layer in a completely unrelated asset.',
    ],
    answerIndex: 0,
    explanation: 'A strong converter is designed around mapping and validation, not just "export whatever the tool gives us."',
    sourceHint: 'Developing Data Exchange Pipelines: Data Exchange',
  },
  {
    id: 'q-validation',
    domainId: 'data-exchange',
    moduleId: 'data-exchange',
    prompt: 'Which is the best example of asset validation?',
    choices: [
      'Checking that required prims, metadata, materials, units, and references meet pipeline rules before publish.',
      'Renaming every prim to a random short name.',
      'Ignoring missing texture assets until render time.',
      'Removing tests after the converter works once.',
    ],
    answerIndex: 0,
    explanation: 'Validation catches problems early. It is especially important when data comes from multiple tools and needs to be trusted downstream.',
    sourceHint: 'Developing Data Exchange Pipelines: Asset Validation',
  },
  {
    id: 'q-custom-schema',
    domainId: 'customizing-usd',
    moduleId: 'scene-description-blueprints',
    prompt: 'When is a custom schema worth considering?',
    choices: [
      'When a pipeline needs a repeatable, tool-recognizable structure for a concept rather than scattered loose custom properties.',
      'Whenever a single one-off note needs to be attached to a prim.',
      'Only when the scene contains lights.',
      'When the goal is to avoid validation.',
    ],
    answerIndex: 0,
    explanation: 'Schemas are useful when a concept should be formal, repeatable, and discoverable by tools. One-off metadata usually does not need a schema.',
    sourceHint: 'Scene Description Blueprints: Schemas',
  },
  {
    id: 'q-flatten',
    domainId: 'pipeline-development',
    moduleId: 'beyond-basics',
    prompt: 'What is a realistic tradeoff of flattening a composed stage?',
    choices: [
      'It can simplify delivery into one layer, but it may lose live composition structure and editability.',
      'It always makes the scene smaller and easier to edit.',
      'It turns all relationships into attributes.',
      'It is required before any stage traversal.',
    ],
    answerIndex: 0,
    explanation: 'Flattening can be useful for handoff or dependency removal, but it bakes the result and gives up some dynamic pipeline structure.',
    sourceHint: 'Pipeline Development blueprint and glossary: Flatten',
  },
  {
    id: 'q-hydra',
    domainId: 'visualization',
    moduleId: 'beyond-basics',
    prompt: 'In a certification discussion, Hydra is most closely associated with what area?',
    choices: [
      'USD imaging and render delegate architecture.',
      'The rule that references are stronger than variants.',
      'The file extension for binary USD files.',
      'A required name for the root prim.',
    ],
    answerIndex: 0,
    explanation: 'Hydra is part of USD imaging. You do not need to confuse it with composition or file format basics.',
    sourceHint: 'Beyond the Basics: Hydra',
  },
  {
    id: 'q-debug-composition',
    domainId: 'debugging',
    moduleId: 'creating-composition-arcs',
    prompt: 'A property value is not what you expected on the composed stage. What is the best first line of reasoning?',
    choices: [
      'Trace authored opinions through the layer stack and composition arcs to find the strongest contributing opinion.',
      'Assume the first file alphabetically always wins.',
      'Delete all weaker layers immediately.',
      'Convert the stage to a rendering-only format.',
    ],
    answerIndex: 0,
    explanation: 'USD debugging often means following the opinions. Strength ordering, arcs, and layer stacks explain the final composed value.',
    sourceHint: 'Creating Composition Arcs and Beyond the Basics: Value Resolution',
  },
  {
    id: 'q-units',
    domainId: 'pipeline-development',
    moduleId: 'beyond-basics',
    prompt: 'Why do units matter in an OpenUSD pipeline?',
    choices: [
      'Without consistent units, assets from different sources can compose at the wrong scale and break simulation or visualization assumptions.',
      'Units decide whether the file is ASCII or binary.',
      'Units replace model kinds.',
      'Units are only useful for cameras.',
    ],
    answerIndex: 0,
    explanation: 'USD enables data from many sources to meet. Units help those assets agree about scale, which matters for layout, rendering, physics, and data exchange.',
    sourceHint: 'Beyond the Basics: Units in OpenUSD',
  },
];

export const contributionIdeas: ContributionIdea[] = [
  {
    title: 'Certification Companion Page',
    value: 'Add a learner-friendly page that maps the official exam blueprint to the Learn OpenUSD modules and glossary terms.',
    likelyFiles: ['docs/certification-companion.md', 'docs/index.md'],
    firstStep: 'Open an issue proposing an exam-blueprint-to-curriculum map with no unofficial exam claims.',
  },
  {
    title: 'Practice Question Bank',
    value: 'Add source-linked self-check questions that explain why an answer is right and point back to the relevant docs section.',
    likelyFiles: ['docs/_static/data/practice-questions.json', 'docs/certification-practice.md'],
    firstStep: 'Contribute a small reviewed batch first, grouped by blueprint domain.',
  },
  {
    title: 'Plain-English Glossary Mode',
    value: 'Layer approachable explanations on top of the existing glossary so non-technical learners can build confidence before reading deeper references.',
    likelyFiles: ['docs/glossary.md', 'docs/interactive-glossary.md'],
    firstStep: 'Start with a few high-impact terms such as stage, layer, prim, attribute, composition arc, payload, and variant set.',
  },
  {
    title: 'Progress Tracker Prototype',
    value: 'Provide a local-browser checklist for learners moving through modules and exercises without requiring accounts or a backend.',
    likelyFiles: ['docs/_static/js/cert-progress.js', 'docs/_templates/layout.html'],
    firstStep: 'Confirm maintainers are comfortable with localStorage-based progress in the docs site.',
  },
];

export function getDomain(id: OpenUSDDomainId): ExamBlueprintDomain {
  const domain = examBlueprintDomains.find(item => item.id === id);
  if (!domain) throw new Error(`Unknown OpenUSD domain: ${id}`);
  return domain;
}

export function getModule(id: string): OpenUSDLearningModule {
  const module = openUSDLearningModules.find(item => item.id === id);
  if (!module) throw new Error(`Unknown OpenUSD module: ${id}`);
  return module;
}

export function moduleDomainWeight(module: OpenUSDLearningModule): number {
  return module.examDomains.reduce((sum, domainId) => sum + getDomain(domainId).weight, 0);
}

export const domainVisualMeta: Record<OpenUSDDomainId, {
  iconName: 'Layers' | 'Boxes' | 'Wrench' | 'RefreshCw' | 'Database' | 'Bug' | 'GitBranch' | 'Eye';
  color: string;
  barColor: string;
}> = {
  composition: {
    iconName: 'Layers',
    color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    barColor: 'bg-cyan-500',
  },
  'content-aggregation': {
    iconName: 'Boxes',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    barColor: 'bg-emerald-500',
  },
  'customizing-usd': {
    iconName: 'Wrench',
    color: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
    barColor: 'bg-fuchsia-500',
  },
  'data-exchange': {
    iconName: 'RefreshCw',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    barColor: 'bg-amber-500',
  },
  'data-modeling': {
    iconName: 'Database',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    barColor: 'bg-blue-500',
  },
  debugging: {
    iconName: 'Bug',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    barColor: 'bg-rose-500',
  },
  'pipeline-development': {
    iconName: 'GitBranch',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    barColor: 'bg-indigo-500',
  },
  visualization: {
    iconName: 'Eye',
    color: 'bg-lime-50 text-lime-700 border-lime-200',
    barColor: 'bg-lime-500',
  },
};

export type DomainIconMap = Record<OpenUSDDomainId, LucideIcon>;
