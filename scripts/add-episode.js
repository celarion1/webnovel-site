#!/usr/bin/env node
/**
 * (선택) 커맨드라인으로 회차를 추가합니다. (맨 뒤에 추가됨)
 * 웹페이지 왼쪽 패널의 "+ 새 회차 등록"과 동일한 동작을 합니다.
 * 스크립트를 쓰지 않고 웹페이지 버튼만 사용해도 충분합니다.
 *
 * 사용법:
 *   npm run add-episode -- <소설 slug> "<회차 제목>" <원고 텍스트파일 경로>
 */
const fs = require("fs");
const path = require("path");

const [, , novelSlug, episodeTitle, sourceFile] = process.argv;

if (!novelSlug || !episodeTitle || !sourceFile) {
  console.error(
    '사용법: npm run add-episode -- <소설 slug> "<회차 제목>" <원고 텍스트파일 경로>'
  );
  process.exit(1);
}

const novelDir = path.join(process.cwd(), "content", novelSlug);
const metaPath = path.join(novelDir, "meta.json");
const episodesDir = path.join(novelDir, "episodes");

if (!fs.existsSync(metaPath)) {
  console.error(
    `존재하지 않는 소설입니다: ${novelSlug}\n먼저 npm run add-novel 로 소설을 등록하세요.`
  );
  process.exit(1);
}

if (!fs.existsSync(sourceFile)) {
  console.error(`원고 파일을 찾을 수 없습니다: ${sourceFile}`);
  process.exit(1);
}

fs.mkdirSync(episodesDir, { recursive: true });

function genId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
if (!Array.isArray(meta.episodes)) meta.episodes = [];

const id = genId("ep");
const body = fs.readFileSync(sourceFile, "utf-8").trim();
fs.writeFileSync(path.join(episodesDir, `${id}.txt`), body + "\n", "utf-8");

meta.episodes.push({ id, title: episodeTitle });
fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + "\n", "utf-8");

console.log(`회차가 추가되었습니다: content/${novelSlug}/episodes/${id}.txt`);
console.log(`순서는 웹페이지 왼쪽 패널의 ▲▼ 버튼으로 언제든 바꿀 수 있습니다.`);
console.log(`이제 git add / commit / push 하면 사이트에 자동 반영됩니다.`);
