'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shorts } from '@/lib/types';

const ROW_SIZE = 10;

// 홈 중간의 쇼츠 가로 스크롤 한 줄 — 개수가 적어도 빈약해 보이지 않도록 그리드 대신 가로 배치
export default function HomeShortsRow() {
  const [shorts, setShorts] = useState<Shorts[]>([]);

  useEffect(() => {
    fetch(`/api/shorts?limit=${ROW_SIZE}`)
      .then((r) => r.json())
      .then((json) => setShorts(json.data || []))
      .catch(() => {});
  }, []);

  if (shorts.length === 0) return null;

  return (
    <section className="mb-6">
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="text-base font-bold" style={{ color: '#00462A' }}>
          검도쇼츠
        </h2>
        <Link href="/shorts" className="text-xs" style={{ color: '#6B7280' }}>
          전체보기 ›
        </Link>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-4 px-4 md:-mx-6 md:px-6 snap-x">
        {shorts.map((s) => (
          <Link
            key={s.id}
            href={`/shorts/${s.id}`}
            className="relative flex-shrink-0 w-32 rounded-xl overflow-hidden snap-start"
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
          </Link>
        ))}
      </div>
    </section>
  );
}
