export const dynamic = 'force-dynamic';

import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import { getSupabase } from '@/lib/supabase';
import { Video } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default async function ListPage() {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('videos')
    .select('*')
    .order('date', { ascending: false });

  const videos: Video[] = (data as Video[]) || [];

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold" style={{ color: '#00462A' }}>
          전체 목록
        </h1>
        <span className="text-sm" style={{ color: '#B9B9B9' }}>
          {videos.length}개
        </span>
      </div>

      {videos.length === 0 ? (
        <p className="text-center py-16" style={{ color: '#B9B9B9' }}>
          등록된 영상이 없습니다.
        </p>
      ) : (
        <>
          {/* 데스크톱 테이블 */}
          <div className="hidden sm:block overflow-x-auto rounded-lg border" style={{ borderColor: '#e0e0e0' }}>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ backgroundColor: '#F8FBF9' }}>
                  {['#', '날짜', '제목', '앵글', '참가자', '주제'].map((col) => (
                    <th
                      key={col}
                      className="px-3 py-2.5 text-left font-semibold border-b"
                      style={{ borderColor: '#e0e0e0', color: '#374151' }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {videos.map((video, i) => (
                  <tr
                    key={video.id}
                    className="transition-colors hover:bg-[rgba(0,70,42,0.04)]"
                    style={{ borderBottom: '1px solid #f0f0f0' }}
                  >
                    <td className="px-3 py-2.5 tabular-nums" style={{ color: '#B9B9B9', width: '2.5rem' }}>
                      {i + 1}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: '#6B7280' }}>
                      {formatDate(video.date)}
                    </td>
                    <td className="px-3 py-2.5 max-w-[240px]">
                      <Link
                        href={`/video/${video.id}`}
                        className="font-medium hover:underline underline-offset-2 line-clamp-1"
                        style={{ color: '#111111' }}
                      >
                        {video.title}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span
                        className="inline-block text-xs font-semibold px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor:
                            video.angle === '전면' ? '#00462A'
                            : video.angle === '후면' ? '#374151'
                            : '#B9B9B9',
                          color: '#fff',
                        }}
                      >
                        {video.angle}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {video.participants.slice(0, 3).map((p) => (
                          <span
                            key={p}
                            className="text-xs px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: 'rgba(0,70,42,0.08)', color: '#00462A' }}
                          >
                            #{p}
                          </span>
                        ))}
                        {video.participants.length > 3 && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ color: '#B9B9B9' }}>
                            +{video.participants.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs" style={{ color: '#6B7280' }}>
                      {video.topic || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 모바일 카드형 리스트 */}
          <div className="sm:hidden divide-y" style={{ borderTop: '1px solid #e0e0e0', borderBottom: '1px solid #e0e0e0' }}>
            {videos.map((video, i) => (
              <Link
                key={video.id}
                href={`/video/${video.id}`}
                className="flex items-start gap-3 py-3 px-1"
              >
                <span className="text-xs tabular-nums pt-0.5 w-6 text-right flex-shrink-0" style={{ color: '#B9B9B9' }}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className="text-xs font-semibold px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{
                        backgroundColor:
                          video.angle === '전면' ? '#00462A'
                          : video.angle === '후면' ? '#374151'
                          : '#B9B9B9',
                        color: '#fff',
                      }}
                    >
                      {video.angle}
                    </span>
                    <span className="text-xs" style={{ color: '#B9B9B9' }}>
                      {formatDate(video.date)}
                    </span>
                  </div>
                  <p className="text-sm font-medium line-clamp-1 mb-1" style={{ color: '#111111' }}>
                    {video.title}
                  </p>
                  {video.participants.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {video.participants.slice(0, 4).map((p) => (
                        <span
                          key={p}
                          className="text-xs px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: 'rgba(0,70,42,0.08)', color: '#00462A' }}
                        >
                          #{p}
                        </span>
                      ))}
                      {video.participants.length > 4 && (
                        <span className="text-xs" style={{ color: '#B9B9B9' }}>+{video.participants.length - 4}</span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </AppLayout>
  );
}
