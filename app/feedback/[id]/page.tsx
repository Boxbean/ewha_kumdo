export const revalidate = 30;

import { notFound } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import ShortsPlayer from '@/components/ShortsPlayer';
import FeedbackCommentsSection from '@/components/FeedbackCommentsSection';
import FeedbackPostBody from '@/components/FeedbackPostBody';
import { getSupabase } from '@/lib/supabase';
import { FeedbackPost } from '@/lib/types';
import { extractYouTubeId, formatTimestamp } from '@/lib/utils';

interface Props {
  params: Promise<{ id: string }>;
}

const FEEDBACK_DETAIL_SELECT = `
  *,
  video:videos(id,title,youtube_url,date),
  shorts:shorts(id,title,video_url,platform),
  comments:feedback_comments(*)
`;

export default async function FeedbackDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('feedback_posts')
    .select(FEEDBACK_DETAIL_SELECT)
    .eq('id', id)
    .order('created_at', { referencedTable: 'feedback_comments', ascending: true })
    .single();

  if (error || !data) notFound();

  const post: FeedbackPost = { ...data, video_type: data.video_id ? 'video' : 'shorts' };
  const videoTitle = post.video_type === 'video' ? post.video?.title : post.shorts?.title;
  const youtubeId = post.video_type === 'video' ? extractYouTubeId(post.video?.youtube_url || '') : null;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        {post.video_type === 'video' ? (
          youtubeId ? (
            <div
              className="relative w-full rounded-lg overflow-hidden mb-2"
              style={{ aspectRatio: '16/9', backgroundColor: '#000' }}
            >
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?start=${post.timestamp_seconds}`}
                title={videoTitle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          ) : (
            <div
              className="w-full rounded-lg flex items-center justify-center text-sm mb-2"
              style={{ aspectRatio: '16/9', backgroundColor: '#e0e0e0', color: '#B9B9B9' }}
            >
              영상을 불러올 수 없습니다.
            </div>
          )
        ) : post.shorts ? (
          <div className="mb-2">
            <ShortsPlayer videoUrl={post.shorts.video_url} platform={post.shorts.platform} title={videoTitle || ''} />
            {post.shorts.platform !== 'youtube' && (
              <p className="text-xs mt-2" style={{ color: '#B9B9B9' }}>
                이 지점을 확인해보세요: {formatTimestamp(post.timestamp_seconds)}
              </p>
            )}
          </div>
        ) : null}

        <p className="text-sm mb-4" style={{ color: '#B9B9B9' }}>
          {videoTitle}
        </p>

        {/* 본문 — 관리자 비밀번호로 수정/삭제 가능 */}
        <FeedbackPostBody post={post} />

        <FeedbackCommentsSection postId={post.id} initialComments={post.comments || []} />
      </div>
    </AppLayout>
  );
}
