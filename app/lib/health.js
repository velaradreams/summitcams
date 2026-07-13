import { CAMS, upstreamUrl, upstreamHeaders, isSummer } from "../cams";

// YouTube liveness: the watch page embeds isLiveNow in player microformat.
// Conservative: only report not-live when we clearly got a real watch page
// that lacks the live marker — bot walls / fetch failures assume ok.
async function youtubeIsLive(videoId) {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: upstreamHeaders("www.youtube.com"),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return true;
    const html = await res.text();
    if (!html.includes('"videoDetails"')) return true;
    return html.includes('"isLiveNow":true') || html.includes('"isLive":true');
  } catch {
    return true;
  }
}

// Check every cam's upstream. Image/timecam cams are fetched through the same
// headers as the proxy; YouTube cams are checked for live status; iframe cams
// are not checkable and always report "ok". States: ok | offseason | down.
export async function checkAllCams() {
  const checks = CAMS.map(async (cam) => {
    // verification: "validated" = season-proven original; "untested" = added
    // 2026-07 from research — serves an image, but not yet confirmed to be a
    // real snow-stake view. Promote to "validated" after a winter eyeball pass.
    const v = cam.verification || "untested";
    if (cam.type === "youtube") {
      const live = await youtubeIsLive(cam.videoId);
      if (live) return [cam.id, { state: "ok", verification: v }];
      const state = cam.seasonal && isSummer() ? "offseason" : "down";
      return [cam.id, { state, verification: v }];
    }
    const url = upstreamUrl(cam);
    if (!url) return [cam.id, { state: "ok", verification: v }];
    try {
      const res = await fetch(url, {
        headers: upstreamHeaders(new URL(url).hostname),
        signal: AbortSignal.timeout(8000),
      });
      // Some hosts (brownrice) return 200 text/html for nonexistent cam names —
      // an image cam is only healthy if the response is actually an image.
      const isImage = (res.headers.get("content-type") || "").startsWith("image/");
      if (res.ok && isImage) return [cam.id, { state: "ok", verification: v }];
      const state = cam.seasonal && isSummer() ? "offseason" : "down";
      return [cam.id, { state, httpStatus: res.status, verification: v }];
    } catch {
      const state = cam.seasonal && isSummer() ? "offseason" : "down";
      return [cam.id, { state, httpStatus: 0, verification: v }];
    }
  });
  const entries = await Promise.all(checks);
  return Object.fromEntries(entries);
}
