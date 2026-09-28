'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Video } from '@/lib/types';
import VideoGrid from '@/components/VideoGrid';
import Pagination from '@/components/Pagination';
import PageLoading from '@/components/PageLoading';

const PAGE_SIZE = 10;

export default function SearchResults() {
  const searchParams = useSearchParams();
  const search = (searchParams.get('q') || '').trim();

  const [videos, setVideos] = useState<Video[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchVideos = useCallback(
    async (offset: number, append: boolean, signal?: AbortSignal) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset), search });
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

  // 검색어 변경 시 초기화 — 이전 요청 취소
  useEffect(() => {
    const controller = new AbortController();
    fetchVideos(0, false, controller.signal);
    return () => controller.abort();
  }, [fetchVideos]);

  if (loading && videos.length === 0) return <PageLoading />;

  return (
    <div>
      <p className="text-sm mb-3" style={{ color: '#374151' }}>
        &ldquo;<strong>{search}</strong>&rdquo; 검색 결과 — {total}개
      </p>
      <VideoGrid videos={videos} autoplay />
      <Pagination hasMore={videos.length < total} onLoadMore={() => fetchVideos(videos.length, true)} loading={loading} />
    </div>
  );
}
