import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  // 요청 본문에 실제로 포함된 필드만 업데이트 — 인라인 편집처럼 일부 필드만 보내는 호출이 나머지 값을 지우지 않도록 함
  const update: Record<string, unknown> = {};
  for (const key of ['name', 'address', 'parking_info', 'court_count', 'floor_type', 'size_memo', 'access_memo', 'nearby_info', 'notes'] as const) {
    if (key in body) update[key] = body[key];
  }

  const { data, error } = await supabase
    .from('venues')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabase.from('venues').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
