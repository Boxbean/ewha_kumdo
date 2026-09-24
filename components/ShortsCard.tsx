import Link from 'next/link';
import { Shorts } from '@/lib/types';

interface ShortsCardProps {
  shorts: Shorts;
}

const PLATFORM_LABEL: Record<Shorts['platform'], string> = {
  youtube: '▶ YouTube',
  instagram: '📷 Instagram',
  other: '🔗 링크',
};

export default function ShortsCard({ shorts }: ShortsCardProps) {
  return (
    <Link href={`/shorts/${shorts.id}`} className="block group">
      <div
        className="relative w-full rounded-lg overflow-hidden"
        style={{ aspectRatio: '3/4', backgroundColor: '#e0e0e0' }}
      >
        {shorts.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shorts.thumbnail_url}
            alt={shorts.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-150 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-3xl" style={{ color: '#B9B9B9' }}>
            🎬
          </div>
        )}

        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{
            height: '65%',
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.75) 82%)',
          }}
        />

        <span
          className="absolute top-1.5 left-1.5 text-xs font-semibold px-1.5 py-0.5 rounded"
          style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: '#374151' }}
        >
          {PLATFORM_LABEL[shorts.platform]}
        </span>

        <p
          className="absolute left-2 right-2 bottom-2 text-xs font-semibold leading-snug line-clamp-2"
          style={{ color: '#ffffff' }}
        >
          {shorts.title}
        </p>
      </div>
    </Link>
  );
}
