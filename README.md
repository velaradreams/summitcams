# SummitCams.live

Colorado snow stake webcam aggregator. All cams on one scrollable page.

## Resorts

The cam list lives in `app/cams.js` — that registry is the source of truth
(this README doesn't repeat it, so it can't drift). Coverage: Copper, A-Basin,
Breck, Keystone, Vail ×2, Beaver Creek, Loveland, Eldora, Winter Park,
Steamboat ×2, Aspen's four mountains, Telluride, Monarch, Ski Cooper,
Sunlight, Powderhorn, Granby Ranch, Purgatory, Wolf Creek (Crested Butte
pulled until it opens). Cam platforms encountered so far: HDRelay, Brownrice,
Timecam.tv, cache.snow.com, ipcamlive, webcam.io, YouTube Live.

## Architecture

- **Cam registry**: `app/cams.js` — single source of truth for every cam
  (metadata, region, season, lat/lon). The proxy allowlist, health checks, and
  snow lookups all derive from it. Adding a cam = one registry entry.
  Never rename a cam `id` once shipped (it's the localStorage prefs key).
- **Frontend**: Next.js 16 (App Router) — single scrollable page, grouped by
  region, with localStorage favorites/reorder/hide (`sc:prefs:v1`).
- **API routes** (all Node runtime):
  - `/api/cam?id=<cam id>&t=<minute>` — same-origin image proxy for registered
    cams only; raster images only (never HTML/SVG)
  - `/api/status` — upstream check per cam (reachable, a real image, frame
    under 6 h old via Last-Modified, YouTube stream not ended); drives the
    off-season / offline UI. Served stale-while-revalidate so nobody waits.
  - `/api/health` — daily cron (vercel.json); Telegram digest of broken cams
    (optional: set `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` env vars)
  - `/api/snow` — trailing-24h snowfall + next-24h forecast per cam, modeled
    at the stake's elevation (Open-Meteo, CC BY 4.0 — credited on both pages)
- **Seasons**: `seasonal: true` cams that are dark in May–Nov show as
  "off-season", not broken. An ended YouTube stream is always "offline" (its
  id needs replacing).
- **YouTube feeds**: Embedded directly via iframe (no proxy needed)
- **Hosting**: Vercel (PWA manifest included; installs to a phone home screen)

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import the repo
4. Deploy (zero config needed — Vercel auto-detects Next.js)
5. In Vercel dashboard → Settings → Domains → add `summitcams.live`
6. Update DNS on Squarespace:
   - Add CNAME record: `www` → `cname.vercel-dns.com`
   - Or follow Vercel's domain setup instructions

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Adding New Cams

1. Add one entry to `CAMS` in `app/cams.js` (copy a neighbor of the same
   `type`: image, timecam, youtube or iframe). The proxy, health check and
   snowfall pick it up automatically.
2. Start it as `verification: "untested"`; flip to `"validated"` after you've
   seen it show a real snow stake.
3. Only if the host refuses requests without one, add a `REFERER_MAP` line —
   and if a host blocks us or asks us to stop, remove the cam instead.
4. Never rename an existing `id` (favorites are stored by id).
5. Eyeball the label before pushing: a push to main deploys to production.

## Image Refresh

- Static images load when scrolled near, then refresh every 60 seconds while
  the tab is visible, via a minute-bucketed `t` param (one shared URL per
  minute, so the CDN cache works — never make it per-request)
- Timecam.tv URLs are dynamically calculated based on current UTC time (10-min intervals)
- YouTube streams are real-time
- Proxy caches upstream responses for 60 seconds (`s-maxage=60`)
