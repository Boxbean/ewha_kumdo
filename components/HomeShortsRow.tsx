'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Shorts } from '@/lib/types';
import SectionTitle from './SectionTitle';
import ShortsViewer from './ShortsViewer';

// 앞의 몇 개는 최신 등록순으로 고정하고, 나머지는 방문할 때마다 섞어서 다양한 쇼츠가 노출되게 함
const NEWEST_FIXED = 2;

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 홈 중간의 쇼츠 가로 스크롤 한 줄 — 개수가 적어도 빈약해 보이지 않도록 그리드 대신 가로 배치
// 목록은 서버(app/page.tsx)에서 최신순으로 받아와 첫 화면에 바로 그림 — 예전처럼 로딩 후 줄이 뒤늦게 끼어들며
// 아래 영상들을 밀어내지 않음. 섞기는 서버 HTML과 첫 렌더가 일치해야 하므로 마운트 후에 수행
export default function HomeShortsRow({ shorts: initial }: { shorts: Shorts[] }) {
  const [shorts, setShorts] = useState<Shorts[]>(initial);
  // 누르면 게시글 화면 대신 쇼츠 탭과 같은 전체화면 재생 화면을 바로 띄움 (위아래로 넘기면 이 줄의 다른 쇼츠)
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const closeViewer = useCallback(() => setViewerIndex(null), []);
  const noMore = useCallback(() => {}, []);

  useEffect(() => {
    setShorts([...initial.slice(0, NEWEST_FIXED), ...shuffle(initial.slice(NEWEST_FIXED))]);
  }, [initial]);

  if (shorts.length === 0) return null;

  return (
    <section data-tour="home-shorts" className="mb-6">
      <div className="flex items-baseline justify-between mb-2">
        <SectionTitle>검도쇼츠</SectionTitle>
        <Link href="/shorts" className="text-xs py-2 -my-2 pl-3" style={{ color: '#6B7280' }}>
          전체보기 ›
        </Link>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-4 px-4 md:-mx-6 md:px-6 snap-x scroll-px-4 md:scroll-px-6">
        {shorts.map((s, i) => (
          <button
            type="button"
            key={s.id}
            onClick={() => setViewerIndex(i)}
            className="relative flex-shrink-0 w-32 rounded-xl overflow-hidden snap-start text-left"
            style={{ aspectRatio: '2/3', backgroundColor: '#e0e0e0' }}
          >
            <div className="absolute inset-0 flex items-center justify-center text-2xl" style={{ color: '#B9B9B9' }}>
              🎬
            </div>
            {s.thumbnail_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={s.thumbnail_url.replace('/mqdefault.jpg', '/hqdefault.jpg')}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <div
              className="absolute inset-x-0 bottom-0 pointer-events-none"
              style={{ height: '50%', background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%)' }}
            />
            <p className="absolute left-2 right-2 bottom-2 text-xs font-bold leading-snug line-clamp-2" style={{ color: '#fff' }}>
              {s.title}
            </p>
          </button>
        ))}
      </div>

      {viewerIndex !== null && (
        <ShortsViewer shorts={shorts} startIndex={viewerIndex} hasMore={false} onNeedMore={noMore} onClose={closeViewer} />
      )}
    </section>
  );
}
