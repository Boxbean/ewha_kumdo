export const dynamic = 'force-dynamic';

import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import CompetitionSubTabs from '@/components/CompetitionSubTabs';
import { getSupabase } from '@/lib/supabase';
import { Competition } from '@/lib/types';
import { getCompetitionColor } from '@/lib/utils';
import { COMPETITION_SERIES } from '@/lib/competitionSeries';

export default async function CompetitionPage() {
  const supabase = getSupabase();
  const allNames = COMPETITION_SERIES.flatMap((s) => s.names);

  const { data } = await supabase
    .from('competitions')
    .select('*, venue:venues(name)')
    .in('name', allNames)
    .order('year', { ascending: false })
    .order('date_start', { ascending: false });

  const competitions: Competition[] = (data as Competition[]) || [];

  return (
    <AppLayout>
      <h1 className="text-xl font-bold mb-4" style={{ color: '#00462A' }}>대회 기록</h1>

      <CompetitionSubTabs active="series" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {COMPETITION_SERIES.map((series) => {
          const latest = competitions.find((c) => series.names.includes(c.name));
          const color = getCompetitionColor(series.names[0]);

          return (
            <Link
              key={series.key}
              href={`/competition/series/${series.key}`}
              className="block rounded-xl border p-4 transition-all hover:shadow-md"
              style={{ borderColor: '#e0e0e0', backgroundColor: '#fff' }}
            >
              <span
                className="inline-block text-xs font-bold px-2.5 py-1 rounded-full text-white mb-2"
                style={{ backgroundColor: color }}
              >
                {series.label}
              </span>
              {latest ? (
                <div className="space-y-0.5">
                  {latest.date_start && (
                    <p className="text-sm" style={{ color: '#374151' }}>
                      🗓️ {latest.date_start}
                    </p>
                  )}
                  {latest.venue?.name && (
                    <p className="text-sm" style={{ color: '#374151' }}>
                      📍 {latest.venue.name}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm" style={{ color: '#B9B9B9' }}>
                  아직 등록된 기록이 없습니다
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </AppLayout>
  );
}
