'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface FilterChip {
  label: string;
  value: string;
  type: 'angle' | 'participant' | 'reset';
}

interface FilterBarProps {
  participants: string[];
  currentAngle?: string;
  currentParticipant?: string;
}

export default function FilterBar({ participants, currentAngle, currentParticipant }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function buildUrl(params: Record<string, string | undefined>) {
    const p = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([k, v]) => {
      if (v) p.set(k, v);
      else p.delete(k);
    });
    return `/?${p.toString()}`;
  }

  const angles: FilterChip[] = ['전면', '후면', '기타'].map((a) => ({
    label: a,
    value: a,
    type: 'angle',
  }));

  const participantChips: FilterChip[] = participants.map((p) => ({
    label: `#${p}`,
    value: p,
    type: 'participant',
  }));

  const isDefault = !currentAngle && !currentParticipant;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
      {/* 전체 */}
      <button
        onClick={() => router.push('/')}
        className="flex-shrink-0 h-7 px-3 text-sm rounded-full border transition-colors"
        style={{
          backgroundColor: isDefault ? '#00462A' : 'transparent',
          color: isDefault ? '#ffffff' : '#374151',
          borderColor: isDefault ? '#00462A' : '#e0e0e0',
        }}
      >
        전체
      </button>

      {/* 앵글 필터 */}
      {angles.map((chip) => {
        const isActive = currentAngle === chip.value;
        return (
          <button
            key={chip.value}
            onClick={() =>
              router.push(
                isActive
                  ? buildUrl({ angle: undefined })
                  : buildUrl({ angle: chip.value })
              )
            }
            className="flex-shrink-0 h-7 px-3 text-sm rounded-full border transition-colors"
            style={{
              backgroundColor: isActive ? '#00462A' : 'transparent',
              color: isActive ? '#ffffff' : '#374151',
              borderColor: isActive ? '#00462A' : '#e0e0e0',
            }}
          >
            {chip.label}
          </button>
        );
      })}

      {/* 참가자 필터 */}
      {participantChips.map((chip) => {
        const isActive = currentParticipant === chip.value;
        return (
          <button
            key={chip.value}
            onClick={() =>
              router.push(
                isActive
                  ? buildUrl({ participant: undefined })
                  : buildUrl({ participant: chip.value })
              )
            }
            className="flex-shrink-0 h-7 px-3 text-sm rounded-full border transition-colors"
            style={{
              backgroundColor: isActive ? '#00462A' : 'transparent',
              color: isActive ? '#ffffff' : '#374151',
              borderColor: isActive ? '#00462A' : '#e0e0e0',
            }}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
