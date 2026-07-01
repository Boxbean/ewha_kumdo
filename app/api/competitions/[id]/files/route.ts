import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 파일 목록 조회
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabase
    .from('competition_files')
    .select('*')
    .eq('competition_id', params.id)
    .order('created_at');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// 파일 메타 등록 (클라이언트에서 Storage 업로드 후 URL만 전달)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { file_url, file_name, file_type } = body;

  if (!file_url) return NextResponse.json({ error: 'file_url 필수' }, { status: 400 });

  const { data, error } = await supabase
    .from('competition_files')
    .insert({ competition_id: params.id, file_url, file_name, file_type })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

// 파일 삭제 (Storage + DB 모두)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { file_id, storage_path } = await req.json();
  if (!file_id) return NextResponse.json({ error: 'file_id 필수' }, { status: 400 });

  // Storage에서 파일 삭제 (경로 있는 경우)
  if (storage_path) {
    await supabase.storage.from('competition-files').remove([storage_path]);
  }

  const { error } = await supabase.from('competition_files').delete().eq('id', file_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
