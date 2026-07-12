import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, address, parking_info, court_count, floor_type, size_memo, access_memo, nearby_info, notes } = body;

  if (!name) return NextResponse.json({ error: '대회장명은 필수입니다' }, { status: 400 });

  const { data, error } = await supabase
    .from('venues')
    .insert({ name, address, parking_info, court_count, floor_type, size_memo, access_memo, nearby_info, notes })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
