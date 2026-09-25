import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { detectPlatform } from '@/lib/utils';
import { fetchLinkMeta, fallbackTitle } from '@/lib/linkMeta';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get('limit') || '12');
  const offset = Number(searchParams.get('offset') || '0');
  // PostgREST or() 절 구분자(쉼표/괄호/따옴표)는 제거해 검색어로 필터 절을 주입하지 못하게 함
  const search = (searchParams.get('search') || '').replace(/[,()"%]/g, '').trim();

  let query = supabase
    .from('shorts')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });
  if (search) query = query.or(`title.ilike.%${search}%,submitter_name.ilike.%${search}%`);

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data, count: count ?? 0 }, {
    headers: { 'Cache-Control': 'private, max-age=30' },
  });
}

// 등록은 로그인 없이 개방 — 삭제만 관리자 비밀번호로 보호 (기존 사이트 신뢰 모델과 동일)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { video_url, submitter_name } = body;
  let { title, thumbnail_url } = body;

  if (!video_url) {
    return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 });
  }

  // 제목/썸네일이 없으면 서버가 한 번 더 시도하고, 그래도 없으면 기본 제목 + 썸네일 없음으로 자동 등록
  if (!title || !thumbnail_url) {
    const meta = await fetchLinkMeta(video_url);
    title = title || meta.title || fallbackTitle(video_url);
    thumbnail_url = thumbnail_url || meta.thumbnail_url;
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
