import { Venue } from './types';

// 경기장 주소 → 좌표 (카카오 로컬 API, 서버 전용 — REST API 키는 브라우저로 보내지 않음)
// DB에 좌표 칸을 따로 두지 않고, 페이지를 만들 때 조회한 결과를 1주일간 캐시해서 사용
// (주소를 수정하면 요청 주소가 달라지므로 새 주소로 다시 조회됨)

export interface VenuePoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

const ONE_WEEK = 60 * 60 * 24 * 7;

// 주소 칸 앞에 장소 이름이 붙어 있는 경우("서울과학기술대학교체육관 서울 노원구 …")를 위해 시·도 이름부터 잘라냄
const REGION_START = /(서울|경기|인천|부산|대구|광주|대전|울산|세종|강원|충북|충남|충청|전북|전남|전라|경북|경남|경상|제주)/;

async function search(kind: 'address' | 'keyword', query: string): Promise<{ lat: number; lng: number } | null> {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key || !query.trim()) return null;
  try {
    const res = await fetch(
      `https://dapi.kakao.com/v2/local/search/${kind}.json?query=${encodeURIComponent(query.trim())}`,
      { headers: { Authorization: `KakaoAK ${key}` }, next: { revalidate: ONE_WEEK } }
    );
    if (!res.ok) return null;
    const doc = (await res.json()).documents?.[0];
    return doc ? { lat: Number(doc.y), lng: Number(doc.x) } : null;
  } catch {
    return null;
  }
}

// 주소 검색이 이름 검색보다 정확함(이름으로 찾으면 "잠실 학생체육관"이 교육청 건물로 잡히는 식) —
// 주소 그대로 → 주소에서 시·도 이후만 → 마지막으로 경기장 이름 순서로 시도
async function geocode(venue: Venue): Promise<{ lat: number; lng: number } | null> {
  const address = venue.address?.trim() || '';
  if (address) {
    const direct = await search('address', address);
    if (direct) return direct;
    const regionIdx = address.search(REGION_START);
    if (regionIdx > 0) {
      const trimmed = await search('address', address.slice(regionIdx));
      if (trimmed) return trimmed;
    }
  }
  return search('keyword', venue.name);
}

export async function geocodeVenues(venues: Venue[]): Promise<VenuePoint[]> {
  const results = await Promise.all(venues.map(async (v) => ({ v, point: await geocode(v) })));
  return results
    .filter((r): r is { v: Venue; point: { lat: number; lng: number } } => r.point !== null)
    .map(({ v, point }) => ({ id: v.id, name: v.name, ...point }));
}
