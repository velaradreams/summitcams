import { CAMS, upstreamUrl, upstreamHeaders, isSummer } from "../cams";

// Check every proxied cam's upstream. YouTube/iframe cams are not checkable
// server-side and always report "ok". States: ok | offseason | down.
export async function checkAllCams() {
  const checks = CAMS.map(async (cam) => {
    const url = upstreamUrl(cam);
    if (!url) return [cam.id, { state: "ok" }];
    try {
      const res = await fetch(url, {
        headers: upstreamHeaders(new URL(url).hostname),
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) return [cam.id, { state: "ok" }];
      const state = cam.seasonal && isSummer() ? "offseason" : "down";
      return [cam.id, { state, httpStatus: res.status }];
    } catch {
      const state = cam.seasonal && isSummer() ? "offseason" : "down";
      return [cam.id, { state, httpStatus: 0 }];
    }
  });
  const entries = await Promise.all(checks);
  return Object.fromEntries(entries);
}
