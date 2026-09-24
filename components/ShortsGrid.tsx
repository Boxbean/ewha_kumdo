import { Shorts } from '@/lib/types';
import ShortsCard from './ShortsCard';

interface ShortsGridProps {
  shorts: Shorts[];
}

export default function ShortsGrid({ shorts }: ShortsGridProps) {
  if (shorts.length === 0) {
    return (
      <p className="text-center py-16" style={{ color: '#B9B9B9' }}>
        아직 등록된 쇼츠가 없습니다.
      </p>
    );
  }

  return (
    <>
      <style>{`
        .shorts-grid {
          display: grid;
          gap: 0.5rem;
          grid-template-columns: repeat(3, 1fr);
        }
        @media (min-width: 640px) {
          .shorts-grid {
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 0.75rem;
          }
        }
      `}</style>
      <div className="shorts-grid">
        {shorts.map((s) => (
          <ShortsCard key={s.id} shorts={s} />
        ))}
      </div>
    </>
  );
}
