# OpenUSD Playground

OpenUSD Playground is a beginner-friendly learning app for people who want to understand OpenUSD and prepare for NVIDIA OpenUSD Development certification.

The app is designed for non-technical and visual learners. It starts with a simple mental model, then turns the official Learn OpenUSD curriculum into a guided path with visual explanations, short practice checks, progress tracking, and certification planning.

## App Source

The standalone app source lives in:

```bash
openusd-playground-source/
```

The Netlify upload package lives at:

```bash
Projects/OpenUSD Playground/openusd-playground-netlify-upload.zip
```

## What It Includes

- A plain-English OpenUSD introduction
- A visual scene builder for stage, prim, attribute, schema, variant, and payload concepts
- A Learn OpenUSD lesson path mapped to official curriculum modules
- Source-linked practice questions
- A certification blueprint planner and readiness checklist
- Official resources, including Learn OpenUSD, the certification page, study guide, and video playlist

## Run Locally

```bash
cd openusd-playground-source
bun install
bun run dev
```

Then open the local URL printed in your terminal.

## Build

```bash
cd openusd-playground-source
bun run build
```

The production site is written to `openusd-playground-source/dist/`.

## Sources

- Learn OpenUSD: https://docs.nvidia.com/learn-openusd/latest/index.html
- NVIDIA OpenUSD certification: https://www.nvidia.com/en-us/learn/certification/openusd-development-professional/
- OpenUSD video playlist: https://www.youtube.com/playlist?list=PL3jK4xNnlCVf3HuZD4qOWlKlouJyh6Prb
