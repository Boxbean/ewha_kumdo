import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';

// 댓글 좋아요 +1 / 취소 -1 — 로그인이 없어 기기당 1회 제한은 클라이언트(localStorage)에서 관리
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  const { id, commentId } = await params;
  const { delta } = await req.json();
  if (delta !== 1 && delta !== -1) {
    return NextResponse.json({ error: 'delta는 1 또는 -1' }, { status: 400 });
  }

  // 다른 게시글의 댓글 id로 요청하는 경우 차단
  const { data: comment } = await supabase
    .from('feedback_comments')
    .select('id')
    .eq('id', commentId)
    .eq('feedback_post_id', id)
    .single();
  if (!comment) return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 });

  const { data, error } = await supabase.rpc('adjust_feedback_comment_like', { p_comment_id: commentId, p_delta: delta });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath(`/feedback/${id}`);
  return NextResponse.json({ like_count: data });
}
