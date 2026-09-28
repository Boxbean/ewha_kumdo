'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import ShortsGrid from '@/components/ShortsGrid';
import ShortsForm from '@/components/ShortsForm';
import FloatingAddButton from '@/components/FloatingAddButton';
import ShortsViewer from '@/components/ShortsViewer';
import { Shorts } from '@/lib/types';
import PageLoading from '@/components/PageLoading';

const PAGE_SIZE = 18;
// 홈 쇼츠 줄과 같은 규칙 — 최신 2개는 등록순으로 고정하고, 나머지는 방문할 때마다 섞어서 다양한 쇼츠가 노출되게 함.
// 페이지 단위로 받아오면 페이지 안에서만 섞이므로 목록은 한 번에 받아 섞고, 화면에는 PAGE_SIZE씩 늘려가며 그림
const NEWEST_FIXED = 2;
const FETCH_ALL_LIMIT = 1000;

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ShortsPage() {
  const [allShorts, setAllShorts] = useState<Shorts[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const requestId = useRef(0);

  const fetchShorts = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const res = await fetch(`/api/shorts?limit=${FETCH_ALL_LIMIT}`);
      const json = await res.json();
      if (id !== requestId.current) return;
      const list: Shorts[] = json.data || [];
      setAllShorts([...list.slice(0, NEWEST_FIXED), ...shuffle(list.slice(NEWEST_FIXED))]);
      setVisibleCount(PAGE_SIZE);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShorts();
  }, [fetchShorts]);

  const shorts = allShorts.slice(0, visibleCount);
  const hasMore = visibleCount < allShorts.length;

  const loadMore = useCallback(() => {
    setVisibleCount((n) => n + PAGE_SIZE);
  }, []);

  // 그리드 하단 센티널이 보이면 다음 페이지 자동 로드
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMore();
    }, { rootMargin: '400px' });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loadMore, shorts.length]);

  const closeViewer = useCallback(() => setViewerIndex(null), []);

  function handleSubmitted() {
    setFormOpen(false);
    fetchShorts();
  }

  return (
    <AppLayout>
      <div>
        {loading && shorts.length === 0 ? (
          <PageLoading />
        ) : (
          <ShortsGrid shorts={shorts} onSelect={setViewerIndex} />
        )}
        <div ref={sentinelRef} style={{ height: 1 }} />
        {loading && shorts.length > 0 && (
          <p className="py-4 text-center text-xs" style={{ color: '#B9B9B9' }}>불러오는 중...</p>
        )}
      </div>

      {/* 우하단 원형 + 버튼 */}
      <FloatingAddButton label="쇼츠 등록하기" onClick={() => setFormOpen(true)} />

      {formOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/40 px-4 pb-6 sm:pb-0"
          onClick={() => setFormOpen(false)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold mb-4" style={{ color: '#00462A' }}>
              검도쇼츠 등록
            </h3>
            <ShortsForm onSuccess={handleSubmitted} onCancel={() => setFormOpen(false)} />
          </div>
        </div>
      )}

      {viewerIndex !== null && (
        <ShortsViewer
          shorts={shorts}
          startIndex={viewerIndex}
          hasMore={hasMore}
          onNeedMore={loadMore}
          onClose={closeViewer}
        />
      )}
    </AppLayout>
  );
}
