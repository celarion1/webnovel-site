import { NextResponse } from "next/server";
import { updateNovel, deleteNovel, friendlyFsError } from "../../../../lib/novels";
import { isAdminAuthed } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req, { params }) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }
  try {
    const { title, description, completed } = await req.json();
    if (title !== undefined && !title.trim()) {
      return NextResponse.json({ error: "제목을 입력해주세요." }, { status: 400 });
    }
    await updateNovel(params.slug, {
      title: title !== undefined ? title.trim() : undefined,
      description: description !== undefined ? description.trim() : undefined,
      completed: completed !== undefined ? Boolean(completed) : undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: friendlyFsError(err) }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }
  try {
    await deleteNovel(params.slug);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: friendlyFsError(err) }, { status: 500 });
  }
}
