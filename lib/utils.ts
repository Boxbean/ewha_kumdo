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
  return null;
}

/**
 * YouTube 썸네일 URL (mqdefault = 320×180)
 */
export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}
