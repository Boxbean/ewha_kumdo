'use client';

import { useState } from 'react';
import { Video, Angle } from '@/lib/types';
import { extractYouTubeId } from '@/lib/utils';

interface VideoFormProps {
  initial?: Partial<Video>;
  onSuccess: () => void;
  onCancel?: () => void;
}

const ANGLES: Angle[] = ['전면', '후면', '기타'];

export default function VideoForm({ initial, onSuccess, onCancel }: VideoFormProps) {
  const isEdit = !!initial?.id;

  const [youtubeUrl, setYoutubeUrl] = useState(initial?.youtube_url || '');
  const [title, setTitle] = useState(initial?.title || '');
  const [date, setDate] = useState(initial?.date || '');
  const [angle, setAngle] = useState<Angle>(initial?.angle || '전면');
  const [participantInput, setParticipantInput] = useState('');
  const [participants, setParticipants] = useState<string[]>(initial?.participants || []);
  const [topic, setTopic] = useState(initial?.topic || '');
  const [uploader, setUploader] = useState(initial?.uploader || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function addParticipant() {
    const p = participantInput.trim();
    if (p && !participants.includes(p)) {
      setParticipants((prev) => [...prev, p]);
    }
    setParticipantInput('');
  }

  function removeParticipant(p: string) {
    setParticipants((prev) => prev.filter((x) => x !== p));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    // YouTube URL 유효성 검사
    if (!extractYouTubeId(youtubeUrl)) {
      setError('YouTube URL 형식이 올바르지 않습니다. (예: https://youtu.be/xxx 또는 https://www.youtube.com/watch?v=xxx)');
      return;
    }
    setLoading(true);
    try {
      const body = { youtube_url: youtubeUrl, title, date, angle, participants, topic, uploader };
      const url = isEdit ? `/api/videos/${initial!.id}` : '/api/videos';
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
          YouTube URL *
        </label>
        <input
          type="text"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          required
          placeholder="https://youtu.be/..."
          className="w-full h-9 px-3 text-sm rounded border focus:outline-none"
          style={{ borderColor: '#e0e0e0' }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
          제목 *
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

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
            날짜 *
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full h-9 px-3 text-sm rounded border focus:outline-none"
            style={{ borderColor: '#e0e0e0' }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
            앵글 *
          </label>
          <select
            value={angle}
            onChange={(e) => setAngle(e.target.value as Angle)}
            className="h-9 px-3 text-sm rounded border focus:outline-none"
            style={{ borderColor: '#e0e0e0' }}
          >
            {ANGLES.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
          참가자 (선택)
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={participantInput}
            onChange={(e) => setParticipantInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addParticipant(); } }}
            placeholder="이름 입력 후 Enter"
            className="flex-1 h-9 px-3 text-sm rounded border focus:outline-none"
            style={{ borderColor: '#e0e0e0' }}
          />
          <button
            type="button"
            onClick={addParticipant}
            className="h-9 px-3 text-sm rounded border"
            style={{ borderColor: '#00462A', color: '#00462A' }}
          >
            추가
          </button>
        </div>
        {participants.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {participants.map((p) => (
              <span
                key={p}
                className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(0,70,42,0.1)', color: '#00462A' }}
              >
                #{p}
                <button
                  type="button"
                  onClick={() => removeParticipant(p)}
                  className="ml-0.5 hover:opacity-60"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
          주제 (선택)
        </label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="예: 기본기, 품새..."
          className="w-full h-9 px-3 text-sm rounded border focus:outline-none"
          style={{ borderColor: '#e0e0e0' }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
          등록자 (선택)
        </label>
        <input
          type="text"
          value={uploader}
          onChange={(e) => setUploader(e.target.value)}
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
          {loading ? '저장 중...' : isEdit ? '수정 완료' : '등록'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="h-9 px-4 text-sm rounded border"
            style={{ borderColor: '#e0e0e0', color: '#374151' }}
          >
            취소
          </button>
        )}
      </div>
    </form>
  );
}
