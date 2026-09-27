'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import FeedbackPostCard from '@/components/FeedbackPostCard';
import FloatingAddButton from '@/components/FloatingAddButton';
import Pagination from '@/components/Pagination';
import { FeedbackPost } from '@/lib/types';
import PageLoading from '@/components/PageLoading';

const PAGE_SIZE = 10;

export default function FeedbackPage() {
  const [posts, setPosts] = useState<FeedbackPost[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

  const hasMore = posts.length < total;

  return (
    <AppLayout>
      {/* 목록 탭과 같은 폭 */}
      <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold" style={{ color: '#00462A' }}>
          피드백 부탁드립니다! 🙏
        </h1>
        <span className="text-sm" style={{ color: '#B9B9B9' }}>
          {total}개
        </span>
      </div>

      {loading && posts.length === 0 ? (
        <PageLoading />
      ) : posts.length === 0 ? (
        <p className="text-center py-16" style={{ color: '#B9B9B9' }}>
          아직 등록된 피드백이 없습니다.
        </p>
      ) : (
        <div>
          {posts.map((post) => (
            <FeedbackPostCard key={post.id} post={post} />
          ))}
        </div>
      )}
      <Pagination hasMore={hasMore} onLoadMore={handleLoadMore} loading={loading} pageSize={PAGE_SIZE} />
      </div>

      {/* 우하단 원형 + 버튼 — 팝업 대신 별도 작성 화면으로 이동 */}
      <FloatingAddButton label="피드백 요청하기" onClick={() => router.push('/feedback/new')} />
    </AppLayout>
  );
}
