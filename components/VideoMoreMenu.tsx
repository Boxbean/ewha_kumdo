'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

// 영상 카드/행의 ⋮ 더보기 메뉴 — 영상 정보 보기 / YouTube에서 보기 / 공유하기
export default function VideoMoreMenu({ videoPath, youtubeUrl, title }: { videoPath: string; youtubeUrl: string; title: string }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  async function share() {
    setOpen(false);
    const url = `${window.location.origin}${videoPath}`;
    try {
      if (navigator.share) await navigator.share({ title, url });
      else {
        await navigator.clipboard.writeText(url);
        alert('링크가 복사되었습니다.');
      }
    } catch {
      // 공유 시트를 닫은 경우 등은 무시
    }
  }

  const itemClass = 'block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50';

  return (
    <div ref={menuRef} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="더보기"
        className="w-8 h-8 -mr-2 flex items-center justify-center rounded-full hover:bg-gray-100"
        style={{ color: '#374151' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute right-0 top-9 z-20 w-44 py-1 rounded-lg border shadow-lg"
          style={{ backgroundColor: '#fff', borderColor: '#e0e0e0', color: '#374151' }}
        >
          <Link href={videoPath} className={itemClass}>
            영상 정보 보기
          </Link>
          <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className={itemClass} onClick={() => setOpen(false)}>
            YouTube에서 보기
          </a>
          <button type="button" onClick={() => void share()} className={itemClass}>
            공유하기
          </button>
        </div>
      )}
    </div>
  );
}
