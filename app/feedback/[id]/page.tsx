export const revalidate = 30;
// 빈 배열을 내보내야 동적 경로([id])도 첫 방문 때 그려 30초 캐시(ISR)함 — 없으면 revalidate가 무시되고 매 요청마다 DB를 조회함
export async function generateStaticParams() {
  return [];
}

import { notFound } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import FeedbackDetail from '@/components/FeedbackDetail';
import { getSupabase } from '@/lib/supabase';
import { FeedbackPost } from '@/lib/types';

interface Props {
  params: Promise<{ id: string }>;
}

const FEEDBACK_DETAIL_SELECT = `
  *,
  video:videos(id,title,youtube_url,date,chapters,participants,uploader),
  shorts:shorts(id,title,video_url,platform,thumbnail_url,submitter_name),
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

  return (
    <AppLayout>
      <FeedbackDetail post={post} />
    </AppLayout>
  );
}
