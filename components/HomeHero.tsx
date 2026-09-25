'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Video } from '@/lib/types';
import { extractYouTubeId, formatDate, formatTimestamp } from '@/lib/utils';
import YouTubePlayer, { YouTubePlayerHandle } from './YouTubePlayer';

interface Props {
  // 같은 날짜(한 번의 운동)의 영상들 — 전면/후면 등을 탭으로 전환
  videos: Video[];
}

// 홈 최상단: 가장 최근 운동 영상을 크게 두고 페이지 이동 없이 바로 재생
export default function HomeHero({ videos }: Props) {
  const [index, setIndex] = useState(0);
  // 와이파이(또는 유선) 연결이 확인될 때만 음소거 자동재생 — 첫 렌더는 썸네일로 그려 초기 로딩을 가볍게 유지
  const [autoplay, setAutoplay] = useState<boolean | null>(null);
  const playerRef = useRef<YouTubePlayerHandle>(null);

  useEffect(() => {
    // 연결 종류를 알려주지 않는 브라우저(아이폰 Safari, 데스크톱 등)는 모바일 데이터일 수도 있으므로 자동재생하지 않음
    const connection = (navigator as Navigator & { connection?: { type?: string } }).connection;
    setAutoplay(connection?.type === 'wifi' || connection?.type === 'ethernet');
  }, []);

  const video = videos[index] ?? videos[0];
  const videoId = extractYouTubeId(video.youtube_url);
  const chapters = video.chapters || [];
  if (!videoId) return null;

  // 같은 앵글이 여러 개면 번호를 붙여 탭 이름이 겹치지 않게 함
  const tabLabels = videos.map((v, i) => {
    const same = videos.filter((x) => x.angle === v.angle);
    return same.length > 1 ? `${v.angle} ${same.indexOf(v) + 1}` : v.angle;
  });

  return (
    // 데스크톱에서 화면을 가득 채우지 않도록 상세 페이지와 같은 폭으로 제한
    <section className="mb-6 max-w-3xl">
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <h2 className="text-base font-bold" style={{ color: '#00462A' }}>
          최근 운동
        </h2>
        <span className="text-xs" style={{ color: '#6B7280' }}>
          {formatDate(video.date)}
        </span>
      </div>

      <div className="relative w-full rounded-lg overflow-hidden" style={{ aspectRatio: '16/9', backgroundColor: '#000' }}>
        {autoplay === null ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
            alt={video.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <YouTubePlayer
            key={video.id}
            ref={playerRef}
            videoId={videoId}
            startSeconds={chapters[0]?.seconds ?? 0}
            autoplayMuted={autoplay}
          />
        )}
      </div>

      {videos.length > 1 && (
        <div className="flex gap-1.5 mt-2">
          {videos.map((v, i) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setIndex(i)}
              className="h-8 px-3 text-xs font-semibold rounded-full border"
              style={
                i === index
                  ? { backgroundColor: '#00462A', borderColor: '#00462A', color: '#fff' }
                  : { borderColor: '#e0e0e0', color: '#374151', backgroundColor: '#fff' }
              }
            >
              {tabLabels[i]}
            </button>
          ))}
        </div>
      )}

      {chapters.length > 0 && (
        <div className="flex gap-2 overflow-x-auto mt-2 pb-1 -mx-1 px-1">
          {chapters.map((c) => (
            <button
              key={`${c.seconds}-${c.label}`}
              type="button"
              onClick={() => playerRef.current?.seekTo(c.seconds)}
              className="flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border hover:opacity-80"
              style={{ borderColor: '#00462A', color: '#00462A', backgroundColor: '#fff' }}
            >
              <span className="font-semibold">{c.label}</span>
              <span style={{ color: '#6B7280' }}>{formatTimestamp(c.seconds)}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mt-2">
        <p className="text-sm font-semibold truncate" style={{ color: '#111' }}>
          {video.title}
        </p>
        <Link href={`/video/${video.id}`} className="flex-shrink-0 text-xs" style={{ color: '#6B7280' }}>
          자세히 ›
        </Link>
      </div>
    </section>
  );
}
