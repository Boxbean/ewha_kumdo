'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ADMIN_DATA_CHANGED } from '@/lib/adminClient';

// 관리자 대시보드에서 등록·수정·삭제한 직후 다른 탭으로 이동하면 바로 반영되어 보이도록,
// 브라우저가 미리 받아둔 페이지 캐시(Next.js 라우터 캐시)를 전부 비움 — router.refresh()가 캐시 전체를 무효화함
export default function AdminDataRefresher() {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => router.refresh();
    window.addEventListener(ADMIN_DATA_CHANGED, refresh);
    return () => window.removeEventListener(ADMIN_DATA_CHANGED, refresh);
  }, [router]);

  return null;
}
