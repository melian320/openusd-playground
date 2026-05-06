# Physical AI Community Hub

Single-page React dashboard for NVIDIA developer-relations community intelligence across Physical AI and robotics: communities, events, speakers, podcasts, Discord, papers, influencers, developer videos, GitHub repo health, and monthly action analysis.

## Run Locally

```bash
bun install
bun run dev
bun run build
```

The app has no backend. Curated data lives in `src/data/communityData.ts` and refreshed snapshot data lives in `src/data/auto/*.json`. You should not need to download or hand-edit those JSON files; the refresh workflow updates them from source APIs.

## Add A Curated Entry

Edit `src/data/communityData.ts`, choose the matching exported array, and add an object that satisfies the TypeScript interface from `src/types/community.ts`.

Use only URLs that resolve to real content. Do not add guessed Discord invites, guessed Lu.ma/Eventbrite links, fabricated speaker profiles, or invented influencer quotes. If a source is missing, leave the field blank or document the gap in the relevant "How this data was pulled" panel.

## Add A Tracked GitHub Repo

1. Add `owner/repo` to `GITHUB_REPOS` in `scripts/refresh-data.ts`.
2. Add a matching curated entry in `src/components/GitHubDashboard.tsx`.
3. Add the same `owner/repo` to `TRACKED_OWNER_REPOS`.
4. Verify the repo resolves at `https://api.github.com/repos/owner/repo`.

The daily job overwrites stars, forks, contributors, open issues, open PRs, weekly commits, language, and last commit from GitHub REST.

## Add A YouTube Channel

Add a channel object to `YOUTUBE_CHANNELS` in `scripts/refresh-data.ts`, using the public `@handle` from YouTube plus an expected title guard.

The refresh job resolves handles with YouTube Data API v3 `forHandle`, verifies the resolved title, filters out low-relevance uploads, pulls view counts, then the app classifies videos by keyword matching title, description, and channel name.

## Add A Global View Source

Add a source object to `GLOBAL_SOURCE_SEEDS` in `src/data/globalSourceRegistry.ts`.

Use this for source-backed communities, event calendars, meetups, hackathons, regional associations, and official NVIDIA product pages tied to Physical AI. Each source needs a real URL, region, source type, product tags, topic tags, and a short description.

The daily refresh fetches each public page, extracts title/meta/body text, checks for product/topic evidence, assigns `verified`, `candidate`, `stale`, or `dead` status, calculates a relevance score, and writes `src/data/auto/global-sources.json`. Global View renders from this source registry first; older curated community/event rows remain in their own tabs and are not treated as authoritative regional coverage. Private Slack/Discord content, paywalled pages, and authenticated social feeds are intentionally not scraped by this job.

## Required Secrets

Set these repository secrets before enabling the scheduled refresh:

- `ANTHROPIC_API_KEY`: Claude Haiku synthesis for the top 8 hot topics.
- `GITHUB_PAT`: GitHub PAT with `repo` and `workflow` scopes for REST data, direct snapshot commits, and optional PR creation.
- `YOUTUBE_API_KEY`: YouTube Data API v3 key for channel and video pulls.

Reddit is intentionally not used. GitHub Actions runners receive HTTP 403 from Reddit JSON endpoints, so Reddit is documented as a known gap rather than simulated.

## Automated Refresh

`.github/workflows/refresh-data.yml` runs daily at 07:30 UTC:

```bash
bun run refresh-data
bun run build
```

On the daily schedule, the workflow commits changed `src/data/auto/` snapshots directly to `main`. Netlify then auto-deploys the latest data from `main`, so there is no JSON pull/import step.

Manual runs have two modes:

- `direct`: commit refreshed snapshots directly to `main`.
- `pr`: open a review PR with the snapshot changes.

The refresh script is incremental. If YouTube or Claude credentials are missing, or a source temporarily returns no rows, it carries forward the previous good snapshot instead of wiping the dashboard to empty data. `_meta.json` records source counts, warnings, and errors for the latest run.

Generated snapshot files include `global-sources.json`, `github.json`, `papers.json`, `videos.json`, `hot-topic-signals.json`, `hot-topics.json`, `snapshot.json`, and `_meta.json`.

## Netlify

`netlify.toml` uses:

- Build command: `bun run build`
- Publish directory: `dist`

Configure the Netlify site to deploy from `main`. The intended vanity URL is `physical-ai-hub.netlify.app`.
