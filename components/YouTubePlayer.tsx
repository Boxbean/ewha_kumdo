'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

// YouTube IFrame Player API 중 이 앱에서 쓰는 부분만 타입으로 선언
interface YTPlayer {
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  playVideo(): void;
  getCurrentTime(): number;
  isMuted(): boolean;
  mute(): void;
  unMute(): void;
  getPlayerState(): number;
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
  // 소리 켠 채로 바로 재생을 시도하고, 브라우저가 막으면(iOS 등) 음소거로 재생 + "소리 켜기" 버튼
  autoplay?: boolean;
  // 재생이 실제로 시작되면 호출 (썸네일 덮개를 걷어내는 용도)
  onPlaying?: () => void;
}

// 소리 켠 자동재생을 시도한 뒤 이 시간 안에 재생이 시작되지 않으면 막힌 것으로 보고 음소거로 재시도
const AUTOPLAY_FALLBACK_MS = 1200;

const YouTubePlayer = forwardRef<YouTubePlayerHandle, Props>(function YouTubePlayer(
  { videoId, startSeconds = 0, autoplayMuted = false, autoplay = false, onPlaying },
  ref
) {
  const onPlayingRef = useRef(onPlaying);
  onPlayingRef.current = onPlaying;
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [showUnmute, setShowUnmute] = useState(false);
  // YT.Player 객체는 onReady 전까지 seekTo/getCurrentTime 같은 메서드가 붙어 있지 않음
  const readyRef = useRef(false);

  useImperativeHandle(ref, () => ({
    seekTo(seconds) {
      const player = playerRef.current;
      if (!player || !readyRef.current) return;
      player.seekTo(seconds, true);
      player.playVideo();
    },
    getCurrentTime() {
      if (!readyRef.current) return null;
      const t = playerRef.current?.getCurrentTime();
      return typeof t === 'number' ? Math.floor(t) : null;
    },
  }));

  useEffect(() => {
    let cancelled = false;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
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
          ...(autoplayMuted ? { autoplay: 1, mute: 1 } : autoplay ? { autoplay: 1 } : {}),
        },
        events: {
          onReady: () => {
            readyRef.current = true;
            if (cancelled) return;
            if (autoplayMuted) setShowUnmute(true);
            if (autoplay) {
              const player = playerRef.current;
              player?.playVideo();
              fallbackTimer = setTimeout(() => {
                if (cancelled || !player) return;
                const state = player.getPlayerState();
                if (state === 1 || state === 3) return; // 1 = PLAYING, 3 = BUFFERING
                player.mute();
                player.playVideo();
                setShowUnmute(true);
              }, AUTOPLAY_FALLBACK_MS);
            }
          },
          onStateChange: (e) => {
            if (e.data === 1) onPlayingRef.current?.(); // 1 = PLAYING
          },
        },
      });
    });

    return () => {
      cancelled = true;
      clearTimeout(fallbackTimer);
      readyRef.current = false;
      playerRef.current?.destroy();
      playerRef.current = null;
      container.innerHTML = '';
      setShowUnmute(false);
    };
  }, [videoId, startSeconds, autoplayMuted, autoplay]);

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
