'use client';

import { useState } from 'react';
import { Shorts, Video } from '@/lib/types';
import VideoGrid from '@/components/VideoGrid';
import Pagination from '@/components/Pagination';
import HomeHero from '@/components/HomeHero';
import HomeShortsRow from '@/components/HomeShortsRow';
import SectionTitle from '@/components/SectionTitle';
import { formatDate } from '@/lib/utils';

interface Props {
  // 첫 페이지는 서버(app/page.tsx)에서 받아오고, 이후 "더 불러오기"만 클라이언트에서 /api/videos 호출
  initialVideos: Video[];
  total: number;
  pageSize: number;
  shorts: Shorts[];
}

export default function HomeContent({ initialVideos, total: initialTotal, pageSize, shorts }: Props) {
  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);

  async function handleLoadMore() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(pageSize), offset: String(videos.length) });
      const res = await fetch(`/api/videos?${params.toString()}`);
      const json = await res.json();
      setVideos((prev) => [...prev, ...(json.data || [])]);
      setTotal(json.count || 0);
    } finally {
      setLoading(false);
    }
  }

  const hasMore = videos.length < total;

  if (videos.length === 0) return <VideoGrid videos={[]} />;

  // 가장 최근 운동(첫 영상과 같은 날짜)은 상단 히어로로, 나머지는 운동 날짜별로 묶어서 표시
  const heroDate = videos[0]?.date;
  const heroVideos = videos.filter((v) => v.date === heroDate);
  const groups = groupByDate(videos.filter((v) => v.date !== heroDate));

  return (
    <div>
      {heroVideos.length > 0 && <HomeHero videos={heroVideos} />}
      <HomeShortsRow shorts={shorts} />

      <div className="space-y-6">
        {groups.map((g, i) => (
          <section key={g.date}>
            <div className="mb-2">
              <SectionTitle sub={g.label || undefined}>{formatDate(g.date)}</SectionTitle>
            </div>
            <VideoGrid videos={g.videos} autoplay priorityCount={i === 0 ? 2 : 0} />
          </section>
        ))}
      </div>
      <Pagination hasMore={hasMore} onLoadMore={handleLoadMore} loading={loading} />
    </div>
  );
}

interface DateGroup {
  date: string;
  label: string;
  videos: Video[];
}

// API는 "최근 등록 영상 → 나머지 날짜순"으로 내려주므로 같은 날짜가 떨어져 있을 수 있어,
// 처음 등장한 순서를 유지하면서 날짜별로 합침
function groupByDate(videos: Video[]): DateGroup[] {
  const map = new Map<string, Video[]>();
  for (const v of videos) {
    const list = map.get(v.date);
    if (list) list.push(v);
    else map.set(v.date, [v]);
  }
  return [...map.entries()].map(([date, list]) => {
    // 그룹 제목 옆 설명: 대회명 우선, 없으면 주제 (중복 제거)
    const labels = [...new Set(list.map((v) => v.competition?.name || v.topic).filter(Boolean))];
    return { date, label: labels.join(' · '), videos: list };
  });
}
