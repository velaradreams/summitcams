import { proxiedHostnames, upstreamHeaders } from "../../cams";

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

  if (!proxiedHostnames().includes(srcUrl.hostname)) {
    return new Response(JSON.stringify({ error: "Domain not allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const upstream = await fetch(src, {
      headers: upstreamHeaders(srcUrl.hostname),
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
