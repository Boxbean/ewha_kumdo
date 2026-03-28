'use client';

import { useEffect, useState } from 'react';
import { Video } from '@/lib/types';
import { formatDate, extractYouTubeId, getYouTubeThumbnail } from '@/lib/utils';
import AngleBadge from './AngleBadge';
import VideoForm from './VideoForm';
import Pagination from './Pagination';
import Image from 'next/image';

const PAGE_SIZE = 50;

export default function AdminVideoList() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function fetchVideos(currentOffset = 0, append = false) {
    if (append) { setLoadingMore(true); } else { setLoading(true); }
    const res = await fetch(`/api/videos?limit=${PAGE_SIZE}&offset=${currentOffset}`);
    const json = await res.json();
    setVideos((prev) => append ? [...prev, ...(json.data || [])] : (json.data || []));
    setTotal(json.count || 0);
    if (append) { setLoadingMore(false); } else { setLoading(false); }
  }

  useEffect(() => { fetchVideos(0, false); }, []);

  async function handleDelete(id: string) {
    if (!confirm('이 영상을 삭제하시겠습니까?')) return;
    await fetch(`/api/videos/${id}`, { method: 'DELETE' });
    setVideos((prev) => prev.filter((v) => v.id !== id));
    setTotal((t) => t - 1);
  }

  function handleLoadMore() {
    const next = offset + PAGE_SIZE;
    setOffset(next);
    fetchVideos(next, true);
  }

  if (loading) {
    return <p className="text-sm py-4" style={{ color: '#B9B9B9' }}>로딩 중...</p>;
  }

  if (videos.length === 0) {
    return <p className="text-sm py-4" style={{ color: '#B9B9B9' }}>등록된 영상이 없습니다.</p>;
  }

  const hasMore = videos.length < total;

  return (
    <div>
      <p className="text-xs mb-3" style={{ color: '#B9B9B9' }}>
        총 {total}개 중 {videos.length}개 표시
      </p>
      <div className="space-y-3">
        {videos.map((video) => {
          const videoId = extractYouTubeId(video.youtube_url);
          const thumbnail = videoId ? getYouTubeThumbnail(videoId) : null;

          return (
            <div
              key={video.id}
              className="rounded-lg border p-3"
              style={{ borderColor: '#e0e0e0', backgroundColor: '#ffffff' }}
            >
              {editingId === video.id ? (
                <div>
                  <VideoForm
                    initial={video}
                    onSuccess={() => { setEditingId(null); fetchVideos(0, false); setOffset(0); }}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : (
                <div className="flex gap-3 items-start">
                  {thumbnail && (
                    <div className="relative flex-shrink-0 rounded overflow-hidden" style={{ width: 80, height: 60 }}>
                      <Image src={thumbnail} alt={video.title} fill className="object-cover" unoptimized />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <AngleBadge angle={video.angle} />
                      <p className="text-sm font-semibold truncate" style={{ color: '#111111' }}>
                        {video.title}
                      </p>
                    </div>
                    <p className="text-xs" style={{ color: '#B9B9B9' }}>{formatDate(video.date)}</p>
                    {video.participants.length > 0 && (
                      <p className="text-xs mt-0.5" style={{ color: '#374151' }}>
                        {video.participants.map((p) => `#${p}`).join(' ')}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button
                      onClick={() => setEditingId(video.id)}
                      className="h-7 px-2.5 text-xs rounded border"
                      style={{ borderColor: '#00462A', color: '#00462A' }}
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(video.id)}
                      className="h-7 px-2.5 text-xs rounded border"
                      style={{ borderColor: '#ef4444', color: '#ef4444' }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <Pagination hasMore={hasMore} onLoadMore={handleLoadMore} loading={loadingMore} />
    </div>
  );
}
