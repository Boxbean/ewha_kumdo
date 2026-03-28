import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

// 서버 컴포넌트/API 라우트에서 매 요청마다 신선한 클라이언트 반환
export function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// 하위 호환 — 클라이언트 컴포넌트용 싱글톤 (브라우저에서만 사용)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
