// Upstash Redis(REST) 기반 방문자/조회수 통계.
// novels-redis.js와 별개의 키 공간을 사용하며, 동일한 방식으로 환경변수를 읽습니다.
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

const PAGEVIEWS_KEY = "webnovel:analytics:pageviews"; // hash: date(YYYY-MM-DD) -> count
const VISITORS_KEY_PREFIX = "webnovel:analytics:visitors:"; // set: date별 방문자 id 집합
const EPISODES_KEY = "webnovel:analytics:episodes"; // hash: "novelSlug::episodeId" -> count

// 날짜별 방문자 집합은 400일 후 자동 만료 (무한정 쌓이지 않도록)
const VISITOR_SET_TTL_SECONDS = 60 * 60 * 24 * 400;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// visitorId: 쿠키 기반 방문자 식별자 (필수)
// episodeKey: "novelSlug::episodeId" 형식, 회차 조회일 때만 전달
export async function recordPageview({ visitorId, episodeKey }) {
  const redis = getClient();
  const date = todayStr();

  const ops = [redis.hincrby(PAGEVIEWS_KEY, date, 1)];

  if (visitorId) {
    const visitorSetKey = `${VISITORS_KEY_PREFIX}${date}`;
    ops.push(redis.sadd(visitorSetKey, visitorId));
    ops.push(redis.expire(visitorSetKey, VISITOR_SET_TTL_SECONDS));
  }

  if (episodeKey) {
    ops.push(redis.hincrby(EPISODES_KEY, episodeKey, 1));
  }

  await Promise.all(ops);
}

export async function getStats({ days = 30 } = {}) {
  const redis = getClient();

  const [pageviewsMap, episodesMap] = await Promise.all([
    redis.hgetall(PAGEVIEWS_KEY),
    redis.hgetall(EPISODES_KEY),
  ]);

  const dateEntries = Object.entries(pageviewsMap || {})
    .sort((a, b) => (a[0] < b[0] ? 1 : -1)) // 최신 날짜 먼저
    .slice(0, days);

  const daily = await Promise.all(
    dateEntries.map(async ([date, pv]) => {
      const uv = await redis.scard(`${VISITORS_KEY_PREFIX}${date}`);
      return {
        date,
        pageviews: Number(pv) || 0,
        uniqueVisitors: Number(uv) || 0,
      };
    })
  );

  const episodes = Object.entries(episodesMap || {}).map(([key, count]) => {
    const idx = key.indexOf("::");
    const novelSlug = idx === -1 ? "" : key.slice(0, idx);
    const episodeId = idx === -1 ? key : key.slice(idx + 2);
    return { novelSlug, episodeId, views: Number(count) || 0 };
  });

  return { daily, episodes };
}
