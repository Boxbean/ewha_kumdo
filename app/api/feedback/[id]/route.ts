import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminAuth';
import { FeedbackPost } from '@/lib/types';

const FEEDBACK_DETAIL_SELECT = `
  *,
  video:videos(id,title,youtube_url,date),
  shorts:shorts(id,title,video_url,platform),
  comments:feedback_comments(*)
`;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await supabase
    .from('feedback_posts')
    .select(FEEDBACK_DETAIL_SELECT)
    .eq('id', id)
    .order('created_at', { referencedTable: 'feedback_comments', ascending: true })
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  const post: FeedbackPost = {
    ...data,
    video_type: data.video_id ? 'video' : 'shorts',
  };
  return NextResponse.json({ data: post });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const { id } = await params;
  const { error } = await supabase.from('feedback_posts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
