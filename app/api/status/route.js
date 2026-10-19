import { checkAllCams } from "../../lib/health";

// Cached at the CDN so all visitors share one check sweep. stale-while-revalidate
// serves the last sweep instantly and refreshes it in the background, so no
// visitor waits on the ~4 s sweep (at low traffic the copy can be hours old).
export async function GET() {
  const statuses = await checkAllCams();
  return new Response(
    JSON.stringify({ statuses, checkedAt: new Date().toISOString() }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control":
          "public, max-age=60, s-maxage=600, stale-while-revalidate=86400",
      },
    }
  );
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
