import { useEffect, useState } from 'react';

// 유튜브 영상 길이(초) — /api/youtube-duration(1주일 캐시)에서 받아옴, 실패하면 null
export function useYouTubeDuration(videoId: string | null): number | null {
  const [duration, setDuration] = useState<number | null>(null);

  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;
    fetch(`/api/youtube-duration?id=${videoId}`)
      .then((r) => r.json())
      .then((json) => { if (!cancelled) setDuration(json.seconds ?? null); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [videoId]);

  return duration;
}
