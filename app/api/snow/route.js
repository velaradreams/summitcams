import { CAMS, elevationMeters } from "../../cams";

// Per cam location, from Open-Meteo (free, no key; CC BY 4.0 — credited on both
// pages): trailing-24h snowfall and the next-24h forecast, in inches, modeled at
// the stake's own elevation (the default grid point can sit 500–1,000 m lower).
// Context only — the stake photo is the ground truth. Cached 30 min at the CDN.
export async function GET() {
  const cams = CAMS.filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lon));
  const elevations = cams.map((c) => elevationMeters(c) ?? "nan");
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${cams.map((c) => c.lat).join(",")}` +
    `&longitude=${cams.map((c) => c.lon).join(",")}&elevation=${elevations.join(",")}` +
    `&hourly=snowfall&past_days=1&forecast_days=2` +
    `&precipitation_unit=inch&timezone=UTC`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000), cache: "no-store" });
    if (!res.ok) throw new Error("open-meteo " + res.status);
    const data = await res.json();
    // Single-location responses come back as an object, multi as an array.
    const locations = Array.isArray(data) ? data : [data];

    const nowMs = Date.now();
    const pastCutoff = nowMs - 24 * 3600 * 1000;
    const futureCutoff = nowMs + 24 * 3600 * 1000;
    const snow = {};
    const forecast = {};
    cams.forEach((cam, i) => {
      const loc = locations[i];
      if (!loc?.hourly?.time) return;
      let past = 0;
      let next = 0;
      loc.hourly.time.forEach((t, j) => {
        const ms = Date.parse(t + "Z");
        const v = loc.hourly.snowfall[j] || 0;
        if (ms > pastCutoff && ms <= nowMs) past += v;
        else if (ms > nowMs && ms <= futureCutoff) next += v;
      });
      snow[cam.id] = Math.round(past * 10) / 10;
      forecast[cam.id] = Math.round(next * 10) / 10;
    });

    return new Response(JSON.stringify({ snow, forecast, fetchedAt: new Date(nowMs).toISOString() }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control":
          "public, max-age=300, s-maxage=1800, stale-while-revalidate=3600",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ snow: {}, forecast: {}, error: err.message }), {
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
