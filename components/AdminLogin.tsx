'use client';

import { useState } from 'react';

interface AdminLoginProps {
  onSuccess: () => void;
}

export default function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (json.ok) {
        sessionStorage.setItem('admin_auth', '1');
        sessionStorage.setItem('admin_pwd', password);
        onSuccess();
      } else {
        setError('비밀번호가 틀렸습니다.');
      }
    } catch {
      setError('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div
        className="w-full max-w-sm p-8 rounded-xl"
        style={{ backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }}
      >
        <h1 className="text-xl font-bold mb-6 text-center" style={{ color: '#00462A' }}>
          관리자 로그인
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            className="w-full h-10 px-3 text-sm rounded border focus:outline-none"
            style={{ borderColor: '#e0e0e0' }}
            autoFocus
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 text-sm font-semibold rounded text-white"
            style={{ backgroundColor: '#00462A', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? '확인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}
