'use client';

import { splitTimestamps } from '@/lib/utils';

interface Props {
  text: string;
  // 없으면(예: 인스타 쇼츠처럼 이동할 수 없는 영상) 시간 표기를 강조만 하고 버튼으로 만들지 않음
  onSeek?: (seconds: number) => void;
  className?: string;
}

// 본문 속 "00:10", "1:02:03" 같은 시간 표기를 누르면 영상의 해당 시점으로 이동하는 링크로 바꿔 보여줌
export default function TimestampText({ text, onSeek, className = '' }: Props) {
  return (
    <p className={`whitespace-pre-wrap break-words ${className}`}>
      {splitTimestamps(text).map((part, i) =>
        part.type === 'text' ? (
          <span key={i}>{part.value}</span>
        ) : onSeek ? (
          <button
            key={i}
            type="button"
            onClick={() => onSeek(part.seconds)}
            className="font-semibold underline underline-offset-2"
            style={{ color: '#2d5a8e' }}
          >
            {part.value}
          </button>
        ) : (
          <span key={i} className="font-semibold" style={{ color: '#2d5a8e' }}>
            {part.value}
          </span>
        )
      )}
    </p>
  );
}
