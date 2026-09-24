-- ============================================================
-- 성능 개선: videos 테이블 정렬/필터 컬럼에 인덱스 추가
-- 실행 위치: Supabase Dashboard > SQL Editor
-- 배경: 홈/목록/주제별/캘린더/영상 상세(페어 영상) 페이지가 모두 date 또는
-- created_at 기준으로 정렬·필터링하는데 지금까지 해당 컬럼에 인덱스가 없어
-- 매 조회마다 순차 스캔(sequential scan)이 발생하고 있었음
-- ============================================================

create index if not exists videos_date_idx on videos (date desc);
create index if not exists videos_created_at_idx on videos (created_at desc);
