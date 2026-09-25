'use client';

import { useEffect, useState } from 'react';
import { Shorts } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { adminFetch } from '@/lib/adminClient';
import Pagination from './Pagination';

const PAGE_SIZE = 50;

const PLATFORM_LABEL: Record<Shorts['platform'], string> = {
  youtube: '▶ YouTube',
  instagram: '📷 Instagram',
  other: '🔗 링크',
};

export default function AdminShortsList() {
  const [shorts, setShorts] = useState<Shorts[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  async function fetchShorts(currentOffset = 0, append = false) {
    if (append) { setLoadingMore(true); } else { setLoading(true); }
    const res = await fetch(`/api/shorts?limit=${PAGE_SIZE}&offset=${currentOffset}`);
    const json = await res.json();
    setShorts((prev) => (append ? [...prev, ...(json.data || [])] : json.data || []));
    setTotal(json.count || 0);
    if (append) { setLoadingMore(false); } else { setLoading(false); }
  }

  useEffect(() => { fetchShorts(0, false); }, []);

  async function handleDelete(id: string) {
    if (!confirm('이 쇼츠를 삭제하시겠습니까?')) return;
    const res = await adminFetch(`/api/shorts/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      alert('삭제에 실패했습니다.');
      return;
    }
    setOffset(0);
    fetchShorts(0, false);
  }

  function handleLoadMore() {
    const next = offset + PAGE_SIZE;
    setOffset(next);
    fetchShorts(next, true);
  }

  if (loading) {
    return <p className="text-sm py-4" style={{ color: '#B9B9B9' }}>로딩 중...</p>;
  }

  if (shorts.length === 0) {
    return <p className="text-sm py-4" style={{ color: '#B9B9B9' }}>등록된 쇼츠가 없습니다.</p>;
  }

  const hasMore = shorts.length < total;

  return (
    <div>
      <p className="text-xs mb-3" style={{ color: '#B9B9B9' }}>
        총 {total}개 중 {shorts.length}개 표시
      </p>
      <div className="space-y-3">
        {shorts.map((s) => (
          <div
            key={s.id}
            className="rounded-lg border p-3 flex gap-3 items-start"
            style={{ borderColor: '#e0e0e0', backgroundColor: '#ffffff' }}
          >
            {s.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={s.thumbnail_url}
                alt={s.title}
                referrerPolicy="no-referrer"
                onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                className="flex-shrink-0 rounded object-cover"
                style={{ width: 60, height: 80 }}
              />
            ) : (
              <div
                className="flex-shrink-0 rounded flex items-center justify-center text-lg"
                style={{ width: 60, height: 80, backgroundColor: '#e0e0e0', color: '#B9B9B9' }}
              >
                🎬
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span
                  className="text-xs font-semibold px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{ backgroundColor: 'rgba(0,70,42,0.08)', color: '#00462A' }}
                >
                  {PLATFORM_LABEL[s.platform]}
                </span>
              </div>
              <p className="text-sm font-semibold truncate" style={{ color: '#111111' }}>
                {s.title}
              </p>
              <p className="text-xs" style={{ color: '#B9B9B9' }}>
                {formatDate(s.created_at.slice(0, 10))}
                {s.submitter_name && ` · ${s.submitter_name}`}
              </p>
            </div>
            <button
              onClick={() => handleDelete(s.id)}
              className="h-7 px-2.5 text-xs rounded border flex-shrink-0"
              style={{ borderColor: '#ef4444', color: '#ef4444' }}
            >
              삭제
            </button>
          </div>
        ))}
      </div>
      <Pagination hasMore={hasMore} onLoadMore={handleLoadMore} loading={loadingMore} pageSize={PAGE_SIZE} />
    </div>
  );
}
