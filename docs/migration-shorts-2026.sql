-- ============================================================
-- 검도쇼츠 기능 마이그레이션
-- 실행 위치: Supabase Dashboard > SQL Editor
-- ============================================================

create table if not exists shorts (
  id              uuid primary key default gen_random_uuid(),
  video_url       text not null,
  platform        text not null check (platform in ('youtube', 'instagram', 'other')),
  title           text not null,
  thumbnail_url   text,
  submitter_name  text,
  created_at      timestamptz default now()
);

create index if not exists shorts_created_at_idx on shorts (created_at desc);

-- ============================================================
-- RLS (Row Level Security) 설정
-- anon: 읽기 허용 / 쓰기(등록)도 로그인 없이 허용, 삭제는 API 라우트의 관리자 비밀번호 체크로만 방어
-- ============================================================

alter table shorts enable row level security;

drop policy if exists "shorts_select" on shorts;
create policy "shorts_select" on shorts for select using (true);

drop policy if exists "shorts_all" on shorts;
create policy "shorts_all" on shorts for all using (true);
