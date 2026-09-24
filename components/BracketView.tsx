'use client';

import { useEffect, useRef, useState } from 'react';
import { BracketMatch, CompetitionFile } from '@/lib/types';
import { groupByDivision, groupBySide, buildSideStructure, assignMatchNumbers } from '@/lib/bracket';
import { computeSideLayout, matchCenterY, LineState } from '@/lib/bracketLayout';
import BracketPlayerCard, { CARD_HEIGHT } from './BracketPlayerCard';
import BracketMatchCircle from './BracketMatchCircle';
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
const NAME_FONT = "700 12px 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif";
const CLUB_FONT = "400 10px 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif";

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

  // 화면(가로/세로)에 전체 대진이 한 번에 들어오는 배율을 기기 크기에 맞춰 자동 계산.
  // 사용자가 +/- 버튼으로 직접 조정하면 그 값을 유지하고, 부문 전환 등으로 대진 크기가 바뀌면 다시 자동 계산한다.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [manual, setManual] = useState(false);

  useEffect(() => {
    setManual(false);
  }, [totalWidth, canvasHeight]);

  useEffect(() => {
    if (manual) return;
    function fit() {
      if (!wrapperRef.current) return;
      const availW = wrapperRef.current.clientWidth || totalWidth;
      const availH = Math.max(320, window.innerHeight * 0.55);
      const fitZoom = Math.min(availW / totalWidth, availH / canvasHeight, 1);
      setZoom(Math.max(0.3, +fitZoom.toFixed(2)));
    }
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [totalWidth, canvasHeight, manual]);

  const toOuterA = (x: number, y: number) => ({ x: marginX + x, y: y + offsetA });
  const toOuterB = (x: number, y: number) => ({ x: marginX + canvasWidth - x, y: y + offsetB });

  const champA = structureA
    ? toOuterA(structureA.maxRound * STEP, matchCenterY(structureA.maxRound, 1, ROW_H))
    : null;
  const champB = structureB
    ? toOuterB(structureB.maxRound * STEP, matchCenterY(structureB.maxRound, 1, ROW_H))
    : null;
  const finalY = champA && champB ? (champA.y + champB.y) / 2 : (champA ?? champB)?.y ?? canvasHeight / 2;
  const finalPoint = { x: marginX + finalX, y: finalY };

  const leftState: LineState = final?.winner_slot === 'player1' ? 'won' : final?.winner_slot ? 'lost' : 'pending';
  const rightState: LineState = final?.winner_slot === 'player2' ? 'won' : final?.winner_slot ? 'lost' : 'pending';

  return (
    <div>
      <div className="flex items-center justify-end gap-1 mb-2">
        <button
          onClick={() => { setManual(true); setZoom((z) => Math.max(0.3, +(z - 0.1).toFixed(2))); }}
          className="w-7 h-7 rounded-full border text-sm"
          style={{ borderColor: '#e0e0e0', color: '#374151' }}
        >
          −
        </button>
        <span className="text-xs w-10 text-center" style={{ color: '#B9B9B9' }}>{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => { setManual(true); setZoom((z) => Math.min(1.3, +(z + 0.1).toFixed(2))); }}
          className="w-7 h-7 rounded-full border text-sm"
          style={{ borderColor: '#e0e0e0', color: '#374151' }}
        >
          +
        </button>
      </div>

      <div ref={wrapperRef} className="overflow-x-auto pb-2">
        <div
          className="relative"
          style={{
            width: totalWidth, height: canvasHeight,
            transform: `scale(${zoom})`, transformOrigin: 'top left',
            marginBottom: zoom < 1 ? -(canvasHeight * (1 - zoom)) : 0,
          }}
        >
          <div className="absolute -top-6 text-[11px] font-bold" style={{ left: 4, color: '#374151' }}>A조</div>
          <div className="absolute -top-6 text-[11px] font-bold" style={{ right: 4, color: '#374151' }}>B조</div>

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
            const isOurs = leaf.slot === 'player1' ? leaf.match.player1_is_ours : leaf.match.player2_is_ours;
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
            const isOurs = leaf.slot === 'player1' ? leaf.match.player1_is_ours : leaf.match.player2_is_ours;
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
