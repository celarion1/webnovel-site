// 로컬 파일(content/analytics.json) 기반 방문자/조회수 통계.
// Redis 환경변수가 없을 때(주로 로컬 개발) 사용됨.
import fs from "fs";
import path from "path";

const FILE_PATH = path.join(process.cwd(), "content", "analytics.json");

function readData() {
  if (!fs.existsSync(FILE_PATH)) {
    return { pageviews: {}, visitors: {}, episodes: {} };
  }
  try {
    const raw = JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
    return {
      pageviews: raw.pageviews || {},
      visitors: raw.visitors || {},
      episodes: raw.episodes || {},
    };
  } catch {
    return { pageviews: {}, visitors: {}, episodes: {} };
  }
}

function writeData(data) {
  const dir = path.dirname(FILE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export async function recordPageview({ visitorId, episodeKey }) {
  const data = readData();
  const date = todayStr();

  data.pageviews[date] = (data.pageviews[date] || 0) + 1;

  if (visitorId) {
    if (!data.visitors[date]) data.visitors[date] = [];
    if (!data.visitors[date].includes(visitorId)) {
      data.visitors[date].push(visitorId);
    }
  }

  if (episodeKey) {
    data.episodes[episodeKey] = (data.episodes[episodeKey] || 0) + 1;
  }

  writeData(data);
}

export async function getStats({ days = 30 } = {}) {
  const data = readData();

  const dateKeys = Object.keys(data.pageviews)
    .sort((a, b) => (a < b ? 1 : -1))
    .slice(0, days);

  const daily = dateKeys.map((date) => ({
    date,
    pageviews: data.pageviews[date] || 0,
    uniqueVisitors: (data.visitors[date] || []).length,
  }));

  const episodes = Object.entries(data.episodes).map(([key, count]) => {
    const idx = key.indexOf("::");
    const novelSlug = idx === -1 ? "" : key.slice(0, idx);
    const episodeId = idx === -1 ? key : key.slice(idx + 2);
    return { novelSlug, episodeId, views: count };
  });

  return { daily, episodes };
}
