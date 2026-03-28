export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import AngleBadge from '@/components/AngleBadge';
import VideoCard from '@/components/VideoCard';
import { supabase } from '@/lib/supabase';
import { Video } from '@/lib/types';
import { extractYouTubeId, formatDate } from '@/lib/utils';

interface Props {
  params: { id: string };
}

export default async function VideoDetailPage({ params }: Props) {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !data) notFound();

  const video = data as Video;
  const videoId = extractYouTubeId(video.youtube_url);

  // 같은 날짜의 다른 영상 (페어 영상)
  const { data: pairData } = await supabase
    .from('videos')
    .select('*')
    .eq('date', video.date)
    .neq('id', video.id)
    .limit(6);

  const pairVideos: Video[] = (pairData as Video[]) || [];

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        {/* YouTube 임베드 */}
        {videoId ? (
          <div
            className="relative w-full rounded-lg overflow-hidden mb-4"
            style={{ aspectRatio: '16/9', backgroundColor: '#000' }}
          >
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        ) : (
          <div
            className="w-full rounded-lg flex items-center justify-center text-sm mb-4"
            style={{ aspectRatio: '16/9', backgroundColor: '#e0e0e0', color: '#B9B9B9' }}
          >
            영상을 불러올 수 없습니다.
          </div>
        )}

        {/* 메타정보 */}
        <div
          className="rounded-lg p-4 mb-4"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }}
        >
          <div className="flex items-start gap-2 mb-2">
            <AngleBadge angle={video.angle} />
            <h1 className="text-lg font-bold leading-snug" style={{ color: '#111111' }}>
              {video.title}
            </h1>
          </div>

          <p className="text-sm mb-2" style={{ color: '#B9B9B9' }}>
            {formatDate(video.date)}
          </p>

          {video.participants.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {video.participants.map((p) => (
                <Link
                  key={p}
                  href={`/participant`}
                  className="text-sm px-2 py-0.5 rounded-full transition-colors"
                  style={{ backgroundColor: 'rgba(0,70,42,0.08)', color: '#00462A' }}
                >
                  #{p}
                </Link>
              ))}
            </div>
          )}

          {video.topic && (
            <p className="text-sm" style={{ color: '#374151' }}>
              주제: <span className="font-medium">{video.topic}</span>
            </p>
          )}
          {video.uploader && (
            <p className="text-sm mt-1" style={{ color: '#B9B9B9' }}>
              등록: {video.uploader}
            </p>
          )}
        </div>

        {/* 페어 영상 */}
        {pairVideos.length > 0 && (
          <div>
            <h2 className="text-base font-bold mb-3" style={{ color: '#374151' }}>
              같은 날짜의 다른 영상
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {pairVideos.map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
