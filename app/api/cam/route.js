import { CAMS, upstreamUrl, upstreamHeaders } from "../../cams";

const MAX_BYTES = 5 * 1024 * 1024;

// Failures go out as 404s with a short shared cache: Vercel never caches a 502,
// so a dead upstream would otherwise be re-fetched on every visitor's request.
function fail(status, error) {
  return new Response(JSON.stringify({ error, status }), {
    status: 404,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=30, s-maxage=60",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

// Same-origin image proxy for registered cams only: /api/cam?id=<cam id>&t=<minute>.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cam = CAMS.find((c) => c.id === searchParams.get("id"));
  const src = cam && upstreamUrl(cam);
  if (!src) return fail(400, "Unknown cam");

  try {
    // redirect: "follow" stays — ipcamlive's snapshot.php answers with a 302.
    const upstream = await fetch(src, {
      headers: upstreamHeaders(new URL(src).hostname),
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    if (!upstream.ok) {
      upstream.body?.cancel();
      return fail(upstream.status, "Upstream " + upstream.status);
    }

    // Only raster images go out on our origin — never HTML or SVG.
    const contentType = upstream.headers.get("content-type") || "";
    if (!contentType.startsWith("image/") || contentType.includes("svg")) {
      upstream.body?.cancel();
      return fail(502, "Not an image");
    }
    const length = Number(upstream.headers.get("content-length") || 0);
    if (length > MAX_BYTES) {
      upstream.body?.cancel();
      return fail(502, "Too large");
    }
    const imageBuffer = await upstream.arrayBuffer();
    if (imageBuffer.byteLength > MAX_BYTES) return fail(502, "Too large");

    return new Response(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=60",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return fail(502, "Fetch failed");
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
