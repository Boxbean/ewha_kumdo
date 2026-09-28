'use client';

import { useState } from 'react';
import { saveAuthorToken } from '@/lib/feedbackAuthorClient';

interface Props {
  postId: string;
  title: string;
  description: string;
  // 확인된 비밀번호 — 수정/삭제 요청 헤더에 실어 보낼 때 사용
  onSuccess: (password: string) => void;
  onClose: () => void;
}

// 게시글 비밀번호(숫자 4자리) 확인 모달 — 잊어버린 경우 개발자에게 문의를 보내는 화면으로 전환
export default function FeedbackPasswordModal({ postId, title, description, onSuccess, onClose }: Props) {
  const [mode, setMode] = useState<'password' | 'forgot' | 'sent'>('password');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4}$/.test(password)) { setError('숫자 4자리를 입력해주세요.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/feedback/${postId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || '비밀번호가 올바르지 않습니다.');
      // 비밀번호를 아는 사람 = 글쓴이 — 이 기기에서 쓰는 댓글도 글쓴이로 표시되게 저장
      if (json.author_token) saveAuthorToken(postId, json.author_token);
      onSuccess(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류 발생');
    } finally {
      setLoading(false);
    }
  }

  async function sendForgot(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('연락받을 이름을 입력해주세요.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/feedback/${postId}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_name: name.trim(), message: message.trim() || undefined }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || '전송 실패');
      setMode('sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류 발생');
    } finally {
      setLoading(false);
    }
  }

  const inputClass = 'w-full h-9 px-3 text-sm rounded border focus:outline-none';

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-xs shadow-lg" onClick={(e) => e.stopPropagation()}>
        {mode === 'password' && (
          <>
            <h3 className="text-base font-bold mb-1" style={{ color: '#374151' }}>{title}</h3>
            <p className="text-xs mb-4" style={{ color: '#B9B9B9' }}>{description}</p>
            <form onSubmit={verify} className="space-y-3">
              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={4}
                value={password}
                onChange={(e) => setPassword(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="비밀번호 (숫자 4자리)"
                autoFocus
                className={`${inputClass} tracking-widest`}
                style={{ borderColor: '#e0e0e0' }}
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-9 text-sm font-semibold rounded text-white"
                  style={{ backgroundColor: '#00462A', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? '확인 중...' : '확인'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="h-9 px-4 text-sm rounded border"
                  style={{ borderColor: '#e0e0e0', color: '#374151' }}
                >
                  취소
                </button>
              </div>
            </form>
            <button
              type="button"
              onClick={() => { setError(''); setMode('forgot'); }}
              className="block mx-auto mt-4 text-xs underline"
              style={{ color: '#6B7280' }}
            >
              비밀번호를 잊으셨나요?
            </button>
          </>
        )}

        {mode === 'forgot' && (
          <>
            <h3 className="text-base font-bold mb-1" style={{ color: '#374151' }}>비밀번호 분실 문의</h3>
            <p className="text-xs mb-4 leading-relaxed" style={{ color: '#6B7280' }}>
              개발자에게 알림이 가요. 글쓴이 본인인지 확인한 뒤 연락드릴게요.
            </p>
            <form onSubmit={sendForgot} className="space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={30}
                placeholder="연락받을 이름 (예: 29기 박수빈)"
                autoFocus
                className={inputClass}
                style={{ borderColor: '#e0e0e0' }}
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={300}
                rows={2}
                placeholder="남길 말 (선택) — 예: 수정하고 싶어요 / 지워주세요"
                className="w-full px-3 py-2 text-sm rounded border focus:outline-none resize-none"
                style={{ borderColor: '#e0e0e0' }}
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-9 text-sm font-semibold rounded text-white"
                  style={{ backgroundColor: '#00462A', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? '보내는 중...' : '개발자에게 알리기'}
                </button>
                <button
                  type="button"
                  onClick={() => { setError(''); setMode('password'); }}
                  className="h-9 px-4 text-sm rounded border"
                  style={{ borderColor: '#e0e0e0', color: '#374151' }}
                >
                  뒤로
                </button>
              </div>
            </form>
          </>
        )}

        {mode === 'sent' && (
          <>
            <h3 className="text-base font-bold mb-2" style={{ color: '#374151' }}>문의를 보냈어요 📨</h3>
            <p className="text-sm mb-4 leading-relaxed" style={{ color: '#6B7280' }}>
              개발자가 확인 후 연락드릴게요.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full h-9 text-sm font-semibold rounded text-white"
              style={{ backgroundColor: '#00462A' }}
            >
              닫기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
