'use client';

import { useRef, useState } from 'react';
import { VideoChapter } from '@/lib/types';
import { formatTimestamp, parseTimestamp } from '@/lib/utils';
import YouTubePlayer, { YouTubePlayerHandle } from './YouTubePlayer';

const PRESET_LABELS = ['준비운동', '기본동작', '대련', '시합연습', '정리운동'];

interface Props {
  videoId: string;
  chapters: VideoChapter[];
  onChange: (chapters: VideoChapter[]) => void;
}

function sortChapters(chapters: VideoChapter[]) {
  return [...chapters].sort((a, b) => a.seconds - b.seconds);
}

// 관리자용: 영상을 보면서 "현재 위치"를 구간 시작으로 찍는 편집기
export default function ChapterEditor({ videoId, chapters, onChange }: Props) {
  const playerRef = useRef<YouTubePlayerHandle>(null);
  const [customLabel, setCustomLabel] = useState('');

  function addAtCurrent(label: string) {
    const seconds = playerRef.current?.getCurrentTime();
    if (seconds == null) {
      alert('영상이 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    onChange(sortChapters([...chapters.filter((c) => c.label !== label), { label, seconds }]));
  }

  function updateTime(index: number, text: string) {
    const seconds = parseTimestamp(text);
    if (seconds == null) return;
    onChange(sortChapters(chapters.map((c, i) => (i === index ? { ...c, seconds } : c))));
  }

  return (
    <div className="space-y-2">
      <div className="relative w-full rounded overflow-hidden" style={{ aspectRatio: '16/9', backgroundColor: '#000' }}>
        <YouTubePlayer ref={playerRef} videoId={videoId} />
      </div>

      <p className="text-xs" style={{ color: '#6B7280' }}>
        영상을 원하는 위치로 옮긴 뒤 버튼을 누르면 그 위치가 구간 시작으로 저장됩니다. 가장 이른 구간이 운동 시작점이 됩니다.
      </p>

      <div className="flex flex-wrap gap-1.5">
        {PRESET_LABELS.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => addAtCurrent(label)}
            className="h-8 px-3 text-xs rounded border"
            style={{ borderColor: '#00462A', color: '#00462A' }}
          >
            + {label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={customLabel}
          onChange={(e) => setCustomLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault(); // 바깥 영상 등록 폼이 제출되지 않도록
            if (customLabel.trim()) {
              addAtCurrent(customLabel.trim());
              setCustomLabel('');
            }
          }}
          placeholder="직접 입력 (예: 호구 착용)"
          className="flex-1 h-8 px-3 text-xs rounded border focus:outline-none"
          style={{ borderColor: '#e0e0e0' }}
        />
        <button
          type="button"
          disabled={!customLabel.trim()}
          onClick={() => {
            addAtCurrent(customLabel.trim());
            setCustomLabel('');
          }}
          className="h-8 px-3 text-xs rounded border shrink-0"
          style={{ borderColor: '#00462A', color: '#00462A', opacity: customLabel.trim() ? 1 : 0.5 }}
        >
          현재 위치에 추가
        </button>
      </div>

      {chapters.length > 0 && (
        <div className="space-y-1">
          {chapters.map((c, i) => (
            <div
              key={`${c.label}-${c.seconds}`}
              className="flex items-center gap-2 px-3 py-1.5 rounded border text-xs"
              style={{ borderColor: '#e0e0e0' }}
            >
              <input
                type="text"
                defaultValue={formatTimestamp(c.seconds)}
                onBlur={(e) => updateTime(i, e.target.value)}
                className="w-16 h-7 px-2 rounded border focus:outline-none"
                style={{ borderColor: '#e0e0e0' }}
              />
              <span className="flex-1" style={{ color: '#374151' }}>
                {c.label}
                {i === 0 && <span style={{ color: '#00462A' }}> · 시작점</span>}
              </span>
              <button type="button" onClick={() => playerRef.current?.seekTo(c.seconds)} style={{ color: '#2d5a8e' }}>
                이동
              </button>
              <button
                type="button"
                onClick={() => onChange(chapters.filter((_, j) => j !== i))}
                style={{ color: '#DC2626' }}
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
