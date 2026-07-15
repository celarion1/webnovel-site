// 로컬 파일(content/comments.json) 기반 회차별 댓글 저장소.
// Redis 환경변수가 없을 때(주로 로컬 개발) 사용됨.
import fs from "fs";
import path from "path";

const FILE_PATH = path.join(process.cwd(), "content", "comments.json");

function genId() {
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function episodeKey(novelSlug, episodeId) {
  return `${novelSlug}::${episodeId}`;
}

function readData() {
  if (!fs.existsSync(FILE_PATH)) return {};
  try {
    const raw = JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
}

function writeData(data) {
  const dir = path.dirname(FILE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

export async function getComments(novelSlug, episodeId) {
  const data = readData();
  const list = data[episodeKey(novelSlug, episodeId)] || [];
  return list.slice().sort((a, b) => a.createdAt - b.createdAt);
}

export async function addComment(novelSlug, episodeId, { nickname, text }) {
  const data = readData();
  const key = episodeKey(novelSlug, episodeId);
  if (!Array.isArray(data[key])) data[key] = [];

  const comment = {
    id: genId(),
    nickname,
    text,
    createdAt: Date.now(),
  };
  data[key].push(comment);
  writeData(data);
  return comment;
}

export async function deleteComment(novelSlug, episodeId, commentId) {
  const data = readData();
  const key = episodeKey(novelSlug, episodeId);
  if (!Array.isArray(data[key])) return;
  data[key] = data[key].filter((c) => c.id !== commentId);
  writeData(data);
}
