import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { recordPageview } from "../../../lib/analytics";

export const dynamic = "force-dynamic";

const VISITOR_COOKIE = "webnovel_visitor";
const VISITOR_MAX_AGE = 60 * 60 * 24 * 365; // 1년

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { type, novelSlug, episodeId } = body || {};

    let visitorId = req.cookies.get(VISITOR_COOKIE)?.value;
    let isNewVisitor = false;
    if (!visitorId) {
      visitorId = randomUUID();
      isNewVisitor = true;
    }

    let episodeKey = null;
    if (type === "episode" && novelSlug && episodeId) {
      episodeKey = `${novelSlug}::${episodeId}`;
    }

    await recordPageview({ visitorId, episodeKey });

    const res = NextResponse.json({ ok: true });
    if (isNewVisitor) {
      res.cookies.set(VISITOR_COOKIE, visitorId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: VISITOR_MAX_AGE,
      });
    }
    return res;
  } catch {
    // 통계 기록 실패가 방문자 경험에 영향을 주지 않도록 조용히 무시
    return NextResponse.json({ ok: false });
  }
}
