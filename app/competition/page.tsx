export const dynamic = 'force-dynamic';

import AppLayout from '@/components/AppLayout';
import CompetitionSubTabs from '@/components/CompetitionSubTabs';
import SeriesCard from '@/components/SeriesCard';
import { getSupabase } from '@/lib/supabase';
import { Competition, SeriesThumbnail } from '@/lib/types';
import { buildSeriesUnion } from '@/lib/competitionSeries';

export default async function CompetitionPage() {
  const supabase = getSupabase();

  const [compRes, thumbRes] = await Promise.all([
    supabase
      .from('competitions')
      .select('*, venue:venues(name)')
      .order('year', { ascending: false })
      .order('date_start', { ascending: false }),
    supabase.from('series_thumbnails').select('*'),
  ]);

  const competitions: Competition[] = (compRes.data as Competition[]) || [];
  const thumbnails: SeriesThumbnail[] = (thumbRes.data as SeriesThumbnail[]) || [];
  const thumbByKey = new Map(thumbnails.map((t) => [t.series_key, t.thumbnail_url]));

  // 관리자 "대회 관리 > 대회 목록"과 동일한 전체 대회 집합을 반영 (프리셋 시리즈 + 직접 입력된 대회명의 합집합)
  const seriesList = buildSeriesUnion(competitions.map((c) => c.name));

  // 각 시리즈의 최근 개최일(연도 → 시작일) 기준 내림차순 정렬. 개최 기록이 없는 시리즈는 맨 뒤로.
  const cards = seriesList
    .map((series) => ({
      series,
      latest: competitions.find((c) => series.names.includes(c.name)) || null,
    }))
    .sort((a, b) => {
      if (!a.latest && !b.latest) return 0;
      if (!a.latest) return 1;
      if (!b.latest) return -1;
      if (a.latest.year !== b.latest.year) return b.latest.year - a.latest.year;
      return (b.latest.date_start || '').localeCompare(a.latest.date_start || '');
    });

  return (
    <AppLayout>
      <h1 className="text-xl font-bold mb-4" style={{ color: '#00462A' }}>대회 기록</h1>

      <CompetitionSubTabs active="series" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cards.map(({ series, latest }) => (
          <SeriesCard
            key={series.key}
            series={series}
            latest={latest}
            thumbnailUrl={thumbByKey.get(series.key) || undefined}
          />
        ))}
      </div>
    </AppLayout>
  );
}
