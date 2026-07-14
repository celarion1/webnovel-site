#!/usr/bin/env node
/**
 * (선택) 커맨드라인으로 새 소설을 등록합니다.
 * 웹페이지 왼쪽 패널의 "+ 새 소설 등록" 버튼과 동일한 동작을 합니다.
 * 스크립트를 쓰지 않고 웹페이지 버튼만 사용해도 충분합니다.
 *
 * 사용법:
 *   npm run add-novel -- "<제목>" "<소개(선택)>"
 */
const fs = require("fs");
const path = require("path");

const [, , title, description = ""] = process.argv;

if (!title) {
  console.error('사용법: npm run add-novel -- "<제목>" "<소개(선택)>"');
  process.exit(1);
}

function genId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

const slug = genId("novel");
const novelDir = path.join(process.cwd(), "content", slug);
fs.mkdirSync(path.join(novelDir, "episodes"), { recursive: true });
fs.writeFileSync(
  path.join(novelDir, "meta.json"),
  JSON.stringify(
    { title, description, createdAt: Date.now(), episodes: [] },
    null,
    2
  ) + "\n",
  "utf-8"
);

console.log(`소설이 생성되었습니다: content/${slug}/`);
console.log(`다음 명령으로 회차를 추가하세요:`);
console.log(`  npm run add-episode -- ${slug} "1화 제목" ./원고.txt`);
