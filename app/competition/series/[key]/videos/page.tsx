export const dynamic = 'force-dynamic';

import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import VideoGrid from '@/components/VideoGrid';
import { getSupabase } from '@/lib/supabase';
import { Video } from '@/lib/types';
import { getCompetitionColor } from '@/lib/utils';
import { getSeriesByKey } from '@/lib/competitionSeries';

interface Props {
  params: Promise<{ key: string }>;
}

export default async function SeriesVideosPage({ params }: Props) {
  const { key } = await params;
  const series = getSeriesByKey(key);

  if (!series) {
    return (
      <AppLayout>
        <div className="text-center py-20" style={{ color: '#B9B9B9' }}>
          존재하지 않는 대회입니다.
        </div>
      </AppLayout>
    );
  }

  const supabase = getSupabase();
  const color = getCompetitionColor(series.names[0]);

  const { data: compData } = await supabase
    .from('competitions')
    .select('id')
    .in('name', series.names);

  const competitionIds = (compData || []).map((c: { id: string }) => c.id);

  let videos: Video[] = [];
  if (competitionIds.length > 0) {
    const { data: videoData } = await supabase
      .from('videos')
      .select('*')
      .in('competition_id', competitionIds)
      .order('date', { ascending: false });
    videos = (videoData as Video[]) || [];
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <Link
          href={`/competition/series/${series.key}`}
          className="inline-flex items-center gap-1 text-sm mb-4"
          style={{ color: '#B9B9B9' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {series.label} 이력
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-sm font-bold px-3 py-1 rounded-full text-white"
            style={{ backgroundColor: color }}
          >
            {series.label}
          </span>
          <span className="text-sm" style={{ color: '#B9B9B9' }}>
            영상 {videos.length}개
          </span>
        </div>
      </div>

      <VideoGrid videos={videos} />
    </AppLayout>
  );
}
