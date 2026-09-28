// 첫 페이지 영상·쇼츠를 서버에서 미리 그려 30초 단위로 캐시 — 예전에는 빈 화면(로딩)만 내려보낸 뒤
// JS 로딩 → /api/videos 호출 → 렌더링 순으로 기다려야 해서 첫 화면이 늦게 떴음.
// 영상/쇼츠 등록·수정·삭제 API에서 revalidatePath('/')로 즉시 갱신
export const revalidate = 30;

import AppLayout from '@/components/AppLayout';
import { getSupabase } from '@/lib/supabase';
import { Shorts } from '@/lib/types';
import { EMPTY_FILTERS, fetchVideosPage } from '@/lib/videoQueries';
import HomeContent from './HomeContent';

const PAGE_SIZE = 10;
// 홈 쇼츠 줄에서 섞어 보여줄 후보 수
const SHORTS_ROW_LIMIT = 50;

export default async function HomePage() {
  const supabase = getSupabase();
  const [videos, shortsRes] = await Promise.all([
    // 실패 시 예외를 그대로 던져야 캐시 갱신이 실패로 처리되어 직전 정상 화면이 유지됨 (빈 홈이 30초간 캐시되는 것 방지)
    fetchVideosPage(supabase, EMPTY_FILTERS, PAGE_SIZE, 0),
    supabase.from('shorts').select('*').order('created_at', { ascending: false }).limit(SHORTS_ROW_LIMIT),
  ]);

  return (
    <AppLayout>
      <HomeContent
        initialVideos={videos.data}
        total={videos.count}
        pageSize={PAGE_SIZE}
        shorts={(shortsRes.data as Shorts[]) || []}
      />
    </AppLayout>
  );
}
