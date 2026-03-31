# EWHA Kumdo — 세션 인수인계

**최초 작성:** 2026-03-28
**최종 업데이트:** 2026-03-31
**상태:** 구현 완료 + 배포 완료 + 성능 최적화 예정

---

## 새 세션에서 할 일

### ⚡ 다음 작업: 성능 최적화 (4개 항목)

아래 순서대로 진행. 각 항목 완료 후 `npm run build` 확인.

---

#### ① 참가자 전용 경량 API 추가 — `app/api/participants/route.ts` (신규) + `HomeContent.tsx`

**문제:** `HomeContent.tsx`가 마운트 시 `/api/videos?limit=200`을 호출해 200개 전체 레코드를 가져오지만, 실제로는 `participants`와 `date` 두 컬럼만 사용함.

**해결:** 전용 엔드포인트 `/api/participants`를 만들어 `select('id, participants, date')`만 조회.

```ts
// app/api/participants/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('videos')
    .select('participants, date')
    .order('date', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, {
    headers: { 'Cache-Control': 'private, max-age=30' },
  });
}
```

`HomeContent.tsx`의 두 번째 fetch를 `/api/participants`로 교체.

---

#### ② API 응답 캐싱 — `app/api/videos/route.ts`

**문제:** 응답에 `Cache-Control` 헤더 없음 → 재방문 시에도 매번 DB 쿼리 발생.

**해결:** GET 핸들러 응답에 헤더 추가. `s-maxage`(CDN 캐시)는 등록 즉시 반영이 안 될 수 있으므로 `private`(브라우저 캐시)만 적용.

```ts
return NextResponse.json({ data, count }, {
  headers: { 'Cache-Control': 'private, max-age=30' },
});
```

---

#### ③ `count: 'estimated'` 전환 — `app/api/videos/route.ts`

**문제:** `count: 'exact'`는 Supabase에서 full COUNT(*) 실행 → 느림.

**해결:** 한 단어 변경.

```ts
// 변경 전
.select('*', { count: 'exact' })

// 변경 후
.select('*', { count: 'estimated' })
```

> 오차 1~5개 가능하지만 현재 영상 수 규모에서 실질적 문제 없음.

---

#### ④ 썸네일 `sizes` prop 추가 — `components/VideoCard.tsx`

**문제:** `unoptimized={true}`로 WebP 변환·리사이즈 비활성화 상태.

**결정:** Vercel Hobby 플랜 이미지 최적화 한도(월 1,000회) 고려해 `unoptimized` 유지.
대신 `sizes` prop만 추가해 브라우저가 뷰포트에 맞는 크기를 올바르게 선택하도록 힌트 제공.

```tsx
<Image
  src={thumbnail}
  alt={video.title}
  fill
  sizes="(max-width: 640px) 50vw, 25vw"
  className="object-cover"
  unoptimized
/>
```

---

### 작업 완료 후

```bash
cd C:/Users/User/kendo-video-app
npm run build
# 빌드 확인 후 직접 push
```

> git push 및 Vercel 배포는 사용자가 터미널에서 직접 처리.

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
| 성능 최적화 | ⏳ 예정 (다음 세션) |

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
  api/videos/route.ts    영상 목록/등록 API
  api/videos/[id]/route.ts  영상 수정/삭제 API
  api/videos/bulk/route.ts  CSV 대량 업로드 API
  api/auth/route.ts      관리자 인증 API
components/
  Header.tsx             헤더 (햄버거/검색/로고)
  Sidebar.tsx            데스크톱 사이드바
  BottomNav.tsx          모바일 하단 탭
  AppLayout.tsx          전체 레이아웃 래퍼
  VideoCard.tsx          영상 카드
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

### 4. 캐시 삭제 방법 (Windows)
빌드 오류 시 `.next` 캐시 삭제:

```powershell
Remove-Item -Recurse -Force .next
npm run dev
```

---

## 이번 세션에서 완료한 UI 개선

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
