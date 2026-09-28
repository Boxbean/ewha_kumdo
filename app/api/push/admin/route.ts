import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminAuth';

// 이 기기가 관리자 알림 기기인지 조회
export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const endpoint = new URL(req.url).searchParams.get('endpoint');
  if (!endpoint) return NextResponse.json({ is_admin: false });
  const { data } = await supabase.from('push_subscriptions').select('is_admin').eq('endpoint', endpoint).maybeSingle();
  return NextResponse.json({ is_admin: !!data?.is_admin });
}

// 관리자 알림 기기로 등록 — 구독 정보도 함께 저장(아직 일반 알림을 안 켠 기기여도 됨)
export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const { endpoint, keys } = await req.json();
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 });
  }
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      user_agent: req.headers.get('user-agent') || null,
      is_admin: true,
    },
    { onConflict: 'endpoint' }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// 관리자 알림만 해제 — 일반(새 영상) 알림 구독은 그대로 둠
export async function DELETE(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const { endpoint } = await req.json();
  if (!endpoint) return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 });
  const { error } = await supabase.from('push_subscriptions').update({ is_admin: false }).eq('endpoint', endpoint);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
