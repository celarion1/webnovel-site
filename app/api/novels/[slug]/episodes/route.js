import { NextResponse } from "next/server";
import { createEpisode, friendlyFsError } from "../../../../../lib/novels";
import { isAdminAuthed } from "../../../../../lib/auth";
import { recordEpisodeAdded } from "../../../../../lib/announcements";

export const dynamic = "force-dynamic";

export async function POST(req, { params }) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }
  try {
    const { title, body } = await req.json();
    if (!title || !title.trim()) {
      return NextResponse.json({ error: "회차 제목을 입력해주세요." }, { status: 400 });
    }
    if (!body || !body.trim()) {
      return NextResponse.json({ error: "본문 내용을 입력해주세요." }, { status: 400 });
    }
    const id = await createEpisode(params.slug, title.trim(), body);
    try {
      await recordEpisodeAdded(params.slug);
    } catch {
      // 공지 기록 실패가 회차 등록 자체를 막지 않도록 무시
    }
    return NextResponse.json({ id });
  } catch (err) {
    return NextResponse.json({ error: friendlyFsError(err) }, { status: 500 });
  }
}
