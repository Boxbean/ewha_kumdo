'use client';

import Link from 'next/link';
import { Video } from '@/lib/types';
import { extractYouTubeId, formatDuration, formatRelativeDate, getYouTubeThumbnail } from '@/lib/utils';
import { useYouTubeDuration } from '@/lib/useYouTubeDuration';
import VideoMoreMenu from './VideoMoreMenu';

const MAX_TAGS = 3;

// 유튜브 채널 "동영상" 탭 스타일의 한 줄: 왼쪽 썸네일(영상 길이) · 오른쪽 제목/메타/참가자 · ⋮
export default function VideoListRow({ video }: { video: Video }) {
  const videoId = extractYouTubeId(video.youtube_url);
  const duration = useYouTubeDuration(videoId);
  const meta = [formatRelativeDate(video.date), video.competition?.name || video.topic].filter(Boolean).join(' · ');
  const extraTags = video.participants.length - MAX_TAGS;

  return (
    <div className="flex items-start gap-3 py-2">
      {/* 행 전체를 누르면 상세 페이지로 가서 바로 재생 */}
      <Link href={`/video/${video.id}?autoplay=1`} className="flex flex-1 min-w-0 items-start gap-3">
        <div
          className="relative flex-shrink-0 w-[44%] max-w-[240px] rounded-lg overflow-hidden"
          style={{ aspectRatio: '16/9', backgroundColor: '#e0e0e0' }}
        >
          {videoId && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getYouTubeThumbnail(videoId)}
              alt={video.title}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          {duration && (
            <span
              className="absolute right-1.5 bottom-1.5 text-[11px] font-semibold px-1 py-px rounded"
              style={{ backgroundColor: 'rgba(0,0,0,0.8)', color: '#fff' }}
            >
              {formatDuration(duration)}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-[15px] font-medium leading-snug line-clamp-2" style={{ color: '#111' }}>
            {video.title}
          </p>
          <p className="text-xs mt-1 truncate" style={{ color: '#6B7280' }}>
            {meta}
          </p>
          {video.participants.length > 0 && (
            <p className="text-xs mt-1.5 truncate" style={{ color: '#00462A' }}>
              {video.participants.slice(0, MAX_TAGS).map((p) => `#${p}`).join(' ')}
              {extraTags > 0 && <span style={{ color: '#B9B9B9' }}> +{extraTags}</span>}
            </p>
          )}
        </div>
      </Link>

      <VideoMoreMenu videoPath={`/video/${video.id}`} youtubeUrl={video.youtube_url} title={video.title} />
    </div>
  );
}
