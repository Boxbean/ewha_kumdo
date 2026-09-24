'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Video } from '@/lib/types';
import VideoGrid from '@/components/VideoGrid';
import Pagination from '@/components/Pagination';

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

  return (
    <div>
      {search && (
        <p className="text-sm mb-3" style={{ color: '#374151' }}>
          &ldquo;<strong>{search}</strong>&rdquo; 검색 결과 — {total}개
        </p>
      )}
      {loading && videos.length === 0 ? (
        <p className="py-12 text-center text-sm tracking-widest select-none" style={{ color: '#00462A', fontFamily: 'var(--font-pretendard), sans-serif' }}>
          Loading... : ▮▮▮▮▮▮▯▯▯
        </p>
      ) : (
        <VideoGrid videos={videos} />
      )}
      <Pagination hasMore={hasMore} onLoadMore={handleLoadMore} loading={loading} />
    </div>
  );
}
