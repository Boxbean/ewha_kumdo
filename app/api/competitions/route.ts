import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get('year');
  const name = searchParams.get('name');

  let query = supabase
    .from('competitions')
    .select(`
      *,
      venue:venues(*),
      participants:competition_participants(*),
      files:competition_files(*)
    `)
    .order('year', { ascending: false })
    .order('date_start', { ascending: false });

  if (year) query = query.eq('year', Number(year));
  if (name) query = query.eq('name', name);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, year, date_start, date_end, venue_id, result_summary, entry_fee, notes } = body;

  if (!name || !year) {
    return NextResponse.json({ error: '대회명과 연도는 필수입니다' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('competitions')
    .insert({ name, year, date_start, date_end, venue_id: venue_id || null, result_summary, entry_fee, notes })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
