import { createClient } from '@supabase/supabase-js';

// 빌드 타임에 환경변수가 없을 경우 플레이스홀더 사용 (실제 요청 시 env가 주입됨)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);
