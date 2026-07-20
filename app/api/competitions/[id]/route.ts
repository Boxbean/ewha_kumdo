import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await supabase
    .from('competitions')
    .select(`
      *,
      venue:venues(*),
      participants:competition_participants(*),
      files:competition_files(*)
    `)
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  // 요청 본문에 실제로 포함된 필드만 업데이트 — 일부 필드만 보내는 부분 수정(인라인 편집) 시
  // 빠진 필드가 undefined로 인해 다른 값(특히 venue_id)을 의도치 않게 지우지 않도록 함
  const update: Record<string, unknown> = {};
  for (const key of ['name', 'year', 'date_start', 'date_end', 'result_summary', 'entry_fee', 'notes'] as const) {
    if (key in body) update[key] = body[key];
  }
  if ('venue_id' in body) update.venue_id = body.venue_id || null;

  const { data, error } = await supabase
    .from('competitions')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabase.from('competitions').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
