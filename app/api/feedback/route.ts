import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { FeedbackPost } from '@/lib/types';
import { FEEDBACK_TITLE_MAX, splitTimestamps } from '@/lib/utils';
import { authorToken, FEEDBACK_PASSWORD_PATTERN } from '@/lib/feedbackAuth';
import { findOrCreateVideoFromYouTube } from '@/lib/feedbackVideo';

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

// 등록은 로그인 없이 개방 — 수정/삭제는 글 비밀번호(숫자 4자리) 또는 관리자 비밀번호로 보호
// 영상은 사이트 영상 선택(video_id) 또는 유튜브 링크(youtube_url → 정규 영상으로 등록) 중 하나.
// 시간 표기는 본문 안에 여러 개 적는 방식
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { youtube_url, title, body: postBody, author_name, password } = body;
  let { video_id } = body;

  if ((!video_id && !youtube_url) || typeof postBody !== 'string' || !postBody.trim()) {
    return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 });
  }
  if (typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ error: '제목을 입력해주세요.' }, { status: 400 });
  }
  if (typeof password !== 'string' || !FEEDBACK_PASSWORD_PATTERN.test(password)) {
    return NextResponse.json({ error: '비밀번호는 숫자 4자리로 입력해주세요.' }, { status: 400 });
  }

  if (!video_id) {
    const result = await findOrCreateVideoFromYouTube(String(youtube_url), author_name || null);
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 });
    video_id = result.id;
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

  // 비밀번호를 못 걸면 아무도 수정/삭제할 수 없는 글이 되므로 등록 자체를 되돌림
  const { data: saved, error: pwError } = await supabase.rpc('set_feedback_password', { p_post_id: data.id, p_password: password });
  if (pwError || saved !== true) {
    await supabase.from('feedback_posts').delete().eq('id', data.id);
    return NextResponse.json({ error: '비밀번호 저장에 실패했습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 });
  }

  return NextResponse.json({ data: withVideoType(data), author_token: authorToken(data.id) }, { status: 201 });
}
