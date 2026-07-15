import { notFound } from "next/navigation";
import { getNovel } from "../../../lib/novels";

export const dynamic = "force-dynamic";

export default async function NovelPage({ params }) {
  const novel = await getNovel(params.slug);
  if (!novel) return notFound();

  return (
    <div className="container">
      <p className="breadcrumb">
        <a href="/">서재</a> / {novel.title}
      </p>
      <h1 className="page-title">
        {novel.title}
        {novel.completed && <span className="status-badge status-badge-completed">완결</span>}
      </h1>
      {novel.description && <p className="page-desc">{novel.description}</p>}

      {novel.episodes.length === 0 ? (
        <div className="empty-state">
          아직 등록된 회차가 없습니다. 왼쪽 패널에서 이 소설을 펼쳐 회차를 등록해보세요.
        </div>
      ) : (
        <ul className="episode-list">
          {novel.episodes.map((ep) => (
            <li key={ep.id}>
              <a href={`/novel/${novel.slug}/${ep.id}`}>
                <span>
                  <span className="episode-num">{ep.number}화</span>
                  {ep.title}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
