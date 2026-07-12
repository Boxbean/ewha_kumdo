-- ============================================================
-- 이화검도부 대회장 시설 정보 확장 마이그레이션
-- 실행 위치: Supabase Dashboard > SQL Editor
-- ============================================================

alter table venues add column if not exists nearby_info text; -- 주변식당 및 편의시설
alter table venues add column if not exists notes text;       -- 경기장 특이사항
