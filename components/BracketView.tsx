'use client';

import { useState } from 'react';
import { BracketMatch, CompetitionFile } from '@/lib/types';
import {
  groupByDivision, groupBySide, buildSideStructure, matchGridPosition,
  sideMatchColumn, sideConnectorColumn, SideStructure,
} from '@/lib/bracket';
import BracketMatchNode from './BracketMatchNode';
import BracketConnector from './BracketConnector';
import BracketPodium from './BracketPodium';

interface Props {
  matches: BracketMatch[];
  files: CompetitionFile[];
}

const LEAF_HEIGHT = 64;
const MATCH_COL_WIDTH = 152;
const CONN_COL_WIDTH = 28;

export default function BracketView({ matches, files }: Props) {
  const groups = groupByDivision(matches);
  const bracketFiles = files.filter((f) => f.file_type === '대진표');
  const [selectedKey, setSelectedKey] = useState(
    groups[0] ? `${groups[0].event_type}__${groups[0].division}` : ''
  );

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

  const selected = groups.find((g) => `${g.event_type}__${g.division}` === selectedKey) || groups[0];
  const bySide = groupBySide(selected.matches);
  const structureA = buildSideStructure(bySide.A);
  const structureB = buildSideStructure(bySide.B);
  const finalMatch = bySide.final[0] || null;

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
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
          style={{ backgroundColor: '#00462A' }}
        >
          {selected.event_type}
        </span>
        <span className="text-sm font-bold" style={{ color: '#111' }}>{selected.division}</span>
      </div>

      <BracketPodium matches={selected.matches} />

      <div className="overflow-x-auto pb-2">
        <div className="flex items-center" style={{ width: 'max-content' }}>
          {structureA ? (
            <BracketSideTree structure={structureA} mirrored={false} sideLabel="A조" />
          ) : (
            <EmptySideNote label="A조" />
          )}

          <FinalConnector />

          <div style={{ width: 160 }}>
            <p className="text-center text-[11px] font-bold mb-1" style={{ color: '#B9B9B9' }}>결승</p>
            <BracketMatchNode match={finalMatch} />
          </div>

          <FinalConnector />

          {structureB ? (
            <BracketSideTree structure={structureB} mirrored sideLabel="B조" />
          ) : (
            <EmptySideNote label="B조" />
          )}
        </div>
      </div>

      {bracketFiles.length > 0 && (
        <div className="mt-6">
          <BracketFileList files={bracketFiles} />
        </div>
      )}
    </div>
  );
}

function FinalConnector() {
  return (
    <div style={{ width: 24, height: 2, backgroundColor: '#cbd5e1', flexShrink: 0 }} />
  );
}

function EmptySideNote({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center px-6" style={{ width: 160, color: '#B9B9B9' }}>
      <span className="text-xs">{label} 데이터 없음</span>
    </div>
  );
}

function BracketSideTree({
  structure, mirrored, sideLabel,
}: {
  structure: SideStructure;
  mirrored: boolean;
  sideLabel: string;
}) {
  const { maxRound, leafCount, roundsMatches } = structure;
  const totalCols = 2 * maxRound - 1;

  const gridTemplateColumns = Array.from({ length: totalCols }, (_, i) =>
    i % 2 === 0 ? `${MATCH_COL_WIDTH}px` : `${CONN_COL_WIDTH}px`
  ).join(' ');

  return (
    <div>
      <p className="text-xs font-bold mb-1.5" style={{ color: '#374151' }}>{sideLabel}</p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns,
          gridTemplateRows: `repeat(${leafCount}, ${LEAF_HEIGHT}px)`,
          columnGap: 0,
        }}
      >
        {roundsMatches.map((row, roundIdx) => {
          const round = roundIdx + 1;
          const matchCol = sideMatchColumn(round, maxRound, mirrored);
          return row.map((match, idx) => {
            const matchNo = idx + 1;
            const { start, end } = matchGridPosition(round, matchNo);
            return (
              <div
                key={`m-${round}-${matchNo}`}
                style={{ gridColumn: matchCol, gridRow: `${start} / ${end}`, alignSelf: 'center', padding: '2px 4px' }}
              >
                <BracketMatchNode match={match} />
              </div>
            );
          });
        })}

        {Array.from({ length: maxRound - 1 }, (_, i) => i + 2).map((round) => {
          const connCol = sideConnectorColumn(round, maxRound, mirrored);
          const countInRound = leafCount / Math.pow(2, round - 1);
          return Array.from({ length: countInRound }, (_, idx) => {
            const matchNo = idx + 1;
            const { start, end } = matchGridPosition(round, matchNo);
            return (
              <div key={`c-${round}-${matchNo}`} style={{ gridColumn: connCol, gridRow: `${start} / ${end}` }}>
                <BracketConnector mirrored={mirrored} />
              </div>
            );
          });
        })}
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
