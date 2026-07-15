// 로컬 파일(content/announcements.json) 기반 "신규 회차 등록" 공지 로그.
// Redis 환경변수가 없을 때(주로 로컬 개발) 사용됨.
import fs from "fs";
import path from "path";

const FILE_PATH = path.join(process.cwd(), "content", "announcements.json");

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

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export async function recordEpisodeAdded(novelSlug) {
  if (!novelSlug) return;
  const data = readData();
  const key = `${todayStr()}::${novelSlug}`;
  data[key] = (data[key] || 0) + 1;
  writeData(data);
}

export async function getAnnouncements({ limit = 20 } = {}) {
  const data = readData();

  const entries = Object.entries(data).map(([key, count]) => {
    const idx = key.indexOf("::");
    const date = idx === -1 ? key : key.slice(0, idx);
    const novelSlug = idx === -1 ? "" : key.slice(idx + 2);
    return { date, novelSlug, count: count || 0 };
  });

  entries.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  return entries.slice(0, limit);
}
