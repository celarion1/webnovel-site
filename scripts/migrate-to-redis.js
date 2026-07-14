#!/usr/bin/env node
/**
 * 로컬 content/ 폴더에 있는 소설·회차를 Upstash Redis(웹사이트가 실제로 읽는 저장소)로
 * 한 번에 옮깁니다. Redis를 새로 연결한 뒤 딱 한 번만 실행하면 됩니다.
 *
 * 사전 준비:
 *   1) Vercel 프로젝트에 Redis(Upstash) 스토리지를 연결한다.
 *   2) 프로젝트 루트에 .env.local 파일을 만들고, Vercel이 발급한 값을 아래처럼 붙여넣는다.
 *        KV_REST_API_URL=...
 *        KV_REST_API_TOKEN=...
 *      (KV_REST_API_* 대신 UPSTASH_REDIS_REST_* 이름으로 되어 있어도 됨)
 *
 * 사용법:
 *   npm run migrate-to-redis
 */
const fs = require("fs");
const path = require("path");

// .env.local을 간단히 읽어 process.env에 채워 넣음 (별도 패키지 불필요)
function loadDotEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadDotEnvLocal();

const { Redis } = require("@upstash/redis");

const url =
  process.env.KV_REST_API_URL ||
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.REDIS_REST_URL;
const token =
  process.env.KV_REST_API_TOKEN ||
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.REDIS_REST_TOKEN;

if (!url || !token) {
  console.error(
    "Redis 연결 정보를 찾을 수 없습니다. .env.local에 KV_REST_API_URL / KV_REST_API_TOKEN(또는 UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN)을 설정해주세요."
  );
  process.exit(1);
}

const CONTENT_DIR = path.join(process.cwd(), "content");
const DATA_KEY = "webnovel:data";

function readLocalNovels() {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => {
      const slug = e.name;
      const metaPath = path.join(CONTENT_DIR, slug, "meta.json");
      if (!fs.existsSync(metaPath)) return null;
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
      const episodesDir = path.join(CONTENT_DIR, slug, "episodes");
      const episodes = (meta.episodes || []).map((ep) => {
        const filePath = path.join(episodesDir, `${ep.id}.txt`);
        const body = fs.existsSync(filePath)
          ? fs.readFileSync(filePath, "utf-8").trim()
          : "";
        return { id: ep.id, title: ep.title, body };
      });
      return {
        slug,
        title: meta.title || "(제목 없음)",
        description: meta.description || "",
        createdAt: meta.createdAt || Date.now(),
        episodes,
      };
    })
    .filter(Boolean);
}

async function main() {
  const redis = new Redis({ url, token });
  const localNovels = readLocalNovels();

  if (localNovels.length === 0) {
    console.log("content/ 폴더에 옮길 소설이 없습니다. 그대로 종료합니다.");
    return;
  }

  const existingRaw = await redis.get(DATA_KEY);
  const existing =
    existingRaw && typeof existingRaw === "object"
      ? existingRaw
      : existingRaw
      ? JSON.parse(existingRaw)
      : { novels: [] };
  if (!Array.isArray(existing.novels)) existing.novels = [];

  let added = 0;
  let skipped = 0;
  for (const novel of localNovels) {
    const already = existing.novels.some((n) => n.slug === novel.slug);
    if (already) {
      skipped++;
      continue;
    }
    existing.novels.push(novel);
    added++;
  }

  await redis.set(DATA_KEY, existing);

  console.log(`완료: ${added}개 소설을 Redis로 옮겼습니다. (이미 있어서 건너뜀: ${skipped}개)`);
  console.log("이제 배포된 사이트에서 관리자로 로그인하면 해당 소설들을 바로 볼 수 있습니다.");
}

main().catch((err) => {
  console.error("마이그레이션 중 오류가 발생했습니다:", err.message);
  process.exit(1);
});
