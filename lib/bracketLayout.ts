import { BracketMatch, WinnerSlot } from './types';
import { SideStructure, matchGridPosition } from './bracket';

export type LineState = 'won' | 'lost' | 'pending';

export interface LayoutLine {
  x1: number; y1: number; x2: number; y2: number;
  state: LineState;
}

export interface LayoutCircle {
  x: number; y: number; match: BracketMatch;
}

export interface LayoutLeaf {
  x: number; y: number; slot: WinnerSlot; match: BracketMatch;
}

export interface SideLayout {
  lines: LayoutLine[];
  circles: LayoutCircle[];
  leaves: LayoutLeaf[]; // 1라운드 개별 선수 위치 (x는 항상 0 — 리프 경계)
  width: number;  // 이 side가 차지하는 가로 길이 (마지막 라운드 원까지)
  height: number; // 이 side가 차지하는 세로 길이
}

/**
 * round/matchNo가 차지하는 leaf-슬롯 구간의 중심 y좌표를 순수 계산으로 구한다.
 * matchGridPosition은 데이터와 무관하게 순수 기하 구조만 다루므로, 실제 매치가 없어도(TBD) 동일한 좌표가 나온다.
 */
export function matchCenterY(round: number, matchNo: number, rowH: number): number {
  const { start, end } = matchGridPosition(round, matchNo);
  return ((start + end - 2) / 2) * rowH;
}

/**
 * 실제 그려지는 y좌표. 자식이 둘 다 있으면 두 자식 y의 중간, 하나만 있으면(부전승 패딩) 그 자식 y를 그대로 따라가
 * 직선으로 이어지게 한다. 자식이 없으면(TBD) 기하 위치를 쓴다.
 */
export function resolvedCenterY(roundsMatches: (BracketMatch | null)[][], round: number, matchNo: number, rowH: number): number {
  if (round === 1) return matchCenterY(1, matchNo, rowH);
  const hasNode = (r: number, m: number) => !!roundsMatches[r - 1]?.[m - 1];
  const c1 = 2 * matchNo - 1;
  const c2 = 2 * matchNo;
  const e1 = hasNode(round - 1, c1);
  const e2 = hasNode(round - 1, c2);
  if (e1 && e2) {
    // 부전승 쪽 선은 직선으로 다음 라운드까지 이어가고, 꺾임은 실제 경기 쪽에서 일어나도록 부모 y를 부전승 y에 맞춘다
    const pad1 = !!roundsMatches[round - 2]?.[c1 - 1]?.is_bye;
    const pad2 = !!roundsMatches[round - 2]?.[c2 - 1]?.is_bye;
    if (pad1 && !pad2) return resolvedCenterY(roundsMatches, round - 1, c1, rowH);
    if (pad2 && !pad1) return resolvedCenterY(roundsMatches, round - 1, c2, rowH);
    return (resolvedCenterY(roundsMatches, round - 1, c1, rowH) + resolvedCenterY(roundsMatches, round - 1, c2, rowH)) / 2;
  }
  if (e1) return resolvedCenterY(roundsMatches, round - 1, c1, rowH);
  if (e2) return resolvedCenterY(roundsMatches, round - 1, c2, rowH);
  return matchCenterY(round, matchNo, rowH);
}

/**
 * 참고: sportsprism.net 대진표의 좌표 방식 — 라운드 사이를 고정폭(step)으로 두고,
 * 각 선수/매치는 자기 y좌표에서 다음 라운드 경계까지 수평선을 그은 뒤, 그 경계(x)에서
 * 수직으로 부모 매치의 y로 꺾여 만난다. 원(경기 번호)은 항상 "경계 x, 부모 y" 위치에 찍힌다.
 * 이 방식은 카드 폭이나 grid 트랙 크기와 무관하게 좌표가 결정되므로 선과 원이 어긋나지 않는다.
 */
export function computeSideLayout(structure: SideStructure | null, rowH: number, step: number): SideLayout {
  if (!structure) return { lines: [], circles: [], leaves: [], width: 0, height: 0 };
  const { maxRound, leafCount, roundsMatches } = structure;

  const lines: LayoutLine[] = [];
  const circles: LayoutCircle[] = [];
  const leaves: LayoutLeaf[] = [];

  for (let r = 1; r <= maxRound; r++) {
    const row = roundsMatches[r - 1] ?? [];
    row.forEach((match, idx) => {
      const matchNo = idx + 1;
      const xNear = (r - 1) * step;
      const xFar = r * step;
      const centerY = resolvedCenterY(roundsMatches, r, matchNo, rowH);

      if (r === 1) {
        if (!match) return; // 데이터 없음 — 아무것도 그리지 않음
        if (match.is_bye) {
          // 부전승: 상대 없이 곧바로 다음 라운드 경계까지 직진, 원 없음 (실제 경기가 아니므로)
          leaves.push({ x: 0, y: centerY, slot: 'player1', match });
          lines.push({ x1: 0, y1: centerY, x2: xFar, y2: centerY, state: 'won' });
          return;
        }
        const yTop = centerY - rowH / 4;
        const yBottom = centerY + rowH / 4;
        leaves.push({ x: 0, y: yTop, slot: 'player1', match });
        leaves.push({ x: 0, y: yBottom, slot: 'player2', match });

        const topState: LineState = match.winner_slot === 'player1' ? 'won' : match.winner_slot ? 'lost' : 'pending';
        const bottomState: LineState = match.winner_slot === 'player2' ? 'won' : match.winner_slot ? 'lost' : 'pending';

        lines.push({ x1: 0, y1: yTop, x2: xFar, y2: yTop, state: topState });
        lines.push({ x1: 0, y1: yBottom, x2: xFar, y2: yBottom, state: bottomState });
        lines.push({ x1: xFar, y1: yTop, x2: xFar, y2: centerY, state: topState });
        lines.push({ x1: xFar, y1: yBottom, x2: xFar, y2: centerY, state: bottomState });
        circles.push({ x: xFar, y: centerY, match });
        return;
      }

      // 2라운드 이상: 자식이 없는 쪽(부전승 패딩의 빈 슬롯)은 선을 그리지 않는다.
      if (!match) return;

      const topState: LineState = match.winner_slot === 'player1' ? 'won' : match.winner_slot ? 'lost' : 'pending';
      const bottomState: LineState = match.winner_slot === 'player2' ? 'won' : match.winner_slot ? 'lost' : 'pending';
      const childTop = roundsMatches[r - 2]?.[2 * matchNo - 2];
      const childBottom = roundsMatches[r - 2]?.[2 * matchNo - 1];

      if (childTop) {
        const y = resolvedCenterY(roundsMatches, r - 1, 2 * matchNo - 1, rowH);
        lines.push({ x1: xNear, y1: y, x2: xFar, y2: y, state: topState });
        if (y !== centerY) lines.push({ x1: xFar, y1: y, x2: xFar, y2: centerY, state: topState });
      }
      if (childBottom) {
        const y = resolvedCenterY(roundsMatches, r - 1, 2 * matchNo, rowH);
        lines.push({ x1: xNear, y1: y, x2: xFar, y2: y, state: bottomState });
        if (y !== centerY) lines.push({ x1: xFar, y1: y, x2: xFar, y2: centerY, state: bottomState });
      }
      if (!match.is_bye) circles.push({ x: xFar, y: centerY, match });
    });
  }

  return { lines, circles, leaves, width: maxRound * step, height: leafCount * rowH };
}
