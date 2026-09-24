-- ============================================================
-- 피드백 게시판 기능 마이그레이션
-- 실행 위치: Supabase Dashboard > SQL Editor
-- 주의: shorts 테이블(migration-shorts-2026.sql)을 먼저 실행해야 함 (FK 의존)
-- ============================================================

create table if not exists feedback_posts (
  id                uuid primary key default gen_random_uuid(),
  video_id          uuid references videos(id) on delete cascade,
  shorts_id         uuid references shorts(id) on delete cascade,
  timestamp_seconds int not null default 0,
  body              text not null,
  author_name       text,
  created_at        timestamptz default now(),
  constraint feedback_posts_exactly_one_video check (
    (video_id is not null and shorts_id is null) or
    (video_id is null and shorts_id is not null)
  )
);

create index if not exists feedback_posts_video_idx on feedback_posts (video_id);
create index if not exists feedback_posts_shorts_idx on feedback_posts (shorts_id);
create index if not exists feedback_posts_created_at_idx on feedback_posts (created_at desc);

create table if not exists feedback_comments (
  id                uuid primary key default gen_random_uuid(),
  feedback_post_id  uuid not null references feedback_posts(id) on delete cascade,
  body              text not null,
  author_name       text,
  created_at        timestamptz default now()
);

create index if not exists feedback_comments_post_idx on feedback_comments (feedback_post_id);

-- ============================================================
-- RLS (Row Level Security) 설정
-- anon: 읽기/등록(게시글·댓글) 모두 허용, 삭제는 API 라우트의 관리자 비밀번호 체크로만 방어
-- ============================================================

alter table feedback_posts enable row level security;
alter table feedback_comments enable row level security;

drop policy if exists "feedback_posts_select" on feedback_posts;
create policy "feedback_posts_select" on feedback_posts for select using (true);
drop policy if exists "feedback_posts_all" on feedback_posts;
create policy "feedback_posts_all" on feedback_posts for all using (true);

drop policy if exists "feedback_comments_select" on feedback_comments;
create policy "feedback_comments_select" on feedback_comments for select using (true);
drop policy if exists "feedback_comments_all" on feedback_comments;
create policy "feedback_comments_all" on feedback_comments for all using (true);
