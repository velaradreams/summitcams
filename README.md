# SummitCams.live

Colorado snow stake webcam aggregator. All cams on one scrollable page.

## Resorts (10 cams)

| Resort | Cam | Source |
|--------|-----|--------|
| Copper Mountain | Snow Stake | HDRelay (proxied) |
| Arapahoe Basin | Snow Stake | HDRelay (proxied) |
| Vail | Summit Snow Stake | Brown Rice (proxied) |
| Vail | Blue Sky Basin | Brown Rice (proxied) |
| Beaver Creek | Snow Stake | Brown Rice (proxied) |
| Breckenridge | Snow Stake | Timecam.tv (proxied) |
| Keystone | Snow Stake | cache.snow.com (proxied) |
| Winter Park | Snow Stake | YouTube Live |
| Steamboat | Mid-Mountain Stake | YouTube Live |
| Steamboat | Champagne Powder | YouTube Live |

## Architecture

- **Cam registry**: `app/cams.js` — single source of truth for every cam
  (metadata, region, season, lat/lon). The proxy allowlist, health checks, and
  snow lookups all derive from it. Adding a cam = one registry entry.
  Never rename a cam `id` once shipped (it's the localStorage prefs key).
- **Frontend**: Next.js 14 (App Router) — single scrollable page, grouped by
  region, with localStorage favorites/reorder/hide (`sc:prefs:v1`).
- **API routes** (all Node runtime):
  - `/api/cam` — proxies static images to bypass CORS/hotlink protection
  - `/api/status` — live upstream check per cam; drives off-season/down UI
  - `/api/health` — daily cron (vercel.json); Telegram digest of broken cams
    (optional: set `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` env vars)
  - `/api/snow` — trailing-24h snowfall per cam location (Open-Meteo, free)
- **Seasons**: `seasonal: true` cams that 404 in May–Oct show as "off-season",
  not broken, and don't alert.
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

Edit the `CAMS` array in `app/page.js`. For image-based cams, add the domain to `ALLOWED_DOMAINS` in `app/api/cam/route.js`.

## Image Refresh

- Static images auto-refresh every 60 seconds via cache-busting query param
- Timecam.tv URLs are dynamically calculated based on current UTC time (10-min intervals)
- YouTube streams are real-time
- Proxy caches upstream responses for 30 seconds (`s-maxage=30`)
