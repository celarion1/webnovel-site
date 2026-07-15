"use client";

import { useEffect, useState } from "react";

const MAX_LENGTH = 50;
const QUICK_EMOJIS = ["😀", "😂", "😍", "👍", "🎉", "😢", "😮", "🔥", "💕", "👏"];

function charLength(text) {
  return Array.from(text || "").length;
}

function formatTime(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function CommentSection({ novelSlug, episodeId }) {
  const [comments, setComments] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchComments();
    fetchAdminStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [novelSlug, episodeId]);

  async function fetchComments() {
    try {
      const res = await fetch(
        `/api/novels/${novelSlug}/episodes/${episodeId}/comments`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (res.ok) setComments(data.comments || []);
    } catch {
      // 조용히 무시
    } finally {
      setLoaded(true);
    }
  }

  async function fetchAdminStatus() {
    try {
      const res = await fetch("/api/admin/status", { cache: "no-store" });
      const data = await res.json();
      setIsAdmin(Boolean(data.isAdmin));
    } catch {
      setIsAdmin(false);
    }
  }

  function handleEmojiClick(emoji) {
    setText((cur) => {
      const next = cur + emoji;
      return charLength(next) > MAX_LENGTH ? cur : next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) {
      setError("댓글 내용을 입력해주세요.");
      return;
    }
    if (charLength(trimmed) > MAX_LENGTH) {
      setError(`댓글은 최대 ${MAX_LENGTH}자까지 입력할 수 있습니다.`);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(
        `/api/novels/${novelSlug}/episodes/${episodeId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: trimmed }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "댓글 등록에 실패했습니다.");
        return;
      }
      setComments((cur) => [...cur, data.comment]);
      setText("");
    } catch {
      setError("댓글 등록 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId) {
    if (!window.confirm("이 댓글을 삭제할까요?")) return;
    try {
      const res = await fetch(
        `/api/novels/${novelSlug}/episodes/${episodeId}/comments/${commentId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setComments((cur) => cur.filter((c) => c.id !== commentId));
      }
    } catch {
      // 무시
    }
  }

  const remaining = MAX_LENGTH - charLength(text);

  return (
    <div className="comment-section">
      <p className="comment-section-title">댓글 {comments.length > 0 ? comments.length : ""}</p>

      <ul className="comment-list">
        {loaded && comments.length === 0 && (
          <p className="empty-hint">아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</p>
        )}
        {comments.map((c) => (
          <li key={c.id} className="comment-item">
            <div className="comment-item-head">
              <span className="comment-nickname">{c.nickname}</span>
              <span className="comment-time">{formatTime(c.createdAt)}</span>
              {isAdmin && (
                <button
                  type="button"
                  className="icon-btn icon-btn-danger comment-delete-btn"
                  title="댓글 삭제"
                  onClick={() => handleDelete(c.id)}
                >
                  🗑
                </button>
              )}
            </div>
            <p className="comment-text">{c.text}</p>
          </li>
        ))}
      </ul>

      <form className="comment-form" onSubmit={handleSubmit}>
        <div className="comment-emoji-row">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              type="button"
              key={emoji}
              className="comment-emoji-btn"
              onClick={() => handleEmojiClick(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
        <textarea
          className="comment-textarea"
          value={text}
          maxLength={MAX_LENGTH * 2}
          placeholder="댓글을 남겨보세요 (최대 50자, 이름은 자동으로 붙어요)"
          onChange={(e) => setText(e.target.value)}
        />
        <div className="comment-form-footer">
          <span className={`comment-char-count${remaining < 0 ? " comment-char-over" : ""}`}>
            {charLength(text)}/{MAX_LENGTH}
          </span>
          <button type="submit" className="btn-primary" style={{ width: "auto" }} disabled={submitting}>
            {submitting ? "등록 중..." : "댓글 등록"}
          </button>
        </div>
        {error && <p className="error-text">{error}</p>}
      </form>
    </div>
  );
}
