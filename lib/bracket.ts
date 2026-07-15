import { BracketMatch, BracketSide, WinnerSlot } from './types';

export interface PlayerSlotRef {
  name?: string;
  club?: string;
  isOurs: boolean;
}

export function getSlot(match: BracketMatch, slot: WinnerSlot): PlayerSlotRef {
  return slot === 'player1'
    ? { name: match.player1_name, club: match.player1_club, isOurs: match.player1_is_ours }
    : { name: match.player2_name, club: match.player2_club, isOurs: match.player2_is_ours };
}

function otherSlot(slot: WinnerSlot): WinnerSlot {
  return slot === 'player1' ? 'player2' : 'player1';
}

export interface StandingEntry extends PlayerSlotRef {
  place: '1위' | '2위' | '3위';
}

/** 결승/준결승 결과로부터 1~3위를 계산. 데이터가 없으면 해당 순위는 생략됨(부분 데이터 허용). */
export function deriveStandings(matches: BracketMatch[]): StandingEntry[] {
  const results: StandingEntry[] = [];

  const final = matches.find((m) => m.side === 'final');
  if (final?.winner_slot) {
    results.push({ place: '1위', ...getSlot(final, final.winner_slot) });
    results.push({ place: '2위', ...getSlot(final, otherSlot(final.winner_slot)) });
  }

  const thirdPlaceMatch = matches.find((m) => m.third_place_match);
  if (thirdPlaceMatch?.winner_slot) {
    results.push({ place: '3위', ...getSlot(thirdPlaceMatch, thirdPlaceMatch.winner_slot) });
  } else {
    for (const side of ['A', 'B'] as const) {
      const sideMatches = matches.filter((m) => m.side === side);
      if (sideMatches.length === 0) continue;
      const maxRound = Math.max(...sideMatches.map((m) => m.round));
      const semi = sideMatches.find((m) => m.round === maxRound && m.match_no === 1);
      if (semi?.winner_slot) {
        results.push({ place: '3위', ...getSlot(semi, otherSlot(semi.winner_slot)) });
      }
    }
  }

  return results;
}

export interface GridPosition {
  span: number;
  start: number;
  end: number;
}

/** round/match_no만으로 CSS Grid의 gridRow 범위를 계산 (DOM 측정 불필요) */
export function matchGridPosition(round: number, matchNo: number): GridPosition {
  const span = Math.pow(2, round - 1);
  const start = (matchNo - 1) * span + 1;
  const end = start + span;
  return { span, start, end };
}

export interface SideStructure {
  maxRound: number;
  leafCount: number;
  /** roundsMatches[round-1][match_no-1], 빈 슬롯은 null(TBD) */
  roundsMatches: (BracketMatch | null)[][];
}

/** 해당 side의 실제 입력된 매치들로부터 전체 대진 구조(빈 슬롯 포함)를 역산 */
export function buildSideStructure(sideMatches: BracketMatch[]): SideStructure | null {
  if (sideMatches.length === 0) return null;
  const maxRound = Math.max(...sideMatches.map((m) => m.round));
  const leafCount = Math.pow(2, maxRound - 1);
  const roundsMatches: (BracketMatch | null)[][] = [];
  for (let r = 1; r <= maxRound; r++) {
    const countInRound = leafCount / Math.pow(2, r - 1);
    const row: (BracketMatch | null)[] = [];
    for (let m = 1; m <= countInRound; m++) {
      row.push(sideMatches.find((x) => x.round === r && x.match_no === m) || null);
    }
    roundsMatches.push(row);
  }
  return { maxRound, leafCount, roundsMatches };
}

/** side 트리 내에서 round가 위치할 그리드 컬럼 번호 (1-index, 홀수=매치, 짝수=커넥터) */
export function sideMatchColumn(round: number, maxRound: number, mirrored: boolean): number {
  const totalCols = 2 * maxRound - 1;
  return mirrored ? totalCols - 2 * round + 2 : 2 * round - 1;
}

/** round(1..maxRound)로 진출시키는 커넥터가 위치할 그리드 컬럼 번호 (round>=2일 때만 존재) */
export function sideConnectorColumn(round: number, maxRound: number, mirrored: boolean): number {
  const totalCols = 2 * maxRound - 1;
  return mirrored ? totalCols - 2 * round + 3 : 2 * round - 2;
}

export function groupBySide(matches: BracketMatch[]): Record<BracketSide, BracketMatch[]> {
  return {
    A: matches.filter((m) => m.side === 'A'),
    B: matches.filter((m) => m.side === 'B'),
    final: matches.filter((m) => m.side === 'final'),
  };
}

export interface DivisionGroup {
  division: string;
  event_type: string;
  matches: BracketMatch[];
}

/** division + event_type 조합별로 매치를 묶음 (한 대회에 여러 대진표가 있을 수 있음) */
export function groupByDivision(matches: BracketMatch[]): DivisionGroup[] {
  const map = new Map<string, DivisionGroup>();
  for (const m of matches) {
    const key = `${m.event_type}__${m.division}`;
    if (!map.has(key)) map.set(key, { division: m.division, event_type: m.event_type, matches: [] });
    map.get(key)!.matches.push(m);
  }
  return Array.from(map.values());
}
