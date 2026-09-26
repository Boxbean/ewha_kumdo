'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

// YouTube IFrame Player API 중 이 앱에서 쓰는 부분만 타입으로 선언
interface YTPlayer {
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  playVideo(): void;
  getCurrentTime(): number;
  isMuted(): boolean;
  unMute(): void;
  destroy(): void;
}

interface YTNamespace {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string;
      width?: string;
      height?: string;
      playerVars?: Record<string, number | string>;
      events?: { onReady?: () => void; onStateChange?: (e: { data: number }) => void };
    }
  ) => YTPlayer;
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;

// IFrame API 스크립트는 페이지당 한 번만 로드
function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT!);
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);
  });
  return apiPromise;
}

export interface YouTubePlayerHandle {
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number | null;
}

interface Props {
  videoId: string;
  startSeconds?: number;
  // 브라우저 정책상 소리 켠 자동재생은 막히므로 음소거로 시작하고 "소리 켜기" 버튼을 띄움
  autoplayMuted?: boolean;
  // 재생이 실제로 시작되면 호출 (썸네일 덮개를 걷어내는 용도)
  onPlaying?: () => void;
}

const YouTubePlayer = forwardRef<YouTubePlayerHandle, Props>(function YouTubePlayer(
  { videoId, startSeconds = 0, autoplayMuted = false, onPlaying },
  ref
) {
  const onPlayingRef = useRef(onPlaying);
  onPlayingRef.current = onPlaying;
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [showUnmute, setShowUnmute] = useState(false);

  useImperativeHandle(ref, () => ({
    seekTo(seconds) {
      const player = playerRef.current;
      if (!player) return;
      player.seekTo(seconds, true);
      player.playVideo();
    },
    getCurrentTime() {
      const t = playerRef.current?.getCurrentTime();
      return typeof t === 'number' ? Math.floor(t) : null;
    },
  }));

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    // YT가 이 div를 iframe으로 교체하므로 React가 관리하지 않는 자식 노드로 만듦
    const target = document.createElement('div');
    container.appendChild(target);

    loadYouTubeApi().then((YT) => {
      if (cancelled) return;
      playerRef.current = new YT.Player(target, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          start: startSeconds,
          playsinline: 1,
          rel: 0,
          ...(autoplayMuted ? { autoplay: 1, mute: 1 } : {}),
        },
        events: {
          onReady: () => {
            if (!cancelled && autoplayMuted) setShowUnmute(true);
          },
          onStateChange: (e) => {
            if (e.data === 1) onPlayingRef.current?.(); // 1 = PLAYING
          },
        },
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
      container.innerHTML = '';
      setShowUnmute(false);
    };
  }, [videoId, startSeconds, autoplayMuted]);

  function unmute() {
    playerRef.current?.unMute();
    playerRef.current?.playVideo();
    setShowUnmute(false);
  }

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="absolute inset-0 [&>iframe]:w-full [&>iframe]:h-full" />
      {showUnmute && (
        <button
          type="button"
          onClick={unmute}
          className="absolute left-3 top-3 flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold text-white"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
        >
          🔊 탭하여 소리 켜기
        </button>
      )}
    </div>
  );
});

export default YouTubePlayer;
