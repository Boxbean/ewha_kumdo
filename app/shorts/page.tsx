'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import ShortsGrid from '@/components/ShortsGrid';
import ShortsForm from '@/components/ShortsForm';
import FloatingAddButton from '@/components/FloatingAddButton';
import ShortsViewer from '@/components/ShortsViewer';
import { Shorts } from '@/lib/types';

const PAGE_SIZE = 18;

export default function ShortsPage() {
  const [shorts, setShorts] = useState<Shorts[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const requestId = useRef(0);
  const loadingRef = useRef(false);
  const lengthRef = useRef(0);
  lengthRef.current = shorts.length;

  const fetchShorts = useCallback(async (offset: number, append: boolean, query: string) => {
    const id = ++requestId.current;
    loadingRef.current = true;
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
      if (query) params.set('search', query);
      const res = await fetch(`/api/shorts?${params.toString()}`);
      const json = await res.json();
      if (id !== requestId.current) return;
      setShorts((prev) => (append ? [...prev, ...(json.data || [])] : json.data || []));
      setTotal(json.count || 0);
    } finally {
      if (id === requestId.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, []);

  // 검색어 변경 시 300ms 디바운스 후 재조회
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    fetchShorts(0, false, search);
  }, [fetchShorts, search]);

  const hasMore = shorts.length < total;

  const loadMore = useCallback(() => {
    if (loadingRef.current) return;
    fetchShorts(lengthRef.current, true, search);
  }, [fetchShorts, search]);

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
    fetchShorts(0, false, search);
  }

  return (
    <AppLayout>
      {/* 상단 검색창 */}
      <div className="sticky top-[52px] z-30 -mx-4 md:-mx-6 px-4 md:px-6 py-2" style={{ backgroundColor: '#ffffff' }}>
        <div
          className="flex items-center gap-2 h-9 px-3 rounded-lg"
          style={{ backgroundColor: '#efefef' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8e8e8e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="검색"
            className="flex-1 min-w-0 bg-transparent text-sm focus:outline-none"
            style={{ color: '#111' }}
          />
        </div>
      </div>

      <div className="-mx-4 md:mx-0">
        {loading && shorts.length === 0 ? (
          <p className="py-12 text-center text-sm tracking-widest select-none" style={{ color: '#00462A', fontFamily: 'var(--font-pretendard), sans-serif' }}>
            Loading... : ▮▮▮▮▮▮▯▯▯
          </p>
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
