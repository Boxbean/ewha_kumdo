'use client';

import { useState } from 'react';
import { detectPlatform } from '@/lib/utils';

interface ShortsFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ShortsForm({ onSuccess, onCancel }: ShortsFormProps) {
  const [videoUrl, setVideoUrl] = useState('');
  const [title, setTitle] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [submitterName, setSubmitterName] = useState('');
  const [manual, setManual] = useState(false);
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function fetchShortsInfo() {
    if (!videoUrl) return;
    setFetchingInfo(true);
    try {
      const res = await fetch(`/api/shorts/oembed?url=${encodeURIComponent(videoUrl)}`);
      const json = await res.json();
      if (json.manual) {
        setManual(true);
        setThumbnailUrl(null);
      } else {
        setManual(false);
        setTitle(json.title || '');
        setThumbnailUrl(json.thumbnail_url || null);
      }
    } catch {
      setManual(true);
    } finally {
      setFetchingInfo(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!videoUrl.trim()) {
      setError('영상 링크를 입력해주세요.');
      return;
    }
    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/shorts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_url: videoUrl,
          title,
          thumbnail_url: thumbnailUrl,
          submitter_name: submitterName || undefined,
        }),
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

  const platform = videoUrl ? detectPlatform(videoUrl) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
          영상 링크 *
        </label>
        <div className="relative">
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => { setVideoUrl(e.target.value); setManual(false); }}
            onBlur={fetchShortsInfo}
            required
            placeholder="인스타그램 릴스, 유튜브 등 영상 링크"
            className="w-full h-9 px-3 text-sm rounded border focus:outline-none"
            style={{ borderColor: '#e0e0e0' }}
          />
          {fetchingInfo && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#B9B9B9' }}>
              불러오는 중…
            </span>
          )}
        </div>
        {platform === 'instagram' && (
          <p className="text-xs mt-1" style={{ color: '#B9B9B9' }}>
            인스타그램 링크는 제목을 자동으로 가져올 수 없어 직접 입력해주세요.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
          제목 * {manual && <span className="font-normal" style={{ color: '#B9B9B9' }}>(직접 입력)</span>}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full h-9 px-3 text-sm rounded border focus:outline-none"
          style={{ borderColor: '#e0e0e0' }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
          제출자 (선택)
        </label>
        <input
          type="text"
          value={submitterName}
          onChange={(e) => setSubmitterName(e.target.value)}
          className="w-full h-9 px-3 text-sm rounded border focus:outline-none"
          style={{ borderColor: '#e0e0e0' }}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="h-9 px-5 text-sm font-semibold rounded text-white"
          style={{ backgroundColor: '#00462A', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? '등록 중...' : '등록'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-9 px-4 text-sm rounded border"
          style={{ borderColor: '#e0e0e0', color: '#374151' }}
        >
          취소
        </button>
      </div>
    </form>
  );
}
