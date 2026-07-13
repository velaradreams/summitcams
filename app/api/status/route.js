import { checkAllCams } from "../../lib/health";

// Cached at the CDN so all visitors share one check sweep per 10 minutes.
export async function GET() {
  const statuses = await checkAllCams();
  return new Response(
    JSON.stringify({ statuses, checkedAt: new Date().toISOString() }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control":
          "public, max-age=60, s-maxage=600, stale-while-revalidate=1200",
      },
    }
  );
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
