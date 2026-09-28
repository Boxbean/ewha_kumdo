'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/adminClient';
import { urlBase64ToUint8Array } from '@/lib/utils';
import RelativeTime from './RelativeTime';

interface PasswordRequest {
  id: string;
  feedback_post_id: string;
  requester_name: string | null;
  message: string | null;
  created_at: string;
  post: { id: string; title: string | null; author_name: string | null } | null;
}

// 관리자 피드백 탭 상단: 비밀번호 분실 문의 목록 + 이 기기로 문의 알림 받기
export default function AdminPasswordRequests() {
  const [requests, setRequests] = useState<PasswordRequest[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await adminFetch('/api/feedback/password-requests');
    const json = await res.json().catch(() => ({}));
    setRequests(json.data || []);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function resolve(id: string) {
    const res = await adminFetch('/api/feedback/password-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) { alert('처리에 실패했습니다.'); return; }
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="rounded-lg border p-3 mb-5" style={{ borderColor: '#e0e0e0', backgroundColor: '#FAFAF7' }}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="text-sm font-bold" style={{ color: '#374151' }}>
          🔑 비밀번호 분실 문의 {requests.length > 0 && <span style={{ color: '#D97706' }}>{requests.length}</span>}
        </h3>
        <AdminAlertToggle />
      </div>
      {loading ? (
        <p className="text-xs" style={{ color: '#B9B9B9' }}>불러오는 중...</p>
      ) : requests.length === 0 ? (
        <p className="text-xs" style={{ color: '#B9B9B9' }}>처리할 문의가 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {requests.map((r) => (
            <div key={r.id} className="rounded border p-2.5 bg-white" style={{ borderColor: '#e0e0e0' }}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link href={`/feedback/${r.feedback_post_id}`} className="text-sm font-semibold hover:underline line-clamp-1" style={{ color: '#111' }}>
                    {r.post?.title || '피드백 요청'} ›
                  </Link>
                  <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                    문의자 <b>{r.requester_name || '이름 없음'}</b> · 글 작성자 {r.post?.author_name || '익명'} · <RelativeTime iso={r.created_at} />
                  </p>
                  {r.message && <p className="text-xs mt-1" style={{ color: '#374151' }}>“{r.message}”</p>}
                </div>
                <button
                  type="button"
                  onClick={() => void resolve(r.id)}
                  className="h-7 px-2.5 text-xs rounded border flex-shrink-0"
                  style={{ borderColor: '#00462A', color: '#00462A' }}
                >
                  처리 완료
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-[11px] mt-2 leading-relaxed" style={{ color: '#9CA3AF' }}>
        관리자로 로그인한 상태에서는 글 상세의 수정·삭제가 글 비밀번호 없이 됩니다. 본인 확인 후 대신 처리해주세요.
      </p>
    </div>
  );
}

type AlertState = 'loading' | 'unsupported' | 'off' | 'on' | 'busy';

// 이 기기(브라우저)를 관리자 알림 기기로 등록/해제 — 아이폰은 홈 화면에 설치한 앱에서만 가능
function AdminAlertToggle() {
  const [state, setState] = useState<AlertState>('loading');

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setState('unsupported');
      return;
    }
    void (async () => {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) { setState('off'); return; }
      const res = await adminFetch(`/api/push/admin?endpoint=${encodeURIComponent(sub.endpoint)}`);
      const json = await res.json().catch(() => ({}));
      setState(json.is_admin ? 'on' : 'off');
    })();
  }, []);

  async function turnOn() {
    // 권한 요청은 반드시 클릭 직후에 해야 함
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') { alert('브라우저 알림 권한이 필요합니다.'); return; }
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) return;
    setState('busy');
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      }));
      const json = sub.toJSON();
      const res = await adminFetch('/api/push/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
      if (!res.ok) throw new Error();
      setState('on');
    } catch {
      alert('알림 등록에 실패했습니다.');
      setState('off');
    }
  }

  async function turnOff() {
    setState('busy');
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await adminFetch('/api/push/admin', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
    }
    setState('off');
  }

  if (state === 'loading') return null;
  if (state === 'unsupported') {
    return <span className="text-[11px]" style={{ color: '#9CA3AF' }}>이 브라우저는 알림 미지원</span>;
  }
  const on = state === 'on';
  return (
    <button
      type="button"
      disabled={state === 'busy'}
      onClick={() => void (on ? turnOff() : turnOn())}
      className="h-7 px-2.5 text-xs rounded-full border flex-shrink-0"
      style={on
        ? { borderColor: '#00462A', backgroundColor: '#00462A', color: '#fff' }
        : { borderColor: '#e0e0e0', color: '#374151' }}
    >
      {on ? '🔔 이 기기로 알림 받는 중' : '🔕 이 기기로 문의 알림 받기'}
    </button>
  );
}
