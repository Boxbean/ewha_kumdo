import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 누구나 옵트인 가능한 공개 엔드포인트 — 계정 시스템이 없어 관리자 인증 불필요
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { endpoint, keys } = body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 });
  }

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      user_agent: req.headers.get('user-agent') || null,
    },
    { onConflict: 'endpoint' }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { endpoint } = await req.json();
  if (!endpoint) return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 });

  const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
