# Physical AI Community Hub — Changelog

A running log of features, additions, and refinements to the dashboard.

---

## v3.5.0 — May 2026 (current)

### 🆕 New tabs

- **Monthly Analysis** is now the **first tab** users land on. Includes overall scorecard with top opportunity, top risk, big bets, and quick wins. 10 section cards (Hot Topics · Communities · Events · Speakers · Podcasts · Discord · Papers · Influencers · Dev Videos · GitHub) each with score, headline, wins, gaps, and June actions.
- **GitHub tracker** — new subtab inside Landscape Intel. Tracks 24 repos: 9 official NVIDIA repos (Isaac Sim, IsaacLab, Cosmos, Alpamayo, LearnOpenUSD, Omniverse, Newton, nCore, Isaac-GR00T) + 15 community projects. Per repo: stars, forks, open PRs, open issues, contributors, weekly commits, last commit, stars-growth %, health badge (Thriving/Active/Steady/Slow), language, topics. Filter by category, search, sort by stars/recent/active/trending. NVIDIA repos get a `#76B900` accent border. Community repos show "Related to:" parent + a highlight callout.
- **Dev Videos** — promoted into Landscape Intel as a subtab (was Tier-1, now lives under Podcasts). Catalog expanded **30 → 50 videos** spanning NVIDIA Developer official + global community creators (Hugging Face, ETH Zürich, MIT CSAIL, Stanford HAI, BAIR Berkeley, KAIST, Tokyo University, Tsinghua, IIT Genova, Imperial College, Oxford Robotics, RoboMaster Academy, Pollen Robotics, ROS Industrial, etc.). Region distribution: Americas 38% · APAC 24% · EMEA 26% · Global 12%.
- **Influencers** — new tab tracking 32 Physical AI thought leaders with klout score, follower data, sample posts, and engage-or-watch flag.
- **Meetups & Hackathons** — new tab with 30 events, NVIDIA tech indicator badges, sponsorship recommendations (yes/maybe/no), Luma links.

### 🔍 Global search

- **"Search Everything"** in the header. Type 2+ chars + press Enter to launch a dedicated search results page replacing the active tab content.
- Results grouped by 8 categories (Communities, Events, Meetups, Speakers, Topics, Podcasts, Discord, Influencers) with per-category counts and a category jump-bar at the top.
- Each result shows full metadata (location, host, klout, etc.) and a one-click "Open in Landscape Intel" jump button. External link if available.
- Empty state with `SearchX` icon and keyword suggestions when nothing matches.
- Search-mode banner at the top of the page indicates active search; one-click "Exit search" returns to where you were.

### 📤 Excel + PDF export

- **Every data tab** now has an Export dropdown:
  - **Excel (.xlsx)** — auto-sized columns, timestamped filenames, one sheet per export
  - **PDF (.pdf)** — landscape A4, violet header rows, alternating row stripes, page numbers, "Physical AI Community Hub" footer
- Exports respect all active filters and sort order — what you see is what you get.
- Tabs with export: Hot Topics · Communities · Events · Meetups · Speakers · Podcasts · Discord · Influencers · Dev Videos · GitHub.
- Rich columns per tab: e.g. Influencers exports klout, follower counts, shouldEngage, engageReason; Videos exports full social copy strings; GitHub exports stars, forks, PRs, issues, contributors, weekly commits, growth %.

### 🏷️ Tags & filters

- **OSS tag** — replaces the OSS filter button. `⚡ OSS` badge appears inline on Communities, Events, Meetups, Speakers, Podcasts, Discord, Influencers cards when keyword-detected (GitHub, ROS, MuJoCo, LeRobot, etc.). Filterable via the tag chip row.
- **OpenUSD tag** — `🔷 OpenUSD` badge across Communities, Discord, Podcasts, Speakers, Influencers, Dev Videos when matched (openusd, USD composer, Omniverse, scene description, hydra, etc.).
- **CAE filter** — new ⚙️ CAE chip in DomainFilter. Keyword-detected: FEA, CFD, Ansys, SIMULIA, OpenFOAM, NASTRAN, ABAQUS, digital twin, PLM, Dassault.
- **Score filter** — new chip row (Trending → High → Medium → Low) on Communities, Events, Meetups, Discord, Podcasts. Acts as a minimum threshold.
- **Tag filter row** for Hot Topics — 8 auto-derived cluster tags: World Foundation Models · Robotics · OpenUSD · Edge AI · Industrial DT · Vision AI · CAE / Simulation · Automotive. Multi-select.
- **Influencer tier filter** — Micro (< 25K) · Macro (25K–100K) · Top (100K+).
- **Meetups type filter** — meetup / hackathon / workshop chips.

### 📊 Sorting

- All Landscape Intel list tabs now sort by **buzz score** by default (Trending → High → Medium → Low), with secondary sort by relevant metric (weekly activity, subscribers, weekly messages, start date).
- Influencers sort by **klout score** desc.

### 📰 Community Stories

- **Only stories with a social-asset URL** are shown (LinkedIn, X, YouTube, GitHub, Facebook, Instagram, TikTok, Threads, Hugging Face, Reddit, Medium, Substack, dev.to).
- **Platform badge** (color-coded) on each story header — instant visual on which network a story lives on.
- **Auto-generated social copy** per story — `Recommended social copy` toggle expands platform-tailored copy:
  - 𝕏 Twitter / X — short (under 280 chars), emoji + product hashtags
  - LinkedIn — long-form, professional, credits author, ends `#PhysicalAI #Robotics`
  - Facebook — friendly mid-length copy
- One-click Copy button per variant (turns to ✓ Copied! for ~2s).

### 🌏 Data expansion

- **+8 APAC communities** (ROS Japan, Korea Robotics Society, Robotics India, Singapore AI & Robotics Meetup, Unitree Developer Forum, DJI Developer Forum, Japan DLA Robotics SIG, Australia Open Robotics).
- **+5 Chinese-robotics Discord channels** (Unitree, DJI Developer Network, Chinese Physical AI Forum, RoboMaster Dev Hub, CyberDog Builders).
- **+5 Industrial Digital Twin hot topics** (Siemens Xcelerator + Omniverse, ABB RobotStudio, Rockwell FactoryTalk, Industrial DT ROI cases, IIoT sensor fusion).
- **+15 speakers** — 10 robotics-company practitioners (Covariant, Apptronik, 1X, Figure AI, Boston Dynamics, Agility, Machina, Fieldwork, Gecko, Realtime) + 5 European researchers (ETH Zürich RSL, TU Munich/DLR, IIT Genova, Oxford Robotics, TU Delft).
- **Rising Talent watchlist** — 8 high-growth speakers tagged with paper count + social growth %.
- **20 new Dev Videos** — Newton physics tutorials, LeRobot ACT, Diffusion Policy walkthroughs, OpenUSD scene composition, GR00T cross-embodiment, etc.

### 🎬 Dev Videos enhancements

- **Promotion flags** on **22 non-NVIDIA** videos with custom `promotionReason` and platform-specific 𝕏 + LinkedIn social copy.
- New filter chips for OpenUSD and OSS in the Dev Videos toolbar.
- Inline `🔷 OpenUSD` badge on matching video cards.

### 📄 Papers improvements

- **"Must amplify"** flag for papers with HF upvotes > 100 + NVIDIA tech mention (planned for next pull).
- CVPR 2026 added to source list (vision AI spike expected June).
- Author-to-Speaker linkage scaffolded.

### 🎨 UI polish

- **Header redesign** — Brand · Search · Tabs · Live indicator. Persona "Focus view" dropdown removed.
- **Search results banner** with gradient background when in search mode.
- **Tab order reflow** — Monthly first; in Landscape Intel: Global View → Hot Topics → Events → Meetups → Communities → Discord → Papers → Podcasts → Dev Videos → GitHub → Speakers → Influencers.

### 🧹 Removed / hidden

- **Persona filter** ("Focus view" dropdown) removed from header.
- **OSS toggle button** replaced by OSS tag/badge + tag filter row.
- **AgriTech** scrubbed entirely from the type system, DOMAIN_META, and all data entries.
- **Aerospace** hidden from Communities and Discord domain filters (still in type for other tabs).

---

## v3.0.0 — Earlier May 2026

- Initial Tier-1/Tier-2 nav structure.
- Landscape Intel with Hot Topics, Speakers, Events, Communities, Shows, Discord, Papers.
- Discord and Stream dashboards as fullscreen iframe tabs.
- Persona filter (later removed in v3.5).
- Region filter (Americas / EMEA / APAC / Global).
- Domain filter (9 Physical AI verticals).
- Buzz badges (Trending / High / Medium / Low).
- Klout score bars for speakers.
- Domain badges on most cards.
- Per-tab "How this data was pulled" analysis panels.

---

## Conventions

- **Score scale:** 0–100, color-coded (≥80 emerald, ≥65 amber, <65 red)
- **Buzz levels:** Trending > High > Medium > Low
- **Tag detection:** keyword-based on topics + name + description so tags update automatically as data evolves
- **Filenames on export:** `{tab}_{YYYYMMDD-HHMM}.{xlsx|pdf}`
