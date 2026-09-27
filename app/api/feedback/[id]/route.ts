import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
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

// 관리자 수정 — 본문에 포함된 필드만 반영
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const { id } = await params;
  const body = await req.json();
  const update: Record<string, unknown> = {};
  if ('body' in body) {
    if (typeof body.body !== 'string' || !body.body.trim()) {
      return NextResponse.json({ error: '피드백 내용을 입력해주세요.' }, { status: 400 });
    }
    update.body = body.body.trim();
  }
  if ('timestamp_seconds' in body) {
    const seconds = Number(body.timestamp_seconds);
    if (!Number.isInteger(seconds) || seconds < 0) {
      return NextResponse.json({ error: '시간 형식이 올바르지 않습니다.' }, { status: 400 });
    }
    update.timestamp_seconds = seconds;
  }
  if ('author_name' in body) update.author_name = body.author_name || null;

  const { data, error } = await supabase
    .from('feedback_posts')
    .update(update)
    .eq('id', id)
    .select('id, body, timestamp_seconds, author_name')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 상세 페이지는 ISR 캐시라 수정 내용이 바로 보이도록 무효화
  revalidatePath(`/feedback/${id}`);
  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const { id } = await params;
  const { error } = await supabase.from('feedback_posts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath(`/feedback/${id}`);
  return NextResponse.json({ ok: true });
}
