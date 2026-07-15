-- ============================================================
-- 대진표(토너먼트 브라켓) 매치 데이터 저장용 테이블
-- 실행 위치: Supabase Dashboard > SQL Editor
-- ============================================================

create table if not exists bracket_matches (
  id                uuid primary key default gen_random_uuid(),
  competition_id    uuid not null references competitions(id) on delete cascade,

  division          text not null,                  -- "남자노년부" 등 (자유 텍스트)
  event_type        text not null default '개인전',  -- '개인전' | '단체전'

  side              text not null check (side in ('A','B','final')),
  round             int  not null check (round >= 1),
  match_no          int  not null check (match_no >= 1),

  match_label       text,   -- 매치 코드 표기용 (예: "5-8"), 점수 아님, 선택 입력

  player1_name      text,
  player1_club      text,
  player1_is_ours   boolean not null default false,

  player2_name      text,
  player2_club      text,
  player2_is_ours   boolean not null default false,

  winner_slot       text check (winner_slot in ('player1','player2')),
  is_bye            boolean not null default false,
  third_place_match boolean not null default false,

  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  unique (competition_id, division, event_type, side, round, match_no)
);

create index if not exists bracket_matches_comp_idx on bracket_matches (competition_id);
create index if not exists bracket_matches_comp_div_idx on bracket_matches (competition_id, division, event_type);

alter table bracket_matches enable row level security;

create policy if not exists "bracket_matches_select" on bracket_matches for select using (true);
create policy if not exists "bracket_matches_all" on bracket_matches for all using (true);
