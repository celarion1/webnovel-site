// Upstash Redis(REST) 기반 회차별 댓글 저장소.
import { Redis } from "@upstash/redis";

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

const DATA_KEY = "webnovel:comments";

function genId() {
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function episodeKey(novelSlug, episodeId) {
  return `${novelSlug}::${episodeId}`;
}

async function loadData() {
  const redis = getClient();
  const data = await redis.get(DATA_KEY);
  if (!data) return {};
  return typeof data === "string" ? JSON.parse(data) : data;
}

async function saveData(data) {
  const redis = getClient();
  await redis.set(DATA_KEY, data);
}

export async function getComments(novelSlug, episodeId) {
  const data = await loadData();
  const list = data[episodeKey(novelSlug, episodeId)] || [];
  return list.slice().sort((a, b) => a.createdAt - b.createdAt);
}

export async function addComment(novelSlug, episodeId, { nickname, text }) {
  const data = await loadData();
  const key = episodeKey(novelSlug, episodeId);
  if (!Array.isArray(data[key])) data[key] = [];

  const comment = {
    id: genId(),
    nickname,
    text,
    createdAt: Date.now(),
  };
  data[key].push(comment);
  await saveData(data);
  return comment;
}

export async function deleteComment(novelSlug, episodeId, commentId) {
  const data = await loadData();
  const key = episodeKey(novelSlug, episodeId);
  if (!Array.isArray(data[key])) return;
  data[key] = data[key].filter((c) => c.id !== commentId);
  await saveData(data);
}
