import { detectPlatform, extractYouTubeId, getYouTubeThumbnail } from './utils';
import { fetchYouTubeOEmbed } from './oembed';

export interface LinkMeta {
  title: string | null;
  thumbnail_url: string | null;
}

const FALLBACK_TITLE = {
  youtube: 'YouTube 영상',
  instagram: '인스타그램 릴스',
  other: '링크 영상',
} as const;

export function fallbackTitle(url: string): string {
  return FALLBACK_TITLE[detectPlatform(url)];
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function ogContent(html: string, prop: string): string | null {
  const tag = html.match(new RegExp(`<meta[^>]+(?:property|name)="${prop}"[^>]*>`, 'i'));
  if (!tag) return null;
  const content = tag[0].match(/content="([^"]*)"/i);
  return content ? decodeEntities(content[1]).trim() || null : null;
}

// 서버가 임의 주소를 요청하므로 내부망/로컬 주소로의 요청(SSRF)은 막음
function isSafePublicUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
    const h = u.hostname.toLowerCase();
    if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal')) return false;
    if (/^[\d.]+$/.test(h) || h.includes(':')) return false; // IP 리터럴
    return true;
  } catch {
    return false;
  }
}

// 인스타 og:title 형식: `작성자 on Instagram: "캡션"` → 캡션만 사용, 없으면 작성자 기반 제목
function parseInstagramTitle(ogTitle: string): string | null {
  // 언어에 따라 앞부분 문구가 달라지므로(영: `X on Instagram: "…"`, 한: `Instagram의 X님 : "…"`) 따옴표 안 캡션만 추출
  const caption = ogTitle.match(/:\s*"([\s\S]*)"\s*$/);
  if (caption && caption[1].trim()) return caption[1].trim().slice(0, 100);
  const author = ogTitle.match(/^(.*?)\s+on Instagram/);
  return author && author[1].trim() ? `${author[1].trim()}의 릴스` : null;
}

// 공식 API 없이 링크 페이지의 og 태그에서 제목/썸네일을 시도해서 가져옴 — 실패하면 null (호출부에서 기본값 처리).
// 인스타그램은 일반 브라우저 UA에는 메타 태그를 주지 않고 소셜 크롤러 UA에만 줌.
export async function fetchLinkMeta(url: string): Promise<LinkMeta> {
  const platform = detectPlatform(url);

  if (platform === 'youtube') {
    const id = extractYouTubeId(url);
    try {
      const data = id ? await fetchYouTubeOEmbed(url) : null;
      return { title: data?.title ?? null, thumbnail_url: id ? getYouTubeThumbnail(id) : null };
    } catch {
      return { title: null, thumbnail_url: id ? getYouTubeThumbnail(id) : null };
    }
  }

  if (!isSafePublicUrl(url)) return { title: null, thumbnail_url: null };

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'facebookexternalhit/1.1' },
      redirect: 'follow',
      signal: AbortSignal.timeout(6000),
      cache: 'no-store',
    });
    if (!res.ok) return { title: null, thumbnail_url: null };
    const html = await res.text();
    const ogTitle = ogContent(html, 'og:title');
    const image = ogContent(html, 'og:image');
    const title = ogTitle ? (platform === 'instagram' ? parseInstagramTitle(ogTitle) : ogTitle.slice(0, 100)) : null;
    return { title, thumbnail_url: image && /^https?:\/\//.test(image) ? image : null };
  } catch {
    return { title: null, thumbnail_url: null };
  }
}
