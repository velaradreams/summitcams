import { CAMS, upstreamUrl, upstreamHeaders, isSummer } from "../cams";

// Check every proxied cam's upstream. YouTube/iframe cams are not checkable
// server-side and always report "ok". States: ok | offseason | down.
export async function checkAllCams() {
  const checks = CAMS.map(async (cam) => {
    // verification: "validated" = season-proven original; "untested" = added
    // 2026-07 from research — serves an image, but not yet confirmed to be a
    // real snow-stake view. Promote to "validated" after a winter eyeball pass.
    const v = cam.verification || "untested";
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
