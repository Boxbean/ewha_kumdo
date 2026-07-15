'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Competition, Video } from '@/lib/types';
import { formatDate, extractYouTubeId, getYouTubeThumbnail } from '@/lib/utils';
import AngleBadge from '@/components/AngleBadge';
import BracketView from '@/components/BracketView';

type TabKey = 'participants' | 'files' | 'videos' | 'bracket';

interface Props {
  comp: Competition;
  videos: Video[];
}

export default function CompetitionTabs({ comp, videos }: Props) {
  const [tab, setTab] = useState<TabKey>('participants');

  const hasBracket = (comp.bracket_matches?.length ?? 0) > 0
    || (comp.files ?? []).some((f) => f.file_type === '대진표');

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'participants', label: '출전자', count: comp.participants?.length },
    { key: 'files', label: '파일', count: comp.files?.length },
    { key: 'videos', label: '영상', count: videos.length },
    ...(hasBracket ? [{ key: 'bracket' as TabKey, label: '대진표', count: comp.bracket_matches?.length }] : []),
  ];

  return (
    <>
      {/* 탭 헤더 */}
      <div className="flex gap-0 mb-5 border-b" style={{ borderColor: '#e0e0e0' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 h-10 px-4 text-sm font-medium border-b-2 -mb-[1px] transition-colors"
            style={{
              borderBottomColor: tab === t.key ? '#00462A' : 'transparent',
              color: tab === t.key ? '#00462A' : '#B9B9B9',
            }}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span
                className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                style={{
                  backgroundColor: tab === t.key ? '#00462A' : '#e0e0e0',
                  color: tab === t.key ? '#fff' : '#374151',
                }}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 출전자 탭 */}
      {tab === 'participants' && (
        <div>
          {!comp.participants || comp.participants.length === 0 ? (
            <EmptyState icon="👤" message="등록된 출전자 정보가 없습니다" />
          ) : (
            (() => {
              // 부별 그룹핑
              const byDivision = comp.participants.reduce<Record<string, typeof comp.participants>>((acc, p) => {
                const key = p.division || '미분류';
                if (!acc[key]) acc[key] = [];
                acc[key].push(p);
                return acc;
              }, {});

              return (
                <div className="space-y-5">
                  {Object.entries(byDivision).map(([division, members]) => (
                    <div key={division}>
                      <h3
                        className="text-xs font-bold uppercase tracking-wider mb-2 px-1"
                        style={{ color: '#00462A' }}
                      >
                        {division}
                        <span className="ml-1 font-normal" style={{ color: '#B9B9B9' }}>
                          {members.length}명
                        </span>
                      </h3>

                      {/* 데스크톱 테이블 */}
                      <div className="hidden sm:block overflow-x-auto rounded-lg border" style={{ borderColor: '#e0e0e0' }}>
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr style={{ backgroundColor: '#F8FBF9' }}>
                              {['이름', '성별', '단/급', '결과', '메모'].map((col) => (
                                <th
                                  key={col}
                                  className="px-3 py-2 text-left font-semibold border-b text-xs"
                                  style={{ borderColor: '#e0e0e0', color: '#374151' }}
                                >
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {members.map((p) => (
                              <tr key={p.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                <td className="px-3 py-2 font-medium" style={{ color: '#111' }}>{p.name}</td>
                                <td className="px-3 py-2" style={{ color: '#6B7280' }}>{p.gender || '—'}</td>
                                <td className="px-3 py-2" style={{ color: '#6B7280' }}>{p.dan_kyu || '—'}</td>
                                <td className="px-3 py-2">
                                  {p.result ? (
                                    <span
                                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                      style={
                                        p.result === '우승'
                                          ? { backgroundColor: '#fef08a', color: '#92400e' }
                                          : p.result === '준우승'
                                          ? { backgroundColor: '#e0e7ff', color: '#3730a3' }
                                          : p.result.includes('강')
                                          ? { backgroundColor: 'rgba(0,70,42,0.1)', color: '#00462A' }
                                          : { backgroundColor: '#f3f4f6', color: '#6B7280' }
                                      }
                                    >
                                      {p.result}
                                    </span>
                                  ) : <span style={{ color: '#B9B9B9' }}>—</span>}
                                </td>
                                <td className="px-3 py-2 text-xs" style={{ color: '#6B7280' }}>{p.notes || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* 모바일 카드형 */}
                      <div className="sm:hidden space-y-2">
                        {members.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between px-3 py-2.5 rounded-lg border"
                            style={{ borderColor: '#e0e0e0' }}
                          >
                            <div>
                              <span className="text-sm font-medium" style={{ color: '#111' }}>{p.name}</span>
                              {p.dan_kyu && (
                                <span className="text-xs ml-2" style={{ color: '#B9B9B9' }}>{p.dan_kyu}</span>
                              )}
                            </div>
                            {p.result && (
                              <span
                                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                style={
                                  p.result === '우승'
                                    ? { backgroundColor: '#fef08a', color: '#92400e' }
                                    : p.result === '준우승'
                                    ? { backgroundColor: '#e0e7ff', color: '#3730a3' }
                                    : p.result.includes('강')
                                    ? { backgroundColor: 'rgba(0,70,42,0.1)', color: '#00462A' }
                                    : { backgroundColor: '#f3f4f6', color: '#6B7280' }
                                }
                              >
                                {p.result}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* 파일 탭 */}
      {tab === 'files' && (
        <div>
          {!comp.files || comp.files.length === 0 ? (
            <EmptyState icon="📄" message="등록된 파일이 없습니다" />
          ) : (
            <div className="space-y-2">
              {comp.files.map((file) => (
                <a
                  key={file.id}
                  href={file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors hover:border-[#00462A]"
                  style={{ borderColor: '#e0e0e0' }}
                >
                  <span className="text-2xl flex-shrink-0">
                    {file.file_type === '팸플릿' ? '📋'
                     : file.file_type === '대진표' ? '🗂️'
                     : file.file_type === '결과지' ? '🏆'
                     : file.file_type === '사진' ? '📸'
                     : '📄'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#111' }}>
                      {file.file_name || file.file_type || '파일'}
                    </p>
                    {file.file_type && (
                      <p className="text-xs" style={{ color: '#B9B9B9' }}>{file.file_type}</p>
                    )}
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B9B9B9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 영상 탭 */}
      {tab === 'videos' && (
        <div>
          {videos.length === 0 ? (
            <EmptyState icon="🎬" message="연결된 영상이 없습니다" sub="영상 등록 시 이 대회를 선택하면 여기에 표시됩니다" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {videos.map((video) => {
                const videoId = extractYouTubeId(video.youtube_url);
                const thumb = videoId ? getYouTubeThumbnail(videoId) : null;
                return (
                  <Link
                    key={video.id}
                    href={`/video/${video.id}`}
                    className="block rounded-xl overflow-hidden border transition-all hover:shadow-md"
                    style={{ borderColor: '#e0e0e0' }}
                  >
                    {/* 썸네일 */}
                    <div className="relative" style={{ aspectRatio: '16/9', backgroundColor: '#f3f4f6' }}>
                      {thumb && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb}
                          alt={video.title}
                          className="w-full h-full object-cover"
                          sizes="(max-width: 640px) 50vw, 33vw"
                        />
                      )}
                      <div className="absolute top-1.5 right-1.5">
                        <AngleBadge angle={video.angle} />
                      </div>
                    </div>

                    {/* 카드 정보 */}
                    <div className="p-2.5">
                      <p className="text-xs font-medium line-clamp-2 mb-1" style={{ color: '#111' }}>
                        {video.title}
                      </p>
                      <p className="text-xs" style={{ color: '#B9B9B9' }}>
                        {formatDate(video.date)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 대진표 탭 */}
      {tab === 'bracket' && (
        <BracketView matches={comp.bracket_matches ?? []} files={comp.files ?? []} />
      )}
    </>
  );
}

function EmptyState({ icon, message, sub }: { icon: string; message: string; sub?: string }) {
  return (
    <div className="text-center py-16">
      <p className="text-4xl mb-3">{icon}</p>
      <p className="text-sm font-medium" style={{ color: '#374151' }}>{message}</p>
      {sub && <p className="text-xs mt-1" style={{ color: '#B9B9B9' }}>{sub}</p>}
    </div>
  );
}
