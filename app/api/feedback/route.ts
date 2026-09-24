import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { FeedbackPost } from '@/lib/types';

const FEEDBACK_SELECT = `
  *,
  video:videos(id,title,youtube_url,date),
  shorts:shorts(id,title,video_url,platform),
  feedback_comments(count)
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function withVideoType(row: any): FeedbackPost {
  const { feedback_comments, ...rest } = row;
  return {
    ...rest,
    video_type: row.video_id ? 'video' : 'shorts',
    comment_count: feedback_comments?.[0]?.count ?? 0,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get('limit') || '10');
  const offset = Number(searchParams.get('offset') || '0');

  const { data, error, count } = await supabase
    .from('feedback_posts')
    .select(FEEDBACK_SELECT, { count: 'estimated' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: (data || []).map(withVideoType), count: count ?? 0 }, {
    headers: { 'Cache-Control': 'private, max-age=30' },
  });
}

// 등록은 로그인 없이 개방 — 삭제만 관리자 비밀번호로 보호 (기존 사이트 신뢰 모델과 동일)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { video_type, video_id, timestamp_seconds, body: postBody, author_name } = body;

  if (!video_type || !video_id || !postBody) {
    return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 });
  }
  if (video_type !== 'video' && video_type !== 'shorts') {
    return NextResponse.json({ error: '잘못된 video_type' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('feedback_posts')
    .insert({
      video_id: video_type === 'video' ? video_id : null,
      shorts_id: video_type === 'shorts' ? video_id : null,
      timestamp_seconds: timestamp_seconds || 0,
      body: postBody,
      author_name: author_name || null,
    })
    .select(FEEDBACK_SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: withVideoType(data) }, { status: 201 });
}
