import { NextResponse } from "next/server";
import { getAnnouncements } from "../../../lib/announcements";
import { getNovels } from "../../../lib/novels";

// 공지사항은 방문자 전체에게 공개되는 정보이므로 관리자 인증 없이 조회 가능.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [entries, novels] = await Promise.all([
      getAnnouncements({ limit: 20 }),
      getNovels(),
    ]);

    const novelMap = new Map(novels.map((n) => [n.slug, n]));

    const announcements = entries
      .filter((e) => novelMap.has(e.novelSlug)) // 삭제된 소설의 과거 공지는 노출하지 않음
      .map((e) => ({
        date: e.date,
        novelSlug: e.novelSlug,
        novelTitle: novelMap.get(e.novelSlug).title,
        count: e.count,
      }));

    return NextResponse.json({ announcements });
  } catch (err) {
    return NextResponse.json(
      { error: (err && err.message) || "공지사항을 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
