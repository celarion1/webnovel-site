import { NextResponse } from "next/server";
import { getComments, addComment } from "../../../../../../../lib/comments";
import { generateNickname } from "../../../../../../../lib/nickname";

export const dynamic = "force-dynamic";

const MAX_LENGTH = 50;

// 댓글 목록/작성은 방문자 전체에게 열려있는 공개 기능이므로 관리자 인증 없이 동작함.
export async function GET(req, { params }) {
  try {
    const comments = await getComments(params.slug, params.episodeId);
    return NextResponse.json({ comments });
  } catch (err) {
    return NextResponse.json(
      { error: (err && err.message) || "댓글을 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(req, { params }) {
  try {
    const { text } = await req.json().catch(() => ({}));
    const trimmed = (text || "").trim();

    if (!trimmed) {
      return NextResponse.json({ error: "댓글 내용을 입력해주세요." }, { status: 400 });
    }
    if (Array.from(trimmed).length > MAX_LENGTH) {
      return NextResponse.json(
        { error: `댓글은 최대 ${MAX_LENGTH}자까지 입력할 수 있습니다.` },
        { status: 400 }
      );
    }

    const nickname = generateNickname();
    const comment = await addComment(params.slug, params.episodeId, {
      nickname,
      text: trimmed,
    });
    return NextResponse.json({ comment });
  } catch (err) {
    return NextResponse.json(
      { error: (err && err.message) || "댓글 등록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
