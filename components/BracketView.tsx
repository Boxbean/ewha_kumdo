'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BracketMatch, CompetitionFile } from '@/lib/types';
import { groupByDivision, groupBySide, buildSideStructure, assignMatchNumbers, isEwhaClub } from '@/lib/bracket';
import { computeSideLayout, resolvedCenterY, LineState } from '@/lib/bracketLayout';
import { PRETENDARD_FAMILY } from '@/lib/fonts';
import BracketPlayerCard, { CARD_HEIGHT } from './BracketPlayerCard';
import BracketMatchCircle, { BracketCircleLegend } from './BracketMatchCircle';
import BracketPodium from './BracketPodium';

interface Props {
  matches: BracketMatch[];
  files: CompetitionFile[];
}

const CARD_ROW_GAP = 10; // 카드 사이 최소 여백(위아래 합산) — 같은 매치 내 두 선수, 서로 다른 매치 사이 모두 동일하게 적용
const ROW_H = (CARD_HEIGHT + CARD_ROW_GAP) * 2; // 선수 한 명당 세로 간격 (카드 높이 + 여백을 넉넉히 반영)
const STEP = 36;     // 라운드 사이 가로 간격
const CARD_GAP = 8;  // 리프 경계와 선수 카드 사이 여백
const CARD_MIN_WIDTH = 56;
const CARD_PADDING = 20; // 카드 좌우 padding + border
const GROUP_LABEL_H = 40; // 대진표 위 A조/B조 라벨 줄 높이
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2; // 태블릿/PC처럼 넓은 화면에서 작은 대진이 과하게 커지지 않도록 제한
// canvas의 font 속성은 CSS 변수를 해석하지 못하므로 실제 폰트 패밀리명을 직접 넣어줘야 함
const NAME_FONT = `700 12px ${PRETENDARD_FAMILY}, -apple-system, BlinkMacSystemFont, sans-serif`;
const CLUB_FONT = `400 10px ${PRETENDARD_FAMILY}, -apple-system, BlinkMacSystemFont, sans-serif`;

const GREEN = '#00462A';
const GRAY = '#cbd5e1';

function lineStyle(state: LineState) {
  if (state === 'won') return { stroke: GREEN, strokeWidth: 2.5 };
  if (state === 'lost') return { stroke: GRAY, strokeWidth: 1.2 };
  return { stroke: GRAY, strokeWidth: 1.2, strokeDasharray: '3,3' };
}

// 한글은 알파벳보다 넓게 대략 어림잡아 이름/소속 텍스트의 픽셀 폭을 추정 (canvas 측정 전 초기값용).
function estimateTextWidth(text: string, hangulPx: number, otherPx: number): number {
  let width = 0;
  for (const ch of text) {
    width += /[ㄱ-힝가-힣]/.test(ch) ? hangulPx : otherPx;
  }
  return width;
}

function roughCardWidth(matches: BracketMatch[]): number {
  let maxContent = 0;
  for (const m of matches) {
    for (const [name, club] of [[m.player1_name, m.player1_club], [m.player2_name, m.player2_club]] as const) {
      if (name) maxContent = Math.max(maxContent, estimateTextWidth(name, 13, 8));
      if (club) maxContent = Math.max(maxContent, estimateTextWidth(club, 10, 6));
    }
  }
  return Math.max(CARD_MIN_WIDTH, maxContent + CARD_PADDING);
}

// canvas로 실제 렌더링 폰트 기준 텍스트 폭을 정확히 측정 — 카드가 텍스트보다 불필요하게 넓어져
// 한쪽으로만 여백이 남는 것을 막고, 카드 양옆 여백(padding)이 균일하게 보이도록 한다.
function measureCardWidth(matches: BracketMatch[]): number | null {
  if (typeof document === 'undefined') return null;
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return null;
  let maxContent = 0;
  for (const m of matches) {
    for (const [name, club] of [[m.player1_name, m.player1_club], [m.player2_name, m.player2_club]] as const) {
      if (name) {
        ctx.font = NAME_FONT;
        maxContent = Math.max(maxContent, ctx.measureText(name).width);
      }
      if (club) {
        ctx.font = CLUB_FONT;
        maxContent = Math.max(maxContent, ctx.measureText(club).width);
      }
    }
  }
  return Math.max(CARD_MIN_WIDTH, Math.ceil(maxContent) + CARD_PADDING);
}

function useCardWidth(matches: BracketMatch[], selectedKey: string): number {
  const [width, setWidth] = useState(() => roughCardWidth(matches));
  useEffect(() => {
    const measured = measureCardWidth(matches);
    if (measured) setWidth(measured);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey, matches]);
  return width;
}

export default function BracketView({ matches, files }: Props) {
  const groups = groupByDivision(matches);
  const bracketFiles = files.filter((f) => f.file_type === '대진표');
  const [selectedKey, setSelectedKey] = useState(
    groups[0] ? `${groups[0].event_type}__${groups[0].division}` : ''
  );
  const selected = groups.find((g) => `${g.event_type}__${g.division}` === selectedKey) || groups[0];
  const cardWidth = useCardWidth(selected?.matches ?? [], selectedKey);

  if (groups.length === 0) {
    return (
      <div>
        {bracketFiles.length > 0 && <BracketFileList files={bracketFiles} />}
        {bracketFiles.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🏆</p>
            <p className="text-sm font-medium" style={{ color: '#374151' }}>등록된 대진표가 없습니다</p>
          </div>
        )}
      </div>
    );
  }

  const bySide = groupBySide(selected.matches);
  const structureA = buildSideStructure(bySide.A);
  const structureB = buildSideStructure(bySide.B);
  const final = bySide.final[0] || null;
  const numbers = assignMatchNumbers(structureA, structureB, final);

  return (
    <div>
      {groups.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {groups.map((g) => {
            const key = `${g.event_type}__${g.division}`;
            const active = key === selectedKey;
            return (
              <button
                key={key}
                onClick={() => setSelectedKey(key)}
                className="text-xs font-medium px-3 py-1.5 rounded-full border transition-colors"
                style={active
                  ? { backgroundColor: '#00462A', borderColor: '#00462A', color: '#fff' }
                  : { borderColor: '#e0e0e0', color: '#374151' }}
              >
                {g.division}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: '#00462A' }}>
          {selected.event_type}
        </span>
        <span className="text-sm font-bold" style={{ color: '#111' }}>{selected.division}</span>
      </div>

      <BracketPodium matches={selected.matches} />

      <BracketTree structureA={structureA} structureB={structureB} final={final} numbers={numbers} cardWidth={cardWidth} />

      {bracketFiles.length > 0 && (
        <div className="mt-6">
          <BracketFileList files={bracketFiles} />
        </div>
      )}
    </div>
  );
}

function BracketTree({
  structureA, structureB, final, numbers, cardWidth,
}: {
  structureA: ReturnType<typeof buildSideStructure>;
  structureB: ReturnType<typeof buildSideStructure>;
  final: BracketMatch | null;
  numbers: Map<string, number>;
  cardWidth: number;
}) {
  if (!structureA && !structureB && !final) {
    return <p className="text-sm text-center py-10" style={{ color: '#B9B9B9' }}>대진 데이터가 없습니다</p>;
  }

  const layoutA = computeSideLayout(structureA, ROW_H, STEP);
  const layoutB = computeSideLayout(structureB, ROW_H, STEP);

  const canvasHeight = Math.max(layoutA.height, layoutB.height, ROW_H);
  const offsetA = (canvasHeight - layoutA.height) / 2;
  const offsetB = (canvasHeight - layoutB.height) / 2;

  const maxRound = Math.max(structureA?.maxRound ?? 0, structureB?.maxRound ?? 0);
  const canvasWidth = 2 * (maxRound + 1) * STEP;
  const finalX = canvasWidth / 2;

  const marginX = cardWidth + CARD_GAP;
  const totalWidth = canvasWidth + marginX * 2;

  // 대진표 가로 폭이 기기 화면 너비에 꽉 차는 배율을 자동 계산 (작은 대진은 확대, 큰 대진은 축소 / 세로는 스크롤).
  // 사용자가 +/- 버튼으로 직접 조정하면 그 값을 유지하고, 부문 전환 등으로 대진 크기가 바뀌면 다시 자동 계산한다.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [manual, setManual] = useState(false);

  useEffect(() => {
    setManual(false);
  }, [totalWidth, canvasHeight]);

  // useLayoutEffect: 첫 화면이 100%로 그려졌다가 바뀌는 깜빡임 없이 처음부터 맞춘 배율로 표시
  useLayoutEffect(() => {
    if (manual) return;
    const el = wrapperRef.current;
    if (!el) return;
    function fit() {
      const availW = el!.clientWidth;
      if (!availW) return;
      // 소수점 반올림 시 화면보다 미세하게 넓어져 가로 스크롤이 생기므로 내림 처리
      const fitZoom = Math.floor((availW / totalWidth) * 1000) / 1000;
      setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, fitZoom)));
    }
    fit();
    // 창 크기뿐 아니라 화면 회전·스크롤바 등으로 영역 너비가 바뀌어도 다시 맞춤
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [totalWidth, canvasHeight, manual]);

  const toOuterA = (x: number, y: number) => ({ x: marginX + x, y: y + offsetA });
  const toOuterB = (x: number, y: number) => ({ x: marginX + canvasWidth - x, y: y + offsetB });

  const champA = structureA
    ? toOuterA(structureA.maxRound * STEP, resolvedCenterY(structureA.roundsMatches, structureA.maxRound, 1, ROW_H))
    : null;
  const champB = structureB
    ? toOuterB(structureB.maxRound * STEP, resolvedCenterY(structureB.roundsMatches, structureB.maxRound, 1, ROW_H))
    : null;
  const finalY = champA && champB ? (champA.y + champB.y) / 2 : (champA ?? champB)?.y ?? canvasHeight / 2;
  const finalPoint = { x: marginX + finalX, y: finalY };

  const leftState: LineState = final?.winner_slot === 'player1' ? 'won' : final?.winner_slot ? 'lost' : 'pending';
  const rightState: LineState = final?.winner_slot === 'player2' ? 'won' : final?.winner_slot ? 'lost' : 'pending';

  return (
    <div>
      <div className="flex items-center gap-1 mb-2">
        <BracketCircleLegend />
        <div className="flex-1" />
        <button
          onClick={() => { setManual(true); setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.1).toFixed(2))); }}
          className="w-7 h-7 rounded-full border text-sm"
          style={{ borderColor: '#e0e0e0', color: '#374151' }}
        >
          −
        </button>
        <span className="text-xs w-10 text-center" style={{ color: '#B9B9B9' }}>{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => { setManual(true); setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.1).toFixed(2))); }}
          className="w-7 h-7 rounded-full border text-sm"
          style={{ borderColor: '#e0e0e0', color: '#374151' }}
        >
          +
        </button>
      </div>

      {/* transform은 레이아웃 크기를 바꾸지 않으므로, 배율이 적용된 실제 크기의 박스로 감싸 스크롤 영역을 맞춘다 */}
      <div ref={wrapperRef} className="overflow-x-auto pb-2">
        <div style={{ width: totalWidth * zoom, height: (GROUP_LABEL_H + canvasHeight) * zoom }}>
        <div style={{ width: totalWidth, transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
          <div className="flex items-start justify-between" style={{ height: GROUP_LABEL_H }}>
            <GroupLabel text={structureA ? 'A조' : ''} />
            <GroupLabel text={structureB ? 'B조' : ''} />
          </div>
        <div className="relative" style={{ width: totalWidth, height: canvasHeight }}>

          <svg className="absolute inset-0 pointer-events-none" width={totalWidth} height={canvasHeight}>
            {layoutA.lines.map((l, i) => {
              const p1 = toOuterA(l.x1, l.y1);
              const p2 = toOuterA(l.x2, l.y2);
              const s = lineStyle(l.state);
              return <line key={`a-${i}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} strokeLinecap="round" {...s} />;
            })}
            {layoutB.lines.map((l, i) => {
              const p1 = toOuterB(l.x1, l.y1);
              const p2 = toOuterB(l.x2, l.y2);
              const s = lineStyle(l.state);
              return <line key={`b-${i}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} strokeLinecap="round" {...s} />;
            })}
            {champA && (
              <>
                <line x1={champA.x} y1={champA.y} x2={finalPoint.x} y2={champA.y} strokeLinecap="round" {...lineStyle(leftState)} />
                {champA.y !== finalPoint.y && (
                  <line x1={finalPoint.x} y1={champA.y} x2={finalPoint.x} y2={finalPoint.y} strokeLinecap="round" {...lineStyle(leftState)} />
                )}
              </>
            )}
            {champB && (
              <>
                <line x1={champB.x} y1={champB.y} x2={finalPoint.x} y2={champB.y} strokeLinecap="round" {...lineStyle(rightState)} />
                {champB.y !== finalPoint.y && (
                  <line x1={finalPoint.x} y1={champB.y} x2={finalPoint.x} y2={finalPoint.y} strokeLinecap="round" {...lineStyle(rightState)} />
                )}
              </>
            )}
          </svg>

          {layoutA.leaves.map((leaf, i) => {
            const p = toOuterA(leaf.x, leaf.y);
            const name = leaf.slot === 'player1' ? leaf.match.player1_name : leaf.match.player2_name;
            const club = leaf.slot === 'player1' ? leaf.match.player1_club : leaf.match.player2_club;
            const isOurs = (leaf.slot === 'player1' ? leaf.match.player1_is_ours : leaf.match.player2_is_ours) || isEwhaClub(club);
            return (
              <div key={`la-${i}`} className="absolute" style={{ left: p.x - marginX, top: p.y - CARD_HEIGHT / 2, width: cardWidth }}>
                <BracketPlayerCard name={name} club={club} isOurs={isOurs} mirrored={false} width={cardWidth} />
              </div>
            );
          })}
          {layoutB.leaves.map((leaf, i) => {
            const p = toOuterB(leaf.x, leaf.y);
            const name = leaf.slot === 'player1' ? leaf.match.player1_name : leaf.match.player2_name;
            const club = leaf.slot === 'player1' ? leaf.match.player1_club : leaf.match.player2_club;
            const isOurs = (leaf.slot === 'player1' ? leaf.match.player1_is_ours : leaf.match.player2_is_ours) || isEwhaClub(club);
            return (
              <div key={`lb-${i}`} className="absolute" style={{ left: p.x, top: p.y - CARD_HEIGHT / 2, width: cardWidth }}>
                <BracketPlayerCard name={name} club={club} isOurs={isOurs} mirrored width={cardWidth} />
              </div>
            );
          })}

          {layoutA.circles.map((c) => {
            const p = toOuterA(c.x, c.y);
            const number = numbers.get(c.match.id) ?? null;
            if (number === null) return null;
            return (
              <div key={`ca-${c.match.id}`} className="absolute" style={{ left: p.x, top: p.y, transform: 'translate(-50%, -50%)' }}>
                <BracketMatchCircle number={number} videoId={c.match.videos?.[0]?.id} decided={!!c.match.winner_slot} />
              </div>
            );
          })}
          {layoutB.circles.map((c) => {
            const p = toOuterB(c.x, c.y);
            const number = numbers.get(c.match.id) ?? null;
            if (number === null) return null;
            return (
              <div key={`cb-${c.match.id}`} className="absolute" style={{ left: p.x, top: p.y, transform: 'translate(-50%, -50%)' }}>
                <BracketMatchCircle number={number} videoId={c.match.videos?.[0]?.id} decided={!!c.match.winner_slot} />
              </div>
            );
          })}
          {final && (
            <div className="absolute" style={{ left: finalPoint.x, top: finalPoint.y, transform: 'translate(-50%, -50%)' }}>
              <BracketMatchCircle number={numbers.get(final.id) ?? 0} videoId={final.videos?.[0]?.id} decided={!!final.winner_slot} />
            </div>
          )}
        </div>
        </div>
        </div>
      </div>
    </div>
  );
}

function GroupLabel({ text }: { text: string }) {
  if (!text) return <span />;
  return (
    <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(0,70,42,0.08)', color: GREEN }}>
      {text}
    </span>
  );
}

function BracketFileList({ files }: { files: CompetitionFile[] }) {
  return (
    <div>
      <p className="text-xs font-bold mb-2" style={{ color: '#00462A' }}>🗂️ 업로드된 대진표</p>
      <div className="flex flex-wrap gap-2">
        {files.map((f) => (
          <a
            key={f.id}
            href={f.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold px-3 py-1.5 rounded-full hover:opacity-80"
            style={{ backgroundColor: 'rgba(0,70,42,0.08)', color: '#00462A' }}
          >
            {f.file_name || '대진표'} 보기
          </a>
        ))}
      </div>
    </div>
  );
}
