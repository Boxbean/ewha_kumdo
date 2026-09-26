const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * "2025-03-20" → "2025. 03. 20 (목)"
 */
export function formatDate(dateStr: string): string {
  // Parse without timezone shift by splitting manually
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayName = DAY_NAMES[date.getDay()];
  return `${year}. ${String(month).padStart(2, '0')}. ${String(day).padStart(2, '0')} (${dayName})`;
}

/**
 * "https://youtu.be/abc123" or "https://www.youtube.com/watch?v=abc123" → "abc123"
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  // youtu.be/ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  // youtube.com/watch?v=ID
  const longMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (longMatch) return longMatch[1];
  // youtube.com/embed/ID
  const embedMatch = url.match(/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];
  // youtube.com/shorts/ID
  const shortsMatch = url.match(/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];
  return null;
}

/**
 * YouTube 썸네일 URL (mqdefault = 320×180)
 */
export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

/**
 * 인스타그램 릴스/게시물 링크 → 사이트 안에서 바로 재생 가능한 공식 embed iframe 주소
 * (embed.js 위젯 방식보다 로딩이 안정적이고 자체 재생 버튼이 있음)
 */
export function getInstagramEmbedUrl(url: string): string | null {
  const m = url.match(/instagram\.com\/(?:[^/?#]+\/)?(?:reels?|p|tv)\/([A-Za-z0-9_-]+)/);
  return m ? `https://www.instagram.com/reel/${m[1]}/embed/` : null;
}

/**
 * 검도쇼츠에 제출된 링크의 플랫폼 판별 — 서버(API 라우트)에서만 호출해 platform 값을 신뢰할 수 있게 함
 */
export function detectPlatform(url: string): 'youtube' | 'instagram' | 'other' {
  if (/(?:youtube\.com|youtu\.be)/i.test(url)) return 'youtube';
  if (/(?:instagram\.com|instagr\.am)/i.test(url)) return 'instagram';
  return 'other';
}

const COMPETITION_NAME_COLORS: Record<string, string> = {
  '사회인대회': '#00462A',
  '서울컵대회': '#1a6b47',
  '대선기대회': '#374151',
  '서울시 춘계 대학연맹전': '#2d5a8e',
  '서울시 추계 대학연맹전': '#7c3d8e',
  '서울시 회장기대회': '#9d5b0b',
  '금천구청장기 대회': '#0e7490',
  '도봉구청장기 대회': '#65a30d',
};

export function getCompetitionColor(name: string): string {
  return COMPETITION_NAME_COLORS[name] || '#00462A';
}

/**
 * 초 단위 정수 → "mm:ss"
 */
export function formatTimestamp(totalSeconds: number): string {
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

/**
 * VAPID 공개키(base64url) → pushManager.subscribe()의 applicationServerKey용 Uint8Array
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// 대회 썸네일은 competition_files에 이 file_type으로 1장만 저장
export const THUMBNAIL_FILE_TYPE = '썸네일';

/**
 * "mm:ss" 또는 "h:mm:ss" → 초 단위 정수 (형식이 틀리면 null)
 */
export function parseTimestamp(text: string): number | null {
  const parts = text.trim().split(':');
  if (parts.length < 2 || parts.length > 3 || parts.some((p) => !/^\d+$/.test(p))) return null;
  return parts.map(Number).reduce((acc, n) => acc * 60 + n, 0);
}

/**
 * API 입력으로 받은 구간 목록을 검증·정렬 — 형식이 틀린 항목은 버림
 */
export function normalizeChapters(input: unknown): { label: string; seconds: number }[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((c) => c && typeof c.label === 'string' && c.label.trim() && Number.isFinite(c.seconds) && c.seconds >= 0)
    .map((c) => ({ label: c.label.trim(), seconds: Math.floor(c.seconds) }))
    .sort((a, b) => a.seconds - b.seconds);
}

/**
 * 초 단위 정수 → 유튜브식 영상 길이 표기 ("3:16", "1:01:38")
 */
export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/**
 * 운동 날짜(YYYY-MM-DD) → 유튜브식 상대 시간 ("오늘", "3일 전", "2주 전", "5개월 전")
 */
export function formatRelativeDate(dateStr: string): string {
  // 서버(UTC)와 휴대폰에서 "오늘"이 달라지지 않도록 한국 시간 기준 날짜로 계산
  const todayKst = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
  const days = Math.round((Date.parse(todayKst) - Date.parse(dateStr)) / 86400000);
  if (days <= 0) return '오늘';
  if (days === 1) return '어제';
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  if (days < 365) return `${Math.floor(days / 30)}개월 전`;
  return `${Math.floor(days / 365)}년 전`;
}
