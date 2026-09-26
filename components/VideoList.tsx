'use client';

import { useState } from 'react';
import { Video } from '@/lib/types';
import Pagination from './Pagination';
import VideoListRow from './VideoListRow';

interface Props {
  initialVideos: Video[];
  total: number;
  pageSize: number;
}

// 목록 탭: 첫 10개는 서버에서 받아 바로 그리고, 이후는 버튼으로 10개씩 추가 로딩 (운동 날짜 최신순)
export default function VideoList({ initialVideos, total, pageSize }: Props) {
  const [videos, setVideos] = useState(initialVideos);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ order: 'date', limit: String(pageSize), offset: String(videos.length) });
      const res = await fetch(`/api/videos?${params.toString()}`);
      const json = await res.json();
      const next: Video[] = json.data || [];
      // 그 사이 새 영상이 등록돼 구간이 밀려도 중복으로 보이지 않도록 id 기준으로 걸러냄
      setVideos((prev) => [...prev, ...next.filter((v) => !prev.some((p) => p.id === v.id))]);
    } finally {
      setLoading(false);
    }
  }

  if (videos.length === 0) {
    return (
      <p className="text-center py-16" style={{ color: '#B9B9B9' }}>
        등록된 영상이 없습니다.
      </p>
    );
  }

  return (
    <div>
      {videos.map((v) => (
        <VideoListRow key={v.id} video={v} />
      ))}
      <Pagination hasMore={videos.length < total} onLoadMore={loadMore} loading={loading} pageSize={pageSize} />
    </div>
  );
}
