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

## Add A Hot Topics Listening Source

Hot Topics is a daily listening report, not a real-time scraper. The refresh job builds a filtered signal pool from:

- Hacker News Algolia discussion search
- arXiv Physical AI query results
- tracked YouTube uploads
- tracked GitHub repo activity
- public RSS/Atom feeds in `HOT_TOPIC_RSS_SOURCES`

To add a new public feed, add an object to `HOT_TOPIC_RSS_SOURCES` in `scripts/refresh-data.ts` with a real RSS/Atom URL, label, and note. Prefer official blogs, public Discourse feeds, GitHub release feeds, standards/community feeds, and conference/news feeds that do not require authentication.

The job writes `hot-topic-signals.json` with URL, date, engagement, product tags, sector tags, and relevance score; `hot-topics.json` with Claude-synthesized trend clusters; and `hot-topic-analysis.json` with "what people are saying," NVIDIA relevance, recommended actions, and next-7/next-30-day plays.

Reddit, private Discord/Slack, and LinkedIn conversations are not scraped by default. Treat them as known gaps or permissioned/manual sources rather than simulated data.

## Add A Global View Source

Add a source object to `GLOBAL_SOURCE_SEEDS` in `src/data/globalSourceRegistry.ts`.

Use this for source-backed communities, event calendars, meetups, hackathons, regional associations, and official NVIDIA product pages tied to Physical AI. Each source needs a real URL, region, source type, product tags, topic tags, and a short description.

The daily refresh fetches each public page, extracts title/meta/body text, checks for product/topic evidence, assigns `verified`, `candidate`, `stale`, or `dead` status, calculates a relevance score, and writes `src/data/auto/global-sources.json`. Global View renders from this source registry first; older curated community/event rows remain in their own tabs and are not treated as authoritative regional coverage. Private Slack/Discord content, paywalled pages, and authenticated social feeds are intentionally not scraped by this job.

## Import Global Events From Excel

Use the Excel importer when the events plan lives in a workbook:

```bash
bun run import:global-events -- "/path/to/Global Events.xlsx"
```

The importer reads the `Events - USA` and `Events - EMEA` style tabs, keeps only rows with public `http(s)` websites, removes tracking parameters, infers region/product/topic tags from the event focus and location, and writes `src/data/importedGlobalEvents.ts`. Rows with blank websites, `TBD`, generic `Link` placeholders, or no inferred NVIDIA product mapping are skipped until a real source URL and product mapping are available.

Imported rows appear in the Global View review scope as unchecked sources, then the daily refresh job validates the public pages and upgrades them to `verified`, `candidate`, `stale`, or `dead`. The default Global View only shows `verified` and `candidate` rows.

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

To refresh only the Global View source validation snapshot without GitHub, YouTube, or Claude credentials:

```bash
bun run refresh-data -- --global-sources-only
```

The refresh script is incremental. If YouTube or Claude credentials are missing, or a source temporarily returns no rows, it carries forward the previous good snapshot instead of wiping the dashboard to empty data. `_meta.json` records source counts, warnings, and errors for the latest run.

Generated snapshot files include `global-sources.json`, `github.json`, `papers.json`, `videos.json`, `hot-topic-signals.json`, `hot-topics.json`, `hot-topic-analysis.json`, `snapshot.json`, and `_meta.json`.

## Netlify

`netlify.toml` uses:

- Build command: `bun run build`
- Publish directory: `dist`

Configure the Netlify site to deploy from `main`. The intended vanity URL is `physical-ai-hub.netlify.app`.
