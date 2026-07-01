-- ============================================================
-- 이화검도부 대회 기능 마이그레이션
-- 실행 위치: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. 대회장 테이블
create table if not exists venues (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  address      text,
  parking_info text,
  court_count  int,
  floor_type   text,
  size_memo    text,
  access_memo  text,
  created_at   timestamptz default now()
);

-- 2. 대회 테이블
create table if not exists competitions (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  year           int  not null,
  date_start     date,
  date_end       date,
  venue_id       uuid references venues(id) on delete set null,
  result_summary text,
  entry_fee      int,
  notes          text,
  created_at     timestamptz default now()
);

create index if not exists competitions_year_idx on competitions (year);

-- 3. 출전자 테이블
create table if not exists competition_participants (
  id             uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions(id) on delete cascade,
  name           text not null,
  gender         text check (gender in ('여', '남', '혼성')),
  division       text,
  dan_kyu        text,
  result         text,
  notes          text
);

create index if not exists comp_participants_comp_idx on competition_participants (competition_id);

-- 4. 첨부 파일 테이블
create table if not exists competition_files (
  id             uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions(id) on delete cascade,
  file_type      text,
  file_url       text not null,
  file_name      text,
  created_at     timestamptz default now()
);

create index if not exists comp_files_comp_idx on competition_files (competition_id);

-- 5. videos 테이블에 competition_id 컬럼 추가
alter table videos
  add column if not exists competition_id uuid references competitions(id) on delete set null;

create index if not exists videos_competition_idx on videos (competition_id);

-- ============================================================
-- RLS (Row Level Security) 설정
-- anon: 읽기 허용 / 쓰기는 API 라우트를 통해서만 (서버사이드)
-- ============================================================

alter table venues enable row level security;
alter table competitions enable row level security;
alter table competition_participants enable row level security;
alter table competition_files enable row level security;

-- 읽기: 모든 사용자 허용
create policy if not exists "venues_select" on venues for select using (true);
create policy if not exists "competitions_select" on competitions for select using (true);
create policy if not exists "comp_participants_select" on competition_participants for select using (true);
create policy if not exists "comp_files_select" on competition_files for select using (true);

-- 쓰기: service_role 또는 anon 허용 (Next.js API 라우트 서버사이드에서만 호출)
-- 주의: anon key를 사용하는 경우 아래 정책 필요
create policy if not exists "venues_all" on venues for all using (true);
create policy if not exists "competitions_all" on competitions for all using (true);
create policy if not exists "comp_participants_all" on competition_participants for all using (true);
create policy if not exists "comp_files_all" on competition_files for all using (true);

-- ============================================================
-- Supabase Storage 버킷 생성
-- 아래 명령은 SQL Editor에서 직접 실행하거나
-- Dashboard > Storage > New Bucket 에서 수동으로 생성하세요.
-- Bucket 이름: competition-files
-- Public: true (공개 파일 URL)
-- ============================================================
-- insert into storage.buckets (id, name, public)
-- values ('competition-files', 'competition-files', true)
-- on conflict do nothing;
