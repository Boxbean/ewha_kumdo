'use client';

import { useState } from 'react';

interface ShortsFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

// 링크만 붙여넣고 등록 — 제목/썸네일은 서버(POST /api/shorts)가 알아서 채우고, 못 가져오면 기본 제목+썸네일 없음으로 저장
export default function ShortsForm({ onSuccess, onCancel }: ShortsFormProps) {
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const url = videoUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      setError('http(s)로 시작하는 영상 링크를 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/shorts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_url: url }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '오류 발생');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류 발생');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="url"
        inputMode="url"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        autoFocus
        placeholder="인스타그램·유튜브 등 영상 링크 붙여넣기"
        className="w-full h-11 px-3 text-sm rounded border focus:outline-none"
        style={{ borderColor: '#e0e0e0' }}
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || !videoUrl.trim()}
          className="flex-1 h-11 text-sm font-semibold rounded text-white"
          style={{ backgroundColor: '#00462A', opacity: loading || !videoUrl.trim() ? 0.6 : 1 }}
        >
          {loading ? '등록 중...' : '등록'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-11 px-4 text-sm rounded border"
          style={{ borderColor: '#e0e0e0', color: '#374151' }}
        >
          취소
        </button>
      </div>
    </form>
  );
}
