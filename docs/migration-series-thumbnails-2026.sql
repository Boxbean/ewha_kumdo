-- ============================================================
-- 대회 시리즈(대회별 카드) 썸네일 이미지 저장용 테이블
-- 실행 위치: Supabase Dashboard > SQL Editor
-- ============================================================

create table if not exists series_thumbnails (
  series_key text primary key,
  thumbnail_url text,
  updated_at timestamptz not null default now()
);
