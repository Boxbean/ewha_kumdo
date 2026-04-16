import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Supabase 환경변수가 설정되지 않았습니다.\n' +
    'NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY를 .env.local에서 확인하세요.'
  );
}

// 서버 컴포넌트/API 라우트에서 매 요청마다 신선한 클라이언트 반환
export function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// 하위 호환 — 클라이언트 컴포넌트용 싱글톤 (브라우저에서만 사용)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
