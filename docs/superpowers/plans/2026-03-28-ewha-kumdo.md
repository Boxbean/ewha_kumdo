# EWHA Kumdo — 구현 계획

**작성일:** 2026-03-28
**상태:** 실행 준비 완료
**설계 문서:** `docs/superpowers/specs/2026-03-27-ewha-kumdo-design.md`
**레이아웃 목업:** `.superpowers/brainstorm/6742-1774596063/content/`

---

## 0. 프로젝트 현황

- [x] 설계 완료 (spec 승인)
- [x] 데스크톱 레이아웃 목업 승인 (`layout-v4.html`)
- [x] 모바일 레이아웃 목업 승인 (`mobile.html`)
- [x] 캘린더 페이지 목업 승인 (`calendar.html`)
- [ ] **구현 시작 전** ← 여기서부터

---

## 1. 기술 스택 확정

| 레이어 | 기술 |
|--------|------|
| 프레임워크 | Next.js 14 (App Router) + TypeScript |
| 스타일링 | Tailwind CSS v3 + Pretendard (CDN) |
| 데이터베이스 | Supabase (PostgreSQL, Free tier) |
| 인증 | 환경변수 `ADMIN_PASSWORD` (서버사이드 비교) |
| 배포 | Vercel (Hobby 무료) |
| 테스트 | Jest + React Testing Library |
| CSV 파싱 | papaparse |

---

## 2. 색상 / 디자인 토큰

```css
--green:    #00462A   /* 헤더, 액센트, 활성 상태 */
--pear:     #FFFDF1   /* 배경, 사이드바 */
--grey:     #B9B9B9   /* 보조 텍스트, 구분선 */
--grey-mid: #e0e0e0
--grey-dark: #374151  /* 후면 앵글 배지 */
```

폰트: `https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css`

---

## 3. 데이터 모델

### Supabase `videos` 테이블

```sql
create table videos (
  id            uuid primary key default gen_random_uuid(),
  youtube_url   text not null,
  title         text not null,
  date          date not null,
  angle         text not null check (angle in ('전면', '후면', '기타')),
  participants  text[] default '{}',   -- 선택 입력
  topic         text,                  -- 선택 입력
  uploader      text,                  -- 선택 입력
  created_at    timestamptz default now()
);
```

**인덱스:**
```sql
create index on videos (date);
create index on videos using gin (participants);
```

---

## 4. 환경변수

```env
# .env.local (로컬 개발)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxx...
ADMIN_PASSWORD=설정할_비밀번호   # NEXT_PUBLIC_ 금지 — 서버 전용
```

Vercel 대시보드에 동일하게 설정.

---

## 5. 구현 단계 (순서대로 실행)

### Step 1 — 프로젝트 초기화

```bash
cd C:/Users/User
npx create-next-app@14 kendo-video-app \
  --typescript --tailwind --app --no-src-dir --import-alias "@/*"
cd kendo-video-app
npm install @supabase/supabase-js papaparse
npm install -D @types/papaparse jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

**`tailwind.config.ts`에 커스텀 색상 추가:**
```ts
colors: {
  'ewha-green': '#00462A',
  'ewha-pear':  '#FFFDF1',
  'ewha-grey':  '#B9B9B9',
}
```

**`app/layout.tsx`에 Pretendard CDN 추가:**
```tsx
<link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css" rel="stylesheet" />
```

---

### Step 2 — 타입 정의 및 유틸리티

**`lib/types.ts`:**
```ts
export type Angle = '전면' | '후면' | '기타';

export interface Video {
  id: string;
  youtube_url: string;
  title: string;
  date: string;        // YYYY-MM-DD
  angle: Angle;
  participants: string[];
  topic?: string;
  uploader?: string;
  created_at: string;
}
```

**`lib/utils.ts`:**
```ts
// "2025-03-20" → "2025. 03. 20 (목)"
export function formatDate(dateStr: string): string { ... }

// "https://youtu.be/abc123" or full URL → "abc123"
export function extractYouTubeId(url: string): string | null { ... }

// YouTube 썸네일 URL
export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}
```

---

### Step 3 — Supabase 클라이언트

**`lib/supabase.ts`:**
```ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

---

### Step 4 — API Routes

**`app/api/videos/route.ts`** — GET (전체 조회), POST (단건 등록)

```
GET  /api/videos?search=홍길동&angle=전면&participant=홍길동&date=2025-03
POST /api/videos  body: { youtube_url, title, date, angle, participants?, topic?, uploader? }
```

**`app/api/videos/[id]/route.ts`** — GET (단건), PATCH (수정), DELETE (삭제)

**`app/api/videos/bulk/route.ts`** — POST (CSV 일괄 등록)
- 서버에서 `ADMIN_PASSWORD` 헤더 검증
- papaparse로 CSV 파싱 후 Supabase insert

**`app/api/auth/route.ts`** — POST (비밀번호 인증)
```ts
// req.body.password === process.env.ADMIN_PASSWORD → { ok: true }
// 실패 → { ok: false }
```

---

### Step 5 — 레이아웃 컴포넌트

**`components/Header.tsx`**
- Ewha Green 배경, 고정 52px
- ☰ 버튼(사이드바 토글), "EWHA Kumdo" 로고, 검색창, "+ 영상 등록" 버튼
- 모바일: 검색창 숨김, ☰ 유지

**`components/Sidebar.tsx`**
- 데스크톱: 200px → 접기 시 56px, 전환 애니메이션 0.2s
- 메뉴: 홈 / 캘린더 보기 / 주제별 보기 / 참가자별 보기
- 모바일: 숨김 (오버레이 슬라이드로 보조)
- active 상태: `rgba(0,70,42,0.12)` + Ewha Green 텍스트

**`components/BottomNav.tsx`** — 모바일 전용 하단 탭
- 홈 / 캘린더 / 주제별 / 참가자별
- `@media (max-width: 768px)` 에서만 표시

**`components/AppLayout.tsx`** — 헤더 + 사이드바 + 컨텐츠 래퍼

---

### Step 6 — 홈 페이지 (`/`)

**`components/VideoCard.tsx`**
- YouTube 썸네일 (`mqdefault.jpg`), 4:3 aspect-ratio
- 우상단 앵글 배지 (전면/후면/기타)
- 카드 정보: `formatDate()` 날짜, 제목, 참가자 태그(#홍길동)
- 호버: `translateY(-2px)` + 그린 그림자

**`components/VideoGrid.tsx`**
- `grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))`
- 모바일: `repeat(2, 1fr)` 고정

**`components/FilterBar.tsx`**
- 칩 목록: 전체 / 참가자 태그 / 앵글 / 날짜 필터
- 활성 칩: Ewha Green 배경, 흰 텍스트
- 모바일: 가로 스크롤

**`components/Pagination.tsx`** — "10개 더 불러오기" 버튼

**`app/page.tsx`**
- 서버 컴포넌트: Supabase에서 최신 10개 조회
- FilterBar + VideoGrid + Pagination 조합

---

### Step 7 — 캘린더 페이지 (`/calendar`)

**`components/CalendarView.tsx`**
- 월간 달력 (7×6 테이블)
- 이전/다음 달 이동: `‹` `›` 버튼
- 오늘 날짜: Ewha Green 원형 표시
- 이전/다음 달 날짜: grey 흐리게
- 영상 있는 날: 앵글 배지 표시

**`components/AngleBadge.tsx`**
- 전면: Ewha Green (`#00462A`) 배경, 흰 텍스트
- 후면: 진회색 (`#374151`) 배경, 흰 텍스트
- 기타: Ewha Grey (`#B9B9B9`) 배경, 흰 텍스트
- 클릭 시 `/video/[id]`로 이동
- 같은 날짜·같은 앵글 영상이 2개면 배지 2개 반복 표시

**범례:** 캘린더 상단에 전면/후면/기타 색상 안내

**`app/calendar/page.tsx`** — Supabase에서 월별 영상 조회, CalendarView에 전달

---

### Step 8 — 주제별 / 참가자별 페이지

**`app/topic/page.tsx`**
- topic별 그룹핑 → 섹션 타이틀 + VideoGrid

**`app/participant/page.tsx`**
- participants 배열에서 고유 이름 추출 → 참가자별 VideoGrid

---

### Step 9 — 영상 상세 페이지 (`/video/[id]`)

**`app/video/[id]/page.tsx`**
- YouTube 임베드: `<iframe src="https://www.youtube.com/embed/{videoId}" />`
- 메타정보: 날짜(요일 포함), 앵글, 참가자 태그, 주제, 등록자
- 같은 날짜의 다른 영상 연결 링크 (페어 영상)

---

### Step 10 — 관리자 페이지 (`/admin`)

**`app/admin/page.tsx`** 구조:

1. **비밀번호 게이트**
   - `<AdminLogin />` 컴포넌트
   - POST `/api/auth` 로 비밀번호 검증
   - 성공 시 `sessionStorage`에 인증 토큰 저장 → 대시보드 진입

2. **영상 등록 폼** `<VideoForm />`
   - YouTube URL 입력
   - 날짜 picker (`<input type="date">`)
   - 앵글 선택 (전면/후면/기타 라디오 또는 드롭다운)
   - 참가자 입력 (태그 형식, Enter로 추가, 선택 입력)
   - 제목 (텍스트)
   - 주제 (텍스트, 선택 입력)
   - 등록자 (텍스트, 선택 입력)
   - 제출 → POST `/api/videos`

3. **CSV 대량 업로드** `<CsvUpload />`
   - 컬럼 순서: `youtube_url, date, angle, participants, title, topic`
   - participants는 쉼표 구분 문자열 (`"홍길동,이순신"`)
   - papaparse로 파싱 → POST `/api/videos/bulk`
   - 미리보기 테이블 표시 후 최종 업로드

4. **영상 목록** `<AdminVideoList />`
   - 등록된 영상 카드 + 수정 / 삭제 버튼
   - 삭제: 확인 다이얼로그 후 DELETE `/api/videos/{id}`
   - 수정: 인라인 폼 또는 모달

---

### Step 11 — 검색 기능

**검색 로직 (`/api/videos?search=...`):**

| 입력 | Supabase 쿼리 |
|------|---------------|
| `홍길동` | `participants` 배열 contains |
| `전면` / `후면` / `기타` | `angle` eq |
| `2025-03-15` | `date` eq |
| 그 외 | `title.ilike` OR `topic.ilike` |

**헤더 검색창:** 실시간이 아닌 Enter/버튼 클릭 시 `/` 페이지로 `?search=...` 쿼리 이동

---

### Step 12 — 배포

1. GitHub 저장소 생성 → push
2. Vercel에서 "Import Project" → GitHub 연결
3. 환경변수 설정:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ADMIN_PASSWORD`
4. Supabase에서 `videos` 테이블 생성 (Step 3 SQL 실행)
5. 배포 후 검증 체크리스트 (아래 참고)

---

## 6. 파일 구조

```
kendo-video-app/
├── app/
│   ├── layout.tsx              # Pretendard CDN + 글로벌 스타일
│   ├── page.tsx                # 홈 (/)
│   ├── calendar/
│   │   └── page.tsx            # 캘린더 보기
│   ├── topic/
│   │   └── page.tsx            # 주제별 보기
│   ├── participant/
│   │   └── page.tsx            # 참가자별 보기
│   ├── video/
│   │   └── [id]/
│   │       └── page.tsx        # 영상 상세
│   ├── admin/
│   │   └── page.tsx            # 관리자 페이지
│   └── api/
│       ├── auth/
│       │   └── route.ts        # POST: 비밀번호 인증
│       └── videos/
│           ├── route.ts        # GET, POST
│           ├── [id]/
│           │   └── route.ts    # GET, PATCH, DELETE
│           └── bulk/
│               └── route.ts    # POST: CSV 일괄 등록
├── components/
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── BottomNav.tsx           # 모바일 전용
│   ├── AppLayout.tsx
│   ├── VideoCard.tsx
│   ├── VideoGrid.tsx
│   ├── FilterBar.tsx
│   ├── Pagination.tsx
│   ├── CalendarView.tsx
│   ├── AngleBadge.tsx
│   ├── AdminLogin.tsx
│   ├── VideoForm.tsx
│   ├── CsvUpload.tsx
│   └── AdminVideoList.tsx
├── lib/
│   ├── types.ts
│   ├── utils.ts
│   └── supabase.ts
└── docs/
    └── superpowers/
        ├── specs/
        │   └── 2026-03-27-ewha-kumdo-design.md
        └── plans/
            └── 2026-03-28-ewha-kumdo.md   ← 이 파일
```

---

## 7. 검증 체크리스트

- [ ] 홈 페이지에서 영상 그리드 정상 로드 (10개씩 페이지네이션)
- [ ] 참가자 태그 클릭 → 해당 참가자 영상만 필터링
- [ ] `/admin` 비밀번호 인증 → 영상 등록 → 홈에 즉시 반영
- [ ] CSV 업로드 → 다수 영상 일괄 등록
- [ ] 캘린더 페이지에서 날짜별 앵글 배지 표시 및 클릭 이동
- [ ] 모바일 브라우저에서 하단 탭 + 2열 그리드 정상 동작
- [ ] 사이드바 ☰ 접기/펼치기 동작
- [ ] 검색창에서 이름/날짜/주제 검색 결과 정확성

---

## 8. CSV 예시 (초기 데이터 마이그레이션)

```
youtube_url,date,angle,participants,title,topic
https://youtu.be/xxx,2025-01-10,전면,"홍길동,이순신",검도 훈련,기본기
https://youtu.be/yyy,2025-01-10,후면,"홍길동,이순신",검도 훈련,
```

participants는 큰따옴표로 묶어 쉼표 구분. topic 빈 값은 null로 처리.
