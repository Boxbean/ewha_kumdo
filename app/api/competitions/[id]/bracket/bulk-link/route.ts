import { NextRequest, NextResponse, after } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminAuth';
import { sendPushToAllSubscribers } from '@/lib/push';
import { fetchYouTubeOEmbed } from '@/lib/oembed';
import { deriveDateFromTitle } from '@/lib/utils';
import { groupBySide, buildSideStructure, assignMatchNumbers } from '@/lib/bracket';
import { Angle, BracketMatch } from '@/lib/types';

const ANGLES: Angle[] = ['전면', '후면', '기타'];

interface BulkLinkRow {
  match_number: number;
  youtube_url: string;
  title?: string;
  date?: string;
  angle?: string;
  participants?: string[];
  topic?: string;
  uploader?: string;
}

// 대진표 화면에 표시되는 경기 번호(원 안의 숫자)로 영상을 대량 연결 — 번호는 BracketView와 완전히 동일한
// 알고리즘(assignMatchNumbers)으로 서버에서 다시 계산하므로, 화면에서 본 번호와 항상 일치한다.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const { id: competitionId } = await params;
  const body = await req.json();
  const division: string = body.division;
  const eventType: string = body.event_type;
  const rows: BulkLinkRow[] = Array.isArray(body.rows) ? body.rows : [];

  if (!division || !eventType) {
    return NextResponse.json({ error: '부문(division/event_type)을 지정해주세요' }, { status: 400 });
  }
  if (rows.length === 0) {
    return NextResponse.json({ error: '연결할 행이 없습니다' }, { status: 400 });
  }

  const [{ data: competition }, { data: matches, error: matchError }] = await Promise.all([
    supabase.from('competitions').select('name, date_start').eq('id', competitionId).single(),
    supabase
      .from('bracket_matches')
      .select('*')
      .eq('competition_id', competitionId)
      .eq('division', division)
      .eq('event_type', eventType),
  ]);

  if (matchError) return NextResponse.json({ error: matchError.message }, { status: 500 });
  if (!matches || matches.length === 0) {
    return NextResponse.json({ error: '해당 부문의 대진 매치가 없습니다' }, { status: 404 });
  }

  const typedMatches = matches as BracketMatch[];
  const bySide = groupBySide(typedMatches);
  const structureA = buildSideStructure(bySide.A);
  const structureB = buildSideStructure(bySide.B);
  const final = bySide.final[0] || null;
  const numberToMatchId = assignMatchNumbers(structureA, structureB, final);
  const matchIdToNumber = new Map(Array.from(numberToMatchId, ([mid, n]) => [n, mid]));
  const matchById = new Map(typedMatches.map((m) => [m.id, m]));

  const todayKst = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());

  const errors: { row: number; reason: string }[] = [];
  const insertRows: Record<string, unknown>[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNo = i + 1;

    if (!row.youtube_url?.trim()) { errors.push({ row: rowNo, reason: '유튜브 링크가 없습니다' }); continue; }
    if (!Number.isFinite(row.match_number)) { errors.push({ row: rowNo, reason: '경기 번호가 올바르지 않습니다' }); continue; }

    const matchId = matchIdToNumber.get(row.match_number);
    const match = matchId ? matchById.get(matchId) : undefined;
    if (!match) { errors.push({ row: rowNo, reason: `${row.match_number}번 경기를 찾을 수 없습니다` }); continue; }

    let title = row.title?.trim() || '';
    if (!title) {
      const oembed = await fetchYouTubeOEmbed(row.youtube_url).catch(() => null);
      title = oembed?.title?.trim() || `${competition?.name ?? ''} ${division} ${match.player1_name ?? '?'} vs ${match.player2_name ?? '?'}`.trim();
    }

    const date = row.date?.trim() || deriveDateFromTitle(title) || competition?.date_start || todayKst;
    const angle: Angle = (row.angle && ANGLES.includes(row.angle as Angle) ? row.angle as Angle : '전면');
    const participants = row.participants?.length
      ? row.participants
      : [match.player1_name, match.player2_name].filter((n): n is string => !!n);

    insertRows.push({
      youtube_url: row.youtube_url.trim(),
      title,
      date,
      angle,
      participants,
      topic: row.topic || null,
      uploader: row.uploader || null,
      competition_id: competitionId,
      bracket_match_id: match.id,
    });
  }

  if (insertRows.length === 0) {
    return NextResponse.json({ inserted: 0, errors }, { status: 400 });
  }

  const { data, error } = await supabase.from('videos').insert(insertRows).select();
  if (error) return NextResponse.json({ error: error.message, errors }, { status: 500 });

  after(() =>
    sendPushToAllSubscribers({
      title: '경기 영상이 등록되었어요',
      body: `${division} 경기 영상 ${insertRows.length}개가 새로 연결됐어요`,
      url: '/',
    })
  );

  return NextResponse.json({ inserted: data?.length ?? insertRows.length, errors }, { status: 201 });
}
