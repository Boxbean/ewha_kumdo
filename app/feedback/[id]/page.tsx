export const revalidate = 30;

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
