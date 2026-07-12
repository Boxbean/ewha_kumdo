---
name: handover
description: Write a session handover doc into docs/handover-YYYY-MM-DD.md for this project (ewha_kumdo), summarizing what changed, what's committed vs. pending, and what's left to do. Use when the user asks to write a handover/인수인계, wrap up a session, or hand off context to the next session.
---

# Handover doc generator (ewha_kumdo)

When invoked, write a new file at `docs/handover-<today's date, YYYY-MM-DD>.md` in this project, summarizing the current session's work. Follow the exact structure and tone of the existing docs in this folder (`docs/handover-2026-06-29.md`, `docs/handover-2026-07-12.md`) — Korean, table-heavy, terse.

## Steps

1. Gather the facts before writing anything:
   - `git log --oneline -15` and `git status --short` in the project root to see what's committed vs. still pending.
   - `git diff --stat` (and read the actual diffs for anything non-trivial) for uncommitted changes.
   - Anything from the current conversation that git can't show: manual steps the user still owes (e.g. running a SQL migration in the Supabase dashboard, filling in `.env.local`, installing something locally) — these are often the most important part of a handover and are easy to forget since they leave no trace in git.
2. Write the doc using this section order (skip a section only if it's genuinely empty):
   - `# 핸드오버 문서 — <one-line summary of the session> (<date>)`
   - `## 변경 요약` — 2-3 sentences, what changed and why, and whether it's fully committed/pushed or still pending.
   - `## 커밋되어 push까지 완료된 작업` — table of `커밋 | 내용` for anything already on the remote.
   - `## 아직 커밋 안 된 변경사항` (omit if working tree is clean) — broken into 새로 추가된 파일 / 대체된 파일(경로 변경) / 수정된 기존 파일, each as a table with a short "why" per row, not just a restatement of the filename.
   - `## 배포 전 필수 작업` — anything the user (not Claude) still needs to do by hand: SQL migrations, env vars, manual QA, explicit go-ahead before a commit/push. Be explicit about what's blocking what.
   - `## 기능 사용 흐름` — how to actually use whatever was built, from a user's perspective, as short numbered/bulleted flows.
   - `## 알려진 제약 / 유의사항` — anything a future session (or the user) could easily get wrong or forget, especially non-obvious constraints baked into the current implementation.
3. Do not touch `docs/HANDOVER.md` (the master rolling doc) unless the user separately asks for it — it's a different, broader document from the dated per-session snapshots this skill produces.
4. After writing the file, tell the user the path and a one-sentence summary. Do not commit it unless asked.
