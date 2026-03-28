# EWHA Kumdo — 세션 인수인계

**작성일:** 2026-03-28
**상태:** 구현 시작 전 (설계 100% 완료)

---

## 새 세션에서 할 일

**구현 계획 전체 실행.** 계획 파일을 읽고 Step 1부터 순서대로 진행:

```
docs/superpowers/plans/2026-03-28-ewha-kumdo.md
```

---

## 프로젝트 한 줄 요약

이화여대 검도부 훈련 영상(비공개 YouTube 링크)을 중앙에서 관리하는 웹앱.
날짜·앵글·참가자 기준 검색/분류. 관리자만 등록/수정/삭제 가능.

---

## 폴더 위치

```
C:/Users/User/kendo-video-app/
```

> ⚠️ `create-next-app`이 아직 실행되지 않았음. 현재 폴더에는 `docs/`만 존재.

---

## 주요 설계 결정 (변경 불가)

| 항목 | 결정 사항 |
|------|-----------|
| 프레임워크 | Next.js 14 App Router + TypeScript |
| 스타일링 | Tailwind CSS + Pretendard (CDN) |
| DB | Supabase PostgreSQL (Free tier) |
| 인증 | 환경변수 `ADMIN_PASSWORD` — 서버사이드 비교만, OAuth 없음 |
| YouTube | URL 수동 입력 (API 없음), 썸네일은 `img.youtube.com` 직접 로드 |
| 배포 | Vercel Hobby 무료 |
| 뷰어 접근 | 링크만 알면 누구나 (로그인 없음) |

---

## 색상 시스템

```
Ewha Green:        #00462A  (헤더, 액센트, 활성 상태)
Ewha Pear Blossom: #FFFDF1  (배경, 사이드바)
Ewha Grey:         #B9B9B9  (보조 텍스트, 구분선)
Dark Grey:         #374151  (후면 앵글 배지)
```

폰트: `cdn.jsdelivr.net/gh/orioncactus/pretendard`

---

## 승인된 목업 파일

| 파일 | 설명 |
|------|------|
| `.superpowers/brainstorm/6742-1774596063/content/layout-v4.html` | 데스크톱 홈 레이아웃 |
| `.superpowers/brainstorm/6742-1774596063/content/mobile.html` | 모바일 레이아웃 |
| `.superpowers/brainstorm/6742-1774596063/content/calendar.html` | 캘린더 페이지 |

---

## DB 스키마 (Supabase에서 실행할 SQL)

```sql
create table videos (
  id            uuid primary key default gen_random_uuid(),
  youtube_url   text not null,
  title         text not null,
  date          date not null,
  angle         text not null check (angle in ('전면', '후면', '기타')),
  participants  text[] default '{}',
  topic         text,
  uploader      text,
  created_at    timestamptz default now()
);
create index on videos (date);
create index on videos using gin (participants);
```

---

## 앵글 배지 색상 (캘린더 + 썸네일)

| 앵글 | 색상 |
|------|------|
| 전면 | `#00462A` (Ewha Green) |
| 후면 | `#374151` (진회색) |
| 기타 | `#B9B9B9` (Ewha Grey) |

같은 날 같은 앵글 영상이 N개면 배지 N개 반복 (×N 표기 아님).

---

## 날짜 표시 형식

DB에 `date` (YYYY-MM-DD) 저장 → 프론트엔드에서 `2025. 03. 20 (목)` 형식으로 출력.
요일은 `new Date(dateStr).getDay()`로 계산.

---

## 페이지 목록

| URL | 권한 |
|-----|------|
| `/` | 누구나 — 최신 영상 그리드 (10개씩) |
| `/calendar` | 누구나 — 월간 달력 + 앵글 배지 |
| `/topic` | 누구나 — 주제별 그룹 |
| `/participant` | 누구나 — 참가자별 그룹 |
| `/video/[id]` | 누구나 — YouTube 임베드 + 메타 |
| `/admin` | 비밀번호 인증 필요 |

---

## 관리자 페이지 기능

1. 비밀번호 게이트 (POST `/api/auth` → `ADMIN_PASSWORD` 환경변수와 비교)
2. 단건 등록 폼 (URL, 날짜, 앵글, 참가자 태그, 제목, 주제)
3. CSV 대량 업로드 (컬럼: `youtube_url, date, angle, participants, title, topic`)
4. 영상 목록 + 수정/삭제 버튼

---

## 전체 설계 문서

```
docs/superpowers/specs/2026-03-27-ewha-kumdo-design.md
```
