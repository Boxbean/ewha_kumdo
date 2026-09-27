'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FeedbackPost } from '@/lib/types';
import { adminFetch } from '@/lib/adminClient';
import { formatTimestamp, parseTimestamp } from '@/lib/utils';
import AdminAuthModal from './AdminAuthModal';

type PendingAction = 'edit' | 'delete' | null;

// 피드백 상세의 본문 카드 — 관리자 비밀번호 확인 후 수정/삭제 가능
export default function FeedbackPostBody({ post: initialPost }: { post: FeedbackPost }) {
  const router = useRouter();
  const [post, setPost] = useState(initialPost);
  const [editing, setEditing] = useState(false);
  const [authFor, setAuthFor] = useState<PendingAction>(null);
  const [timeText, setTimeText] = useState('');
  const [body, setBody] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function startEdit() {
    setTimeText(formatTimestamp(post.timestamp_seconds));
    setBody(post.body);
    setAuthorName(post.author_name || '');
    setError('');
    setEditing(true);
  }

  async function remove() {
    if (!confirm('이 피드백을 삭제하시겠습니까? 달린 댓글도 함께 삭제됩니다.')) return;
    setBusy(true);
    try {
      const res = await adminFetch(`/api/feedback/${post.id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || '삭제 실패');
      router.push('/feedback');
      router.refresh();
    } catch (e) {
      alert('삭제 실패: ' + (e instanceof Error ? e.message : String(e)));
      setBusy(false);
    }
  }

  // 이번 세션에 이미 인증했다면 비밀번호를 다시 묻지 않음
  function requestAction(action: Exclude<PendingAction, null>) {
    if (sessionStorage.getItem('admin_auth') === '1') run(action);
    else setAuthFor(action);
  }

  function run(action: Exclude<PendingAction, null>) {
    if (action === 'edit') startEdit();
    else void remove();
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const seconds = parseTimestamp(timeText);
    if (seconds == null) { setError('시간은 mm:ss 형식으로 입력해주세요. (예: 03:12)'); return; }
    if (!body.trim()) { setError('피드백 내용을 입력해주세요.'); return; }
    setBusy(true);
    setError('');
    try {
      const res = await adminFetch(`/api/feedback/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timestamp_seconds: seconds, body: body.trim(), author_name: authorName.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '저장 실패');
      setPost((prev) => ({ ...prev, ...json.data }));
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류 발생');
    } finally {
      setBusy(false);
    }
  }

  const buttonClass = 'text-xs px-2.5 py-1 rounded border transition-colors hover:bg-gray-50';

  return (
    <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }}>
      {editing ? (
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>시간 (mm:ss)</label>
            <input
              type="text"
              value={timeText}
              onChange={(e) => setTimeText(e.target.value)}
              className="w-24 h-9 px-3 text-sm rounded border focus:outline-none"
              style={{ borderColor: '#e0e0e0' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>내용</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 text-sm rounded border focus:outline-none resize-y"
              style={{ borderColor: '#e0e0e0' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>작성자 (비우면 익명)</label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded border focus:outline-none"
              style={{ borderColor: '#e0e0e0' }}
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="h-9 px-5 text-sm font-semibold rounded text-white"
              style={{ backgroundColor: '#00462A', opacity: busy ? 0.7 : 1 }}
            >
              {busy ? '저장 중...' : '수정 완료'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="h-9 px-4 text-sm rounded border"
              style={{ borderColor: '#e0e0e0', color: '#374151' }}
            >
              취소
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span
              className="text-xs font-semibold px-1.5 py-0.5 rounded"
              style={{ backgroundColor: 'rgba(0,70,42,0.1)', color: '#00462A' }}
            >
              {formatTimestamp(post.timestamp_seconds)}
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => requestAction('edit')}
                disabled={busy}
                className={buttonClass}
                style={{ borderColor: '#e0e0e0', color: '#B9B9B9' }}
              >
                수정
              </button>
              <button
                type="button"
                onClick={() => requestAction('delete')}
                disabled={busy}
                className={buttonClass}
                style={{ borderColor: '#e0e0e0', color: '#B9B9B9' }}
              >
                삭제
              </button>
            </div>
          </div>
          <p className="text-sm leading-relaxed mb-2 whitespace-pre-wrap" style={{ color: '#111111' }}>
            {post.body}
          </p>
          <p className="text-xs" style={{ color: '#B9B9B9' }}>
            {post.author_name || '익명'}
          </p>
        </>
      )}

      {authFor && (
        <AdminAuthModal
          description={authFor === 'edit' ? '피드백을 수정하려면 관리자 비밀번호가 필요합니다.' : '피드백을 삭제하려면 관리자 비밀번호가 필요합니다.'}
          onClose={() => setAuthFor(null)}
          onSuccess={() => {
            const action = authFor;
            setAuthFor(null);
            run(action);
          }}
        />
      )}
    </div>
  );
}
