-- ============================================================
-- 영상 구간(챕터) 저장용 컬럼 추가
-- 형식: [{ "label": "기본동작", "seconds": 510 }, ...] — seconds 오름차순
-- 가장 이른 구간이 "운동 시작점"으로 쓰여, 상세 페이지/알림 자동재생이 그 지점부터 시작됨
-- 실행 위치: Supabase Dashboard > SQL Editor
-- ============================================================

alter table videos
  add column if not exists chapters jsonb not null default '[]'::jsonb;
