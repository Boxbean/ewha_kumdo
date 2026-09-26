'use client';

import { RefObject, useEffect, useRef, useState } from 'react';
import { Video } from '@/lib/types';
import { extractYouTubeId, formatDate, formatDuration, formatTimestamp } from '@/lib/utils';
import YouTubePlayer, { YouTubePlayerHandle } from './YouTubePlayer';
import SectionTitle from './SectionTitle';
import VideoMoreMenu from './VideoMoreMenu';
import { useYouTubeDuration } from '@/lib/useYouTubeDuration';

interface Props {
  // 같은 날짜(한 번의 운동)의 영상들 — 전면/후면 등을 탭으로 전환
  videos: Video[];
}

// 홈 최상단: 가장 최근 운동 영상을 유튜브 롱폼 카드처럼 꽉 찬 썸네일로 보여주고, 페이지 이동 없이 바로 재생
export default function HomeHero({ videos }: Props) {
  const [index, setIndex] = useState(0);
  // 와이파이(또는 유선) 연결이 확인될 때만 음소거 자동재생
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
  const tabLabels = videos.map((v) => {
    const same = videos.filter((x) => x.angle === v.angle);
    return same.length > 1 ? `${v.angle} ${same.indexOf(v) + 1}` : v.angle;
  });
  const meta = ['EWHA Kumdo', video.competition?.name || video.topic, formatDate(video.date)].filter(Boolean).join(' · ');

  return (
    // 모바일에서는 본문 좌우 여백(p-4)을 상쇄해 화면 폭에 꽉 차게, 데스크톱은 상세 페이지와 같은 폭으로 제한
    <section className="mb-6 -mx-4 md:mx-0 md:max-w-3xl">
      <div className="px-4 md:px-0 mb-2">
        <SectionTitle>최근 운동</SectionTitle>
      </div>

      <HeroPlayer
        key={video.id}
        videoId={videoId}
        title={video.title}
        startSeconds={chapters[0]?.seconds ?? 0}
        autoplay={autoplay}
        playerRef={playerRef}
      />

      {/* 유튜브 롱폼 카드 하단: 채널 프로필 · 제목 · 메타 · 더보기 */}
      <div className="flex gap-3 px-4 md:px-0 mt-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="EWHA Kumdo"
          className="flex-shrink-0 w-9 h-9 rounded-full object-contain p-1"
          style={{ backgroundColor: '#f3f4f6' }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold leading-snug line-clamp-2" style={{ color: '#111' }}>
            {video.title}
          </p>
          <p className="text-xs mt-0.5 truncate" style={{ color: '#6B7280' }}>
            {meta}
          </p>
        </div>
        <VideoMoreMenu videoPath={`/video/${video.id}`} youtubeUrl={video.youtube_url} title={video.title} />
      </div>

      {(videos.length > 1 || chapters.length > 0) && (
        <div className="flex gap-1.5 overflow-x-auto px-4 md:px-0 mt-3 pb-1 scroll-px-4 md:scroll-px-0">
          {videos.length > 1 &&
            videos.map((v, i) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setIndex(i)}
                className="flex-shrink-0 h-8 px-3 text-xs font-semibold rounded-full border"
                style={
                  i === index
                    ? { backgroundColor: '#00462A', borderColor: '#00462A', color: '#fff' }
                    : { borderColor: '#e0e0e0', color: '#374151', backgroundColor: '#fff' }
                }
              >
                {tabLabels[i]}
              </button>
            ))}
          {chapters.map((c) => (
            <button
              key={`${c.seconds}-${c.label}`}
              type="button"
              onClick={() => playerRef.current?.seekTo(c.seconds)}
              className="flex-shrink-0 flex items-center gap-1.5 h-8 text-xs px-3 rounded-full border hover:opacity-80"
              style={{ borderColor: '#00462A', color: '#00462A', backgroundColor: '#fff' }}
            >
              <span className="font-semibold">{c.label}</span>
              <span style={{ color: '#6B7280' }}>{formatTimestamp(c.seconds)}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function HeroPlayer({
  videoId, title, startSeconds, autoplay, playerRef,
}: {
  videoId: string;
  title: string;
  startSeconds: number;
  autoplay: boolean | null;
  playerRef: RefObject<YouTubePlayerHandle>;
}) {
  const [playing, setPlaying] = useState(false);
  const duration = useYouTubeDuration(videoId);

  return (
    <div className="relative w-full md:rounded-lg overflow-hidden" style={{ aspectRatio: '16/9', backgroundColor: '#000' }}>
      {autoplay !== null && (
        <YouTubePlayer
          ref={playerRef}
          videoId={videoId}
          startSeconds={startSeconds}
          autoplayMuted={autoplay}
          onPlaying={() => setPlaying(true)}
        />
      )}

      {/* 재생 전에는 유튜브 기본 UI(제목·공유·YouTube에서 보기 등)를 썸네일로 덮어 깔끔하게 보여줌.
          덮개는 터치를 통과시켜(pointer-events-none) 아래 유튜브 플레이어가 한 번의 탭으로 소리와 함께 재생되게 함 */}
      {!playing && (
        <div className="absolute inset-0 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="68" height="48" viewBox="0 0 68 48" aria-hidden="true">
              <path
                d="M66.5 7.7c-.8-2.9-2.5-5.4-5.4-6.2C55.8.1 34 0 34 0S12.2.1 6.9 1.6c-3 .8-4.6 3.3-5.4 6.2C.1 13 0 24 0 24s.1 11 1.5 16.3c.8 2.9 2.5 5.4 5.4 6.2C12.2 47.9 34 48 34 48s21.8-.1 27.1-1.6c3-.8 4.6-3.3 5.4-6.2C67.9 35 68 24 68 24s-.1-11-1.5-16.3z"
                fill="#f00"
              />
              <path d="M45 24 27 14v20" fill="#fff" />
            </svg>
          </div>
          {duration && (
            <span
              className="absolute right-2 bottom-2 text-xs font-semibold px-1.5 py-0.5 rounded"
              style={{ backgroundColor: 'rgba(0,0,0,0.8)', color: '#fff' }}
            >
              {formatDuration(duration)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
