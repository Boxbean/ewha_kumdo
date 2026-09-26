// 30초 단위로 캐시된 페이지를 즉시 서빙하고 백그라운드에서 갱신 — 탭 이동마다 Supabase 왕복이 발생하던 것을 제거
export const revalidate = 30;

import AppLayout from '@/components/AppLayout';
import VideoList from '@/components/VideoList';
import { getSupabase } from '@/lib/supabase';
import { Video } from '@/lib/types';

const LIST_PAGE_SIZE = 10;

export default async function ListPage() {
  // 첫 페이지만 서버에서 가져오고 나머지는 "더 불러오기"로 — /api/videos?order=date 와 같은 정렬·조인
  const { data, count } = await getSupabase()
    .from('videos')
    .select('*, competition:competitions(name)', { count: 'exact' })
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(0, LIST_PAGE_SIZE - 1);

  const videos: Video[] = (data as Video[]) || [];
  const total = count ?? videos.length;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-baseline justify-between mb-3">
          <h1 className="text-xl font-bold" style={{ color: '#00462A' }}>
            전체 목록
          </h1>
          <span className="text-sm" style={{ color: '#B9B9B9' }}>
            {total}개
          </span>
        </div>
        <VideoList initialVideos={videos} total={total} pageSize={LIST_PAGE_SIZE} />
      </div>
    </AppLayout>
  );
}
