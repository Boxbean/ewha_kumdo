export const dynamic = 'force-dynamic';

import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import { getSupabase } from '@/lib/supabase';
import { Competition } from '@/lib/types';
import { getCompetitionColor } from '@/lib/utils';

interface Props {
  params: Promise<{ name: string }>;
}

export default async function CompetitionSeriesPage({ params }: Props) {
  const { name } = await params;
  const supabase = getSupabase();

  const { data } = await supabase
    .from('competitions')
    .select('*, venue:venues(*), participants:competition_participants(id), files:competition_files(id)')
    .eq('name', name)
    .order('year', { ascending: false })
    .order('date_start', { ascending: false });

  const competitions: Competition[] = (data as Competition[]) || [];

  const byYear = competitions.reduce<Record<number, Competition[]>>((acc, c) => {
    if (!acc[c.year]) acc[c.year] = [];
    acc[c.year].push(c);
    return acc;
  }, {});

  const years = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => b - a);

  const color = getCompetitionColor(name);

  return (
    <AppLayout>
      <div className="mb-6">
        <Link
          href="/competition"
          className="inline-flex items-center gap-1 text-sm mb-4"
          style={{ color: '#B9B9B9' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          대회 목록
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-sm font-bold px-3 py-1 rounded-full text-white"
            style={{ backgroundColor: color }}
          >
            {name}
          </span>
          <span className="text-sm" style={{ color: '#B9B9B9' }}>
            {years.length}개 연도 · {competitions.length}회 개최
          </span>
        </div>
      </div>

      {competitions.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🏆</p>
          <p className="text-base font-medium mb-1" style={{ color: '#374151' }}>등록된 개최 기록이 없습니다</p>
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
                {byYear[year].map((comp) => {
                  const participantCount = Array.isArray(comp.participants) ? comp.participants.length : 0;
                  const fileCount = Array.isArray(comp.files) ? comp.files.length : 0;

                  return (
                    <Link
                      key={comp.id}
                      href={`/competition/${comp.id}`}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg border transition-all hover:shadow-md"
                      style={{ borderColor: '#e0e0e0', backgroundColor: '#fff' }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {comp.date_start && (
                            <span className="text-xs" style={{ color: '#B9B9B9' }}>
                              {comp.date_start}
                              {comp.date_end && comp.date_end !== comp.date_start ? ` ~ ${comp.date_end}` : ''}
                            </span>
                          )}
                          {comp.venue?.name && (
                            <span className="text-xs" style={{ color: '#374151' }}>
                              📍 {comp.venue.name}
                            </span>
                          )}
                        </div>
                        {comp.result_summary && (
                          <p className="text-sm font-semibold truncate" style={{ color: '#111' }}>
                            {comp.result_summary}
                          </p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          {participantCount > 0 && (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: 'rgba(0,70,42,0.08)', color: '#00462A' }}
                            >
                              출전자 {participantCount}명
                            </span>
                          )}
                          {fileCount > 0 && (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: 'rgba(55,65,81,0.08)', color: '#374151' }}
                            >
                              파일 {fileCount}개
                            </span>
                          )}
                        </div>
                      </div>
                      <svg
                        width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="#B9B9B9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        className="flex-shrink-0"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
