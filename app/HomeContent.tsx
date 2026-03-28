'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Video } from '@/lib/types';
import VideoGrid from '@/components/VideoGrid';
import FilterBar from '@/components/FilterBar';
import Pagination from '@/components/Pagination';

const PAGE_SIZE = 10;

export default function HomeContent() {
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';
  const angle = searchParams.get('angle') || '';
  const participant = searchParams.get('participant') || '';

  const [videos, setVideos] = useState<Video[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [allParticipants, setAllParticipants] = useState<string[]>([]);

  const fetchVideos = useCallback(
    async (currentOffset: number, append = false) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: String(currentOffset),
        });
        if (search) params.set('search', search);
        if (angle) params.set('angle', angle);
        if (participant) params.set('participant', participant);

        const res = await fetch(`/api/videos?${params.toString()}`);
        const json = await res.json();
        setVideos((prev) => (append ? [...prev, ...(json.data || [])] : json.data || []));
        setTotal(json.count || 0);
      } finally {
        setLoading(false);
      }
    },
    [search, angle, participant]
  );

  // 필터 변경 시 초기화
  useEffect(() => {
    setOffset(0);
    fetchVideos(0, false);
  }, [fetchVideos]);

  // 참가자 목록 (전체) — 필터 칩용
  useEffect(() => {
    fetch('/api/videos?limit=200')
      .then((r) => r.json())
      .then((json) => {
        const rows: Video[] = json.data || [];
        const set = new Set<string>();
        rows.forEach((v) => v.participants.forEach((p) => set.add(p)));
        setAllParticipants(Array.from(set).sort());
      });
  }, []);

  function handleLoadMore() {
    const next = offset + PAGE_SIZE;
    setOffset(next);
    fetchVideos(next, true);
  }

  const hasMore = videos.length < total;

  return (
    <div>
      <FilterBar
        participants={allParticipants}
        currentAngle={angle}
        currentParticipant={participant}
      />
      {search && (
        <p className="text-sm mb-3" style={{ color: '#374151' }}>
          &ldquo;<strong>{search}</strong>&rdquo; 검색 결과 — {total}개
        </p>
      )}
      <VideoGrid videos={videos} />
      <Pagination hasMore={hasMore} onLoadMore={handleLoadMore} loading={loading} />
    </div>
  );
}
