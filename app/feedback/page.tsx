'use client';

import { useCallback, useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import FeedbackPostCard from '@/components/FeedbackPostCard';
import FeedbackForm from '@/components/FeedbackForm';
import FloatingAddButton from '@/components/FloatingAddButton';
import Pagination from '@/components/Pagination';
import { FeedbackPost } from '@/lib/types';

const PAGE_SIZE = 10;

export default function FeedbackPage() {
  const [posts, setPosts] = useState<FeedbackPost[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const fetchPosts = useCallback(async (currentOffset: number, append = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(currentOffset) });
      const res = await fetch(`/api/feedback?${params.toString()}`);
      const json = await res.json();
      setPosts((prev) => (append ? [...prev, ...(json.data || [])] : json.data || []));
      setTotal(json.count || 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(0, false);
  }, [fetchPosts]);

  function handleLoadMore() {
    const next = offset + PAGE_SIZE;
    setOffset(next);
    fetchPosts(next, true);
  }

  function handleSubmitted() {
    setFormOpen(false);
    setOffset(0);
    fetchPosts(0, false);
  }

  const hasMore = posts.length < total;

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold" style={{ color: '#00462A' }}>
          피드백
        </h1>
        <span className="text-sm" style={{ color: '#B9B9B9' }}>
          {total}개
        </span>
      </div>

      {loading && posts.length === 0 ? (
        <p className="py-12 text-center text-sm tracking-widest select-none" style={{ color: '#00462A', fontFamily: 'var(--font-pretendard), sans-serif' }}>
          Loading... : ▮▮▮▮▮▮▯▯▯
        </p>
      ) : posts.length === 0 ? (
        <p className="text-center py-16" style={{ color: '#B9B9B9' }}>
          아직 등록된 피드백이 없습니다.
        </p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <FeedbackPostCard key={post.id} post={post} />
          ))}
        </div>
      )}
      <Pagination hasMore={hasMore} onLoadMore={handleLoadMore} loading={loading} pageSize={PAGE_SIZE} />

      {/* 우하단 원형 + 버튼 */}
      <FloatingAddButton label="피드백 남기기" onClick={() => setFormOpen(true)} />

      {formOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/40 px-4 pb-6 sm:pb-0"
          onClick={() => setFormOpen(false)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl overflow-y-auto"
            style={{ maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold mb-4" style={{ color: '#00462A' }}>
              피드백 요청하기
            </h3>
            <FeedbackForm onSuccess={handleSubmitted} onCancel={() => setFormOpen(false)} />
          </div>
        </div>
      )}
    </AppLayout>
  );
}
