'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Shorts } from '@/lib/types';
import { extractYouTubeId } from '@/lib/utils';
import InstagramEmbed from './InstagramEmbed';

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
      ) : isActive && shorts.platform === 'instagram' ? (
        // 인스타 임베드는 비공개/삭제/차단 등으로 조용히 비어 보일 수 있어, 포스터(썸네일)+원본 링크를 항상 아래에 깔고
        // 임베드가 정상 렌더링되면 그 위를 덮도록 함
        <div className="relative w-full max-w-[420px]" style={{ maxHeight: 'calc(100dvh - 160px)' }}>
          <a
            href={shorts.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="relative flex items-center justify-center w-full overflow-hidden"
            style={{ aspectRatio: '4 / 5', backgroundColor: '#1a1a1a' }}
          >
            {shorts.thumbnail_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shorts.thumbnail_url}
                alt=""
                referrerPolicy="no-referrer"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <span
              className="relative flex items-center justify-center rounded-full text-2xl"
              style={{ width: 64, height: 64, backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff' }}
            >
              ▶
            </span>
          </a>
          <div className="absolute inset-x-0 top-0 z-10 overflow-y-auto" style={{ maxHeight: 'calc(100dvh - 160px)' }}>
            <InstagramEmbed url={shorts.video_url} />
          </div>
        </div>
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
