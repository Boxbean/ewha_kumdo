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
  const [sharing, setSharing] = useState<Shorts | null>(null);

  // 뷰어가 열려 있는 동안 상단 상태바(theme-color)도 검은색으로 맞춤 — 닫으면 원래 색으로 복원
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) return;
    const prev = meta.content;
    meta.content = '#000000';
    return () => { meta.content = prev; };
  }, []);

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
        aria-label="뒤로가기"
        className="fixed z-[80] flex items-center justify-center rounded-full"
        style={{
          top: 'calc(0.75rem + env(safe-area-inset-top, 0px))',
          left: '0.75rem',
          width: 36,
          height: 36,
          backgroundColor: 'rgba(0,0,0,0.5)',
          color: '#fff',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>

      {shorts.map((s, i) => (
        <Slide key={s.id} shorts={s} isActive={i === active} onShare={() => setSharing(s)} />
      ))}

      {sharing && <ShareSheet shorts={sharing} onClose={() => setSharing(null)} />}
    </div>
  );
}

function Slide({ shorts, isActive, onShare }: { shorts: Shorts; isActive: boolean; onShare: () => void }) {
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
        <div className="pointer-events-auto shrink-0 flex items-center gap-2">
          <button
            type="button"
            onClick={onShare}
            aria-label="공유하기"
            className="flex items-center justify-center rounded-full"
            style={{ width: 32, height: 32, backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 2L11 13" />
              <path d="M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
          <a
            href={shorts.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ backgroundColor: '#fff', color: '#111' }}
          >
            원본 보기 ↗
          </a>
        </div>
      </div>
    </section>
  );
}

// 원본 영상 링크 공유 팝업 — 기기 공유 시트(인스타·카톡 등 설치된 앱)로 보내기 / 링크 복사
function ShareSheet({ shorts, onClose }: { shorts: Shorts; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  async function shareToApp() {
    try {
      await navigator.share({ title: shorts.title, url: shorts.video_url });
      onClose();
    } catch {
      // 공유 시트를 닫은 경우 등은 무시
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shorts.video_url);
    } catch {
      // clipboard API가 막힌 환경(구형 인앱 브라우저 등) 대비
      const ta = document.createElement('textarea');
      ta.value = shorts.video_url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    setTimeout(onClose, 900);
  }

  const itemClass = 'flex items-center gap-3 w-full px-4 py-3.5 text-left text-sm font-semibold rounded-xl';

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[520px] rounded-t-2xl px-4 pt-3"
        style={{ backgroundColor: '#1c1c1e', color: '#fff', paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 rounded-full" style={{ width: 36, height: 4, backgroundColor: 'rgba(255,255,255,0.3)' }} />
        <p className="px-1 mb-3 text-sm font-bold line-clamp-1">{shorts.title}</p>
        <div className="space-y-1">
          {canShare && (
            <button type="button" onClick={() => void shareToApp()} className={itemClass} style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                <path d="M16 6l-4-4-4 4" />
                <path d="M12 2v13" />
              </svg>
              <span>
                앱으로 보내기
                <span className="block text-xs font-normal mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>인스타그램, 카카오톡 등</span>
              </span>
            </button>
          )}
          <button type="button" onClick={() => void copyLink()} className={itemClass} style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10 13a5 5 0 007.07 0l3-3a5 5 0 00-7.07-7.07l-1.5 1.5" />
              <path d="M14 11a5 5 0 00-7.07 0l-3 3a5 5 0 007.07 7.07l1.5-1.5" />
            </svg>
            {copied ? '복사됐어요 ✓' : '원본 링크 복사하기'}
          </button>
        </div>
        <button type="button" onClick={onClose} className="w-full mt-2 py-3 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
          취소
        </button>
      </div>
    </div>
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
