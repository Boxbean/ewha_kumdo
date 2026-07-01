'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  videoId: string;
}

export default function EditButton({ videoId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleClose() {
    setOpen(false);
    setPassword('');
    setError('');
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error('비밀번호가 올바르지 않습니다.');
      sessionStorage.setItem('admin_auth', '1');
      sessionStorage.setItem('admin_pwd', password);
      sessionStorage.setItem('admin_edit_id', videoId);
      router.push('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류 발생');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex-shrink-0 text-xs px-3 py-1 rounded border transition-colors hover:bg-gray-50"
        style={{ borderColor: '#e0e0e0', color: '#B9B9B9' }}
      >
        수정하기
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={handleClose}
        >
          <div
            className="bg-white rounded-lg p-6 w-80 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold mb-1" style={{ color: '#374151' }}>
              관리자 인증
            </h3>
            <p className="text-xs mb-4" style={{ color: '#B9B9B9' }}>
              영상을 수정하려면 관리자 비밀번호가 필요합니다.
            </p>
            <form onSubmit={handleAuth} className="space-y-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력"
                autoFocus
                className="w-full h-9 px-3 text-sm rounded border focus:outline-none"
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
                  onClick={handleClose}
                  className="h-9 px-4 text-sm rounded border"
                  style={{ borderColor: '#e0e0e0', color: '#374151' }}
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
