export const dynamic = 'force-dynamic';

import AppLayout from '@/components/AppLayout';
import CompetitionSubTabs from '@/components/CompetitionSubTabs';
import SeriesCard from '@/components/SeriesCard';
import { getSupabase } from '@/lib/supabase';
import { Competition, SeriesThumbnail } from '@/lib/types';
import { getCompetitionColor } from '@/lib/utils';
import { COMPETITION_SERIES } from '@/lib/competitionSeries';

export default async function CompetitionPage() {
  const supabase = getSupabase();
  const allNames = COMPETITION_SERIES.flatMap((s) => s.names);

  const [compRes, thumbRes] = await Promise.all([
    supabase
      .from('competitions')
      .select('*, venue:venues(name)')
      .in('name', allNames)
      .order('year', { ascending: false })
      .order('date_start', { ascending: false }),
    supabase.from('series_thumbnails').select('*'),
  ]);

  const competitions: Competition[] = (compRes.data as Competition[]) || [];
  const thumbnails: SeriesThumbnail[] = (thumbRes.data as SeriesThumbnail[]) || [];
  const thumbByKey = new Map(thumbnails.map((t) => [t.series_key, t.thumbnail_url]));

  return (
    <AppLayout>
      <h1 className="text-xl font-bold mb-4" style={{ color: '#00462A' }}>대회 기록</h1>

      <CompetitionSubTabs active="series" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {COMPETITION_SERIES.map((series) => {
          const latest = competitions.find((c) => series.names.includes(c.name)) || null;
          const color = getCompetitionColor(series.names[0]);

          return (
            <SeriesCard
              key={series.key}
              series={series}
              latest={latest}
              thumbnailUrl={thumbByKey.get(series.key) || undefined}
              color={color}
            />
          );
        })}
      </div>
    </AppLayout>
  );
}
