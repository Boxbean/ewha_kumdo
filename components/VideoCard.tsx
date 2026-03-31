import Link from 'next/link';
import Image from 'next/image';
import { Video } from '@/lib/types';
import { extractYouTubeId, getYouTubeThumbnail, formatDate } from '@/lib/utils';
import AngleBadge from './AngleBadge';

interface VideoCardProps {
  video: Video;
}

const MAX_TAGS = 4;

export default function VideoCard({ video }: VideoCardProps) {
  const videoId = extractYouTubeId(video.youtube_url);
  const thumbnail = videoId ? getYouTubeThumbnail(videoId) : null;
  const visibleParticipants = video.participants.slice(0, MAX_TAGS);
  const hiddenCount = video.participants.length - MAX_TAGS;

  return (
    <Link href={`/video/${video.id}`} className="block group h-full">
      <div
        className="rounded-lg overflow-hidden border transition-transform duration-150 group-hover:-translate-y-0.5 h-full flex flex-col"
        style={{
          borderColor: '#e0e0e0',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        {/* 썸네일 (4:3 비율) */}
        <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={video.title}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-sm"
              style={{ backgroundColor: '#e0e0e0', color: '#B9B9B9' }}
            >
              No Image
            </div>
          )}
          {/* 앵글 배지 — 우상단 */}
          <div className="absolute top-1.5 right-1.5">
            <AngleBadge angle={video.angle} />
          </div>
        </div>

        {/* 카드 정보 */}
        <div className="p-2.5 flex flex-col flex-grow">
          <p className="text-xs mb-1" style={{ color: '#B9B9B9' }}>
            {formatDate(video.date)}
          </p>
          <p
            className="text-sm font-semibold leading-snug line-clamp-2 mb-1.5"
            style={{ color: '#111111' }}
          >
            {video.title}
          </p>
          {video.participants.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {visibleParticipants.map((p) => (
                <span
                  key={p}
                  className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(0,70,42,0.08)', color: '#00462A' }}
                >
                  #{p}
                </span>
              ))}
              {hiddenCount > 0 && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(0,0,0,0.06)', color: '#B9B9B9' }}
                >
                  +{hiddenCount}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
