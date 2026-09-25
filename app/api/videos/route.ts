import { NextRequest, NextResponse, after } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Video } from '@/lib/types';
import { requireAdmin } from '@/lib/adminAuth';
import { sendPushToAllSubscribers } from '@/lib/push';
import { normalizeChapters } from '@/lib/utils';

// 같은 날짜 영상(전면/후면 등)이 이 기간 안에 이미 등록됐다면 알림을 이미 보낸 것으로 보고 생략
const PUSH_DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000;

async function notifyNewVideo(video: Video) {
  const since = new Date(Date.now() - PUSH_DEDUPE_WINDOW_MS).toISOString();
  const { count } = await supabase
    .from('videos')
    .select('id', { count: 'exact', head: true })
    .eq('date', video.date)
    .neq('id', video.id)
    .gte('created_at', since);
  if (count) return;

  const [, monthStr, dayStr] = video.date.split('-');
  const dayLabel = `${Number(monthStr)}월 ${Number(dayStr)}일`;
  let title = `${dayLabel} ${video.topic || '운동'} 영상이 업로드되었어요!`;
  if (video.competition_id) {
    const { data: comp } = await supabase.from('competitions').select('name').eq('id', video.competition_id).single();
    if (comp?.name) title = `${comp.name} 영상이 업로드되었어요!`;
  }

  // 알림을 누르면 상세 페이지에서 운동 시작점부터 바로(음소거) 재생
  await sendPushToAllSubscribers({ title, body: '', url: `/video/${video.id}?autoplay=1` });
}

// 등록된 지 이 기간 이내인 영상은 경기일(date) 순서를 무시하고 최신 등록순으로 맨 앞에 노출
const RECENT_UPLOAD_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

// 목록 카드에서 대회명/상대 정보를 보여주기 위한 조인 — 카드 렌더링에 필요한 컬럼만 가져옴
const VIDEO_SELECT = `
  *,
  competition:competitions(name),
  bracket_match:bracket_matches(player1_name,player1_club,player1_is_ours,player2_name,player2_club,player2_is_ours)
`;

interface VideoFilters {
  angle: string;
  participant: string;
  date: string;
  competition_id: string;
  search: string;
}

function parseFilters(searchParams: URLSearchParams): VideoFilters {
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
function applyFilters(query: any, f: VideoFilters): any {
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filters = parseFilters(searchParams);
  const limit = Number(searchParams.get('limit') || '10');
  const offset = Number(searchParams.get('offset') || '0');

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
  if (recentError) return NextResponse.json({ error: recentError.message }, { status: 500 });
  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });
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
    if (restError) return NextResponse.json({ error: restError.message }, { status: 500 });
    restRows = (restData as Video[]) || [];
  }

  const paged = [...recentPage, ...restRows];

  return NextResponse.json({ data: paged, count: recentTotal + restTotal }, {
    headers: { 'Cache-Control': 'private, max-age=30' },
  });
}

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const body = await req.json();
  const { youtube_url, title, date, angle, participants, topic, uploader, competition_id, chapters } = body;

  if (!youtube_url || !title || !date || !angle) {
    return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('videos')
    .insert({ youtube_url, title, date, angle, participants: participants || [], topic, uploader, competition_id: competition_id || null, chapters: normalizeChapters(chapters) })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  after(() => notifyNewVideo(data as Video));

  return NextResponse.json({ data }, { status: 201 });
}
