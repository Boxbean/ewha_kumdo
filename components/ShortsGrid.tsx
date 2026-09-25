import { Shorts } from '@/lib/types';

interface ShortsGridProps {
  shorts: Shorts[];
  onSelect: (index: number) => void;
}

const PLATFORM_ICON: Record<Shorts['platform'], string> = {
  youtube: '▶',
  instagram: '◎',
  other: '↗',
};

// 인스타 돋보기 탭 배치: 3열, 6개 단위 블록마다 2x2 큰 타일이 좌/우로 번갈아 나옴
export default function ShortsGrid({ shorts, onSelect }: ShortsGridProps) {
  if (shorts.length === 0) {
    return (
      <p className="text-center py-16" style={{ color: '#B9B9B9' }}>
        표시할 쇼츠가 없습니다.
      </p>
    );
  }

  return (
    <>
      <style>{`
        .explore-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-auto-flow: dense;
          gap: 2px;
        }
        .explore-tile {
          position: relative;
          overflow: hidden;
          background: #e0e0e0;
          aspect-ratio: 1 / 1;
          padding: 0;
          border: 0;
          cursor: pointer;
          display: block;
        }
        /* 큰 타일도 정사각형(2칸 너비 = 2행 높이+간격)으로 두어, 옆에 작은 타일이 없어도(예: 영상 1개) 높이가 0으로 접히지 않게 함 */
        .explore-tile.big { grid-row: span 2; }
        .explore-tile.big-left { grid-column: 1 / span 2; }
        .explore-tile.big-right { grid-column: 2 / span 2; }
        @media (min-width: 768px) {
          .explore-grid { max-width: 640px; margin: 0 auto; }
        }
      `}</style>
      <div className="explore-grid">
        {shorts.map((s, i) => {
          const block = Math.floor(i / 6);
          const isBig = i % 6 === 0;
          const cls = isBig ? `big ${block % 2 === 0 ? 'big-left' : 'big-right'}` : '';
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(i)}
              className={`explore-tile ${cls}`}
              aria-label={s.title}
            >
              {/* 썸네일이 없거나 만료로 로드 실패해도 아래 placeholder가 그대로 보이도록 항상 깔아둠 */}
              <div
                className="absolute inset-0 flex items-center justify-center text-2xl"
                style={{ color: '#B9B9B9' }}
              >
                🎬
              </div>
              {s.thumbnail_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.thumbnail_url}
                  alt=""
                  loading={i < 9 ? 'eager' : 'lazy'}
                  referrerPolicy="no-referrer"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              <div
                className="absolute inset-x-0 bottom-0 pointer-events-none"
                style={{
                  height: '60%',
                  background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%)',
                }}
              />
              <span
                className="absolute top-1.5 right-1.5 text-xs font-bold leading-none"
                style={{ color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
              >
                {PLATFORM_ICON[s.platform]}
              </span>
              <p
                className={`absolute left-1.5 right-1.5 bottom-1.5 text-left font-semibold leading-snug ${
                  isBig ? 'text-sm line-clamp-3' : 'text-[11px] line-clamp-2'
                }`}
                style={{ color: '#ffffff' }}
              >
                {s.title}
              </p>
            </button>
          );
        })}
      </div>
    </>
  );
}
