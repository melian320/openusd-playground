# Setup — Self-Refreshing Physical AI Community Hub

This guide walks through deploying the dashboard with **daily automated data refresh** at $0–5/month.

After setup, the dashboard:
- ✅ Lives at a public Netlify URL you can share
- ✅ Refreshes GitHub stars, arXiv papers, YouTube videos, Reddit/HN signals daily
- ✅ Uses Claude (optional, ~$5/mo) to synthesize hot topic narratives
- ✅ Opens a PR each day for you to review and merge (or commits direct to main)
- ✅ Auto-deploys on every merge

---

## Prerequisites (15 minutes total)

You'll need accounts (all free) for:

1. **GitHub** — to host the repo + run Actions
2. **Netlify** — to host the deployed dashboard
3. **Anthropic** *(optional, for Claude enrichment)* — `console.anthropic.com`
4. **Google Cloud** *(optional, for YouTube)* — `console.cloud.google.com`

---

## Step 1 — Push to GitHub

```bash
cd "Community App"
git init
git add .
git commit -m "Initial commit"
gh repo create physical-ai-hub --public --source=. --push
# Or use the GitHub web UI to create the repo, then:
# git remote add origin <repo-url>
# git push -u origin main
```

---

## Step 2 — Generate the API tokens

### GitHub Personal Access Token (required)

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name: `physical-ai-hub-refresh`
4. Scopes: ✅ `public_repo` (or `repo` if your repo is private)
5. Generate, copy the token

### YouTube Data API key (optional — skip if you don't need video refresh)

1. Go to https://console.cloud.google.com/apis/credentials
2. Create a project (or select one)
3. Enable "YouTube Data API v3" → APIs & Services → Library
4. Credentials → Create Credentials → API key
5. Copy the key (free, 10,000 units/day quota — way more than enough)

### Anthropic API key (optional — skip if you don't need Claude enrichment)

1. Sign up at https://console.anthropic.com
2. Go to Settings → API Keys
3. Create key (you get $5 free credit; daily refresh runs ~$1.50/month after that with Haiku)
4. Copy the key

---

## Step 3 — Add the tokens to GitHub Secrets

In your repo on GitHub:

1. Settings → Secrets and variables → Actions → New repository secret
2. Add each:
   - **`GH_DATA_TOKEN`** = your GitHub PAT from Step 2
   - **`YOUTUBE_API_KEY`** = your YouTube key (optional)
   - **`ANTHROPIC_API_KEY`** = your Claude key (optional)

> Note: Don't use the auto-provided `GITHUB_TOKEN` for repo data — it has limited rate limits. Use a separate PAT (`GH_DATA_TOKEN`).

---

## Step 4 — Test the workflow

1. Go to Actions tab → "Refresh data" workflow
2. Click "Run workflow" → keep `pr` mode → run
3. Watch it run (~3 minutes)
4. When it finishes, a new PR appears titled "🤖 Daily data refresh"
5. Review the diff — you should see new entries in `src/data/auto/*.json`
6. Merge if it looks right

If the test passes, you'll get a fresh PR every morning at 9am UTC automatically.

---

## Step 5 — Deploy to Netlify

1. Sign up at https://netlify.com (use GitHub login)
2. "Add new site" → "Import an existing project" → GitHub
3. Pick your `physical-ai-hub` repo
4. Build settings (auto-detected, but verify):
   - Build command: `bun run build`
   - Publish directory: `dist`
   - Node version: 20+ (Netlify defaults to a recent version)
5. Deploy
6. After ~2 minutes, your site is live at `https://random-name.netlify.app`
7. (Optional) Site settings → Domain → rename to something memorable

**Done.** The dashboard is now public, auto-refreshing daily. Share the URL with your team.

---

## How the refresh cycle works

```
┌─────────────────────────────────────────────────────────┐
│  Daily 09:00 UTC                                        │
│  GitHub Action runs scripts/refresh-data.ts             │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ├──── Pull GitHub repos (24)
                       ├──── Pull arXiv papers (40)
                       ├──── Pull YouTube videos (50)
                       ├──── Pull Reddit + HN signals (~120)
                       └──── Claude synthesizes 8 hot topics
                       │
                       ▼
        Updates src/data/auto/*.json
                       │
                       ▼
        Opens PR "🤖 Daily data refresh"
                       │
                       ▼
        You merge (or auto-merge with branch protection)
                       │
                       ▼
        Netlify rebuilds + redeploys (~2 min)
                       │
                       ▼
        Public URL has fresh data
```

---

## Switching from PR-review mode to direct-commit

After a few weeks of confidence with the daily diffs, you can skip the PR step:

1. Edit `.github/workflows/refresh-data.yml`
2. Change the workflow_dispatch default from `pr` to `direct`
3. Or, just always invoke manually with `direct` mode

The Action will commit changes directly to `main` and Netlify deploys without your involvement.

---

## Cost summary

| Service | Free tier | Your usage | Cost |
|---|---|---|---|
| GitHub Actions | 2000 min/mo (private) or unlimited (public) | ~5 min/day = 150/mo | $0 |
| Netlify | 100GB bandwidth, 300 build min/mo | Well under limits | $0 |
| GitHub API | 5000 req/hr authenticated | ~50 req/refresh | $0 |
| arXiv API | unlimited, no auth | ~1 req/day | $0 |
| YouTube Data API v3 | 10,000 units/day | ~500 units/refresh | $0 |
| Reddit JSON | unlimited, no auth | ~5 req/refresh | $0 |
| HN Algolia API | unlimited, no auth | ~5 req/refresh | $0 |
| Anthropic Claude API (Haiku) | $5 free credit | ~$0.05/run × 30 runs | ~$1.50/mo |

**Total: $1.50/month with Claude enrichment, $0 without it.**

---

## Editorial data (the 4 tabs that don't auto-refresh)

The following tabs keep their existing curated data:
- **Communities** — Discord servers, Slack workspaces, LinkedIn groups
- **Speakers** — Researcher bios, klout scores
- **Influencers** — Engage flags, follower counts
- **Podcasts** — Show metadata

These don't have free programmatic data sources. Update workflow:

1. **Periodic check-in with Claude/Anthropic** (or me, the assistant)
   - "Add 5 new APAC speakers from Korea & Japan"
   - "Refresh top 20 influencer follower counts" (you provide source)
   - "Update community member counts based on this CSV"
2. Update the .ts files in `src/data/`
3. Push to GitHub → Netlify auto-deploys

Realistic cadence: ~30 minutes of editorial work, **once a month**.

---

## Customizing the data sources

Edit `scripts/refresh-data.ts` and update these constants:

- `GITHUB_REPOS` — list of `owner/repo` strings to track
- `YOUTUBE_CHANNELS` — list of `{id, name}` objects
- `ARXIV_QUERY` — arXiv search syntax for filtering papers
- `REDDIT_SUBREDDITS` — list of subreddit names

Push the change → Action picks it up on next run.

---

## Troubleshooting

**Action fails with "GITHUB_TOKEN required"**
→ Check that `GH_DATA_TOKEN` is set in repo Secrets (with underscore, not space).

**Empty `src/data/auto/youtube.json`**
→ `YOUTUBE_API_KEY` not set. The script silently skips YouTube without it.

**No `hot-topics.json` written**
→ `ANTHROPIC_API_KEY` not set. Without it, `hot-topic-signals.json` is the raw signal feed.

**Hit GitHub rate limits**
→ Make sure you're using `GH_DATA_TOKEN` (a real PAT), not `GITHUB_TOKEN` (auto-provided, lower limits).

**PR not opening**
→ Workflow needs `pull-requests: write` permission. Already set in the YAML.

---

## What you can edit anytime

| File | What it controls | Edit cadence |
|---|---|---|
| `scripts/refresh-data.ts` | Which repos, channels, subreddits to track | Rare |
| `src/data/communityData.ts` | Curated tabs (Communities, Speakers, etc.) | Monthly |
| `src/data/auto/*.json` | **Don't edit** — overwritten by daily refresh | Never |
| `.github/workflows/refresh-data.yml` | Cron schedule, secret names | Rare |

---

## Roll back to manual

If you want to disable the auto-refresh:

1. Disable the workflow: Actions tab → Refresh data → ⋯ → Disable workflow
2. Or delete `.github/workflows/refresh-data.yml`

The dashboard keeps working with whatever data was last in `src/data/auto/`.
