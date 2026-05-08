# OpenUSD Playground

OpenUSD Playground is a beginner-friendly learning tool for OpenUSD and NVIDIA's OpenUSD Development certification.

It starts with a tiny interactive scene builder so new learners can understand the basic ideas before reading deeper technical docs:

- **Stage**: the play table where the scene appears
- **Prim**: one thing in the scene
- **Layer**: a note that adds or changes something
- **Attribute**: a small value, like color or position
- **Variant**: a tidy choice, like small or big
- **Compose**: putting the notes together into one scene

After the playful intro, the app includes a roadmap, practice questions, a plain-English glossary, and a contribution plan for the LearnOpenUSD curriculum.

## Run Locally

```bash
bun install
bun run dev
```

Then open the local URL printed in your terminal.

## Build

```bash
bun run build
```

The production site is written to `dist/`.

## Deploy

This is a static Vite app. You can deploy it to Netlify, Vercel, GitHub Pages, or any static host.

For Netlify:

- Build command: `bun run build`
- Publish directory: `dist`

## Sources

- Learn OpenUSD: https://docs.nvidia.com/learn-openusd/latest/index.html
- LearnOpenUSD repository: https://github.com/NVIDIA-Omniverse/LearnOpenUSD
- NVIDIA OpenUSD certification: https://www.nvidia.com/en-us/learn/certification/openusd-development-professional/

