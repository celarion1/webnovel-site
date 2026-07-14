import { NextResponse } from "next/server";
import { moveEpisode, friendlyFsError } from "../../../../../lib/novels";
import { isAdminAuthed } from "../../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req, { params }) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }
  try {
    const { episodeId, direction } = await req.json();
    if (!episodeId || !["up", "down"].includes(direction)) {
      return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
    }
    await moveEpisode(params.slug, episodeId, direction);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: friendlyFsError(err) }, { status: 500 });
  }
}
