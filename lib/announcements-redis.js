// Upstash Redis(REST) 기반 "신규 회차 등록" 공지 로그.
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

// hash: "날짜::소설slug" -> 그날 그 소설에 새로 등록된 회차 수
const ANNOUNCEMENTS_KEY = "webnovel:announcements";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export async function recordEpisodeAdded(novelSlug) {
  if (!novelSlug) return;
  const redis = getClient();
  const key = `${todayStr()}::${novelSlug}`;
  await redis.hincrby(ANNOUNCEMENTS_KEY, key, 1);
}

export async function getAnnouncements({ limit = 20 } = {}) {
  const redis = getClient();
  const map = await redis.hgetall(ANNOUNCEMENTS_KEY);

  const entries = Object.entries(map || {}).map(([key, count]) => {
    const idx = key.indexOf("::");
    const date = idx === -1 ? key : key.slice(0, idx);
    const novelSlug = idx === -1 ? "" : key.slice(idx + 2);
    return { date, novelSlug, count: Number(count) || 0 };
  });

  entries.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  return entries.slice(0, limit);
}
