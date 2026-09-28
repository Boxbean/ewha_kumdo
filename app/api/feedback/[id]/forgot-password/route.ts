import { NextRequest, NextResponse, after } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendPushToAdmins } from '@/lib/push';

const NAME_MAX = 30;
const MESSAGE_MAX = 300;

// 비밀번호 분실 문의 — 관리자 화면에 쌓이고, 관리자 알림 기기로 푸시가 감
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { requester_name, message } = await req.json();
  if (typeof requester_name !== 'string' || !requester_name.trim()) {
    return NextResponse.json({ error: '연락받을 이름을 입력해주세요.' }, { status: 400 });
  }

  const { data: post } = await supabase.from('feedback_posts').select('id, title').eq('id', id).single();
  if (!post) return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });

  // 같은 글에 아직 처리 안 된 문의가 있으면 새로 쌓지 않음 (알림 중복 방지)
  const { data: open } = await supabase
    .from('feedback_password_requests')
    .select('id')
    .eq('feedback_post_id', id)
    .is('resolved_at', null)
    .limit(1);
  if (open && open.length > 0) return NextResponse.json({ ok: true, duplicate: true });

  const name = requester_name.trim().slice(0, NAME_MAX);
  const { error } = await supabase.from('feedback_password_requests').insert({
    feedback_post_id: id,
    requester_name: name,
    message: typeof message === 'string' && message.trim() ? message.trim().slice(0, MESSAGE_MAX) : null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  after(() =>
    sendPushToAdmins({
      title: '🔑 피드백 비밀번호 분실 문의',
      body: `${name} — "${post.title || '피드백 요청'}"`,
      url: '/admin?tab=feedback',
    })
  );
  return NextResponse.json({ ok: true }, { status: 201 });
}
