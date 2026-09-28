import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { requireAdminOrPostPassword } from '@/lib/feedbackAuth';
import { FeedbackPost } from '@/lib/types';
import { FEEDBACK_TITLE_MAX, splitTimestamps } from '@/lib/utils';

const FEEDBACK_DETAIL_SELECT = `
  *,
  video:videos(id,title,youtube_url,date,chapters),
  shorts:shorts(id,title,video_url,platform,thumbnail_url),
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

// 글쓴이(글 비밀번호) 또는 관리자 수정 — 본문에 포함된 필드만 반영
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authError = await requireAdminOrPostPassword(req, id);
  if (authError) return authError;

  const body = await req.json();
  const update: Record<string, unknown> = {};
  if ('body' in body) {
    if (typeof body.body !== 'string' || !body.body.trim()) {
      return NextResponse.json({ error: '피드백 내용을 입력해주세요.' }, { status: 400 });
    }
    update.body = body.body.trim();
    // 대표 타임스탬프는 본문 첫 번째 시간 표기를 따라감
    const firstTime = splitTimestamps(body.body).find((p) => p.type === 'time');
    update.timestamp_seconds = firstTime && firstTime.type === 'time' ? firstTime.seconds : 0;
  }
  if ('title' in body) {
    if (typeof body.title !== 'string' || !body.title.trim()) {
      return NextResponse.json({ error: '제목을 입력해주세요.' }, { status: 400 });
    }
    update.title = body.title.trim().slice(0, FEEDBACK_TITLE_MAX);
  }
  if ('author_name' in body) update.author_name = body.author_name || null;

  const { data, error } = await supabase
    .from('feedback_posts')
    .update(update)
    .eq('id', id)
    .select('id, title, body, timestamp_seconds, author_name')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 상세 페이지는 ISR 캐시라 수정 내용이 바로 보이도록 무효화
  revalidatePath(`/feedback/${id}`);
  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authError = await requireAdminOrPostPassword(req, id);
  if (authError) return authError;

  const { error } = await supabase.from('feedback_posts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath(`/feedback/${id}`);
  return NextResponse.json({ ok: true });
}
