export const dynamic = 'force-dynamic';

import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import { getSupabase } from '@/lib/supabase';
import { Competition } from '@/lib/types';

const COMPETITION_NAMES = ['사회인대회', '서울컵대회', '대선기대회', '서울시 춘계 대학연맹전', '서울시 추계 대학연맹전'];

export default async function CompetitionPage() {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('competitions')
    .select('*, participants:competition_participants(id), files:competition_files(id)')
    .order('year', { ascending: false })
    .order('date_start', { ascending: true });

  const competitions: Competition[] = (data as Competition[]) || [];

  // 연도별 그룹핑
  const byYear = competitions.reduce<Record<number, Competition[]>>((acc, c) => {
    if (!acc[c.year]) acc[c.year] = [];
    acc[c.year].push(c);
    return acc;
  }, {});

  const years = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => b - a);

  // 대회명별 색상
  const nameColors: Record<string, string> = {
    '사회인대회': '#00462A',
    '서울컵대회': '#1a6b47',
    '대선기대회': '#374151',
    '서울시 춘계 대학연맹전': '#2d5a8e',
    '서울시 추계 대학연맹전': '#7c3d8e',
  };

  function getColor(name: string) {
    return nameColors[name] || '#00462A';
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: '#00462A' }}>대회 기록</h1>
        <span className="text-sm" style={{ color: '#B9B9B9' }}>
          {competitions.length}개 대회
        </span>
      </div>

      {competitions.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🏆</p>
          <p className="text-base font-medium mb-1" style={{ color: '#374151' }}>등록된 대회 기록이 없습니다</p>
          <p className="text-sm" style={{ color: '#B9B9B9' }}>관리자 페이지에서 대회를 등록해주세요</p>
        </div>
      ) : (
        <div className="space-y-10">
          {years.map((year) => (
            <section key={year}>
              {/* 연도 헤더 */}
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="text-lg font-bold px-3 py-0.5 rounded-full"
                  style={{ backgroundColor: '#00462A', color: '#FFFDF1' }}
                >
                  {year}
                </span>
                <div className="flex-1 h-px" style={{ backgroundColor: '#e0e0e0' }} />
                <span className="text-xs" style={{ color: '#B9B9B9' }}>
                  {byYear[year].length}개 대회
                </span>
              </div>

              {/* 대회 카드 목록 */}
              <div className="space-y-3">
                {byYear[year].map((comp) => {
                  const participantCount = Array.isArray(comp.participants) ? comp.participants.length : 0;
                  const fileCount = Array.isArray(comp.files) ? comp.files.length : 0;
                  const color = getColor(comp.name);

                  return (
                    <Link
                      key={comp.id}
                      href={`/competition/${comp.id}`}
                      className="block rounded-xl border transition-all hover:shadow-md"
                      style={{ borderColor: '#e0e0e0', backgroundColor: '#fff' }}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {/* 대회명 배지 + 이름 */}
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span
                                className="text-xs font-bold px-2 py-0.5 rounded-full text-white flex-shrink-0"
                                style={{ backgroundColor: color }}
                              >
                                {comp.name}
                              </span>
                              {comp.date_start && (
                                <span className="text-xs" style={{ color: '#B9B9B9' }}>
                                  {comp.date_start}
                                  {comp.date_end && comp.date_end !== comp.date_start
                                    ? ` ~ ${comp.date_end}`
                                    : ''}
                                </span>
                              )}
                            </div>

                            {/* 결과 요약 */}
                            {comp.result_summary && (
                              <p className="text-sm font-semibold mb-1.5 truncate" style={{ color: '#111' }}>
                                {comp.result_summary}
                              </p>
                            )}

                            {/* 메타 정보 칩 */}
                            <div className="flex items-center gap-2 flex-wrap">
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
                              {comp.entry_fee && (
                                <span className="text-xs" style={{ color: '#B9B9B9' }}>
                                  참가비 {comp.entry_fee.toLocaleString()}원
                                </span>
                              )}
                            </div>
                          </div>

                          {/* 화살표 */}
                          <svg
                            width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="#B9B9B9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            className="flex-shrink-0 mt-1"
                          >
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        </div>
                      </div>
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
