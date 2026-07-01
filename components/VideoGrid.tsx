import { Video } from '@/lib/types';
import VideoCard from './VideoCard';

interface VideoGridProps {
  videos: Video[];
}

export default function VideoGrid({ videos }: VideoGridProps) {
  if (videos.length === 0) {
    return (
      <p className="text-center py-16" style={{ color: '#B9B9B9' }}>
        영상이 없습니다.
      </p>
    );
  }

  return (
    <>
      <style>{`
        .video-grid {
          display: grid;
          gap: 1rem;
          grid-template-columns: repeat(2, 1fr);
        }
        @media (min-width: 640px) {
          .video-grid {
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          }
        }
      `}</style>
      <div className="video-grid">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </>
  );
}
