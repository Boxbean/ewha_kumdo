export const dynamic = 'force-dynamic';

import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import VenueInfoCard from '@/components/VenueInfoCard';
import { getSupabase } from '@/lib/supabase';
import { Competition, Venue } from '@/lib/types';
import { getCompetitionColor } from '@/lib/utils';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function VenueDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = getSupabase();

  const [venueRes, compRes] = await Promise.all([
    supabase.from('venues').select('*').eq('id', id).single(),
    supabase
      .from('competitions')
      .select('*, participants:competition_participants(id), files:competition_files(id)')
      .eq('venue_id', id)
      .order('year', { ascending: false })
      .order('date_start', { ascending: false }),
  ]);

  if (venueRes.error || !venueRes.data) {
    return (
      <AppLayout>
        <div className="text-center py-20" style={{ color: '#B9B9B9' }}>
          대회장 정보를 찾을 수 없습니다.
        </div>
      </AppLayout>
    );
  }

  const venue = venueRes.data as Venue;
  const competitions: Competition[] = (compRes.data as Competition[]) || [];

  const byYear = competitions.reduce<Record<number, Competition[]>>((acc, c) => {
    if (!acc[c.year]) acc[c.year] = [];
    acc[c.year].push(c);
    return acc;
  }, {});

  const years = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <AppLayout>
      <div className="space-y-6">
        <VenueInfoCard venue={venue} />

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold" style={{ color: '#00462A' }}>
              이 대회장에서 열린 대회
            </h2>
            <span className="text-xs" style={{ color: '#B9B9B9' }}>
              {competitions.length}회 개최
            </span>
          </div>

          {competitions.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">📍</p>
              <p className="text-sm" style={{ color: '#B9B9B9' }}>이 대회장에서 열린 대회 기록이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-8">
              {years.map((year) => (
                <section key={year}>
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="text-base font-bold px-3 py-0.5 rounded-full"
                      style={{ backgroundColor: '#00462A', color: '#FFFDF1' }}
                    >
                      {year}
                    </span>
                    <div className="flex-1 h-px" style={{ backgroundColor: '#e0e0e0' }} />
                  </div>

                  <div className="space-y-2">
                    {byYear[year].map((comp) => (
                      <Link
                        key={comp.id}
                        href={`/competition/${comp.id}`}
                        className="block px-4 py-3 rounded-lg border transition-all hover:shadow-md"
                        style={{ borderColor: '#e0e0e0', backgroundColor: '#fff' }}
                      >
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: getCompetitionColor(comp.name) }}
                          >
                            {comp.name}
                          </span>
                          {comp.date_start && (
                            <span className="text-xs" style={{ color: '#B9B9B9' }}>
                              {comp.date_start}
                              {comp.date_end && comp.date_end !== comp.date_start ? ` ~ ${comp.date_end}` : ''}
                            </span>
                          )}
                        </div>
                        {comp.result_summary && (
                          <p className="text-sm font-semibold mb-0.5" style={{ color: '#111' }}>
                            {comp.result_summary}
                          </p>
                        )}
                        {comp.notes && (
                          <p className="text-xs whitespace-pre-wrap" style={{ color: '#B9B9B9' }}>
                            &ldquo;{comp.notes}&rdquo;
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
