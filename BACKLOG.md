# SummitCams Backlog

Single source of truth for deferred work. Roadmap from the 2026-07-12 analysis;
executed and deployed 2026-07-13 (commits 1a52753 / 683f24d / 0e00a1b).

## 🍂 FALL 2026 CIRCLE-BACK (do when resorts turn cams on, ~Oct/Nov)

The high-priority section. Everything here is blocked on winter, not on decisions.

1. **Verify the never-seen-live candidate URL:**
   - Eldora Snow Stake — `img.hdrelay.com/frames/6c30942d-6116-4b5d-a7d9-141cb6415d07/default/last.jpg`
     (GUID extracted from eldora.com Gatsby page-data while their whole cam system was down
     for summer maintenance; POWDR/HDRelay like Copper, but the URL has NEVER returned 200).
     Fallback pattern to try: `manage.hdrelay.com/snapshot/<guid>?size=800x450`.
2. **Confirm the summer-dark registered cams wake up** (they're seasonal — they'll leave the
   off-season section automatically; only act if the health cron flags them as broken):
   - Monarch Powder Cam — webcam.io `z7Arw9/latest.jpg` (404s when frames stale)
   - Telluride PowCam — ipcamlive `alias=powcam` (snapshot.php 302s; alias is stable key)
   - Copper + A-Basin HDRelay frames, Breck Timecam (existing cams, offline every summer)
   - Purgatory stake — whole `assets.mcp.ski` host is 526 for summer (one re-check also
     answers whether Hesperus's cam on the same host revived, if that ever matters)
   - Powderhorn b16.hdrelay.com host — if it breaks, re-fetch player JSON at
     `manage.hdrelay.com/player/<playerid>` (ids in agent notes / cams.js comment)
3. **Add Monarch's 2nd stake cam** — webcam.io `9RmqeM` ("Storm Cam", Butterfly marker) once
   frames are fresh; decide if two Monarch stakes is one too many.
4. **Season sanity pass**: eyeball every card the first powder week — stake visible?
   aimed right? label still accurate? (Cheap coverage-matrix re-check.)
   Registry has `verification: "validated" | "untested"` per cam (original 10 = validated;
   everything added 2026-07 = untested, i.e. serves an image but not yet confirmed to be a
   real snow-stake view — some may turn out to be scenic cams). /api/health reports the
   untested list. **Flip untested → validated in app/cams.js as each one passes the eyeball.**
5. Telegram alerting (BACKLOGGED 2026-07-13 — AJ deprioritized; don't re-pitch): code is
   live but dormant; enabling = set `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` in Vercel +
   redeploy. Until then, fall wake-up checks are manual: hit /api/health and read the JSON.

## Active roadmap

1–7. ~~Registry, health cron, off-season UI, Tier 1+2 coverage + integration,
   localStorage favorites~~ — ALL DONE + DEPLOYED 2026-07-13. 20 cams live.
8. ~~Tier 3 integration~~ — DONE 2026-07-13: +5 cams (Powderhorn stake — research
   visually CONFIRMED the measurement board; Sunlight stake; Ski Cooper stake as
   self-hosted HLS iframe; Purgatory stake, summer-dark; Granby Ranch base, no stake).
   NOT added, with reasons:
   - Silverton Mountain — no webcam exists (their /webcam/ page 404s)
   - Kendall Mountain — operating town hill, no webcam
   - Hesperus — CLOSED since 2023, confirmed closed for 2025-26; skip until it reopens
   - Howelsen Hill — no official cam; only feed is coloradowebcam.net (a cam company's
     own product — proxying it ≠ proxying a resort's marketing cam). AJ's call.
   - OpenSnow rehosts (Purgatory extras, Silverton town cams) — third-party ToS risk.
9. DECISION GATE — accounts (Phase B): only if cross-device sync demand or snowfall-alerts
   feature gets greenlit. Recommendation: Supabase free tier, magic-link auth,
   `user_cam_prefs (user_id, cam_id, rank, hidden)`, migrate localStorage on first login.
10. Stretch: snowfall alerts ("Wolf Creek stake shows 6+"), 24h stake timelapse
   (Vercel cron + Blob snapshots every 30 min) — next big value item.

## Reference: verified-live cams deliberately NOT added (scenic; stake-first rule)

Add any of these on request — URLs verified 2026-07-13:
- Monarch: Pioneer Top / Sundeck / Pano Flats (`player.brownrice.com/snapshot/skimonarch{garfield,sundeck,panoflats}`)
- Crested Butte: Base / Paradise Warming House / Umbrella Bar (`player.brownrice.com/snapshot/{Crestedbuttebase,Crestedbuttewarm,Crestedbuttebar}` — capital C, case-sensitive)
- Telluride: Plaza / Bon Vivant / Hoot Brown / Joint Point (ipcamlive aliases `plazacam,bonvivant,hootbrown,jointpoint`)
- Wolf Creek: Summit (`live2.brownrice.com/snapshot/wolfcreeksummit`)
- Loveland: Basin / Chair 1 / Ptarmigan / Valley pano (`photosskiloveland.com/{basin,chairone,ptarmigan}/image.jpg`)
- Aspen lift cams: Verkada, domain-locked to *.aspensnowmass.com — permanently skip.

Platform-follows-ownership cheat sheet:
- Vail Resorts → cache.snow.com / Timecam / Brownrice · POWDR → HDRelay ·
  Alterra → YouTube Live · independents → verify per resort
- brownrice universal snapshot: `{player|liveN}.brownrice.com/snapshot/<name>`
- ipcamlive: request the alias snapshot.php URL and follow redirects (stream IDs rotate)

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
- Vercel Analytics (free tier) — learn if anyone uses the site
- Timecam URL builder: add fallback if Breck's 10-min frame cadence ever changes
- Delete stale ~/Downloads/summitcams 2/3/4 + summitcams*.zip copies (AJ's call; disk-constrained Mac)

## Done archive

- 2026-07-12: Flavorbasin label fix, cache-buster bucketing
- 2026-07-13: registry (app/cams.js), /api/status + /api/health + daily cron + Telegram digest
  (env vars pending), off-season UI, Tier 1+2 research + 10 new cams, localStorage
  favorites/reorder/hide, /api/snow (Open-Meteo), PWA manifest + apple-touch-icon,
  next/font self-hosting, MDT clock, README refresh
