"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Sidebar() {
  const router = useRouter();

  const [novels, setNovels] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [loginOpen, setLoginOpen] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  const [showNovelForm, setShowNovelForm] = useState(false);
  const [novelTitle, setNovelTitle] = useState("");
  const [novelDesc, setNovelDesc] = useState("");
  const [novelError, setNovelError] = useState("");
  const [novelSubmitting, setNovelSubmitting] = useState(false);

  const [expandedSlug, setExpandedSlug] = useState(null);
  const [episodeFormOpenFor, setEpisodeFormOpenFor] = useState(null);
  const [episodeTitle, setEpisodeTitle] = useState("");
  const [episodeBody, setEpisodeBody] = useState("");
  const [episodeError, setEpisodeError] = useState("");
  const [episodeSubmitting, setEpisodeSubmitting] = useState(false);

  const [reorderingId, setReorderingId] = useState(null);

  // 통계
  const [showStats, setShowStats] = useState(false);
  const [statsData, setStatsData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");

  // 소설 수정
  const [editingNovelSlug, setEditingNovelSlug] = useState(null);
  const [editNovelTitle, setEditNovelTitle] = useState("");
  const [editNovelDesc, setEditNovelDesc] = useState("");
  const [editNovelError, setEditNovelError] = useState("");
  const [editNovelSubmitting, setEditNovelSubmitting] = useState(false);

  // 회차 수정
  const [editingEpisodeId, setEditingEpisodeId] = useState(null);
  const [editEpisodeTitle, setEditEpisodeTitle] = useState("");
  const [editEpisodeBody, setEditEpisodeBody] = useState("");
  const [editEpisodeError, setEditEpisodeError] = useState("");
  const [editEpisodeLoading, setEditEpisodeLoading] = useState(false);
  const [editEpisodeSubmitting, setEditEpisodeSubmitting] = useState(false);

  useEffect(() => {
    fetchNovels();
    fetchAdminStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchAdminStatus() {
    try {
      const res = await fetch("/api/admin/status", { cache: "no-store" });
      const data = await res.json();
      setIsAdmin(Boolean(data.isAdmin));
    } catch {
      setIsAdmin(false);
    }
  }

  async function fetchNovels() {
    try {
      const res = await fetch("/api/novels", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setNovels(data.novels || []);
    } catch {
      // 조용히 무시 (사이드바 목록만 못 불러옴)
    } finally {
      setLoaded(true);
    }
  }

  // ---------- 로그인/로그아웃 ----------

  async function handleLogin(e) {
    e.preventDefault();
    if (!loginPassword) {
      setLoginError("비밀번호를 입력해주세요.");
      return;
    }
    setLoginSubmitting(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "로그인에 실패했습니다.");
        return;
      }
      setIsAdmin(true);
      setLoginOpen(false);
      setLoginPassword("");
      router.refresh();
    } catch {
      setLoginError("로그인 중 오류가 발생했습니다.");
    } finally {
      setLoginSubmitting(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // 무시
    } finally {
      setIsAdmin(false);
      setExpandedSlug(null);
      setEditingNovelSlug(null);
      setEditingEpisodeId(null);
      router.refresh();
    }
  }

  // ---------- 소설 등록 ----------

  async function handleAddNovel(e) {
    e.preventDefault();
    if (!novelTitle.trim()) {
      setNovelError("제목을 입력해주세요.");
      return;
    }
    setNovelSubmitting(true);
    setNovelError("");
    try {
      const res = await fetch("/api/novels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: novelTitle, description: novelDesc }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNovelError(data.error || "등록에 실패했습니다.");
        return;
      }
      setNovelTitle("");
      setNovelDesc("");
      setShowNovelForm(false);
      await fetchNovels();
      setExpandedSlug(data.slug);
    } catch {
      setNovelError("등록 중 오류가 발생했습니다.");
    } finally {
      setNovelSubmitting(false);
    }
  }

  // ---------- 소설 수정/삭제 ----------

  function startEditNovel(novel) {
    setEditingNovelSlug(novel.slug);
    setEditNovelTitle(novel.title);
    setEditNovelDesc(novel.description || "");
    setEditNovelError("");
  }

  async function handleSaveNovel(slug) {
    if (!editNovelTitle.trim()) {
      setEditNovelError("제목을 입력해주세요.");
      return;
    }
    setEditNovelSubmitting(true);
    setEditNovelError("");
    try {
      const res = await fetch(`/api/novels/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editNovelTitle, description: editNovelDesc }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditNovelError(data.error || "저장에 실패했습니다.");
        return;
      }
      setEditingNovelSlug(null);
      await fetchNovels();
      router.refresh();
    } catch {
      setEditNovelError("저장 중 오류가 발생했습니다.");
    } finally {
      setEditNovelSubmitting(false);
    }
  }

  async function handleDeleteNovel(slug, title) {
    if (!window.confirm(`"${title}" 소설과 등록된 회차를 모두 삭제합니다. 계속할까요?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/novels/${slug}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "삭제에 실패했습니다.");
        return;
      }
      if (expandedSlug === slug) setExpandedSlug(null);
      if (editingNovelSlug === slug) setEditingNovelSlug(null);
      setEditingEpisodeId(null);
      await fetchNovels();
      router.refresh();
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    }
  }

  // ---------- 통계 ----------

  async function toggleStats() {
    if (showStats) {
      setShowStats(false);
      return;
    }
    setShowStats(true);
    setStatsLoading(true);
    setStatsError("");
    try {
      const res = await fetch("/api/admin/stats", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setStatsError(data.error || "통계를 불러오지 못했습니다.");
        return;
      }
      setStatsData(data);
    } catch {
      setStatsError("통계를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setStatsLoading(false);
    }
  }

  // ---------- 회차 등록 ----------

  function toggleExpand(slug) {
    setExpandedSlug((cur) => (cur === slug ? null : slug));
    setEpisodeFormOpenFor(null);
    setEpisodeError("");
    setEditingEpisodeId(null);
  }

  function openEpisodeForm(slug) {
    setEpisodeFormOpenFor(slug);
    setEpisodeTitle("");
    setEpisodeBody("");
    setEpisodeError("");
  }

  function handleFileLoad(e, onLoaded) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onLoaded(String(reader.result || ""), file.name.replace(/\.txt$/i, ""));
    };
    reader.readAsText(file, "utf-8");
    e.target.value = "";
  }

  async function handleAddEpisode(slug) {
    if (!episodeTitle.trim()) {
      setEpisodeError("회차 제목을 입력해주세요.");
      return;
    }
    if (!episodeBody.trim()) {
      setEpisodeError("본문 내용을 입력하거나 파일을 불러와주세요.");
      return;
    }
    setEpisodeSubmitting(true);
    setEpisodeError("");
    try {
      const res = await fetch(`/api/novels/${slug}/episodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: episodeTitle, body: episodeBody }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEpisodeError(data.error || "등록에 실패했습니다.");
        return;
      }
      setEpisodeFormOpenFor(null);
      setEpisodeTitle("");
      setEpisodeBody("");
      await fetchNovels();
      router.push(`/novel/${slug}/${data.id}`);
    } catch {
      setEpisodeError("등록 중 오류가 발생했습니다.");
    } finally {
      setEpisodeSubmitting(false);
    }
  }

  // ---------- 회차 수정/삭제 ----------

  async function startEditEpisode(novelSlug, ep) {
    setEditingEpisodeId(ep.id);
    setEditEpisodeTitle(ep.title);
    setEditEpisodeBody("");
    setEditEpisodeError("");
    setEditEpisodeLoading(true);
    try {
      const res = await fetch(`/api/novels/${novelSlug}/episodes/${ep.id}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok) {
        setEditEpisodeTitle(data.title);
        setEditEpisodeBody(data.body);
      } else {
        setEditEpisodeError(data.error || "불러오기에 실패했습니다.");
      }
    } catch {
      setEditEpisodeError("불러오기 중 오류가 발생했습니다.");
    } finally {
      setEditEpisodeLoading(false);
    }
  }

  async function handleSaveEpisode(novelSlug, episodeId) {
    if (!editEpisodeTitle.trim()) {
      setEditEpisodeError("회차 제목을 입력해주세요.");
      return;
    }
    if (!editEpisodeBody.trim()) {
      setEditEpisodeError("본문 내용을 입력해주세요.");
      return;
    }
    setEditEpisodeSubmitting(true);
    setEditEpisodeError("");
    try {
      const res = await fetch(`/api/novels/${novelSlug}/episodes/${episodeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editEpisodeTitle, body: editEpisodeBody }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditEpisodeError(data.error || "저장에 실패했습니다.");
        return;
      }
      setEditingEpisodeId(null);
      await fetchNovels();
      router.refresh();
    } catch {
      setEditEpisodeError("저장 중 오류가 발생했습니다.");
    } finally {
      setEditEpisodeSubmitting(false);
    }
  }

  async function handleDeleteEpisode(novelSlug, ep) {
    if (!window.confirm(`"${ep.title}" 회차를 삭제합니다. 계속할까요?`)) return;
    try {
      const res = await fetch(`/api/novels/${novelSlug}/episodes/${ep.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "삭제에 실패했습니다.");
        return;
      }
      if (editingEpisodeId === ep.id) setEditingEpisodeId(null);
      await fetchNovels();
      router.refresh();
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    }
  }

  async function handleReorder(slug, episodeId, direction) {
    setReorderingId(episodeId);
    try {
      const res = await fetch(`/api/novels/${slug}/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episodeId, direction }),
      });
      if (res.ok) {
        await fetchNovels();
        router.refresh();
      }
    } catch {
      // 무시
    } finally {
      setReorderingId(null);
    }
  }

  return (
    <aside className="sidebar">
      <div className="admin-status-row">
        {isAdmin ? (
          <>
            <span className="admin-badge">관리자로 로그인됨</span>
            <button type="button" className="btn-text" onClick={handleLogout}>
              로그아웃
            </button>
          </>
        ) : loginOpen ? (
          <form className="form-inline" onSubmit={handleLogin} style={{ margin: "0 0 14px" }}>
            <input
              type="password"
              placeholder="관리자 비밀번호"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              autoFocus
            />
            {loginError && <p className="error-text">{loginError}</p>}
            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setLoginOpen(false);
                  setLoginError("");
                }}
              >
                취소
              </button>
              <button className="btn-primary" disabled={loginSubmitting} style={{ width: "auto" }}>
                {loginSubmitting ? "확인 중..." : "로그인"}
              </button>
            </div>
          </form>
        ) : (
          <button type="button" className="btn-text" onClick={() => setLoginOpen(true)}>
            관리자 로그인
          </button>
        )}
      </div>

      {isAdmin && (
        <div className="stats-panel-wrap">
          <button type="button" className="btn-text" onClick={toggleStats}>
            {showStats ? "통계 닫기" : "📊 통계 보기"}
          </button>

          {showStats && (
            <div className="stats-panel">
              {statsLoading && <p className="empty-hint">불러오는 중...</p>}
              {statsError && <p className="error-text">{statsError}</p>}

              {statsData && (
                <>
                  <p className="stats-summary">
                    최근 30일 조회수 {statsData.totals.totalPageviews.toLocaleString()}회 · 회차
                    누적 조회수 {statsData.totals.totalEpisodeViews.toLocaleString()}회
                  </p>

                  <p className="stats-subtitle">일별 방문 현황 (최근 30일)</p>
                  {statsData.daily.length === 0 ? (
                    <p className="empty-hint">아직 기록된 방문이 없습니다.</p>
                  ) : (
                    <table className="stats-table">
                      <thead>
                        <tr>
                          <th>날짜</th>
                          <th>조회수</th>
                          <th>순방문자</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statsData.daily.map((d) => (
                          <tr key={d.date}>
                            <td>{d.date}</td>
                            <td>{d.pageviews}</td>
                            <td>{d.uniqueVisitors}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  <p className="stats-subtitle">회차별 조회수 TOP 10</p>
                  {statsData.episodes.length === 0 ? (
                    <p className="empty-hint">아직 조회된 회차가 없습니다.</p>
                  ) : (
                    <ul className="stats-episode-list">
                      {statsData.episodes.slice(0, 10).map((e) => (
                        <li key={`${e.novelSlug}-${e.episodeId}`}>
                          <span
                            className="stats-episode-title"
                            title={`${e.novelTitle} - ${e.episodeTitle}`}
                          >
                            {e.novelTitle} · {e.episodeTitle}
                          </span>
                          <span className="stats-episode-count">{e.views}회</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {isAdmin && (
        <>
          <p className="sidebar-section-title">웹소설 등록</p>

          {!showNovelForm ? (
            <button className="btn-primary" onClick={() => setShowNovelForm(true)}>
              + 새 소설 등록
            </button>
          ) : (
            <form className="form-inline" onSubmit={handleAddNovel}>
              <input
                type="text"
                placeholder="소설 제목"
                value={novelTitle}
                onChange={(e) => setNovelTitle(e.target.value)}
                autoFocus
              />
              <input
                type="text"
                placeholder="한 줄 소개 (선택)"
                value={novelDesc}
                onChange={(e) => setNovelDesc(e.target.value)}
              />
              {novelError && <p className="error-text">{novelError}</p>}
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowNovelForm(false);
                    setNovelError("");
                  }}
                >
                  취소
                </button>
                <button className="btn-primary" disabled={novelSubmitting} style={{ width: "auto" }}>
                  {novelSubmitting ? "등록 중..." : "등록"}
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {!isAdmin && <p className="sidebar-section-title" style={{ marginTop: 4 }}>웹소설 목록</p>}

      <ul className="novel-list-side" style={{ marginTop: 16 }}>
        {loaded && novels.length === 0 && (
          <p className="empty-hint">아직 등록된 소설이 없습니다.</p>
        )}

        {novels.map((novel) => (
          <li className="novel-item" key={novel.slug}>
            {isAdmin && editingNovelSlug === novel.slug ? (
              <div className="form-inline">
                <input
                  type="text"
                  value={editNovelTitle}
                  onChange={(e) => setEditNovelTitle(e.target.value)}
                  placeholder="소설 제목"
                  autoFocus
                />
                <input
                  type="text"
                  value={editNovelDesc}
                  onChange={(e) => setEditNovelDesc(e.target.value)}
                  placeholder="한 줄 소개 (선택)"
                />
                {editNovelError && <p className="error-text">{editNovelError}</p>}
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setEditingNovelSlug(null)}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ width: "auto" }}
                    disabled={editNovelSubmitting}
                    onClick={() => handleSaveNovel(novel.slug)}
                  >
                    {editNovelSubmitting ? "저장 중..." : "저장"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="novel-item-header">
                <span
                  className="novel-item-title"
                  onClick={() => toggleExpand(novel.slug)}
                >
                  {expandedSlug === novel.slug ? "▾ " : "▸ "}
                  {novel.title}
                </span>
                <span className="novel-item-actions">
                  <span className="novel-item-count">{novel.episodes.length}화</span>
                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        className="icon-btn"
                        title="소설 수정"
                        onClick={() => startEditNovel(novel)}
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="icon-btn icon-btn-danger"
                        title="소설 삭제"
                        onClick={() => handleDeleteNovel(novel.slug, novel.title)}
                      >
                        🗑
                      </button>
                    </>
                  )}
                </span>
              </div>
            )}

            {expandedSlug === novel.slug && (
              <div className="novel-item-body">
                <ul className="episode-list-side">
                  {novel.episodes.map((ep, i) => (
                    <li key={ep.id}>
                      {isAdmin && editingEpisodeId === ep.id ? (
                        <div className="form-inline">
                          <input
                            type="text"
                            value={editEpisodeTitle}
                            onChange={(e) => setEditEpisodeTitle(e.target.value)}
                            placeholder="회차 제목"
                          />
                          <div className="file-picker-row">
                            <label className="btn-secondary" style={{ cursor: "pointer" }}>
                              파일 불러오기
                              <input
                                type="file"
                                accept=".txt"
                                onChange={(e) =>
                                  handleFileLoad(e, (text) => setEditEpisodeBody(text))
                                }
                              />
                            </label>
                            <span className="empty-hint" style={{ padding: 0 }}>
                              또는 아래에서 직접 수정
                            </span>
                          </div>
                          <textarea
                            value={editEpisodeBody}
                            onChange={(e) => setEditEpisodeBody(e.target.value)}
                            placeholder={editEpisodeLoading ? "불러오는 중..." : "회차 본문"}
                          />
                          {editEpisodeError && <p className="error-text">{editEpisodeError}</p>}
                          <div className="form-actions">
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => setEditingEpisodeId(null)}
                            >
                              취소
                            </button>
                            <button
                              type="button"
                              className="btn-primary"
                              style={{ width: "auto" }}
                              disabled={editEpisodeSubmitting || editEpisodeLoading}
                              onClick={() => handleSaveEpisode(novel.slug, ep.id)}
                            >
                              {editEpisodeSubmitting ? "저장 중..." : "저장"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="episode-row">
                          <span className="episode-row-num">{i + 1}</span>
                          <span
                            className="episode-row-title"
                            onClick={() => router.push(`/novel/${novel.slug}/${ep.id}`)}
                            title={ep.title}
                          >
                            {ep.title}
                          </span>
                          {isAdmin && (
                            <>
                              <span className="order-btns">
                                <button
                                  type="button"
                                  disabled={i === 0 || reorderingId === ep.id}
                                  onClick={() => handleReorder(novel.slug, ep.id, "up")}
                                  title="위로"
                                >
                                  ▲
                                </button>
                                <button
                                  type="button"
                                  disabled={i === novel.episodes.length - 1 || reorderingId === ep.id}
                                  onClick={() => handleReorder(novel.slug, ep.id, "down")}
                                  title="아래로"
                                >
                                  ▼
                                </button>
                              </span>
                              <button
                                type="button"
                                className="icon-btn"
                                title="회차 수정"
                                onClick={() => startEditEpisode(novel.slug, ep)}
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                className="icon-btn icon-btn-danger"
                                title="회차 삭제"
                                onClick={() => handleDeleteEpisode(novel.slug, ep)}
                              >
                                🗑
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                  {novel.episodes.length === 0 && (
                    <p className="empty-hint">아직 등록된 회차가 없습니다.</p>
                  )}
                </ul>

                {isAdmin && (
                  episodeFormOpenFor !== novel.slug ? (
                    <button
                      className="btn-secondary"
                      onClick={() => openEpisodeForm(novel.slug)}
                    >
                      + 새 회차 등록
                    </button>
                  ) : (
                    <div className="form-inline">
                      <input
                        type="text"
                        placeholder="회차 제목 (예: 3화. 뜻밖의 재회)"
                        value={episodeTitle}
                        onChange={(e) => setEpisodeTitle(e.target.value)}
                      />
                      <div className="file-picker-row">
                        <label className="btn-secondary" style={{ cursor: "pointer" }}>
                          파일 불러오기
                          <input
                            type="file"
                            accept=".txt"
                            onChange={(e) =>
                              handleFileLoad(e, (text, name) => {
                                setEpisodeBody(text);
                                if (!episodeTitle.trim()) setEpisodeTitle(name);
                              })
                            }
                          />
                        </label>
                        <span className="empty-hint" style={{ padding: 0 }}>
                          또는 아래에 직접 붙여넣기
                        </span>
                      </div>
                      <textarea
                        placeholder="회차 본문을 입력하거나 파일을 불러온 뒤 이곳에서 수정하세요."
                        value={episodeBody}
                        onChange={(e) => setEpisodeBody(e.target.value)}
                      />
                      {episodeError && <p className="error-text">{episodeError}</p>}
                      <div className="form-actions">
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setEpisodeFormOpenFor(null)}
                        >
                          취소
                        </button>
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ width: "auto" }}
                          disabled={episodeSubmitting}
                          onClick={() => handleAddEpisode(novel.slug)}
                        >
                          {episodeSubmitting ? "등록 중..." : "등록"}
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}
