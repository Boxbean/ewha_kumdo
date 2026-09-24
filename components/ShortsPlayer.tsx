import { ShortsPlatform } from '@/lib/types';
import { extractYouTubeId } from '@/lib/utils';
import InstagramEmbed from './InstagramEmbed';

interface ShortsPlayerProps {
  videoUrl: string;
  platform: ShortsPlatform;
  title: string;
  startSeconds?: number;
}

export default function ShortsPlayer({ videoUrl, platform, title, startSeconds }: ShortsPlayerProps) {
  if (platform === 'youtube') {
    const videoId = extractYouTubeId(videoUrl);
    if (videoId) {
      const src = `https://www.youtube.com/embed/${videoId}${startSeconds ? `?start=${startSeconds}` : ''}`;
      return (
        <div
          className="relative w-full rounded-lg overflow-hidden"
          style={{ aspectRatio: '16/9', backgroundColor: '#000' }}
        >
          <iframe
            src={src}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
      );
    }
  }

  if (platform === 'instagram') {
    return (
      <div className="space-y-3">
        <InstagramEmbed url={videoUrl} />
        <LinkOutButton videoUrl={videoUrl} />
      </div>
    );
  }

  // other — 임베드 시도 없이 링크아웃만
  return <LinkOutButton videoUrl={videoUrl} />;
}

function LinkOutButton({ videoUrl }: { videoUrl: string }) {
  return (
    <a
      href={videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center h-11 rounded-lg text-sm font-semibold w-full"
      style={{ backgroundColor: '#00462A', color: '#ffffff' }}
    >
      영상 보러가기 ↗
    </a>
  );
}
