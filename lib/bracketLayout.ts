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
      const centerY = matchCenterY(r, matchNo, rowH);

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

      // 2라운드 이상: 자식 두 매치(이전 라운드의 matchNo*2-1, matchNo*2)의 y좌표는
      // 데이터 존재 여부와 무관하게 같은 공식으로 계산되므로 항상 일치한다.
      const childTopY = matchCenterY(r - 1, 2 * matchNo - 1, rowH);
      const childBottomY = matchCenterY(r - 1, 2 * matchNo, rowH);
      if (!match) return;

      const topState: LineState = match.winner_slot === 'player1' ? 'won' : match.winner_slot ? 'lost' : 'pending';
      const bottomState: LineState = match.winner_slot === 'player2' ? 'won' : match.winner_slot ? 'lost' : 'pending';

      lines.push({ x1: xNear, y1: childTopY, x2: xFar, y2: childTopY, state: topState });
      lines.push({ x1: xNear, y1: childBottomY, x2: xFar, y2: childBottomY, state: bottomState });
      lines.push({ x1: xFar, y1: childTopY, x2: xFar, y2: centerY, state: topState });
      lines.push({ x1: xFar, y1: childBottomY, x2: xFar, y2: centerY, state: bottomState });
      circles.push({ x: xFar, y: centerY, match });
    });
  }

  return { lines, circles, leaves, width: maxRound * step, height: leafCount * rowH };
}
