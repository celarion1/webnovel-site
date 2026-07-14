import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const { password } = await req.json();
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    return NextResponse.json(
      { error: "서버에 관리자 비밀번호(ADMIN_PASSWORD)가 설정되어 있지 않습니다." },
      { status: 500 }
    );
  }

  if (!password || password !== expected) {
    return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
