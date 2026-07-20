import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Video } from '@/lib/types';

// 등록된 지 이 기간 이내인 영상은 경기일(date) 순서를 무시하고 최신 등록순으로 맨 앞에 노출
const RECENT_UPLOAD_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const angle = searchParams.get('angle') || '';
  const participant = searchParams.get('participant') || '';
  const date = searchParams.get('date') || '';
  const competition_id = searchParams.get('competition_id') || '';
  const limit = Number(searchParams.get('limit') || '10');
  const offset = Number(searchParams.get('offset') || '0');

  let query = supabase.from('videos').select('*');

  if (angle) {
    query = query.eq('angle', angle);
  }
  if (participant) {
    query = query.contains('participants', [participant]);
  }
  if (date) {
    query = query.eq('date', date);
  }
  if (competition_id) {
    query = query.eq('competition_id', competition_id);
  }
  if (search && !angle && !participant && !date && !competition_id) {
    // 앵글 키워드 검색
    const angles = ['전면', '후면', '기타'];
    if (angles.includes(search)) {
      query = query.eq('angle', search);
    } else {
      // 제목, 주제, 참가자 이름 검색
      query = query.or(`title.ilike.%${search}%,topic.ilike.%${search}%,participants.cs.{"${search}"}`);
    }
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 경기일 순서와 등록순 정렬을 한 쿼리로 표현할 수 없어 앱 레벨에서 정렬 후 페이지네이션 적용
  const cutoff = Date.now() - RECENT_UPLOAD_WINDOW_MS;
  const rows = (data as Video[]) || [];
  const recentlyUploaded = rows.filter((v) => new Date(v.created_at).getTime() >= cutoff);
  const rest = rows.filter((v) => new Date(v.created_at).getTime() < cutoff);

  recentlyUploaded.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  rest.sort((a, b) => b.date.localeCompare(a.date) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const sorted = [...recentlyUploaded, ...rest];
  const paged = sorted.slice(offset, offset + limit);

  return NextResponse.json({ data: paged, count: sorted.length }, {
    headers: { 'Cache-Control': 'private, max-age=30' },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { youtube_url, title, date, angle, participants, topic, uploader, competition_id } = body;

  if (!youtube_url || !title || !date || !angle) {
    return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('videos')
    .insert({ youtube_url, title, date, angle, participants: participants || [], topic, uploader, competition_id: competition_id || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
