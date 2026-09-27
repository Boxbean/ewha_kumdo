import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { FeedbackPost } from '@/lib/types';
import { FEEDBACK_TITLE_MAX, splitTimestamps } from '@/lib/utils';

const FEEDBACK_SELECT = `
  *,
  video:videos(id,title,youtube_url,date),
  shorts:shorts(id,title,video_url,platform,thumbnail_url),
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

// 등록은 로그인 없이 개방 — 수정/삭제만 관리자 비밀번호로 보호 (기존 사이트 신뢰 모델과 동일)
// 개편 후 새 글은 정규 영상(videos)만 대상으로 하고, 시간 표기는 본문 안에 여러 개 적는 방식
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { video_id, title, body: postBody, author_name } = body;

  if (!video_id || typeof postBody !== 'string' || !postBody.trim()) {
    return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 });
  }
  if (typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ error: '제목을 입력해주세요.' }, { status: 400 });
  }

  // 목록 정렬·기존 화면 호환을 위해 본문 첫 번째 시간 표기를 대표 타임스탬프로 저장
  const firstTime = splitTimestamps(postBody).find((p) => p.type === 'time');

  const { data, error } = await supabase
    .from('feedback_posts')
    .insert({
      video_id,
      title: title.trim().slice(0, FEEDBACK_TITLE_MAX),
      timestamp_seconds: firstTime && firstTime.type === 'time' ? firstTime.seconds : 0,
      body: postBody.trim(),
      author_name: author_name || null,
    })
    .select(FEEDBACK_SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: withVideoType(data) }, { status: 201 });
}
