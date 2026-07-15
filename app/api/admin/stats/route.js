import { NextResponse } from "next/server";
import { getStats } from "../../../../lib/analytics";
import { getNovels } from "../../../../lib/novels";
import { isAdminAuthed } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }
  try {
    const [stats, novels] = await Promise.all([getStats({ days: 30 }), getNovels()]);

    const novelMap = new Map(novels.map((n) => [n.slug, n]));

    const episodes = stats.episodes
      .map((e) => {
        const novel = novelMap.get(e.novelSlug);
        const episode = novel ? novel.episodes.find((ep) => ep.id === e.episodeId) : null;
        return {
          novelSlug: e.novelSlug,
          episodeId: e.episodeId,
          novelTitle: novel ? novel.title : "(삭제된 소설)",
          episodeTitle: episode ? episode.title : "(삭제된 회차)",
          views: e.views,
        };
      })
      .sort((a, b) => b.views - a.views);

    const totalPageviews = stats.daily.reduce((sum, d) => sum + d.pageviews, 0);
    const totalEpisodeViews = episodes.reduce((sum, e) => sum + e.views, 0);

    return NextResponse.json({
      daily: stats.daily,
      episodes,
      totals: { totalPageviews, totalEpisodeViews },
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err && err.message) || "통계를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
