import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await supabase
    .from('competition_files')
    .select('*')
    .eq('competition_id', id)
    .order('created_at');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { file_url, file_name, file_type } = body;

  if (!file_url) return NextResponse.json({ error: 'file_url 필수' }, { status: 400 });

  const { data, error } = await supabase
    .from('competition_files')
    .insert({ competition_id: id, file_url, file_name, file_type })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params;
  const { file_id, storage_path } = await req.json();
  if (!file_id) return NextResponse.json({ error: 'file_id 필수' }, { status: 400 });

  if (storage_path) {
    await supabase.storage.from('competition-files').remove([storage_path]);
  }

  const { error } = await supabase.from('competition_files').delete().eq('id', file_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
