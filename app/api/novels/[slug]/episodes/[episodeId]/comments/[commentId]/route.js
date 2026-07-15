import { NextResponse } from "next/server";
import { deleteComment } from "../../../../../../../../lib/comments";
import { isAdminAuthed } from "../../../../../../../../lib/auth";

export const dynamic = "force-dynamic";

// 댓글 삭제(모더레이션)는 관리자만 가능함.
export async function DELETE(req, { params }) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }
  try {
    await deleteComment(params.slug, params.episodeId, params.commentId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err && err.message) || "댓글 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
