'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface FilterBarProps {
  participants: string[];
  currentAngle?: string;
  currentParticipant?: string;
}

const ROW_H = 36; // h-7(28px) + gap-2(8px)

export default function FilterBar({ participants, currentAngle, currentParticipant }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const innerRef = useRef<HTMLDivElement>(null);
  const [visibleRows, setVisibleRows] = useState(1);
  const [totalRows, setTotalRows] = useState(1);

  useEffect(() => {
    if (!innerRef.current) return;
    const h = innerRef.current.scrollHeight;
    const rows = Math.max(1, Math.ceil(h / ROW_H));
    setTotalRows(rows);
    setVisibleRows(1);
  }, [participants]);

  function buildUrl(params: Record<string, string | undefined>) {
    const p = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([k, v]) => {
      if (v) p.set(k, v);
      else p.delete(k);
    });
    return `/?${p.toString()}`;
  }

  const isDefault = !currentAngle && !currentParticipant;
  const showMore = visibleRows < totalRows;
  const showLess = visibleRows > 1;

  const chipStyle = (isActive: boolean) => ({
    backgroundColor: isActive ? '#00462A' : 'transparent',
    color: isActive ? '#ffffff' : '#374151',
    borderColor: isActive ? '#00462A' : '#e0e0e0',
  });

  return (
    <div className="mb-4">
      <div style={{ maxHeight: visibleRows * ROW_H, overflow: 'hidden', transition: 'max-height 0.2s ease' }}>
        <div ref={innerRef} className="flex flex-wrap gap-2">
          {/* 전체 */}
          <button
            onClick={() => router.push('/')}
            className="flex-shrink-0 h-7 px-3 text-sm rounded-full border transition-colors"
            style={chipStyle(isDefault)}
          >
            전체
          </button>

          {/* 앵글 필터 (전면/후면/기타 고정) */}
          {(['전면', '후면', '기타'] as const).map((a) => {
            const isActive = currentAngle === a;
            return (
              <button
                key={a}
                onClick={() => router.push(isActive ? buildUrl({ angle: undefined }) : buildUrl({ angle: a }))}
                className="flex-shrink-0 h-7 px-3 text-sm rounded-full border transition-colors"
                style={chipStyle(isActive)}
              >
                {a}
              </button>
            );
          })}

          {/* 참가자 필터 (최근 업로드순) */}
          {participants.map((p) => {
            const isActive = currentParticipant === p;
            return (
              <button
                key={p}
                onClick={() => router.push(isActive ? buildUrl({ participant: undefined }) : buildUrl({ participant: p }))}
                className="flex-shrink-0 h-7 px-3 text-sm rounded-full border transition-colors"
                style={chipStyle(isActive)}
              >
                #{p}
              </button>
            );
          })}
        </div>
      </div>

      {/* 더보기 / 접기 */}
      {(showMore || showLess) && (
        <div className="flex gap-3 mt-2">
          {showMore && (
            <button
              onClick={() => setVisibleRows((v) => v + 1)}
              className="text-xs"
              style={{ color: '#00462A' }}
            >
              더보기 ▾
            </button>
          )}
          {showLess && (
            <button
              onClick={() => setVisibleRows(1)}
              className="text-xs"
              style={{ color: '#B9B9B9' }}
            >
              접기 ▴
            </button>
          )}
        </div>
      )}
    </div>
  );
}
