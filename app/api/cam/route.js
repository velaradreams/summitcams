const ALLOWED_DOMAINS = [
  "img.hdrelay.com",
  "live9.brownrice.com",
  "live6.brownrice.com",
  "streamer5.brownrice.com",
  "terra.timecam.tv",
  "cache.snow.com",
];

const REFERER_MAP = {
  "img.hdrelay.com": "https://www.hdrelay.com/",
  "terra.timecam.tv": "https://www.breckenridge.com/",
  "cache.snow.com": "https://www.keystoneresort.com/",
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const src = searchParams.get("src");

  if (!src) {
    return new Response(JSON.stringify({ error: "Missing src" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

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

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
  };

  const referer = REFERER_MAP[srcUrl.hostname];
  if (referer) {
    headers["Referer"] = referer;
  }

  try {
    const upstream = await fetch(src, {
      headers,
      signal: AbortSignal.timeout(10000),
    });

    if (!upstream.ok) {
      return new Response(
        JSON.stringify({
          error: "Upstream " + upstream.status,
          src: src,
        }),
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
      JSON.stringify({
        error: "Fetch failed",
        detail: err.message,
        src: src,
      }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export const runtime = "nodejs";
