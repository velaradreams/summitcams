import { CAMS, upstreamUrl, upstreamHeaders, isSummer } from "../cams";

// A frame older than this counts as a stuck camera, not a live one.
const STALE_MS = 6 * 3600 * 1000;
const TIMEOUT_MS = 4000;

// YouTube liveness from the watch page. Returns "live", "ended" (the stream is
// over for good — this video id will never come back), or "unknown".
// Conservative: bot walls / fetch failures / pages we can't read are "unknown",
// which the caller treats as ok.
async function youtubeState(videoId) {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: upstreamHeaders("www.youtube.com"),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) {
      res.body?.cancel();
      return "unknown";
    }
    const html = await res.text();
    if (!html.includes('"videoDetails"')) return "unknown";
    if (html.includes('"isLiveNow":true') || html.includes('"isLive":true')) return "live";
    if (html.includes('"endTimestamp"')) return "ended";
    return "notlive";
  } catch {
    return "unknown";
  }
}

// A dark cam: off-season during May–November for seasonal cams, otherwise down.
function darkState(cam, extra) {
  const state = cam.seasonal && isSummer() ? "offseason" : "down";
  return { state, ...extra };
}

// Check every cam's upstream. Image/timecam cams are fetched with the proxy's
// headers; YouTube cams are checked for live status; iframe cams can't be
// checked and report "ok". States: ok | offseason | down (with a reason).
export async function checkAllCams() {
  const checks = CAMS.map(async (cam) => {
    // verification: "validated" = eyeballed as a real snow-stake view;
    // "untested" = serves an image but not yet confirmed. Promote after a look.
    const v = cam.verification || "untested";
    if (cam.type === "youtube") {
      const yt = await youtubeState(cam.videoId);
      if (yt === "live" || yt === "unknown") return [cam.id, { state: "ok", verification: v }];
      // An ended stream never comes back: flag it in any month so the id gets replaced.
      if (yt === "ended")
        return [cam.id, { state: "down", reason: "ended", verification: v }];
      return [cam.id, { ...darkState(cam, { reason: "offline" }), verification: v }];
    }
    const url = upstreamUrl(cam);
    if (!url) return [cam.id, { state: "ok", verification: v }];
    try {
      const res = await fetch(url, {
        headers: upstreamHeaders(new URL(url).hostname),
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      });
      res.body?.cancel();
      // Some hosts (brownrice) return 200 text/html for nonexistent cam names —
      // an image cam is only healthy if the response is actually an image.
      const isImage = (res.headers.get("content-type") || "").startsWith("image/");
      if (!res.ok || !isImage)
        return [cam.id, { ...darkState(cam, { reason: "offline", httpStatus: res.status }), verification: v }];
      // A camera that stopped often keeps serving its last frame with a 200.
      const lastModified = Date.parse(res.headers.get("last-modified") || "");
      if (cam.freshness !== "none" && Number.isFinite(lastModified) && Date.now() - lastModified > STALE_MS) {
        const frameAt = new Date(lastModified).toISOString();
        return [cam.id, { ...darkState(cam, { reason: "stale", frameAt }), verification: v }];
      }
      return [cam.id, { state: "ok", verification: v }];
    } catch {
      return [cam.id, { ...darkState(cam, { reason: "offline", httpStatus: 0 }), verification: v }];
    }
  });
  const entries = await Promise.all(checks);
  return Object.fromEntries(entries);
}
