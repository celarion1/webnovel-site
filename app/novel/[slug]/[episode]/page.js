import { notFound } from "next/navigation";
import { getEpisode } from "../../../../lib/novels";

export const dynamic = "force-dynamic";

export default async function EpisodePage({ params }) {
  const episode = await getEpisode(params.slug, params.episode);
  if (!episode) return notFound();

  return (
    <div className="container">
      <p className="breadcrumb">
        <a href="/">서재</a> / <a href={`/novel/${params.slug}`}>{episode.novelTitle}</a>
      </p>

      <div className="reader">
        <h1 className="reader-title">
          {episode.number}화. {episode.title}
        </h1>
        <div className="reader-body">{episode.body}</div>
      </div>

      <div className="reader-nav">
        {episode.prev ? (
          <a href={`/novel/${params.slug}/${episode.prev.id}`}>← 이전화</a>
        ) : (
          <span>← 이전화</span>
        )}
        {episode.next ? (
          <a href={`/novel/${params.slug}/${episode.next.id}`}>다음화 →</a>
        ) : (
          <span>다음화 →</span>
        )}
      </div>
    </div>
  );
}
