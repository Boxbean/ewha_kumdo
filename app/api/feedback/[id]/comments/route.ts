import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { isValidAuthorToken } from '@/lib/feedbackAuth';

// 댓글 작성은 로그인 없이 개방 — 목록은 부모 게시글 GET(/api/feedback/[id])에 포함되어 내려감
// parent_id가 있으면 대댓글 (대댓글에 다시 답글은 불가 — 1단계까지만)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { body: commentBody, author_name, parent_id, author_token } = body;

  if (typeof commentBody !== 'string' || !commentBody.trim()) {
    return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 });
  }

  if (parent_id) {
    const { data: parent } = await supabase
      .from('feedback_comments')
      .select('id, feedback_post_id, parent_id')
      .eq('id', parent_id)
      .single();
    if (!parent || parent.feedback_post_id !== id) {
      return NextResponse.json({ error: '답글을 달 댓글을 찾을 수 없습니다.' }, { status: 400 });
    }
    if (parent.parent_id) {
      return NextResponse.json({ error: '답글에는 다시 답글을 달 수 없습니다.' }, { status: 400 });
    }
  }

  const { data, error } = await supabase
    .from('feedback_comments')
    .insert({
      feedback_post_id: id,
      parent_id: parent_id || null,
      body: commentBody.trim(),
      author_name: author_name || null,
      // 글 등록/비밀번호 확인 때 받은 토큰이 맞을 때만 글쓴이로 표시
      is_author: isValidAuthorToken(id, author_token),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath(`/feedback/${id}`);
  return NextResponse.json({ data }, { status: 201 });
}
