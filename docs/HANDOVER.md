# EWHA Kumdo — 세션 인수인계

**최초 작성:** 2026-03-28
**최종 업데이트:** 2026-04-01
**상태:** 구현 완료 + 배포 완료 + 성능 최적화 완료 + UI 아이콘 교체 완료

---

## 새 세션에서 할 일

현재 예정된 작업 없음. 기능 요청 또는 버그 발생 시 추가.

---

## 현재 상태 요약

| 항목 | 상태 |
|------|------|
| Next.js 앱 구현 | ✅ 완료 |
| Supabase 테이블 + RLS | ✅ 완료 |
| Vercel 배포 | ✅ 완료 (GitHub 연동, 자동 배포) |
| 로컬 개발 환경 | ✅ `.env.local` 설정 완료 |
| 홈 UI 개선 | ✅ 완료 (6종) |
| 캘린더 UI 개선 | ✅ 완료 (5종) |
| 캘린더 뱃지 버그 수정 | ✅ 완료 |
| 햄버거 메뉴 (모바일 오버레이) | ✅ 완료 |
| 영상 등록 결과 화면 | ✅ 완료 (등록완료 / 문제발생 분기) |
| 영상 상세 → 수정하기 버튼 | ✅ 완료 (관리자 인증 후 편집 진입) |
| 홈 로딩 텍스트 | ✅ 완료 (`ʟᴏᴀᴅɪɴɢ` 정적 텍스트) |
| 성능 최적화 (4개 항목) | ✅ 완료 (2026-04-01) |
| 네비게이션 아이콘 교체 | ✅ 완료 (2026-04-01) |

---

## 최근 세션 완료 작업 (2026-04-01)

### 성능 최적화 4개 항목

#### ① 참가자 전용 경량 API — `app/api/participants/route.ts` (신규)
- **배경:** `HomeContent.tsx`가 참가자 목록 구성을 위해 `/api/videos?limit=200`으로 200개 전체 레코드를 가져오던 것을 분리
- **변경:** `app/api/participants/route.ts` 신규 생성, `select('participants, date')`만 조회
- **연관 변경:** `HomeContent.tsx`의 fetch URL을 `/api/participants`로 교체
- Cache-Control: `private, max-age=30`

#### ② API 응답 캐싱 — `app/api/videos/route.ts`
- GET 핸들러 응답에 `Cache-Control: private, max-age=30` 헤더 추가
- 재방문 시 브라우저 캐시 활용, DB 쿼리 감소

#### ③ `count: 'estimated'` 전환 — `app/api/videos/route.ts`
- `.select('*', { count: 'exact' })` → `.select('*', { count: 'estimated' })`
- full COUNT(*) 제거. 오차 1~5개 허용 (현재 영상 수 규모에서 실질적 문제 없음)

#### ④ 썸네일 `sizes` prop 추가 — `components/VideoCard.tsx`
- `unoptimized` 유지 (Vercel Hobby 이미지 최적화 한도 고려)
- `sizes="(max-width: 640px) 50vw, 25vw"` 추가로 브라우저 뷰포트 힌트 제공

### 네비게이션 아이콘 교체

- **배경:** `🏠 📅 📚 👤` 이모지가 OS/기기마다 다르게 렌더링되고 사이트 무드와 불일치
- **결정:** 인라인 SVG stroke 방식 (strokeWidth 1.8, currentColor) — 기존 `Header.tsx` 검색 아이콘과 동일한 방식
- **변경 파일:**
  - `components/Sidebar.tsx` — size 16px, 4종 SVG 컴포넌트 (IconHome / IconCalendar / IconBook / IconUsers)
  - `components/BottomNav.tsx` — size 20px, 동일 4종
- **장점:** `stroke="currentColor"` 덕분에 active(`#00462A`) / inactive(`#B9B9B9`, `#374151`) 색상 전환이 기존 로직 그대로 동작

---

## 프로젝트 한 줄 요약

이화여대 검도부 훈련 영상(YouTube 링크)을 중앙에서 관리하는 웹앱.
날짜·앵글·참가자 기준 검색/분류. 관리자만 등록/수정/삭제 가능.

---

## 폴더 위치

```
C:/Users/User/kendo-video-app/
```

---

## 인프라 정보

| 항목 | 정보 |
|------|------|
| GitHub | `https://github.com/Boxbean/ewha_kumdo` (Private) |
| Vercel | Boxbean 계정, ewha_kumdo 프로젝트 |
| Supabase | ewha_kumdo 프로젝트 |
| 환경변수 위치 | 로컬: `.env.local` / 배포: Vercel 환경변수 설정 |

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
| 이미지 최적화 | `unoptimized` 유지 (Hobby 플랜 월 1,000회 한도) |
| 네비게이션 아이콘 | 인라인 SVG stroke (strokeWidth 1.8, currentColor) — 패키지 없음 |

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

## DB 스키마

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

-- RLS
alter table videos enable row level security;
create policy "public read" on videos for select using (true);
create policy "public write" on videos for all using (true) with check (true);
```

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

## 핵심 파일 구조

```
app/
  page.tsx               홈 (서버 컴포넌트 shell)
  HomeContent.tsx        홈 (클라이언트, 필터/페이지네이션)
  calendar/page.tsx      캘린더
  topic/page.tsx         주제별
  participant/page.tsx   참가자별
  video/[id]/page.tsx    영상 상세
  admin/page.tsx         관리자
  api/videos/route.ts    영상 목록/등록 API (캐싱 + estimated count 적용)
  api/videos/[id]/route.ts  영상 수정/삭제 API
  api/videos/bulk/route.ts  CSV 대량 업로드 API
  api/participants/route.ts 참가자 목록 경량 API (신규)
  api/auth/route.ts      관리자 인증 API
components/
  Header.tsx             헤더 (햄버거/검색/로고)
  Sidebar.tsx            데스크톱 사이드바 (인라인 SVG 아이콘)
  BottomNav.tsx          모바일 하단 탭 (인라인 SVG 아이콘)
  AppLayout.tsx          전체 레이아웃 래퍼
  VideoCard.tsx          영상 카드 (sizes prop 적용)
  VideoGrid.tsx          카드 그리드
  FilterBar.tsx          필터 칩 바
  CalendarView.tsx       달력 UI
  AngleBadge.tsx         앵글 배지
  VideoForm.tsx          영상 등록 폼
  AdminVideoList.tsx     관리자 영상 목록
  CsvUpload.tsx          CSV 업로드
  Pagination.tsx         더 불러오기 버튼
lib/
  supabase.ts            Supabase 클라이언트
  types.ts               TypeScript 타입
  utils.ts               날짜 포맷, YouTube ID 추출
```

---

## 중요 구현 패턴 (버그 방지용)

### 1. 서버 컴포넌트는 반드시 getSupabase() 사용
모듈 레벨 싱글톤 `supabase`는 빌드 시점에 placeholder URL로 초기화될 수 있음.
서버 컴포넌트(page.tsx)에서는 반드시 `getSupabase()`로 매 요청마다 fresh 클라이언트 생성.

```ts
// ❌ 서버 컴포넌트에서 잘못된 사용
import { supabase } from '@/lib/supabase';

// ✅ 서버 컴포넌트에서 올바른 사용
import { getSupabase } from '@/lib/supabase';
const supabase = getSupabase();
```

API 라우트(`app/api/`)는 `supabase` 싱글톤 그대로 사용해도 됨.

### 2. 서버 컴포넌트에 force-dynamic 필수
Supabase 호출이 있는 서버 컴포넌트 최상단에 반드시 추가:

```ts
export const dynamic = 'force-dynamic';
```

### 3. 날짜 비교 시 slice(0, 10) 정규화

```ts
const key = v.date.slice(0, 10); // "2026-03-28T00:00:00" 방어
```

### 4. SVG 아이콘 추가 시 패턴
새 아이콘이 필요하면 `Sidebar.tsx` / `BottomNav.tsx`의 기존 함수 형태를 그대로 복사해서 추가.
`stroke="currentColor"`를 반드시 유지해야 active/inactive 색상 자동 전환이 동작함.

```tsx
function IconExample() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* path here */}
    </svg>
  );
}
```

### 5. 캐시 삭제 방법 (Windows)
빌드 오류 시 `.next` 캐시 삭제:

```powershell
Remove-Item -Recurse -Force .next
npm run dev
```

---

## 누적 UI 개선 이력

### 홈 화면 (6종)
1. 참가자 태그 최대 4개 + `+N` 배지 — `VideoCard.tsx`
2. 카드 높이 균일 고정 (`h-full flex flex-col`) — `VideoCard.tsx`
3. 검색 아이콘 → 흰색 SVG 돋보기 — `Header.tsx`
4. 햄버거 메뉴 → 동일 두께 3줄 — `Header.tsx`
5. 참가자 태그 최근 업로드 날짜순 정렬 — `HomeContent.tsx`
6. 태그 줄넘침 시 `더보기 ▾` / `접기 ▴` — `FilterBar.tsx`

### 캘린더 화면 (5종)
1. 제목 `캘린더 보기` → `CALENDAR` — `calendar/page.tsx`
2. 년/월 클릭 시 월 선택 팝업 — `CalendarView.tsx`
3. 년/월 배경 이화그린 + 베이지 텍스트 pill — `CalendarView.tsx`
4. 전면/후면/기타 인덱스 삭제 — `CalendarView.tsx`
5. 셀 크기 90px 고정, 잉여 행 제거 — `CalendarView.tsx`

---

## 관리자 페이지 기능

1. 비밀번호 게이트 (POST `/api/auth` → `ADMIN_PASSWORD` 환경변수와 비교)
2. 단건 등록 폼 (URL, 날짜, 앵글, 참가자 태그, 제목, 주제)
3. CSV 대량 업로드 (컬럼: `youtube_url, date, angle, participants, title, topic`)
4. 영상 목록 50개씩 페이지네이션 + 수정/삭제

---

## 전체 설계 문서

```
docs/superpowers/specs/2026-03-27-ewha-kumdo-design.md
docs/superpowers/plans/2026-03-28-ewha-kumdo.md
```
