import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "webnovel_admin";

// 서버 컴포넌트/라우트 핸들러에서 관리자 로그인 여부 확인
export function isAdminAuthed() {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  return token === expected;
}
