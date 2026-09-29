'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FeedbackPost } from '@/lib/types';
import { adminFetch } from '@/lib/adminClient';
import { FEEDBACK_TITLE_MAX } from '@/lib/utils';
import FeedbackPasswordModal from './FeedbackPasswordModal';
import TimestampText from './TimestampText';
import RelativeTime from './RelativeTime';

type PendingAction = 'edit' | 'delete' | null;

// 피드백 상세의 본문 카드 — 제목(요약)이 메인, 본문의 시간 표기는 영상 이동 링크. 글 비밀번호(또는 관리자 인증) 확인 후 수정/삭제 가능
export default function FeedbackPostBody({
  post: initialPost, onSeek,
}: {
  post: FeedbackPost;
  onSeek?: (seconds: number) => void;
}) {
  const router = useRouter();
  const [post, setPost] = useState(initialPost);
  const [editing, setEditing] = useState(false);
  const [authFor, setAuthFor] = useState<PendingAction>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // 이번에 확인한 글 비밀번호 — 수정/삭제 요청 헤더에 실어 보냄
  const [postPassword, setPostPassword] = useState('');

  function startEdit() {
    setTitle(post.title || '');
    setBody(post.body);
    setAuthorName(post.author_name || '');
    setError('');
    setEditing(true);
  }

  async function remove(password: string) {
    if (!confirm('이 피드백을 삭제하시겠습니까? 달린 댓글도 함께 삭제됩니다.')) return;
    setBusy(true);
    try {
      const res = await adminFetch(`/api/feedback/${post.id}`, { method: 'DELETE', headers: passwordHeader(password) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || '삭제 실패');
      router.push('/feedback');
      router.refresh();
    } catch (e) {
      alert('삭제 실패: ' + (e instanceof Error ? e.message : String(e)));
      setBusy(false);
    }
  }

  // 관리자로 인증된 세션이거나 이미 글 비밀번호를 확인했다면 다시 묻지 않음
  function requestAction(action: Exclude<PendingAction, null>) {
    if (sessionStorage.getItem('admin_auth') === '1' || postPassword) run(action, postPassword);
    else setAuthFor(action);
  }

  function run(action: Exclude<PendingAction, null>, password: string) {
    if (action === 'edit') startEdit();
    else void remove(password);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('제목(요약)을 입력해주세요.'); return; }
    if (!body.trim()) { setError('피드백 내용을 입력해주세요.'); return; }
    setBusy(true);
    setError('');
    try {
      const res = await adminFetch(`/api/feedback/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...passwordHeader(postPassword) },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), author_name: authorName.trim() || null }),
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
    <div data-tour="feedback-post" className="rounded-lg p-4 mb-4" style={{ backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }}>
      {editing ? (
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>제목 (요약)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, FEEDBACK_TITLE_MAX))}
              className="w-full h-9 px-3 text-sm rounded border focus:outline-none"
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
          <div className="flex items-start justify-between gap-2 mb-2">
            <h1 className="text-base font-bold leading-snug" style={{ color: '#111' }}>
              {post.title || '피드백 요청'}
            </h1>
            <div className="flex flex-shrink-0 gap-1.5">
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
          <div className="text-sm leading-relaxed mb-2" style={{ color: '#374151' }}>
            <TimestampText text={post.body} onSeek={onSeek} />
          </div>
          <p className="text-xs" style={{ color: '#B9B9B9' }}>
            {post.author_name || '익명'} · <RelativeTime iso={post.created_at} />
          </p>
        </>
      )}

      {authFor && (
        <FeedbackPasswordModal
          postId={post.id}
          title={authFor === 'edit' ? '피드백 수정' : '피드백 삭제'}
          description="글을 등록할 때 정한 비밀번호(숫자 4자리)를 입력해주세요."
          onClose={() => setAuthFor(null)}
          onSuccess={(password) => {
            const action = authFor;
            setAuthFor(null);
            setPostPassword(password);
            run(action, password);
          }}
        />
      )}
    </div>
  );
}

// 관리자 세션이면 adminFetch가 관리자 비밀번호도 함께 실어 보내므로 둘 중 하나만 맞으면 통과
function passwordHeader(password: string): Record<string, string> {
  return password ? { 'x-feedback-password': password } : {};
}
