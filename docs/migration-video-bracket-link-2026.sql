-- ============================================================
-- 영상 ↔ 대진표 매치 연결 (대진표에서 해당 경기 클릭 시 영상 바로 보기)
-- 실행 위치: Supabase Dashboard > SQL Editor
-- ============================================================

alter table videos
  add column if not exists bracket_match_id uuid references bracket_matches(id) on delete set null;

create index if not exists videos_bracket_match_idx on videos (bracket_match_id);
