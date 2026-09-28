-- ============================================================
-- 피드백 게시글 비밀번호, 글쓴이 댓글 표시, 비밀번호 분실 문의, 관리자 알림 기기
-- 실행 위치: Supabase Dashboard > SQL Editor
-- 주의: 코드 배포 전에 먼저 실행할 것 (새 글 등록이 set_feedback_password를 호출함)
-- ============================================================

create extension if not exists pgcrypto with schema extensions;

-- 1. 게시글 비밀번호 — 해시는 별도 테이블에 두고 RLS 정책을 만들지 않아 anon 키로 직접 읽거나 쓸 수 없게 함
--    (feedback_posts는 공개 읽기라 같은 테이블에 두면 누구나 해시를 가져갈 수 있음)
create table if not exists feedback_post_secrets (
  feedback_post_id uuid primary key references feedback_posts(id) on delete cascade,
  password_hash    text not null,
  created_at       timestamptz default now()
);
alter table feedback_post_secrets enable row level security;

-- 비밀번호는 글마다 한 번만 설정 가능 (이미 있으면 false) — 남의 글 비밀번호를 덮어쓸 수 없음
create or replace function set_feedback_password(p_post_id uuid, p_password text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  insert into feedback_post_secrets (feedback_post_id, password_hash)
  values (p_post_id, crypt(p_password, gen_salt('bf')))
  on conflict (feedback_post_id) do nothing;
  return found;
end;
$$;

create or replace function check_feedback_password(p_post_id uuid, p_password text)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1 from feedback_post_secrets
     where feedback_post_id = p_post_id
       and password_hash = crypt(p_password, password_hash)
  );
$$;

-- 기존 게시글은 비밀번호 1212
insert into feedback_post_secrets (feedback_post_id, password_hash)
select id, extensions.crypt('1212', extensions.gen_salt('bf')) from feedback_posts
on conflict (feedback_post_id) do nothing;

-- 2. 글쓴이가 남긴 댓글/답글 표시 (말풍선 꼬리 방향)
alter table feedback_comments add column if not exists is_author boolean not null default false;

-- 3. 비밀번호 분실 문의 — 관리자 화면에서 확인 후 처리
create table if not exists feedback_password_requests (
  id               uuid primary key default gen_random_uuid(),
  feedback_post_id uuid not null references feedback_posts(id) on delete cascade,
  requester_name   text,
  message          text,
  created_at       timestamptz default now(),
  resolved_at      timestamptz
);
create index if not exists feedback_password_requests_open_idx
  on feedback_password_requests (created_at desc) where resolved_at is null;

alter table feedback_password_requests enable row level security;
drop policy if exists "feedback_password_requests_all" on feedback_password_requests;
create policy "feedback_password_requests_all" on feedback_password_requests for all using (true);

-- 4. 관리자(개발자) 알림을 받을 기기 표시
alter table push_subscriptions add column if not exists is_admin boolean not null default false;
