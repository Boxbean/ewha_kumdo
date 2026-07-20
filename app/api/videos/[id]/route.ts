import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  // 요청 본문에 실제로 포함된 필드만 업데이트 — 대진표 매치 연결처럼 일부 필드만 보내는
  // 호출이 competition_id 등 나머지 값을 의도치 않게 지우지 않도록 함
  const update: Record<string, unknown> = {};
  for (const key of ['youtube_url', 'title', 'date', 'angle', 'participants', 'topic', 'uploader'] as const) {
    if (key in body) update[key] = body[key];
  }
  if ('competition_id' in body) update.competition_id = body.competition_id ?? null;
  if ('bracket_match_id' in body) update.bracket_match_id = body.bracket_match_id ?? null;

  const { data, error } = await supabase
    .from('videos')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabase.from('videos').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
