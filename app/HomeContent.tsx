'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Video } from '@/lib/types';
import VideoGrid from '@/components/VideoGrid';
import Pagination from '@/components/Pagination';
import HomeHero from '@/components/HomeHero';
import HomeShortsRow from '@/components/HomeShortsRow';
import { formatDate } from '@/lib/utils';

const PAGE_SIZE = 10;

export default function HomeContent() {
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';

  const [videos, setVideos] = useState<Video[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchVideos = useCallback(
    async (currentOffset: number, append = false, signal?: AbortSignal) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: String(currentOffset),
        });
        if (search) params.set('search', search);

        const res = await fetch(`/api/videos?${params.toString()}`, { signal });
        const json = await res.json();
        setVideos((prev) => (append ? [...prev, ...(json.data || [])] : json.data || []));
        setTotal(json.count || 0);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') throw err;
      } finally {
        setLoading(false);
      }
    },
    [search]
  );

  // 필터 변경 시 초기화 — 이전 요청 취소
  useEffect(() => {
    const controller = new AbortController();
    setOffset(0);
    fetchVideos(0, false, controller.signal);
    return () => controller.abort();
  }, [fetchVideos]);

  function handleLoadMore() {
    const next = offset + PAGE_SIZE;
    setOffset(next);
    fetchVideos(next, true);
  }

  const hasMore = videos.length < total;

  if (loading && videos.length === 0) {
    return (
      <p className="py-12 text-center text-sm tracking-widest select-none" style={{ color: '#00462A', fontFamily: 'var(--font-pretendard), sans-serif' }}>
        Loading... : ▮▮▮▮▮▮▯▯▯
      </p>
    );
  }

  // 검색 결과는 기존처럼 평평한 그리드로
  if (search) {
    return (
      <div>
        <p className="text-sm mb-3" style={{ color: '#374151' }}>
          &ldquo;<strong>{search}</strong>&rdquo; 검색 결과 — {total}개
        </p>
        <VideoGrid videos={videos} autoplay />
        <Pagination hasMore={hasMore} onLoadMore={handleLoadMore} loading={loading} />
      </div>
    );
  }

  if (videos.length === 0) return <VideoGrid videos={[]} />;

  // 가장 최근 운동(첫 영상과 같은 날짜)은 상단 히어로로, 나머지는 운동 날짜별로 묶어서 표시
  const heroDate = videos[0]?.date;
  const heroVideos = videos.filter((v) => v.date === heroDate);
  const groups = groupByDate(videos.filter((v) => v.date !== heroDate));

  return (
    <div>
      {heroVideos.length > 0 && <HomeHero videos={heroVideos} />}
      <HomeShortsRow />

      <div className="space-y-6">
        {groups.map((g, i) => (
          <section key={g.date}>
            <div className="flex items-baseline gap-2 mb-2">
              <h2 className="text-sm font-bold" style={{ color: '#111' }}>
                {formatDate(g.date)}
              </h2>
              {g.label && (
                <span className="text-xs truncate" style={{ color: '#6B7280' }}>
                  {g.label}
                </span>
              )}
            </div>
            <VideoGrid videos={g.videos} autoplay priorityCount={i === 0 ? 2 : 0} />
          </section>
        ))}
      </div>
      <Pagination hasMore={hasMore} onLoadMore={handleLoadMore} loading={loading} />
    </div>
  );
}

interface DateGroup {
  date: string;
  label: string;
  videos: Video[];
}

// API는 "최근 등록 영상 → 나머지 날짜순"으로 내려주므로 같은 날짜가 떨어져 있을 수 있어,
// 처음 등장한 순서를 유지하면서 날짜별로 합침
function groupByDate(videos: Video[]): DateGroup[] {
  const map = new Map<string, Video[]>();
  for (const v of videos) {
    const list = map.get(v.date);
    if (list) list.push(v);
    else map.set(v.date, [v]);
  }
  return [...map.entries()].map(([date, list]) => {
    // 그룹 제목 옆 설명: 대회명 우선, 없으면 주제 (중복 제거)
    const labels = [...new Set(list.map((v) => v.competition?.name || v.topic).filter(Boolean))];
    return { date, label: labels.join(' · '), videos: list };
  });
}
