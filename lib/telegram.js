// 텔레그램 채널로 신규 회차 알림을 보내는 유틸.
// TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID 환경변수가 모두 설정된 경우에만 동작함.
// (설정되지 않았거나 전송 실패 시에도 예외를 던지지 않고 조용히 무시함 —
//  알림 발송 실패가 회차 등록 자체를 막아서는 안 되기 때문)

function getSiteUrl() {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "";
}

export function hasTelegramEnv() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHANNEL_ID);
}

export async function notifyNewEpisode({ novelSlug, novelTitle, episodeId, episodeTitle }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHANNEL_ID;
  if (!token || !chatId) return; // 설정 전이면 조용히 스킵

  const siteUrl = getSiteUrl();
  const link = siteUrl ? `${siteUrl}/novel/${novelSlug}/${episodeId}` : "";

  const lines = [
    `📖 ${novelTitle} 새 회차가 올라왔어요!`,
    episodeTitle,
  ];
  if (link) {
    lines.push("");
    lines.push(`지금 읽기: ${link}`);
  }
  const text = lines.join("\n");

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[telegram] sendMessage failed:", res.status, body);
    }
  } catch (err) {
    console.error("[telegram] sendMessage error:", err);
  }
}
