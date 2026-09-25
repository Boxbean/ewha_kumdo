import { Shorts } from '@/lib/types';

interface ShortsGridProps {
  shorts: Shorts[];
  onSelect: (index: number) => void;
}

// 유튜브 검색 결과 스타일: 2열, 둥근 모서리의 세로형(2:3) 카드, 제목은 썸네일 하단에 오버레이
function sharpenThumbnail(url: string): string {
  // 등록 시 저장된 유튜브 썸네일은 320x180(mqdefault)이라 세로로 크롭하면 흐려서 480x360으로 올려 사용
  return url.replace('/mqdefault.jpg', '/hqdefault.jpg');
}

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
        .shorts-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }
        .shorts-card {
          position: relative;
          overflow: hidden;
          border-radius: 12px;
          background: #e0e0e0;
          aspect-ratio: 2 / 3;
          padding: 0;
          border: 0;
          cursor: pointer;
          display: block;
        }
        @media (min-width: 640px) {
          .shorts-grid { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
        }
      `}</style>
      <div className="shorts-grid">
        {shorts.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(i)}
            className="shorts-card"
            aria-label={s.title}
          >
            {/* 썸네일이 없거나 만료로 로드 실패해도 아래 placeholder가 그대로 보이도록 항상 깔아둠 */}
            <div
              className="absolute inset-0 flex items-center justify-center text-3xl"
              style={{ color: '#B9B9B9' }}
            >
              🎬
            </div>
            {s.thumbnail_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sharpenThumbnail(s.thumbnail_url)}
                alt=""
                loading={i < 6 ? 'eager' : 'lazy'}
                referrerPolicy="no-referrer"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <div
              className="absolute inset-x-0 bottom-0 pointer-events-none"
              style={{
                height: '45%',
                background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%)',
              }}
            />
            <p
              className="absolute left-3 right-3 bottom-3 text-left text-[15px] font-bold leading-snug line-clamp-2"
              style={{ color: '#ffffff' }}
            >
              {s.title}
            </p>
          </button>
        ))}
      </div>
    </>
  );
}
