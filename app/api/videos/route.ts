import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const angle = searchParams.get('angle') || '';
  const participant = searchParams.get('participant') || '';
  const date = searchParams.get('date') || '';
  const limit = Number(searchParams.get('limit') || '10');
  const offset = Number(searchParams.get('offset') || '0');

  let query = supabase
    .from('videos')
    .select('*', { count: 'estimated' })
    .order('date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (angle) {
    query = query.eq('angle', angle);
  }
  if (participant) {
    query = query.contains('participants', [participant]);
  }
  if (date) {
    query = query.eq('date', date);
  }
  if (search && !angle && !participant && !date) {
    // 앵글 키워드 검색
    const angles = ['전면', '후면', '기타'];
    if (angles.includes(search)) {
      query = query.eq('angle', search);
    } else {
      // 제목, 주제, 참가자 이름 검색
      query = query.or(`title.ilike.%${search}%,topic.ilike.%${search}%,participants.cs.{"${search}"}`);
    }
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, count }, {
    headers: { 'Cache-Control': 'private, max-age=30' },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { youtube_url, title, date, angle, participants, topic, uploader } = body;

  if (!youtube_url || !title || !date || !angle) {
    return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('videos')
    .insert({ youtube_url, title, date, angle, participants: participants || [], topic, uploader })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
