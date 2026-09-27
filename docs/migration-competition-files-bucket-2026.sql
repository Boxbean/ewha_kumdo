-- ============================================================
-- 대회 첨부파일(썸네일·팜플렛) 저장소 버킷 생성
-- 기존 migration-competition-2026.sql에서는 버킷 생성이 주석으로만 남아 있어 실제로 만들어지지 않았음
-- → 업로드 시 "Bucket not found" 오류
-- 실행 위치: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. 공개 버킷 (파일 URL로 누구나 열람) — 이미지/PDF만, 파일당 10MB 제한
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'competition-files',
  'competition-files',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2. 접근 정책 — 관리자 화면(브라우저)에서 anon 키로 직접 업로드하고,
--    삭제는 서버 API(역시 anon 키)에서 하므로 이 버킷에 한해 anon 읽기/쓰기/삭제 허용
--    (다른 테이블의 기존 신뢰 모델과 동일: 쓰기 화면은 관리자 비밀번호로 보호)
drop policy if exists "competition_files_bucket_select" on storage.objects;
create policy "competition_files_bucket_select" on storage.objects
  for select using (bucket_id = 'competition-files');

drop policy if exists "competition_files_bucket_insert" on storage.objects;
create policy "competition_files_bucket_insert" on storage.objects
  for insert with check (bucket_id = 'competition-files');

drop policy if exists "competition_files_bucket_update" on storage.objects;
create policy "competition_files_bucket_update" on storage.objects
  for update using (bucket_id = 'competition-files');

drop policy if exists "competition_files_bucket_delete" on storage.objects;
create policy "competition_files_bucket_delete" on storage.objects
  for delete using (bucket_id = 'competition-files');
