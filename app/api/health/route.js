import { CAMS } from "../../cams";
import { checkAllCams } from "../../lib/health";

// Daily cron target (see vercel.json). Checks every cam and sends a Telegram
// digest of genuinely-broken (not off-season) cams. Alerting is optional:
// without TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID env vars it just reports JSON.
export async function GET() {
  const statuses = await checkAllCams();
  const broken = Object.entries(statuses).filter(([, s]) => s.state === "down");

  let alerted = false;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (broken.length > 0 && token && chatId) {
    const byId = Object.fromEntries(CAMS.map((c) => [c.id, c]));
    const lines = broken.map(([id, s]) => {
      const cam = byId[id];
      return `• ${cam.resort} — ${cam.cam} (HTTP ${s.httpStatus || "timeout"})`;
    });
    const text = `⚠️ summitcams: ${broken.length} cam(s) down\n${lines.join("\n")}`;
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text }),
          signal: AbortSignal.timeout(10000),
        }
      );
      alerted = res.ok;
    } catch {
      alerted = false;
    }
  }

  return new Response(
    JSON.stringify({
      statuses,
      brokenCount: broken.length,
      alerted,
      checkedAt: new Date().toISOString(),
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
