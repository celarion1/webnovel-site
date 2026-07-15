"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// 실제로 렌더된 페이지에서만 조회수를 기록하기 위한 클라이언트 컴포넌트.
// (Next.js Link의 prefetch는 이 컴포넌트를 마운트하지 않으므로 과다 집계되지 않음)
export default function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    const segments = pathname.split("/").filter(Boolean);
    let payload = { type: "home" };

    if (segments[0] === "novel" && segments[1]) {
      if (segments[2]) {
        payload = { type: "episode", novelSlug: segments[1], episodeId: segments[2] };
      } else {
        payload = { type: "novel", novelSlug: segments[1] };
      }
    }

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // 통계 전송 실패는 읽기 경험에 영향을 주지 않도록 무시
    });
  }, [pathname]);

  return null;
}
