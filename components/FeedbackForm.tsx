'use client';

import { useEffect, useState } from 'react';
import { FeedbackVideoType, Video, Shorts } from '@/lib/types';

interface FeedbackFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialVideoType?: FeedbackVideoType;
  initialVideoId?: string;
}

export default function FeedbackForm({ onSuccess, onCancel, initialVideoType, initialVideoId }: FeedbackFormProps) {
  const [videoType, setVideoType] = useState<FeedbackVideoType>(initialVideoType || 'video');
  const [videos, setVideos] = useState<Pick<Video, 'id' | 'title' | 'date'>[]>([]);
  const [shortsList, setShortsList] = useState<Pick<Shorts, 'id' | 'title'>[]>([]);
  const [videoId, setVideoId] = useState(initialVideoId || '');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [body, setBody] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/videos?limit=100')
      .then((r) => r.json())
      .then(({ data }) => setVideos(data || []))
      .catch(() => {});
    fetch('/api/shorts?limit=100')
      .then((r) => r.json())
      .then(({ data }) => setShortsList(data || []))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!videoId) {
      setError('영상을 선택해주세요.');
      return;
    }
    if (!body.trim()) {
      setError('피드백 내용을 입력해주세요.');
      return;
    }
    const timestampSeconds = (Number(minutes) || 0) * 60 + (Number(seconds) || 0);
    setLoading(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_type: videoType,
          video_id: videoId,
          timestamp_seconds: timestampSeconds,
          body,
          author_name: authorName || undefined,
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

  const options = videoType === 'video' ? videos : shortsList;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
          영상 종류 *
        </label>
        <div className="flex gap-2">
          {(['video', 'shorts'] as FeedbackVideoType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setVideoType(t); setVideoId(''); }}
              className="flex-1 h-9 text-sm rounded border font-medium"
              style={
                videoType === t
                  ? { backgroundColor: '#00462A', borderColor: '#00462A', color: '#fff' }
                  : { borderColor: '#e0e0e0', color: '#374151', backgroundColor: '#fff' }
              }
            >
              {t === 'video' ? '정규 영상' : '검도쇼츠'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
          영상 선택 *
        </label>
        <select
          value={videoId}
          onChange={(e) => setVideoId(e.target.value)}
          required
          className="w-full h-9 px-3 text-sm rounded border focus:outline-none bg-white"
          style={{ borderColor: '#e0e0e0', color: videoId ? '#111' : '#B9B9B9' }}
        >
          <option value="">영상을 선택해주세요</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
          타임스탬프 <span className="font-normal" style={{ color: '#B9B9B9' }}>(mm:ss)</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            placeholder="분"
            className="w-20 h-9 px-3 text-sm rounded border focus:outline-none"
            style={{ borderColor: '#e0e0e0' }}
          />
          <span style={{ color: '#B9B9B9' }}>:</span>
          <input
            type="number"
            min={0}
            max={59}
            value={seconds}
            onChange={(e) => setSeconds(e.target.value)}
            placeholder="초"
            className="w-20 h-9 px-3 text-sm rounded border focus:outline-none"
            style={{ borderColor: '#e0e0e0' }}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
          피드백 내용 *
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={4}
          placeholder="이 부분에서 이런 피드백을 주시면 좋겠어요..."
          className="w-full px-3 py-2 text-sm rounded border focus:outline-none resize-none"
          style={{ borderColor: '#e0e0e0' }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
          작성자 (선택) <span className="font-normal" style={{ color: '#B9B9B9' }}>(예: 29기 박수빈)</span>
        </label>
        <input
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
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
