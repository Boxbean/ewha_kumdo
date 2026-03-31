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
  const [loading, setLoading] = useState(true);
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

  // 참가자 목록 (전체) — 최근 업로드된 영상 기준 정렬
  useEffect(() => {
    fetch('/api/participants')
      .then((r) => r.json())
      .then((json) => {
        const rows: Pick<Video, 'participants' | 'date'>[] = json.data || [];
        const latestDate: Record<string, string> = {};
        rows.forEach((v) => {
          v.participants.forEach((p) => {
            if (!latestDate[p] || v.date > latestDate[p]) {
              latestDate[p] = v.date;
            }
          });
        });
        const sorted = Object.keys(latestDate).sort(
          (a, b) => latestDate[b].localeCompare(latestDate[a])
        );
        setAllParticipants(sorted);
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
      {loading && videos.length === 0 ? (
        <p className="py-12 text-center text-sm tracking-widest select-none" style={{ color: '#00462A', fontFamily: "'Pretendard', sans-serif" }}>
          Loading... : ▮▮▮▮▮▮▯▯▯
        </p>
      ) : (
        <VideoGrid videos={videos} />
      )}
      <Pagination hasMore={hasMore} onLoadMore={handleLoadMore} loading={loading} />
    </div>
  );
}
