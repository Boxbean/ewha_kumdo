import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const body = await req.json();
  const {
    division, event_type, side, round, match_no, match_label,
    player1_name, player1_club, player1_is_ours,
    player2_name, player2_club, player2_is_ours,
    winner_slot, is_bye, third_place_match, notes,
  } = body;

  const { data, error } = await supabase
    .from('bracket_matches')
    .update({
      division, event_type, side, round, match_no, match_label,
      player1_name, player1_club, player1_is_ours,
      player2_name, player2_club, player2_is_ours,
      winner_slot: winner_slot || null, is_bye, third_place_match, notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', matchId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const { error } = await supabase.from('bracket_matches').delete().eq('id', matchId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
