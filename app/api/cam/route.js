import sharp from "sharp";
import { CAMS, upstreamUrl, upstreamHeaders } from "../../cams";

const MAX_BYTES = 5 * 1024 * 1024;
// Card-size frames: 1920px / 250 KB sources get scaled to 1280px wide. That's
// sharp on a 3x phone and halves the biggest frames. ?full=1 serves the original
// (the card's tap-to-enlarge link).
const CARD_WIDTH = 1280;
const RECOMPRESS_OVER = 150 * 1024;

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
    let body = Buffer.from(await upstream.arrayBuffer());
    if (body.length > MAX_BYTES) return fail(502, "Too large");

    let type = contentType;
    if (searchParams.get("full") !== "1") {
      try {
        const { width } = await sharp(body).metadata();
        if (width > CARD_WIDTH || body.length > RECOMPRESS_OVER) {
          body = await sharp(body)
            .resize({ width: CARD_WIDTH, withoutEnlargement: true })
            .jpeg({ quality: 78, mozjpeg: true })
            .toBuffer();
          type = "image/jpeg";
        }
      } catch {
        // Not decodable by sharp: serve the original bytes.
      }
    }

    // When the camera's server says when the frame was taken, pass that along
    // as Server-Timing so the page can show "photo 4 min ago" without an extra
    // request (images can't expose headers to JS; Resource Timing can).
    const lastModified = Date.parse(upstream.headers.get("last-modified") || "");
    const frameTiming =
      cam.freshness !== "none" && Number.isFinite(lastModified)
        ? { "Server-Timing": `frame;desc="${new Date(lastModified).toISOString()}"` }
        : {};

    return new Response(body, {
      status: 200,
      headers: {
        ...frameTiming,
        "Content-Type": type,
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
