import { NextRequest, NextResponse, after } from 'next/server';
import { revalidatesSite } from '@/lib/revalidate';
import { supabase } from '@/lib/supabase';
import { Video } from '@/lib/types';
import { requireAdmin } from '@/lib/adminAuth';
import { sendPushToAllSubscribers } from '@/lib/push';
import { normalizeChapters } from '@/lib/utils';
import { applyFilters, fetchVideosPage, parseFilters, VIDEO_SELECT } from '@/lib/videoQueries';

// 같은 날짜 영상(전면/후면 등)이 이 기간 안에 이미 등록됐다면 알림을 이미 보낸 것으로 보고 생략
const PUSH_DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000;

async function notifyNewVideo(video: Video) {
  const since = new Date(Date.now() - PUSH_DEDUPE_WINDOW_MS).toISOString();
  const { count } = await supabase
    .from('videos')
    .select('id', { count: 'exact', head: true })
    .eq('date', video.date)
    .neq('id', video.id)
    .gte('created_at', since);
  if (count) return;

  const [, monthStr, dayStr] = video.date.split('-');
  const dayLabel = `${Number(monthStr)}월 ${Number(dayStr)}일`;
  let title = `${dayLabel} ${video.topic || '운동'} 영상이 업로드되었어요!`;
  if (video.competition_id) {
    const { data: comp } = await supabase.from('competitions').select('name').eq('id', video.competition_id).single();
    if (comp?.name) title = `${comp.name} 영상이 업로드되었어요!`;
  }

  // 알림을 누르면 상세 페이지에서 운동 시작점부터 바로(음소거) 재생
  await sendPushToAllSubscribers({ title, body: '', url: `/video/${video.id}?autoplay=1` });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filters = parseFilters(searchParams);
  const limit = Number(searchParams.get('limit') || '10');
  const offset = Number(searchParams.get('offset') || '0');

  // 목록 탭: 최근 업로드 우선 노출 없이 운동 날짜 최신순 그대로
  if (searchParams.get('order') === 'date') {
    const { data, count, error } = await applyFilters(supabase.from('videos').select(VIDEO_SELECT, { count: 'exact' }), filters)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data: (data as Video[]) || [], count: count ?? 0 }, {
      headers: { 'Cache-Control': 'private, max-age=30' },
    });
  }

  try {
    const result = await fetchVideosPage(supabase, filters, limit, offset);
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'private, max-age=30' },
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export const POST = revalidatesSite(async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const body = await req.json();
  const { youtube_url, title, date, angle, participants, topic, uploader, competition_id, chapters } = body;

  if (!youtube_url || !title || !date || !angle) {
    return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('videos')
    .insert({ youtube_url, title, date, angle, participants: participants || [], topic, uploader, competition_id: competition_id || null, chapters: normalizeChapters(chapters) })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  after(() => notifyNewVideo(data as Video));

  return NextResponse.json({ data }, { status: 201 });
});
