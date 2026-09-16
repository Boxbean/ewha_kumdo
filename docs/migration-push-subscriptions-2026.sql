-- ============================================================
-- 웹 푸시 알림 구독 정보 저장용 테이블 (VAPID 기반, 자체 호스팅)
-- 실행 위치: Supabase Dashboard > SQL Editor
-- ============================================================

create table if not exists push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  endpoint    text not null unique,      -- 기기/브라우저별 고유 푸시 엔드포인트 URL (계정 시스템이 없어 이것이 곧 식별자)
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_all" on push_subscriptions;
create policy "push_subscriptions_all" on push_subscriptions for all using (true);
