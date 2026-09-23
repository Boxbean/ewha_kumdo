'use client';

import { useEffect, useState } from 'react';
import { urlBase64ToUint8Array } from '@/lib/utils';

type PushState = 'unsupported' | 'ios-not-installed' | 'default' | 'subscribed' | 'denied' | 'loading';

function isIos(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches;
}

function BellIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

export default function PushNotificationButton() {
  const [state, setState] = useState<PushState>('loading');
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setState('unsupported');
      return;
    }
    if (isIos() && !isStandalone()) {
      setState('ios-not-installed');
      return;
    }
    if (Notification.permission === 'denied') {
      setState('denied');
      return;
    }
    if (Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then((reg) =>
        reg.pushManager.getSubscription().then((sub) => setState(sub ? 'subscribed' : 'default'))
      );
      return;
    }
    setState('default');
  }, []);

  async function subscribe() {
    // 사용자 클릭의 직접적인 결과로 즉시 호출 — 권한 요청은 반드시 유저 제스처 안에서 이루어져야 함
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      setState(permission === 'denied' ? 'denied' : 'default');
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) return;

    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });
    const json = sub.toJSON();

    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
    });

    setState('subscribed');
  }

  async function unsubscribe() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
    }
    setState('default');
  }

  if (state === 'unsupported' || state === 'loading') return null;

  if (state === 'ios-not-installed') {
    return (
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setShowIosHint((v) => !v)}
          className="w-8 h-8 flex items-center justify-center rounded-full border hover:bg-white/20"
          style={{ borderColor: 'rgba(255,255,255,0.5)', color: '#ffffff' }}
          aria-label="알림 안내"
          title="알림 받기"
        >
          <BellIcon filled={false} />
        </button>
        {showIosHint && (
          <div
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 rounded-lg p-3 text-xs leading-relaxed shadow-lg"
            style={{ backgroundColor: '#ffffff', color: '#374151', border: '1px solid #e0e0e0' }}
          >
            아이폰에서는 홈 화면에 추가한 후에만 알림을 받을 수 있어요. 공유 버튼 → &quot;홈 화면에 추가&quot;로 먼저 설치해주세요.
          </div>
        )}
      </div>
    );
  }

  if (state === 'denied') {
    return (
      <button
        disabled
        className="w-8 h-8 flex items-center justify-center rounded-full border opacity-40 cursor-not-allowed flex-shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.5)', color: '#ffffff' }}
        aria-label="알림 차단됨"
        title="브라우저 설정에서 알림 차단을 해제해야 해요"
      >
        <BellIcon filled={false} />
      </button>
    );
  }

  const subscribed = state === 'subscribed';

  return (
    <button
      onClick={subscribed ? unsubscribe : subscribe}
      className="w-8 h-8 flex items-center justify-center rounded-full border hover:bg-white/20 flex-shrink-0"
      style={{ borderColor: 'rgba(255,255,255,0.5)', color: '#ffffff' }}
      aria-label={subscribed ? '알림 끄기' : '알림 받기'}
      title={subscribed ? '알림 켜짐' : '알림 받기'}
    >
      <BellIcon filled={subscribed} />
    </button>
  );
}
