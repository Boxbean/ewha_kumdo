import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get('year');
  const name = searchParams.get('name');
  const basic = searchParams.get('basic');

  // basic=1: 대회명 드롭다운 등 id/name/year만 필요한 화면용 — venue/participants/files/bracket_matches 조인·병합을 건너뛰어 매 요청 전체 브라켓 테이블 스캔을 피함
  if (basic) {
    let basicQuery = supabase
      .from('competitions')
      .select('id, name, year')
      .order('year', { ascending: false })
      .order('date_start', { ascending: false });

    if (year) basicQuery = basicQuery.eq('year', Number(year));
    if (name) basicQuery = basicQuery.eq('name', name);

    const { data, error } = await basicQuery;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, {
      headers: { 'Cache-Control': 'private, max-age=30' },
    });
  }

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

  // bracket_matches는 별도 조회 후 병합 — 테이블이 아직 없어도(마이그레이션 전) 대회 목록 자체는 정상 응답되도록 함
  const { data: bracketData } = await supabase.from('bracket_matches').select('*');
  const bracketByCompetition = new Map<string, unknown[]>();
  for (const row of (bracketData as { competition_id: string }[]) || []) {
    const list = bracketByCompetition.get(row.competition_id) || [];
    list.push(row);
    bracketByCompetition.set(row.competition_id, list);
  }
  const withBrackets = (data || []).map((c: { id: string }) => ({
    ...c,
    bracket_matches: bracketByCompetition.get(c.id) || [],
  }));

  return NextResponse.json({ data: withBrackets }, {
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
