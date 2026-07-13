# SummitCams Implementation Plan

**Main value:** one page, on a phone, at 6am — *did it snow, and how much, at every Colorado
resort.* Every phase below either makes that answer more reliable, more complete, or faster
to get to. Written 2026-07-12. Companion to BACKLOG.md (which tracks status).

**Verified today:** Copper and A-Basin HDRelay frames 404 upstream (summer shutdown) — the
site currently shows two dead cards with eternal "retrying" states. Phases 2–3 fix this class
of problem permanently.

---

## Phase 0 — Hygiene (DONE 2026-07-12, local, unpushed)

- `page.js`: A-Basin label restored from "Flavorbasin V: May 9th" (was live in prod).
- `page.js`: client cache-buster bucketed to the minute (`Math.floor(Date.now()/60000)`) so
  all visitors share one URL per minute and the proxy's `s-maxage=30` CDN cache actually
  absorbs traffic. Before this, every visitor's 60s tick hit the resorts directly.
- Verified: `npm run build` clean; page renders with fixed label via `next start`.

## Phase 1 — Cam registry (the foundation; ~half day)

Everything later (health, seasons, expansion, favorites) needs cams as *data*.

- New `app/cams.js`: exports `CAMS` — the current 10 entries plus new fields:
  - `region` ("Summit County", "I-70 West", "Steamboat"…) — grouping once the list grows
  - `seasonal: true|false` — cam goes dark in summer
  - `sourceHost` — derived or explicit hostname for the proxy allowlist
- `app/api/cam/route.js`: `ALLOWED_DOMAINS` derived from the registry (map over image/timecam
  cams, extract hostnames) instead of a hand-maintained list. `REFERER_MAP` stays here —
  it's proxy behavior, not cam identity.
- `page.js` imports from `app/cams.js`; zero visual change.
- **Acceptance:** page renders identically; adding a cam = one registry entry, allowlist
  updates itself; a registry entry with a new host Just Works through the proxy.

## Phase 2 — Health + status (the reliability layer; ~half day)

Kills the silent-rot problem (proven today by the two dead HDRelay feeds).

- `app/api/health/route.js`: fetches every image/timecam cam through the same proxy logic,
  records `{camId, ok, httpStatus, checkedAt}`.
- Status storage: a single JSON blob (Vercel Blob or Edge Config; Blob is simplest).
  Health writes it; the page reads it at request time (or the client fetches `/api/status`).
- `vercel.json` cron: hit `/api/health` 2×/day in season, 1×/day summer.
- Alerting: on a cam's first transition to failing, send a Telegram message (same bot
  pattern as ConcertQueue admin alerts; token in env var). Include cam id + upstream status.
- UI: a cam with `ok:false` for >24h renders a compact "temporarily down" card (thin bar,
  not a full black rectangle) so the page never looks broken for weeks unnoticed.
- **Acceptance:** kill a cam URL in the registry → within one cron cycle, Telegram alert +
  compact down-state card; restore it → card returns automatically.

## Phase 3 — Season handling (~2–3 hrs)

- Cams with `seasonal: true` that are failing get status `offseason` instead of `broken`
  (heuristic: seasonal + summer months + upstream 404 = off-season, alert suppressed).
- UI: off-season cams collapse into a bottom section — "❄ Off-season — back when the lifts
  spin (Nov)". The page must look *intentional* in July, not broken.
- A-Basin/Wolf Creek edge: their seasons run into June — status is per-cam, never a global
  summer switch.
- **Acceptance:** today's two dead HDRelay cams display as off-season, not broken; no alert
  spam for expected summer darkness.

## Phase 4 — Coverage expansion (the "more mountains" layer)

Step 1: **coverage matrix before any integration** (one pass, ~a day): for each target
resort, find the webcam page and classify: static JPG (proxyable — test hotlink behavior),
HDRelay / Brownrice / Timecam (recipes already exist), YouTube (trivial), or JS-player-only
(embed or skip). Many stake cams are summer-dark → matrix rows marked "verify in fall".

Ownership → platform cheat sheet (from the 10 working integrations):
| Owner | Targets | Expected platform |
|---|---|---|
| Vail Resorts | Crested Butte | cache.snow.com / Timecam / Brownrice |
| POWDR | Eldora | HDRelay |
| Alterra | (have WP, Steamboat) | YouTube Live |
| Independent | Loveland, Monarch, Wolf Creek, Telluride, Aspen ×4 | verify per resort |

Rollout order: **Tier 1** Loveland, Eldora, Monarch (Front Range day-trip set; Loveland is
the A-Basin peer everyone checks) → **Tier 2** Crested Butte, Telluride, Aspen Snowmass,
Wolf Creek (the snow-total king). Tier 3 completionist list stays in BACKLOG.md pending a
decision that "every CO resort" is a goal.

Rule: **stake cams over scenic cams.** A base-area cam is an acceptable substitute only
where no stake cam exists, and gets labeled as such. 40 mixed scenic cams = a worse COtrip.

UI at scale: region group headers from the registry `region` field; quick-nav chips
(sticky, horizontal scroll) that jump to a region; `loading="lazy"` below the fold.
- **Acceptance per batch:** new cams render, proxy allowlist picked them up automatically,
  health cron covers them from day one.

## Phase 5 — Glanceability (turns cam-viewer into snow-checker; ~1 day)

The 6am question is "how much fell" — let the page answer it before an image even loads.

- Per-resort snowfall numbers: Open-Meteo (free, no key) 24h/48h snowfall at each resort's
  lat/lon (add `lat`/`lon` to registry). Server route caches 30 min; render "24h: 6.2″"
  next to the elevation badge.
- This is *context*, not ground truth — the stake photo remains the product; the number
  tells you which photo to look at first.
- PWA manifest + icons so it installs to a home screen (this is a phone site).
- **Acceptance:** page shows a snowfall number per resort; Lighthouse mobile ≥ 90;
  add-to-home-screen works on iPhone.

## Phase 6 — Personalization, Phase A (no accounts; ~1 day)

- Star on each card → favorites pin to top, in user-chosen order (drag on desktop,
  up/down buttons on mobile — drag-reorder on touch is fiddly; buttons are honest).
- Optional per-cam hide. All state in `localStorage` (`sc:prefs:v1`).
- Registry ids are the stable keys — never rename an id once shipped (breaks user prefs).
- **Acceptance:** reorder survives reload; clearing prefs restores default order; zero
  server involvement.

## Decision gate — accounts (Phase B; NOT scheduled)

Build only if a trigger fires: real cross-device-sync demand, or the snowfall-alerts
feature ("tell me when Wolf Creek's stake shows 6+") gets greenlit. Recommendation on
file: Supabase free tier, magic-link auth, `user_cam_prefs(user_id, cam_id, rank, hidden)`,
localStorage prefs migrate on first login. Rationale: accounts double the maintenance
surface of a set-and-forget site; localStorage covers the one-phone-at-6am reality.

## Stretch (post-Phase 6, in value order)

1. **24h stake timelapse** — cron snapshots each stake cam every 30 min to Vercel Blob
   (in season); card gets a scrubber. *The* killer feature for "did it snow overnight".
2. Snowfall alerts (requires accounts gate).
3. Vercel Analytics (free) — find out if anyone's out there.
4. next/font self-hosting; MST→dynamic tz label; Timecam cadence fallback; README Edge/nodejs
   doc fix (all small, batch into any phase's PR).

## Sequencing + cost

Phases 1→2→3 are one weekend and are the whole reliability story. Phase 4 Tier 1 the next
weekend. 5 and 6 are independent single days in any order. Everything through Phase 6:
**$0/month** (Vercel hobby + free APIs), no servers, no database.
