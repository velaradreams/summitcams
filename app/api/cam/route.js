// Serverless image proxy for webcam feeds
// Bypasses CORS and hotlink protection by fetching server-side

const ALLOWED_DOMAINS = [
  "img.hdrelay.com",
  "live9.brownrice.com",
  "live6.brownrice.com",
  "streamer5.brownrice.com",
  "terra.timecam.tv",
  "cache.snow.com",
];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const src = searchParams.get("src");

  if (!src) {
    return new Response(JSON.stringify({ error: "Missing src parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate domain
  let srcUrl;
  try {
    srcUrl = new URL(src);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid URL" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!ALLOWED_DOMAINS.includes(srcUrl.hostname)) {
    return new Response(JSON.stringify({ error: "Domain not allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const upstream = await fetch(src, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        Referer: srcUrl.origin + "/",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!upstream.ok) {
      return new Response(
        JSON.stringify({ error: `Upstream ${upstream.status}` }),
        {
          status: upstream.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    const imageBuffer = await upstream.arrayBuffer();

    return new Response(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=30, s-maxage=30, stale-while-revalidate=60",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch image", detail: err.message }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export const runtime = "edge";
