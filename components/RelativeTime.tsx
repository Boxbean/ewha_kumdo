'use client';

import { useEffect, useState } from 'react';
import { formatRelativeTime } from '@/lib/utils';

// "5분 전" 같은 상대 시간 — 캐시된 서버 HTML과 현재 시각이 달라 어긋나지 않도록 브라우저에서만 계산
export default function RelativeTime({ iso }: { iso: string }) {
  const [text, setText] = useState('');
  useEffect(() => setText(formatRelativeTime(iso)), [iso]);
  return <time dateTime={iso}>{text}</time>;
}
