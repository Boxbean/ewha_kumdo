import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 게시글 비밀번호: 숫자 4자리
export const FEEDBACK_PASSWORD_PATTERN = /^\d{4}$/;

// 글쓴이 기기 표시용 토큰 — 서버 비밀값으로 서명해서 DB에 저장할 필요가 없음
// 글 등록 직후나 비밀번호 확인 후 내려주고, 기기에 저장해 두었다가 댓글에 실어 보냄
export function authorToken(postId: string): string {
  return createHmac('sha256', process.env.ADMIN_PASSWORD || '')
    .update(`feedback-author:${postId}`)
    .digest('hex');
}

export function isValidAuthorToken(postId: string, token: unknown): boolean {
  if (typeof token !== 'string' || !token) return false;
  const expected = Buffer.from(authorToken(postId));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

// 해시는 anon 키로 읽을 수 없는 테이블에 있어 DB 함수로만 확인
export async function checkPostPassword(postId: string, password: unknown): Promise<boolean> {
  if (typeof password !== 'string' || !FEEDBACK_PASSWORD_PATTERN.test(password)) return false;
  const { data, error } = await supabase.rpc('check_feedback_password', { p_post_id: postId, p_password: password });
  return !error && data === true;
}

// 게시글 수정/삭제: 관리자 비밀번호 또는 해당 글 비밀번호 — 반환값이 있으면 그대로 응답하고 중단
export async function requireAdminOrPostPassword(req: NextRequest, postId: string): Promise<NextResponse | null> {
  const adminPassword = req.headers.get('x-admin-password');
  if (adminPassword && adminPassword === process.env.ADMIN_PASSWORD) return null;
  if (await checkPostPassword(postId, req.headers.get('x-feedback-password'))) return null;
  return NextResponse.json({ error: '비밀번호가 올바르지 않습니다.' }, { status: 401 });
}
