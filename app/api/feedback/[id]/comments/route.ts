import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 댓글 작성은 로그인 없이 개방 — 목록은 부모 게시글 GET(/api/feedback/[id])에 포함되어 내려감
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { body: commentBody, author_name } = body;

  if (!commentBody) {
    return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('feedback_comments')
    .insert({ feedback_post_id: id, body: commentBody, author_name: author_name || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
