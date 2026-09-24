import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { detectPlatform } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get('limit') || '12');
  const offset = Number(searchParams.get('offset') || '0');

  const { data, error, count } = await supabase
    .from('shorts')
    .select('*', { count: 'estimated' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data, count: count ?? 0 }, {
    headers: { 'Cache-Control': 'private, max-age=30' },
  });
}

// 등록은 로그인 없이 개방 — 삭제만 관리자 비밀번호로 보호 (기존 사이트 신뢰 모델과 동일)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { video_url, title, thumbnail_url, submitter_name } = body;

  if (!video_url || !title) {
    return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 });
  }

  const platform = detectPlatform(video_url);

  const { data, error } = await supabase
    .from('shorts')
    .insert({ video_url, title, platform, thumbnail_url: thumbnail_url || null, submitter_name: submitter_name || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
