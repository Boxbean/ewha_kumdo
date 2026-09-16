import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET() {
  const { data, error } = await supabase
    .from('series_thumbnails')
    .select('*');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const body = await req.json();
  const { series_key, thumbnail_url } = body;

  if (!series_key) return NextResponse.json({ error: 'series_key는 필수입니다' }, { status: 400 });

  const { data, error } = await supabase
    .from('series_thumbnails')
    .upsert({ series_key, thumbnail_url, updated_at: new Date().toISOString() }, { onConflict: 'series_key' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
