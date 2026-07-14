// 로컬 파일(content/ 폴더) 기반 스토리지.
// Redis 환경변수가 없을 때(주로 로컬 개발) 사용됨.
import fs from "fs";
import path from "path";

const CONTENT_DIR = path.join(process.cwd(), "content");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function safeReadDir(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true });
}

function genId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

function metaPath(slug) {
  return path.join(CONTENT_DIR, slug, "meta.json");
}

function readMeta(slug) {
  const p = metaPath(slug);
  if (!fs.existsSync(p)) return null;
  const meta = JSON.parse(fs.readFileSync(p, "utf-8"));
  if (!Array.isArray(meta.episodes)) meta.episodes = [];
  return meta;
}

function writeMeta(slug, meta) {
  fs.writeFileSync(metaPath(slug), JSON.stringify(meta, null, 2) + "\n", "utf-8");
}

function notFoundError(message) {
  const err = new Error(message);
  err.code = "ENOENT";
  return err;
}

export function friendlyError(err) {
  if (err && ["EROFS", "EACCES", "EPERM"].includes(err.code)) {
    return "이 배포 환경에서는 콘텐츠를 저장할 수 없습니다. 로컬(npm run dev)에서 실행한 뒤 git push로 반영해주세요.";
  }
  return (err && err.message) || "알 수 없는 오류가 발생했습니다.";
}

// ---------- 조회 ----------

export async function getNovels() {
  return safeReadDir(CONTENT_DIR)
    .filter((e) => e.isDirectory())
    .map((e) => {
      const meta = readMeta(e.name);
      if (!meta) return null;
      return {
        slug: e.name,
        title: meta.title || "(제목 없음)",
        description: meta.description || "",
        createdAt: meta.createdAt || 0,
        episodes: meta.episodes.map((ep, i) => ({
          id: ep.id,
          title: ep.title,
          number: i + 1,
        })),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function getNovel(slug) {
  const meta = readMeta(slug);
  if (!meta) return null;
  return {
    slug,
    title: meta.title || "(제목 없음)",
    description: meta.description || "",
    episodes: meta.episodes.map((ep, i) => ({
      id: ep.id,
      title: ep.title,
      number: i + 1,
    })),
  };
}

export async function getEpisode(novelSlug, episodeId) {
  const novel = await getNovel(novelSlug);
  if (!novel) return null;

  const idx = novel.episodes.findIndex((e) => e.id === episodeId);
  if (idx === -1) return null;

  const filePath = path.join(CONTENT_DIR, novelSlug, "episodes", `${episodeId}.txt`);
  if (!fs.existsSync(filePath)) return null;

  const body = fs.readFileSync(filePath, "utf-8").trim();
  const prev = idx > 0 ? novel.episodes[idx - 1] : null;
  const next = idx < novel.episodes.length - 1 ? novel.episodes[idx + 1] : null;

  return {
    novelTitle: novel.title,
    number: idx + 1,
    title: novel.episodes[idx].title,
    body,
    prev,
    next,
  };
}

export async function getEpisodeRaw(novelSlug, episodeId) {
  const meta = readMeta(novelSlug);
  if (!meta) return null;
  const ep = meta.episodes.find((e) => e.id === episodeId);
  if (!ep) return null;

  const filePath = path.join(CONTENT_DIR, novelSlug, "episodes", `${episodeId}.txt`);
  if (!fs.existsSync(filePath)) return null;

  return {
    title: ep.title,
    body: fs.readFileSync(filePath, "utf-8").trim(),
  };
}

// ---------- 등록 ----------

export async function createNovel(title, description = "") {
  const slug = genId("novel");
  ensureDir(path.join(CONTENT_DIR, slug, "episodes"));
  writeMeta(slug, { title, description, createdAt: Date.now(), episodes: [] });
  return slug;
}

export async function createEpisode(novelSlug, title, body) {
  const meta = readMeta(novelSlug);
  if (!meta) throw notFoundError("존재하지 않는 소설입니다.");

  const id = genId("ep");
  const episodesDir = path.join(CONTENT_DIR, novelSlug, "episodes");
  ensureDir(episodesDir);
  fs.writeFileSync(path.join(episodesDir, `${id}.txt`), body.trim() + "\n", "utf-8");

  meta.episodes.push({ id, title });
  writeMeta(novelSlug, meta);
  return id;
}

// ---------- 수정 ----------

export async function updateNovel(slug, { title, description }) {
  const meta = readMeta(slug);
  if (!meta) throw notFoundError("존재하지 않는 소설입니다.");

  if (title !== undefined) meta.title = title;
  if (description !== undefined) meta.description = description;
  writeMeta(slug, meta);
}

export async function updateEpisode(novelSlug, episodeId, { title, body }) {
  const meta = readMeta(novelSlug);
  if (!meta) throw notFoundError("존재하지 않는 소설입니다.");

  const ep = meta.episodes.find((e) => e.id === episodeId);
  if (!ep) throw notFoundError("존재하지 않는 회차입니다.");

  if (title !== undefined) ep.title = title;
  writeMeta(novelSlug, meta);

  if (body !== undefined) {
    const filePath = path.join(CONTENT_DIR, novelSlug, "episodes", `${episodeId}.txt`);
    fs.writeFileSync(filePath, body.trim() + "\n", "utf-8");
  }
}

export async function moveEpisode(novelSlug, episodeId, direction) {
  const meta = readMeta(novelSlug);
  if (!meta) throw notFoundError("존재하지 않는 소설입니다.");

  const idx = meta.episodes.findIndex((e) => e.id === episodeId);
  if (idx === -1) throw new Error("존재하지 않는 회차입니다.");

  const targetIdx = direction === "up" ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= meta.episodes.length) {
    return meta.episodes;
  }

  const arr = meta.episodes;
  [arr[idx], arr[targetIdx]] = [arr[targetIdx], arr[idx]];
  writeMeta(novelSlug, meta);
  return arr;
}

// ---------- 삭제 ----------

export async function deleteNovel(slug) {
  const dir = path.join(CONTENT_DIR, slug);
  if (!fs.existsSync(dir)) throw notFoundError("존재하지 않는 소설입니다.");
  fs.rmSync(dir, { recursive: true, force: true });
}

export async function deleteEpisode(novelSlug, episodeId) {
  const meta = readMeta(novelSlug);
  if (!meta) throw notFoundError("존재하지 않는 소설입니다.");

  const idx = meta.episodes.findIndex((e) => e.id === episodeId);
  if (idx === -1) throw notFoundError("존재하지 않는 회차입니다.");

  meta.episodes.splice(idx, 1);
  writeMeta(novelSlug, meta);

  const filePath = path.join(CONTENT_DIR, novelSlug, "episodes", `${episodeId}.txt`);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}
