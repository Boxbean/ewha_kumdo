import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import Papa from 'papaparse';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await supabase
    .from('competition_participants')
    .select('*')
    .eq('competition_id', id)
    .order('division')
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contentType = req.headers.get('content-type') || '';
  let rows: Array<{
    competition_id: string;
    name: string;
    gender?: string;
    division?: string;
    dan_kyu?: string;
    result?: string;
    notes?: string;
  }> = [];

  if (contentType.includes('application/json')) {
    const body = await req.json();

    if (typeof body.csv === 'string') {
      const parsed = Papa.parse<{
        name: string; gender?: string; division?: string;
        dan_kyu?: string; result?: string; notes?: string;
      }>(body.csv, { header: true, skipEmptyLines: true });

      rows = parsed.data.map((r) => ({
        competition_id: id,
        name: r.name?.trim() || '',
        gender: r.gender?.trim() || undefined,
        division: r.division?.trim() || undefined,
        dan_kyu: r.dan_kyu?.trim() || undefined,
        result: r.result?.trim() || undefined,
        notes: r.notes?.trim() || undefined,
      })).filter((r) => r.name);
    } else {
      const { name, gender, division, dan_kyu, result, notes } = body;
      if (!name) return NextResponse.json({ error: '이름은 필수입니다' }, { status: 400 });
      rows = [{ competition_id: id, name, gender, division, dan_kyu, result, notes }];
    }
  }

  if (rows.length === 0) return NextResponse.json({ error: '등록할 출전자가 없습니다' }, { status: 400 });

  const { data, error } = await supabase.from('competition_participants').insert(rows).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, count: rows.length }, { status: 201 });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { participants } = await req.json();

  await supabase.from('competition_participants').delete().eq('competition_id', id);

  if (!participants || participants.length === 0) {
    return NextResponse.json({ data: [], count: 0 });
  }

  const rows = participants.map((p: Record<string, string>) => ({
    ...p,
    competition_id: id,
  }));

  const { data, error } = await supabase.from('competition_participants').insert(rows).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, count: rows.length });
}
