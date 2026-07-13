import { CAMS } from "../../cams";

// Trailing-24h snowfall (inches) per cam location, from Open-Meteo (free, no key).
// Context only — the stake photo is the ground truth. Cached 30 min at the CDN.
export async function GET() {
  const lats = CAMS.map((c) => c.lat).join(",");
  const lons = CAMS.map((c) => c.lon).join(",");
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}` +
    `&hourly=snowfall&past_days=1&forecast_days=1` +
    `&precipitation_unit=inch&timezone=UTC`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error("open-meteo " + res.status);
    const data = await res.json();
    // Single-location responses come back as an object, multi as an array.
    const locations = Array.isArray(data) ? data : [data];

    const nowMs = Date.now();
    const cutoffMs = nowMs - 24 * 3600 * 1000;
    const snow = {};
    CAMS.forEach((cam, i) => {
      const loc = locations[i];
      if (!loc?.hourly?.time) return;
      let total = 0;
      loc.hourly.time.forEach((t, j) => {
        const ms = Date.parse(t + "Z");
        if (ms > cutoffMs && ms <= nowMs) total += loc.hourly.snowfall[j] || 0;
      });
      snow[cam.id] = Math.round(total * 10) / 10;
    });

    return new Response(JSON.stringify({ snow }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ snow: {}, error: err.message }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=300",
      },
    });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
