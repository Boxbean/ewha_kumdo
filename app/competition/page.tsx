export const revalidate = 30;

import AppLayout from '@/components/AppLayout';
import CompetitionSubTabs from '@/components/CompetitionSubTabs';
import SeriesCard from '@/components/SeriesCard';
import { getSupabase } from '@/lib/supabase';
import { Competition, SeriesThumbnail } from '@/lib/types';
import { buildSeriesUnion } from '@/lib/competitionSeries';
import { THUMBNAIL_CARD_FILE_TYPE, THUMBNAIL_FILE_TYPE } from '@/lib/utils';

// 카드 썸네일: 시리즈에서 가장 최근에 썸네일을 등록한 대회의 카드용(관리자가 고른 정사각형) 이미지
// → 없으면 그 대회 원본(카드에서 object-cover로 정중앙 정사각형만 보임)
function competitionThumbnail(competitions: Competition[]): string | undefined {
  for (const c of competitions) {
    const card = c.files?.find((f) => f.file_type === THUMBNAIL_CARD_FILE_TYPE);
    const original = c.files?.find((f) => f.file_type === THUMBNAIL_FILE_TYPE);
    if (card || original) return (card || original)!.file_url;
  }
  return undefined;
}

export default async function CompetitionPage() {
  const supabase = getSupabase();

  const [compRes, thumbRes] = await Promise.all([
    supabase
      .from('competitions')
      .select('*, venue:venues(name), files:competition_files(file_type,file_url)')
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
            // 대회정보에서 등록한 썸네일 우선, 없으면 관리자 페이지의 시리즈 썸네일, 그것도 없으면 로고
            thumbnailUrl={
              competitionThumbnail(competitions.filter((c) => series.names.includes(c.name))) ||
              thumbByKey.get(series.key) ||
              undefined
            }
          />
        ))}
      </div>
    </AppLayout>
  );
}
