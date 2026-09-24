'use client';

import { useEffect, useState } from 'react';
import { FeedbackPost } from '@/lib/types';
import { formatTimestamp } from '@/lib/utils';
import { adminFetch } from '@/lib/adminClient';
import Pagination from './Pagination';

const PAGE_SIZE = 50;

export default function AdminFeedbackList() {
  const [posts, setPosts] = useState<FeedbackPost[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  async function fetchPosts(currentOffset = 0, append = false) {
    if (append) { setLoadingMore(true); } else { setLoading(true); }
    const res = await fetch(`/api/feedback?limit=${PAGE_SIZE}&offset=${currentOffset}`);
    const json = await res.json();
    setPosts((prev) => (append ? [...prev, ...(json.data || [])] : json.data || []));
    setTotal(json.count || 0);
    if (append) { setLoadingMore(false); } else { setLoading(false); }
  }

  useEffect(() => { fetchPosts(0, false); }, []);

  async function handleDelete(id: string) {
    if (!confirm('이 피드백 게시글을 삭제하시겠습니까? 댓글도 함께 삭제됩니다.')) return;
    const res = await adminFetch(`/api/feedback/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      alert('삭제에 실패했습니다.');
      return;
    }
    setOffset(0);
    fetchPosts(0, false);
  }

  function handleLoadMore() {
    const next = offset + PAGE_SIZE;
    setOffset(next);
    fetchPosts(next, true);
  }

  if (loading) {
    return <p className="text-sm py-4" style={{ color: '#B9B9B9' }}>로딩 중...</p>;
  }

  if (posts.length === 0) {
    return <p className="text-sm py-4" style={{ color: '#B9B9B9' }}>등록된 피드백이 없습니다.</p>;
  }

  const hasMore = posts.length < total;

  return (
    <div>
      <p className="text-xs mb-3" style={{ color: '#B9B9B9' }}>
        총 {total}개 중 {posts.length}개 표시
      </p>
      <div className="space-y-3">
        {posts.map((post) => {
          const videoTitle = post.video_type === 'video' ? post.video?.title : post.shorts?.title;
          return (
            <div
              key={post.id}
              className="rounded-lg border p-3"
              style={{ borderColor: '#e0e0e0', backgroundColor: '#ffffff' }}
            >
              <div className="flex gap-3 items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="text-xs font-semibold px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{ backgroundColor: 'rgba(0,70,42,0.08)', color: '#00462A' }}
                    >
                      {formatTimestamp(post.timestamp_seconds)}
                    </span>
                    {videoTitle && (
                      <span className="text-xs truncate" style={{ color: '#B9B9B9' }}>
                        {videoTitle}
                      </span>
                    )}
                  </div>
                  <p className="text-sm line-clamp-2 mb-1" style={{ color: '#111111' }}>
                    {post.body}
                  </p>
                  <p className="text-xs" style={{ color: '#B9B9B9' }}>
                    {post.author_name || '익명'} · 댓글 {post.comment_count ?? 0}개
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(post.id)}
                  className="h-7 px-2.5 text-xs rounded border flex-shrink-0"
                  style={{ borderColor: '#ef4444', color: '#ef4444' }}
                >
                  삭제
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <Pagination hasMore={hasMore} onLoadMore={handleLoadMore} loading={loadingMore} pageSize={PAGE_SIZE} />
    </div>
  );
}
