-- ============================================================
-- 피드백 게시판 개편: 게시글 제목, 대댓글(1단계), 댓글 좋아요
-- 실행 위치: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. 게시글 제목(요약) — 기존 글은 비어 있어도 됨(카드에서 본문 앞부분으로 대체 표시)
alter table feedback_posts add column if not exists title text;

-- 2. 대댓글 — 부모 댓글이 지워지면 대댓글도 함께 삭제. 1단계 제한은 API에서 검사
alter table feedback_comments
  add column if not exists parent_id uuid references feedback_comments(id) on delete cascade;
create index if not exists feedback_comments_parent_idx on feedback_comments (parent_id);

-- 3. 댓글 좋아요 수 — 로그인이 없어 기기(브라우저)당 1회는 클라이언트에서 관리
alter table feedback_comments add column if not exists like_count int not null default 0;

-- 좋아요 +1/-1을 동시에 눌러도 값이 꼬이지 않도록 DB에서 원자적으로 증감 (0 미만으로 내려가지 않음)
create or replace function adjust_feedback_comment_like(p_comment_id uuid, p_delta int)
returns int
language sql
as $$
  update feedback_comments
     set like_count = greatest(0, like_count + p_delta)
   where id = p_comment_id
  returning like_count;
$$;
