// 쇼츠 목록을 서버에서 미리 그려 30초 단위로 캐시 — 홈과 같은 방식 (쇼츠 등록·삭제 API에서 즉시 갱신)
export const revalidate = 30;

import { getSupabase } from '@/lib/supabase';
import { Shorts } from '@/lib/types';
import ShortsContent from './ShortsContent';

// ShortsContent의 새로고침 조회 개수와 같게
const FETCH_ALL_LIMIT = 1000;

export default async function ShortsPage() {
  const { data, error } = await getSupabase()
    .from('shorts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(FETCH_ALL_LIMIT);
  // 실패 시 예외를 던져야 캐시 갱신이 실패로 처리되어 직전 정상 화면이 유지됨
  if (error) throw error;

  return <ShortsContent initialShorts={(data as Shorts[]) || []} />;
}
