import { NextResponse } from "next/server";
import {
  getEpisodeRaw,
  updateEpisode,
  deleteEpisode,
  friendlyFsError,
} from "../../../../../../lib/novels";
import { isAdminAuthed } from "../../../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }
  try {
    const data = await getEpisodeRaw(params.slug, params.episodeId);
    if (!data) {
      return NextResponse.json({ error: "존재하지 않는 회차입니다." }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: friendlyFsError(err) }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }
  try {
    const { title, body } = await req.json();
    if (title !== undefined && !title.trim()) {
      return NextResponse.json({ error: "회차 제목을 입력해주세요." }, { status: 400 });
    }
    if (body !== undefined && !body.trim()) {
      return NextResponse.json({ error: "본문 내용을 입력해주세요." }, { status: 400 });
    }
    await updateEpisode(params.slug, params.episodeId, {
      title: title !== undefined ? title.trim() : undefined,
      body,
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
    await deleteEpisode(params.slug, params.episodeId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: friendlyFsError(err) }, { status: 500 });
  }
}
