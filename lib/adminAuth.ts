import { NextRequest, NextResponse } from 'next/server';

// 관리자 전용 쓰기 라우트 맨 앞에서 호출 — 반환값이 있으면 그대로 응답하고 핸들러를 중단할 것
export function requireAdmin(req: NextRequest): NextResponse | null {
  const password = req.headers.get('x-admin-password');
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 });
  }
  return null;
}
