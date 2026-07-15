import { getNovels } from "../lib/novels";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const novels = await getNovels();

  return (
    <div className="container">
      <h1 className="page-title">내 웹소설 서재</h1>
      <p className="page-desc">
        왼쪽 패널에서 소설을 등록하거나 회차를 골라 읽어보세요. 아래 목록에서도 바로 이동할 수 있습니다.
      </p>

      {novels.length === 0 ? (
        <div className="empty-state">
          아직 등록된 소설이 없습니다. 왼쪽 패널의 &quot;+ 새 소설 등록&quot; 버튼으로 시작해보세요.
        </div>
      ) : (
        <ul className="novel-list">
          {novels.map((novel) => (
            <li key={novel.slug}>
              <a className="novel-card" href={`/novel/${novel.slug}`}>
                <p className="novel-card-title">
                  {novel.title}
                  {novel.completed && <span className="status-badge status-badge-completed">완결</span>}
                </p>
                {novel.description && (
                  <p className="novel-card-desc">{novel.description}</p>
                )}
                <p className="novel-card-meta">
                  {novel.completed ? "완결" : `전체 ${novel.episodes.length}화`}
                </p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
