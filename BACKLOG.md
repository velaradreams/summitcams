# SummitCams Backlog

Single source of truth for deferred work. Roadmap from the 2026-07-12 analysis.

## Active roadmap (in order)

1. ~~Fix "Flavorbasin V: May 9th" label + cache-buster bucketing~~ — DONE 2026-07-12
2. ~~Cam registry refactor (app/cams.js, derived allowlist)~~ — DONE 2026-07-13
3. ~~Health-check cron (/api/health + vercel.json) + Telegram digest + /api/status~~ — DONE 2026-07-13
   (Telegram needs TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID env vars set in Vercel — AJ)
4. ~~Off-season grouping UI~~ — DONE 2026-07-13 (seasonal+summer+404 → off-season section, no alert)
5. ~~Coverage matrix for Tier 1+2 resort cams~~ — DONE 2026-07-13 (research agent pass)
6. ~~Integrate Tier 1+2 cams~~ — DONE 2026-07-13: +10 cams (Loveland, Eldora, Monarch,
   CB PowCam, Telluride PowCam, Aspen ×4 stakes, Wolf Creek base). **Fall re-verification
   list** (added as seasonal; currently 404 → off-season section; when resorts flip them on
   they light up automatically, but verify these URLs if they alert as broken in Nov):
   - Eldora HDRelay GUID 6c30942d… (candidate URL from eldora.com page-data, never seen live)
   - Monarch webcam.io z7Arw9 latest.jpg (+ 2nd stake 9RmqeM not yet added)
   - Telluride ipcamlive alias=powcam
   Extra verified-live cams NOT added (scenic; add if wanted): Monarch Pioneer Top/Sundeck/
   Pano (player.brownrice.com/snapshot/skimonarch*), CB base/Paradise/Umbrella Bar,
   Telluride Plaza/BonVivant/HootBrown/JointPoint (ipcamlive), Wolf Creek Summit,
   Loveland Basin/Chair 1/Ptarmigan. Aspen lift cams are Verkada domain-locked — skip.
7. ~~Phase A personalization — localStorage favorites (pin/reorder via buttons), hide~~ — DONE 2026-07-13
8. DECISION GATE — accounts (Phase B): only if cross-device sync demand or snowfall-alerts
   feature gets greenlit. Recommendation: Supabase free tier, magic-link auth,
   `user_cam_prefs (user_id, cam_id, rank, hidden)`, migrate localStorage on first login.
9. Stretch: snowfall alerts ("Wolf Creek stake shows 6+"), 24h stake timelapse
   (Vercel cron + Blob snapshots every 30 min).

Platform-follows-ownership cheat sheet for step 6:
- Vail Resorts (Crested Butte) → expect cache.snow.com / Timecam / Brownrice patterns (already handled)
- POWDR (Eldora) → expect HDRelay pattern (already handled, Copper)
- Alterra → expect YouTube Live (already handled, WP/Steamboat)
- Independents (Loveland, Monarch, Wolf Creek, Telluride, Aspen) → verify per resort

## Backlogged (not scheduled)

- **i70cams** — separate project idea: I-70 corridor traffic cams, Denver→Vail, horizontal
  east-west filmstrip sorted by mile marker (~MM 260 → 176), corridor ribbon colored by
  travel-time feed, incident pins (crash / closure / chain law).
  Data: CDOT COtrip official developer feed — free apiKey via https://manage-api.cotrip.org/,
  endpoints confirmed live at data.cotrip.org/api/v1/{incidents, roadConditions, plannedEvents,
  destinations, weatherStations, signs} (probed 2026-07-12; camera product name TBD after
  key signup — portal lists products; COtrip map GraphQL is the fallback).
  Architecture: same Next.js/Vercel recipe, apiKey server-side in env var, shared 60s CDN cache.
  First step when picked up: request the API key (only dependency with a wait).
- Tier 3 completionist resorts (Purgatory, Powderhorn, Sunlight, Ski Cooper, Granby Ranch,
  Howelsen Hill, Silverton) — decide if "every CO resort" is a goal.
- next/font migration (self-host DM Sans/JetBrains Mono, drop Google Fonts request)
- Vercel Analytics (free tier) — learn if anyone uses the site
- ~~Per-card snow numbers~~ / ~~PWA manifest + chips + lazy~~ / ~~MST label~~ /
  ~~README Edge drift~~ — all DONE 2026-07-13
- PWA icon is SVG-only; add PNG apple-touch-icon for iOS home-screen install
- Timecam URL builder: add fallback if Breck's 10-min frame cadence ever changes
- 24h stake timelapse (cron + Blob snapshots) — next big value item
- Accounts decision gate unchanged (see IMPLEMENTATION_PLAN.md)
- Delete stale ~/Downloads/summitcams 2/3/4 + summitcams*.zip copies (AJ's call; disk-constrained Mac)
