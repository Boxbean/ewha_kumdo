import { SupabaseClient } from '@supabase/supabase-js';
import { Video } from './types';

// 홈 목록 조회 로직 — /api/videos(더 불러오기·검색)와 홈 서버 렌더링(첫 페이지)이 같은 정렬을 쓰도록 공유

// 등록된 지 이 기간 이내인 영상은 경기일(date) 순서를 무시하고 최신 등록순으로 맨 앞에 노출
const RECENT_UPLOAD_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

// 목록 카드에서 대회명/상대 정보를 보여주기 위한 조인 — 카드 렌더링에 필요한 컬럼만 가져옴
export const VIDEO_SELECT = `
  *,
  competition:competitions(name),
  bracket_match:bracket_matches(player1_name,player1_club,player1_is_ours,player2_name,player2_club,player2_is_ours)
`;

export interface VideoFilters {
  angle: string;
  participant: string;
  date: string;
  competition_id: string;
  search: string;
}

export const EMPTY_FILTERS: VideoFilters = { angle: '', participant: '', date: '', competition_id: '', search: '' };

export function parseFilters(searchParams: URLSearchParams): VideoFilters {
  return {
    angle: searchParams.get('angle') || '',
    participant: searchParams.get('participant') || '',
    date: searchParams.get('date') || '',
    competition_id: searchParams.get('competition_id') || '',
    search: searchParams.get('search') || '',
  };
}

// 대회/영상 목록 GET에서 공통으로 쓰는 필터 — 최근 업로드 버킷/나머지 버킷 쿼리에 동일하게 적용하기 위해 분리
// Supabase 쿼리 빌더의 제네릭 체이닝 타입을 함수 경계 너머로 그대로 통과시키면
// 타입스크립트 인스턴스화 깊이 한도(TS2589)에 걸려 any로 완화함 — 호출부에서 반환값을 그대로 체이닝만 하고 즉시 as로 캐스팅해 사용
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyFilters(query: any, f: VideoFilters): any {
  let q = query;
  if (f.angle) q = q.eq('angle', f.angle);
  if (f.participant) q = q.contains('participants', [f.participant]);
  if (f.date) q = q.eq('date', f.date);
  if (f.competition_id) q = q.eq('competition_id', f.competition_id);
  if (f.search && !f.angle && !f.participant && !f.date && !f.competition_id) {
    // 앵글 키워드 검색
    const angles = ['전면', '후면', '기타'];
    if (angles.includes(f.search)) {
      q = q.eq('angle', f.search);
    } else {
      // 제목, 주제, 참가자 이름 검색 — PostgREST or() 로직 트리 구문에서 쉼표/괄호/따옴표는
      // 절 구분자로 해석되어 백슬래시로 이스케이프가 안 되므로(파싱 에러 발생), 검색어에서 아예 제거해
      // 검색어로 필터 절을 주입하는 것을 방지
      const sanitized = f.search.replace(/[,()"]/g, '');
      q = q.or(`title.ilike.%${sanitized}%,topic.ilike.%${sanitized}%,participants.cs.{"${sanitized}"}`);
    }
  }
  return q;
}

// 최근 업로드(3일) 영상을 등록순으로 맨 앞에, 나머지는 경기일 최신순으로 이어붙인 목록의 [offset, offset+limit) 구간
export async function fetchVideosPage(
  supabase: SupabaseClient,
  filters: VideoFilters,
  limit: number,
  offset: number
): Promise<{ data: Video[]; count: number }> {
  const cutoffIso = new Date(Date.now() - RECENT_UPLOAD_WINDOW_MS).toISOString();

  // 최근 업로드 버킷과 나머지 버킷 개수는 서로 독립적인 쿼리라 병렬로 조회 — 순차 대기 시간 절약
  const [
    { data: recentData, error: recentError },
    { count: restCount, error: countError },
  ] = await Promise.all([
    // 최근 업로드 버킷: 시간 창(3일)으로 크기가 자연히 제한되어 전체 조회해도 안전 — 등록순 정렬 확정
    applyFilters(supabase.from('videos').select(VIDEO_SELECT), filters)
      .gte('created_at', cutoffIso)
      .order('created_at', { ascending: false }),
    // 나머지 버킷 전체 개수만 추정치로 조회 (행 데이터는 가져오지 않음)
    applyFilters(supabase.from('videos').select('*', { count: 'estimated', head: true }), filters).lt(
      'created_at',
      cutoffIso
    ),
  ]);
  if (recentError) throw recentError;
  if (countError) throw countError;
  const recentRows = (recentData as Video[]) || [];
  const recentTotal = recentRows.length;
  const restTotal = restCount ?? 0;

  // 요청된 페이지 구간 [offset, offset+limit) 중 최근 업로드 버킷에 해당하는 부분
  const recentPage = recentRows.slice(Math.min(offset, recentTotal), Math.min(offset + limit, recentTotal));

  // 나머지 구간은 DB에서 경기일순으로 정렬·페이지네이션까지 처리 — 전체 스캔 없이 필요한 행만 가져옴
  const restOffset = Math.max(0, offset - recentTotal);
  const restNeeded = limit - recentPage.length;
  let restRows: Video[] = [];
  if (restNeeded > 0 && restOffset < restTotal) {
    const { data: restData, error: restError } = await applyFilters(supabase.from('videos').select(VIDEO_SELECT), filters)
      .lt('created_at', cutoffIso)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(restOffset, restOffset + restNeeded - 1);
    if (restError) throw restError;
    restRows = (restData as Video[]) || [];
  }

  return { data: [...recentPage, ...restRows], count: recentTotal + restTotal };
}
