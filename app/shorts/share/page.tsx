'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppLayout from '@/components/AppLayout';

// 인스타그램/유튜브 등의 공유 메뉴에서 이 앱을 선택하면(PWA share_target) 여기로 넘어와 바로 쇼츠로 등록됨.
// 인스타는 공유 시 링크를 url 또는 text("… https://…")에 담아 보내므로 둘 다 확인
function extractUrl(url: string | null, text: string | null): string | null {
  const candidate = [url, text].find((v) => v && /https?:\/\/\S+/i.test(v));
  const m = candidate?.match(/https?:\/\/\S+/i);
  return m ? m[0] : null;
}

function ShareHandler() {
  const router = useRouter();
  const params = useSearchParams();
  const started = useRef(false);
  const [status, setStatus] = useState<'loading' | 'done' | 'error' | 'nolink'>('loading');
  const [message, setMessage] = useState('');

  const link = extractUrl(params.get('url'), params.get('text'));

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!link) {
      setStatus('nolink');
      return;
    }
    (async () => {
      try {
        const res = await fetch('/api/shorts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ video_url: link }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || '등록에 실패했어요');
        setStatus('done');
        setTimeout(() => router.replace('/shorts'), 900);
      } catch (err) {
        setMessage(err instanceof Error ? err.message : '등록에 실패했어요');
        setStatus('error');
      }
    })();
  }, [link, router]);

  return (
    <div className="flex flex-col items-center justify-center text-center py-24 gap-4">
      {status === 'loading' && <p className="text-sm" style={{ color: '#00462A' }}>쇼츠에 등록하는 중...</p>}
      {status === 'done' && (
        <>
          <div className="text-4xl" style={{ color: '#00462A' }}>✓</div>
          <p className="text-base font-bold" style={{ color: '#00462A' }}>쇼츠에 등록됐어요!</p>
        </>
      )}
      {status === 'error' && (
        <>
          <p className="text-base font-bold text-red-500">등록하지 못했어요</p>
          <p className="text-xs" style={{ color: '#B9B9B9' }}>{message}</p>
        </>
      )}
      {status === 'nolink' && (
        <p className="text-sm" style={{ color: '#374151' }}>공유된 내용에서 영상 링크를 찾지 못했어요.</p>
      )}
      {(status === 'error' || status === 'nolink') && (
        <button
          onClick={() => router.replace('/shorts')}
          className="h-10 px-5 text-sm font-semibold rounded text-white"
          style={{ backgroundColor: '#00462A' }}
        >
          쇼츠로 이동
        </button>
      )}
    </div>
  );
}

export default function ShortsSharePage() {
  return (
    <AppLayout>
      <Suspense fallback={null}>
        <ShareHandler />
      </Suspense>
    </AppLayout>
  );
}
