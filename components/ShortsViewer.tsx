'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Shorts } from '@/lib/types';
import { extractYouTubeId, getInstagramEmbedUrl } from '@/lib/utils';

interface ShortsViewerProps {
  shorts: Shorts[];
  startIndex: number;
  hasMore: boolean;
  onNeedMore: () => void;
  onClose: () => void;
}

export default function ShortsViewer({ shorts, startIndex, hasMore, onNeedMore, onClose }: ShortsViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(startIndex);

  // 뒤로가기(모바일 제스처 포함)로 뷰어만 닫히도록 히스토리 항목 하나를 쌓음
  useEffect(() => {
    history.pushState({ shortsViewer: true }, '');
    const handlePop = () => onClose();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') history.back();
    };
    window.addEventListener('popstate', handlePop);
    window.addEventListener('keydown', handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('popstate', handlePop);
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = startIndex * el.clientHeight;
  }, [startIndex]);

  useEffect(() => {
    if (hasMore && active >= shorts.length - 3) onNeedMore();
  }, [active, shorts.length, hasMore, onNeedMore]);

  const rafRef = useRef<number | null>(null);
  function handleScroll() {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const el = containerRef.current;
      if (el && el.clientHeight > 0) setActive(Math.round(el.scrollTop / el.clientHeight));
    });
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="fixed inset-0 z-[70] overflow-y-scroll snap-y snap-mandatory"
      style={{ backgroundColor: '#000', overscrollBehavior: 'contain' }}
    >
      <button
        type="button"
        onClick={() => history.back()}
        aria-label="닫기"
        className="fixed z-[80] flex items-center justify-center rounded-full"
        style={{
          top: 'calc(0.75rem + env(safe-area-inset-top, 0px))',
          left: '0.75rem',
          width: 36,
          height: 36,
          backgroundColor: 'rgba(0,0,0,0.5)',
          color: '#fff',
          fontSize: 20,
          lineHeight: 1,
        }}
      >
        ✕
      </button>

      {shorts.map((s, i) => (
        <Slide key={s.id} shorts={s} isActive={i === active} />
      ))}
    </div>
  );
}

function Slide({ shorts, isActive }: { shorts: Shorts; isActive: boolean }) {
  const youtubeId = shorts.platform === 'youtube' ? extractYouTubeId(shorts.video_url) : null;
  const igEmbed = shorts.platform === 'instagram' ? getInstagramEmbedUrl(shorts.video_url) : null;

  return (
    <section
      className="relative snap-start snap-always w-full flex items-center justify-center"
      style={{ height: '100dvh' }}
    >
      {isActive && youtubeId ? (
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&playsinline=1&rel=0`}
          title={shorts.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full max-w-[520px]"
          style={{ height: 'calc(100dvh - 160px)', border: 0 }}
        />
      ) : isActive && igEmbed ? (
        <InstagramFullBleed src={igEmbed} title={shorts.title} />
      ) : shorts.thumbnail_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={shorts.thumbnail_url}
          alt=""
          referrerPolicy="no-referrer"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
          className="max-w-[520px] w-full object-contain"
          style={{ maxHeight: 'calc(100dvh - 160px)' }}
        />
      ) : (
        <div className="text-5xl" style={{ color: '#555' }}>🎬</div>
      )}

      <div
        className="absolute inset-x-0 bottom-0 px-4 pt-10 flex items-end justify-between gap-3 pointer-events-none"
        style={{
          paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
          background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.75) 100%)',
        }}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold line-clamp-2" style={{ color: '#fff' }}>{shorts.title}</p>
          {shorts.submitter_name && (
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>{shorts.submitter_name}</p>
          )}
        </div>
        <a
          href={shorts.video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full"
          style={{ backgroundColor: '#fff', color: '#111' }}
        >
          원본 보기 ↗
        </a>
      </div>
    </section>
  );
}

// 인스타 embed iframe은 cross-origin이라 안쪽 UI(게시자 헤더/좋아요·댓글·공유 푸터)를 숨길 수 없음.
// 대신 iframe을 clip-path로 "영상 영역"만 남기고 확대/배치해서 화면을 채움. 재생은 iframe 그대로(▶ 한 번 탭).
// 폭 400px 기준 embed 실측: 헤더 54px + 영상 영역 M + 푸터 154px = 전체 높이 T.
// 영상 영역 높이 M은 영상 비율마다 다르지만(세로 릴스 500, 가로 225 등) iframe이 부모로 보내는
// MEASURE 메시지의 T로 M = T - 208 을 구할 수 있음. 인스타가 레이아웃을 바꾸면 아래 상수만 조정.
const IG_W = 400;
const IG_HEADER = 54;
const IG_CHROME = 208; // 헤더 + 푸터
const IG_DEFAULT_M = 500;

function InstagramFullBleed({ src, title }: { src: string; title: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [media, setMedia] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.source !== frameRef.current?.contentWindow) return;
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        const total = data?.type === 'MEASURE' ? Number(data.details?.height) : NaN;
        if (total > IG_CHROME + 100 && total < IG_CHROME + 800) setMedia(total - IG_CHROME);
      } catch {
        // 인스타가 보내는 다른 형식의 메시지는 무시
      }
    }
    window.addEventListener('message', onMessage);
    const t = setTimeout(() => setTimedOut(true), 2500);
    return () => {
      window.removeEventListener('message', onMessage);
      clearTimeout(t);
    };
  }, []);

  const m = media ?? IG_DEFAULT_M;
  const tall = m / IG_W >= 1.2; // 세로형(릴스)은 화면 높이에 맞춰 꽉 채우고, 가로/정사각형은 폭에 맞추고 세로 중앙 정렬
  const scale = tall ? size.h / m : size.w / IG_W;
  const x = (size.w - IG_W * scale) / 2;
  const y = tall ? -IG_HEADER * scale : (size.h - m * scale) / 2 - IG_HEADER * scale;
  const frameH = IG_HEADER + m + 160;
  const visible = media !== null || timedOut;

  return (
    <div ref={boxRef} className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#000' }}>
      {size.h > 0 && (
        <iframe
          ref={frameRef}
          src={src}
          title={title}
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          scrolling="no"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: IG_W,
            height: frameH,
            border: 0,
            opacity: visible ? 1 : 0,
            transformOrigin: '0 0',
            transform: `translate(${x}px, ${y}px) scale(${scale})`,
            clipPath: `inset(${IG_HEADER}px 0px ${frameH - IG_HEADER - m}px 0px)`,
          }}
        />
      )}
    </div>
  );
}
