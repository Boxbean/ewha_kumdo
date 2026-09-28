import { NextRequest, NextResponse } from 'next/server';
import { authorToken, checkPostPassword } from '@/lib/feedbackAuth';

// 게시글 비밀번호 확인 — 맞으면 글쓴이 토큰을 내려줘서 이 기기의 댓글이 "글쓴이"로 표시되게 함
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { password } = await req.json();
  if (!(await checkPostPassword(id, password))) {
    return NextResponse.json({ error: '비밀번호가 올바르지 않습니다.' }, { status: 401 });
  }
  return NextResponse.json({ ok: true, author_token: authorToken(id) });
}
