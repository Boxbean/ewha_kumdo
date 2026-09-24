'use client';

import { useCallback, useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import ShortsGrid from '@/components/ShortsGrid';
import ShortsForm from '@/components/ShortsForm';
import Pagination from '@/components/Pagination';
import { Shorts } from '@/lib/types';

const PAGE_SIZE = 12;

export default function ShortsPage() {
  const [shorts, setShorts] = useState<Shorts[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const fetchShorts = useCallback(async (currentOffset: number, append = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(currentOffset) });
      const res = await fetch(`/api/shorts?${params.toString()}`);
      const json = await res.json();
      setShorts((prev) => (append ? [...prev, ...(json.data || [])] : json.data || []));
      setTotal(json.count || 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShorts(0, false);
  }, [fetchShorts]);

  function handleLoadMore() {
    const next = offset + PAGE_SIZE;
    setOffset(next);
    fetchShorts(next, true);
  }

  function handleSubmitted() {
    setFormOpen(false);
    setOffset(0);
    fetchShorts(0, false);
  }

  const hasMore = shorts.length < total;

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold" style={{ color: '#00462A' }}>
          검도쇼츠
        </h1>
        <span className="text-sm" style={{ color: '#B9B9B9' }}>
          {total}개
        </span>
      </div>

      {loading && shorts.length === 0 ? (
        <p className="py-12 text-center text-sm tracking-widest select-none" style={{ color: '#00462A', fontFamily: 'var(--font-pretendard), sans-serif' }}>
          Loading... : ▮▮▮▮▮▮▯▯▯
        </p>
      ) : (
        <ShortsGrid shorts={shorts} />
      )}
      <Pagination hasMore={hasMore} onLoadMore={handleLoadMore} loading={loading} pageSize={PAGE_SIZE} />

      {/* 우하단 원형 + 버튼 */}
      <button
        onClick={() => setFormOpen(true)}
        aria-label="쇼츠 등록하기"
        className="fixed z-40 flex items-center justify-center rounded-full shadow-lg"
        style={{
          width: '52px',
          height: '52px',
          right: '1rem',
          bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))',
          backgroundColor: '#00462A',
          color: '#ffffff',
          fontSize: '28px',
          lineHeight: 1,
        }}
      >
        +
      </button>

      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-6 sm:pb-0"
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
    </AppLayout>
  );
}
