import { NextResponse } from "next/server";
import { getNovels, createNovel, friendlyFsError } from "../../../lib/novels";
import { isAdminAuthed } from "../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ novels: await getNovels() });
  } catch (err) {
    return NextResponse.json({ error: friendlyFsError(err) }, { status: 500 });
  }
}

export async function POST(req) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }
  try {
    const { title, description } = await req.json();
    if (!title || !title.trim()) {
      return NextResponse.json({ error: "제목을 입력해주세요." }, { status: 400 });
    }
    const slug = await createNovel(title.trim(), (description || "").trim());
    return NextResponse.json({ slug });
  } catch (err) {
    return NextResponse.json({ error: friendlyFsError(err) }, { status: 500 });
  }
}
