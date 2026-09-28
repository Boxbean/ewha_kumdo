import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminAuth';

// 관리자: 처리 안 된 비밀번호 분실 문의 목록
export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const { data, error } = await supabase
    .from('feedback_password_requests')
    .select('*, post:feedback_posts(id, title, author_name)')
    .is('resolved_at', null)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data || [] });
}

// 관리자: 문의 처리 완료 표시
export async function PATCH(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 });
  const { error } = await supabase
    .from('feedback_password_requests')
    .update({ resolved_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
