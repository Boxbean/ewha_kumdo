'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Video, Angle } from '@/lib/types';
import { extractYouTubeId } from '@/lib/utils';

interface VideoFormProps {
  initial?: Partial<Video>;
  onSuccess: () => void;
  onCancel?: () => void;
}

const ANGLES: Angle[] = ['전면', '후면', '기타'];

export default function VideoForm({ initial, onSuccess, onCancel }: VideoFormProps) {
  const router = useRouter();
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
  const [resultStatus, setResultStatus] = useState<null | 'success' | 'error'>(null);
  const [apiError, setApiError] = useState('');

  function resetForm() {
    setYoutubeUrl('');
    setTitle('');
    setDate('');
    setAngle('전면');
    setParticipantInput('');
    setParticipants([]);
    setTopic('');
    setUploader('');
    setError('');
    setApiError('');
    setResultStatus(null);
  }

  function fillAutoComplete() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yy = String(yesterday.getFullYear()).slice(2);
    const mm = String(yesterday.getMonth() + 1).padStart(2, '0');
    const dd = String(yesterday.getDate()).padStart(2, '0');
    setTitle(`${yy}${mm}${dd}코오롱스포렉스 저녁반`);
    setDate(`${yesterday.getFullYear()}-${mm}-${dd}`);
    setAngle('후면');
  }

  function addParticipant() {
    const parts = participantInput.split(',').map((s) => s.trim()).filter(Boolean);
    setParticipants((prev) => {
      const next = [...prev];
      parts.forEach((p) => { if (!next.includes(p)) next.push(p); });
      return next;
    });
    setParticipantInput('');
  }

  function removeParticipant(p: string) {
    setParticipants((prev) => prev.filter((x) => x !== p));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
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
      setResultStatus('success');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : '오류 발생');
      setResultStatus('error');
    } finally {
      setLoading(false);
    }
  }

  // 성공 결과 화면
  if (resultStatus === 'success') {
    return (
      <div className="flex flex-col items-center py-10 gap-5 text-center">
        <div>
          <div className="text-3xl mb-2" style={{ color: '#00462A' }}>✓</div>
          <h3 className="text-lg font-bold" style={{ color: '#00462A' }}>등록 완료!</h3>
        </div>
        <div className="flex gap-3">
          <button
            onClick={resetForm}
            className="h-9 px-5 text-sm font-semibold rounded text-white"
            style={{ backgroundColor: '#00462A' }}
          >
            다른 영상 등록하기
          </button>
          <button
            onClick={() => router.push('/')}
            className="h-9 px-4 text-sm rounded border"
            style={{ borderColor: '#e0e0e0', color: '#374151' }}
          >
            전체 영상 보기
          </button>
        </div>
      </div>
    );
  }

  // 실패 결과 화면
  if (resultStatus === 'error') {
    return (
      <div className="flex flex-col items-center py-10 gap-5 text-center">
        <div>
          <div className="text-3xl mb-2 text-red-400">✗</div>
          <h3 className="text-lg font-bold text-red-500">문제가 발생했습니다</h3>
          {apiError && (
            <p className="text-xs mt-2" style={{ color: '#B9B9B9' }}>{apiError}</p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setResultStatus(null)}
            className="h-9 px-5 text-sm font-semibold rounded text-white"
            style={{ backgroundColor: '#00462A' }}
          >
            다시 시도하기
          </button>
          <button
            onClick={() => onCancel ? onCancel() : router.push('/')}
            className="h-9 px-4 text-sm rounded border"
            style={{ borderColor: '#e0e0e0', color: '#374151' }}
          >
            나가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {!isEdit && (
        <div>
          <button
            type="button"
            onClick={fillAutoComplete}
            className="h-8 px-3 text-xs rounded border"
            style={{ borderColor: '#00462A', color: '#00462A' }}
          >
            자동완성
          </button>
        </div>
      )}
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

      <div>
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
        <div className="flex gap-2">
          {ANGLES.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAngle(a)}
              className="flex-1 h-9 text-sm rounded border font-medium"
              style={
                angle === a
                  ? { backgroundColor: '#00462A', borderColor: '#00462A', color: '#fff' }
                  : { borderColor: '#e0e0e0', color: '#374151', backgroundColor: '#fff' }
              }
            >
              {a}
            </button>
          ))}
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
            className="h-9 px-3 text-sm rounded border shrink-0 whitespace-nowrap"
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
          placeholder="기본기, 연습대련, 본, 시합..."
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
