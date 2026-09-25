'use client';

import { useEffect, useRef, useState } from 'react';
import { VideoChapter } from '@/lib/types';
import { formatTimestamp } from '@/lib/utils';
import YouTubePlayer, { YouTubePlayerHandle } from './YouTubePlayer';

interface Props {
  videoId: string;
  chapters: VideoChapter[];
}

// 영상 상세의 플레이어 + 구간 버튼
// 가장 이른 구간을 운동 시작점으로 보고 그 지점부터 재생, 푸시 알림(?autoplay=1)으로 들어오면 음소거 자동재생
export default function VideoPlayerSection({ videoId, chapters }: Props) {
  const playerRef = useRef<YouTubePlayerHandle>(null);
  // 상세 페이지는 정적 생성(ISR)이라 쿼리 파라미터는 클라이언트에서 마운트 후 읽음
  const [autoplay, setAutoplay] = useState<boolean | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    setAutoplay(url.searchParams.get('autoplay') === '1');
    if (url.searchParams.has('autoplay')) {
      // 새로고침이나 링크 공유 시 다시 자동재생되지 않도록 주소에서 제거
      url.searchParams.delete('autoplay');
      window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
    }
  }, []);

  const startSeconds = chapters[0]?.seconds ?? 0;

  return (
    <div className="mb-4">
      <div
        className="relative w-full rounded-lg overflow-hidden"
        style={{ aspectRatio: '16/9', backgroundColor: '#000' }}
      >
        {autoplay !== null && (
          <YouTubePlayer ref={playerRef} videoId={videoId} startSeconds={startSeconds} autoplayMuted={autoplay} />
        )}
      </div>

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
    </div>
  );
}
