export const dynamic = 'force-dynamic';

import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import { getSupabase } from '@/lib/supabase';
import { Competition, Video } from '@/lib/types';
import CompetitionTabs from '@/components/CompetitionTabs';
import CompetitionDetailFields from '@/components/CompetitionDetailFields';
import CompetitionEditButton from '@/components/CompetitionEditButton';
import { getSeriesByName } from '@/lib/competitionSeries';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CompetitionDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = getSupabase();

  const [compRes, videosRes] = await Promise.all([
    supabase
      .from('competitions')
      .select('*, venue:venues(*), participants:competition_participants(*), files:competition_files(*)')
      .eq('id', id)
      .single(),
    supabase
      .from('videos')
      .select('*')
      .eq('competition_id', id)
      .order('date', { ascending: true }),
  ]);

  if (compRes.error || !compRes.data) {
    return (
      <AppLayout>
        <div className="text-center py-20" style={{ color: '#B9B9B9' }}>
          대회 정보를 찾을 수 없습니다.
        </div>
      </AppLayout>
    );
  }

  const comp = compRes.data as Competition;
  const videos: Video[] = (videosRes.data as Video[]) || [];
  const series = getSeriesByName(comp.name);

  return (
    <AppLayout>
      {/* 상단 헤더 */}
      <div className="mb-6">
        <Link
          href={series ? `/competition/series/${series.key}` : '/competition'}
          className="inline-flex items-center gap-1 text-sm mb-4"
          style={{ color: '#B9B9B9' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {series ? `${series.label} 이력` : '대회 목록'}
        </Link>

        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
              style={{ backgroundColor: '#00462A' }}
            >
              {comp.name}
            </span>
            <span className="text-sm font-semibold" style={{ color: '#374151' }}>
              {comp.year}년
            </span>
          </div>
          <CompetitionEditButton competitionId={comp.id} />
        </div>

        {/* 결과 요약 배너 */}
        {comp.result_summary && (
          <div
            className="mt-3 px-4 py-2.5 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: 'rgba(0,70,42,0.08)', color: '#00462A' }}
          >
            🏆 {comp.result_summary}
          </div>
        )}
      </div>

      {/* 대회 정보 6요소 (항상 노출, 없으면 '등록된 정보 없음') */}
      <div className="mb-6">
        <CompetitionDetailFields comp={comp} />
      </div>

      {/* 탭 컴포넌트 (클라이언트) */}
      <CompetitionTabs comp={comp} videos={videos} />
    </AppLayout>
  );
}
