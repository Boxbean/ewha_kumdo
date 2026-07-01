'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Video, Angle, Competition } from '@/lib/types';
import { extractYouTubeId } from '@/lib/utils';

interface VideoFormProps {
  initial?: Partial<Video>;
  onSuccess: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
}

const ANGLES: Angle[] = ['전면', '후면', '기타'];

const SEP = /[\s,\-\/|·]+/;

function parseParticipantsFromTitle(title: string): string[] {
  const parenIdx = title.indexOf('(');
  if (parenIdx === -1) return [];
  const str = title.slice(parenIdx + 1);
  return str
    .split(SEP)
    .map((s) => s.replace(/[)\s,\-\/|·]+$/, '').trim())
    .filter(Boolean);
}

export default function VideoForm({ initial, onSuccess, onCancel, onDelete }: VideoFormProps) {
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
  const [competitionId, setCompetitionId] = useState<string>(initial?.competition_id || '');
  const [competitions, setCompetitions] = useState<Pick<Competition, 'id' | 'name' | 'year'>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultStatus, setResultStatus] = useState<null | 'success' | 'error'>(null);
  const [apiError, setApiError] = useState('');
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  function resetForm() {
    setYoutubeUrl('');
    setTitle('');
    setDate('');
    setAngle('전면');
    setParticipantInput('');
    setParticipants([]);
    setTopic('');
    setUploader('');
    setCompetitionId('');
    setError('');
    setApiError('');
    setResultStatus(null);
  }

  // 대회 목록 로드
  useEffect(() => {
    fetch('/api/competitions')
      .then((r) => r.json())
      .then(({ data }) => {
        if (data) setCompetitions(data.map((c: Competition) => ({ id: c.id, name: c.name, year: c.year })));
      })
      .catch(() => {});
  }, []);

  async function fetchVideoInfo() {
    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) return;
    setFetchingInfo(true);
    try {
      const res = await fetch(`/api/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`);
      if (!res.ok) return;
      const json = await res.json();
      const rawTitle: string = json.title || '';
      setTitle(rawTitle);
      const names = parseParticipantsFromTitle(rawTitle);
      if (names.length > 0) {
        setParticipants((prev) => {
          const next = [...prev];
          names.forEach((n) => { if (!next.includes(n)) next.push(n); });
          return next;
        });
      }
    } catch {
      // 실패 시 무시 — 사용자가 직접 입력
    } finally {
      setFetchingInfo(false);
    }
  }

  function fillAutoComplete() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yy = String(yesterday.getFullYear()).slice(2);
    const mm = String(yesterday.getMonth() + 1).padStart(2, '0');
    const dd = String(yesterday.getDate()).padStart(2, '0');
    setTitle(`${yy}${mm}${dd} 저녁운동`);
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
      const body = { youtube_url: youtubeUrl, title, date, angle, participants, topic, uploader, competition_id: competitionId || null };
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

  async function handleDelete() {
    if (!initial?.id) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const res = await fetch(`/api/videos/${initial.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || '삭제 실패');
      }
      setResultStatus('deleted' as typeof resultStatus);
      onDelete?.();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : '오류 발생');
    } finally {
      setDeleteLoading(false);
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

  // 삭제 완료 화면
  if ((resultStatus as string) === 'deleted') {
    return (
      <div className="flex flex-col items-center py-10 gap-5 text-center">
        <div>
          <div className="text-3xl mb-2 text-red-400">✓</div>
          <h3 className="text-lg font-bold text-red-500">삭제가 완료되었습니다</h3>
        </div>
        <button
          onClick={() => router.push('/')}
          className="h-9 px-5 text-sm font-semibold rounded text-white"
          style={{ backgroundColor: '#374151' }}
        >
          전체 영상 보기
        </button>
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
    <>
    {/* 삭제 확인 모달 */}
    {deleteConfirm && (
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-6 sm:pb-0"
        onClick={() => setDeleteConfirm(false)}
      >
        <div
          className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-base font-bold mb-2 text-red-500">영상 삭제</h3>
          <p className="text-sm mb-5" style={{ color: '#374151' }}>
            정말 삭제하시겠습니까?<br />
            <span className="font-semibold text-red-400">삭제 후 복구가 불가능합니다!</span>
          </p>
          {deleteError && <p className="text-xs text-red-500 mb-3">{deleteError}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteLoading}
              className="flex-1 h-10 text-sm font-semibold rounded text-white"
              style={{ backgroundColor: '#DC2626', opacity: deleteLoading ? 0.7 : 1 }}
            >
              {deleteLoading ? '삭제 중...' : '삭제하기'}
            </button>
            <button
              type="button"
              onClick={() => setDeleteConfirm(false)}
              className="flex-1 h-10 text-sm rounded border font-medium"
              style={{ borderColor: '#e0e0e0', color: '#374151' }}
            >
              취소
            </button>
          </div>
        </div>
      </div>
    )}

    <form onSubmit={handleSubmit} className="space-y-3">
      {isEdit && (
        <div className="flex justify-end mb-1">
          <button
            type="button"
            onClick={() => setDeleteConfirm(true)}
            className="h-8 px-3 text-xs rounded border"
            style={{ borderColor: '#DC2626', color: '#DC2626' }}
          >
            영상 삭제하기
          </button>
        </div>
      )}
      {!isEdit && (
        <div className="mb-1">
          <button
            type="button"
            onClick={fillAutoComplete}
            className="h-8 px-3 text-xs rounded border"
            style={{ borderColor: '#00462A', color: '#00462A' }}
          >
            자동완성
          </button>
          <div
            className="mt-3 rounded-lg p-3 text-xs"
            style={{ backgroundColor: '#F8FBF9', border: '1px solid #d1e8dc' }}
          >
            <p className="font-semibold mb-1.5" style={{ color: '#00462A' }}>
              자동완성 기능 사용 가이드
            </p>
            <ol className="space-y-0.5" style={{ color: '#374151' }}>
              <li>1. 유튜브 영상 링크를 붙여넣어주세요.</li>
              <li>2. 자동완성 버튼을 눌러주세요.</li>
              <li>3. 링크 내 제목, 날짜, 앵글, 참가자 정보가 자동 입력됩니다.</li>
              <li>4. 잘못된 정보가 있다면 수정 후</li>
              <li>5. &lsquo;등록&rsquo;을 누르면 완료됩니다!</li>
            </ol>
          </div>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
          YouTube URL *
        </label>
        <div className="relative">
          <input
            type="text"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            onBlur={fetchVideoInfo}
            required
            placeholder="https://youtu.be/..."
            className="w-full h-9 px-3 text-sm rounded border focus:outline-none"
            style={{ borderColor: '#e0e0e0' }}
          />
          {fetchingInfo && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#B9B9B9' }}>
              불러오는 중…
            </span>
          )}
        </div>
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
        <div className="w-full overflow-hidden">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full h-9 px-3 text-sm rounded border focus:outline-none"
            style={{ borderColor: '#e0e0e0', boxSizing: 'border-box' }}
          />
        </div>
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
          placeholder="정규운동, 기본기, 시합, 모의시합..."
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

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
          대회 연결 (선택)
        </label>
        <select
          value={competitionId}
          onChange={(e) => setCompetitionId(e.target.value)}
          className="w-full h-9 px-3 text-sm rounded border focus:outline-none bg-white"
          style={{ borderColor: '#e0e0e0', color: competitionId ? '#111' : '#B9B9B9' }}
        >
          <option value="">일반 훈련 영상 (대회 없음)</option>
          {competitions
            .sort((a, b) => b.year - a.year)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.year} {c.name}
              </option>
            ))}
        </select>
        {competitionId && (
          <p className="text-xs mt-1" style={{ color: '#00462A' }}>
            ✓ 대회 탭에서도 이 영상이 표시됩니다
          </p>
        )}
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
    </>
  );
}
