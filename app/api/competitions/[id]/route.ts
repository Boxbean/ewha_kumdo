import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabase
    .from('competitions')
    .select(`
      *,
      venue:venues(*),
      participants:competition_participants(*),
      files:competition_files(*)
    `)
    .eq('id', params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { name, year, date_start, date_end, venue_id, result_summary, entry_fee, notes } = body;

  const { data, error } = await supabase
    .from('competitions')
    .update({ name, year, date_start, date_end, venue_id: venue_id || null, result_summary, entry_fee, notes })
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  // CASCADE로 participants, files도 함께 삭제됨
  const { error } = await supabase.from('competitions').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
