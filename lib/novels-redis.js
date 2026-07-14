// Upstash Redis(REST) 기반 스토리지.
// Vercel 배포 환경에서 관리자 로그인 후 실시간으로 등록/수정/삭제가 반영되도록 함.
import { Redis } from "@upstash/redis";

const DATA_KEY = "webnovel:data";

function readEnv() {
  const url =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.REDIS_REST_TOKEN;
  return { url, token };
}

export function hasRedisEnv() {
  const { url, token } = readEnv();
  return Boolean(url && token);
}

let client = null;
function getClient() {
  if (client) return client;
  const { url, token } = readEnv();
  if (!url || !token) {
    throw new Error(
      "Redis 연결 정보(KV_REST_API_URL/TOKEN 또는 UPSTASH_REDIS_REST_URL/TOKEN)가 설정되어 있지 않습니다."
    );
  }
  client = new Redis({ url, token });
  return client;
}

function genId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

function notFoundError(message) {
  const err = new Error(message);
  err.code = "ENOENT";
  return err;
}

async function loadData() {
  const redis = getClient();
  const data = await redis.get(DATA_KEY);
  if (!data) return { novels: [] };
  const parsed = typeof data === "string" ? JSON.parse(data) : data;
  if (!Array.isArray(parsed.novels)) parsed.novels = [];
  return parsed;
}

async function saveData(data) {
  const redis = getClient();
  await redis.set(DATA_KEY, data);
}

export function friendlyError(err) {
  return (err && err.message) || "저장소 연결 중 알 수 없는 오류가 발생했습니다.";
}

// ---------- 조회 ----------

export async function getNovels() {
  const data = await loadData();
  return data.novels
    .map((n) => ({
      slug: n.slug,
      title: n.title || "(제목 없음)",
      description: n.description || "",
      createdAt: n.createdAt || 0,
      episodes: (n.episodes || []).map((ep, i) => ({
        id: ep.id,
        title: ep.title,
        number: i + 1,
      })),
    }))
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function getNovel(slug) {
  const data = await loadData();
  const n = data.novels.find((x) => x.slug === slug);
  if (!n) return null;
  return {
    slug: n.slug,
    title: n.title || "(제목 없음)",
    description: n.description || "",
    episodes: (n.episodes || []).map((ep, i) => ({
      id: ep.id,
      title: ep.title,
      number: i + 1,
    })),
  };
}

export async function getEpisode(novelSlug, episodeId) {
  const data = await loadData();
  const n = data.novels.find((x) => x.slug === novelSlug);
  if (!n) return null;

  const idx = n.episodes.findIndex((e) => e.id === episodeId);
  if (idx === -1) return null;

  const prev = idx > 0 ? { id: n.episodes[idx - 1].id, title: n.episodes[idx - 1].title } : null;
  const next =
    idx < n.episodes.length - 1
      ? { id: n.episodes[idx + 1].id, title: n.episodes[idx + 1].title }
      : null;

  return {
    novelTitle: n.title,
    number: idx + 1,
    title: n.episodes[idx].title,
    body: n.episodes[idx].body,
    prev,
    next,
  };
}

export async function getEpisodeRaw(novelSlug, episodeId) {
  const data = await loadData();
  const n = data.novels.find((x) => x.slug === novelSlug);
  if (!n) return null;
  const ep = n.episodes.find((e) => e.id === episodeId);
  if (!ep) return null;
  return { title: ep.title, body: ep.body };
}

// ---------- 등록 ----------

export async function createNovel(title, description = "") {
  const data = await loadData();
  const slug = genId("novel");
  data.novels.push({ slug, title, description, createdAt: Date.now(), episodes: [] });
  await saveData(data);
  return slug;
}

export async function createEpisode(novelSlug, title, body) {
  const data = await loadData();
  const n = data.novels.find((x) => x.slug === novelSlug);
  if (!n) throw notFoundError("존재하지 않는 소설입니다.");

  const id = genId("ep");
  n.episodes.push({ id, title, body: body.trim() });
  await saveData(data);
  return id;
}

// ---------- 수정 ----------

export async function updateNovel(slug, { title, description }) {
  const data = await loadData();
  const n = data.novels.find((x) => x.slug === slug);
  if (!n) throw notFoundError("존재하지 않는 소설입니다.");

  if (title !== undefined) n.title = title;
  if (description !== undefined) n.description = description;
  await saveData(data);
}

export async function updateEpisode(novelSlug, episodeId, { title, body }) {
  const data = await loadData();
  const n = data.novels.find((x) => x.slug === novelSlug);
  if (!n) throw notFoundError("존재하지 않는 소설입니다.");

  const ep = n.episodes.find((e) => e.id === episodeId);
  if (!ep) throw notFoundError("존재하지 않는 회차입니다.");

  if (title !== undefined) ep.title = title;
  if (body !== undefined) ep.body = body.trim();
  await saveData(data);
}

export async function moveEpisode(novelSlug, episodeId, direction) {
  const data = await loadData();
  const n = data.novels.find((x) => x.slug === novelSlug);
  if (!n) throw notFoundError("존재하지 않는 소설입니다.");

  const idx = n.episodes.findIndex((e) => e.id === episodeId);
  if (idx === -1) throw new Error("존재하지 않는 회차입니다.");

  const targetIdx = direction === "up" ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= n.episodes.length) return n.episodes;

  [n.episodes[idx], n.episodes[targetIdx]] = [n.episodes[targetIdx], n.episodes[idx]];
  await saveData(data);
  return n.episodes;
}

// ---------- 삭제 ----------

export async function deleteNovel(slug) {
  const data = await loadData();
  const idx = data.novels.findIndex((x) => x.slug === slug);
  if (idx === -1) throw notFoundError("존재하지 않는 소설입니다.");
  data.novels.splice(idx, 1);
  await saveData(data);
}

export async function deleteEpisode(novelSlug, episodeId) {
  const data = await loadData();
  const n = data.novels.find((x) => x.slug === novelSlug);
  if (!n) throw notFoundError("존재하지 않는 소설입니다.");

  const idx = n.episodes.findIndex((e) => e.id === episodeId);
  if (idx === -1) throw notFoundError("존재하지 않는 회차입니다.");

  n.episodes.splice(idx, 1);
  await saveData(data);
}
