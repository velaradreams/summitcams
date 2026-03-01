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

- **Frontend**: Next.js 14 (App Router) — single scrollable page
- **Backend**: Edge API route at `/api/cam` — proxies static images to bypass CORS/hotlink protection
- **YouTube feeds**: Embedded directly via iframe (no proxy needed)
- **Hosting**: Vercel

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
