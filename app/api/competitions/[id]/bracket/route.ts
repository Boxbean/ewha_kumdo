import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const division = searchParams.get('division');
  const eventType = searchParams.get('event_type');

  let query = supabase
    .from('bracket_matches')
    .select('*')
    .eq('competition_id', id)
    .order('division')
    .order('event_type')
    .order('side')
    .order('round')
    .order('match_no');

  if (division) query = query.eq('division', division);
  if (eventType) query = query.eq('event_type', eventType);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const {
    division, event_type, side, round, match_no, match_label,
    player1_name, player1_club, player1_is_ours,
    player2_name, player2_club, player2_is_ours,
    winner_slot, is_bye, third_place_match, notes,
  } = body;

  if (!division || !side || !round || !match_no) {
    return NextResponse.json({ error: '부문/조/라운드/순번은 필수입니다' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('bracket_matches')
    .insert({
      competition_id: id,
      division, event_type: event_type || '개인전', side, round, match_no, match_label,
      player1_name, player1_club, player1_is_ours: !!player1_is_ours,
      player2_name, player2_club, player2_is_ours: !!player2_is_ours,
      winner_slot: winner_slot || null, is_bye: !!is_bye, third_place_match: !!third_place_match,
      notes,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
