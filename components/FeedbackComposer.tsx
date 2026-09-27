'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Video } from '@/lib/types';
import {
  extractYouTubeId, FEEDBACK_TITLE_MAX, formatDate, formatTimestamp, getYouTubeThumbnail, splitTimestamps,
} from '@/lib/utils';
import YouTubePlayer, { YouTubePlayerHandle } from './YouTubePlayer';

const SEARCH_LIMIT = 20;
const BODY_PLACEHOLDER = '예) 00:10 에 친 머리는 왜 득점이 아닌지 궁금합니다.\n01:23 에서 받아허리를 맞지 않으려면 어떻게 했어야 할까요?';

// 피드백 요청 작성: 정규 영상 검색·선택 → 영상을 보며 현재 시간을 본문에 넣기 → 제목/본문/작성자
export default function FeedbackComposer({ initialVideoId }: { initialVideoId: string | null }) {
  const router = useRouter();
  const [video, setVideo] = useState<Video | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(!!initialVideoId);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const playerRef = useRef<YouTubePlayerHandle>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // 영상 상세에서 넘어온 경우 해당 영상을 미리 선택
  useEffect(() => {
    if (!initialVideoId) return;
    fetch(`/api/videos/${initialVideoId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => { if (json?.data) setVideo(json.data); })
      .catch(() => {})
      .finally(() => setLoadingInitial(false));
  }, [initialVideoId]);

  // 커서 위치에 "03:12 " 삽입 — 커서가 없으면 끝에 새 줄로
  function insertTime(seconds: number) {
    const stamp = `${formatTimestamp(seconds)} `;
    const el = bodyRef.current;
    if (!el) { setBody((b) => b + stamp); return; }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const prefix = body.slice(0, start);
    const needsBreak = prefix.length > 0 && !prefix.endsWith('\n') && start === body.length;
    const insert = (needsBreak ? '\n' : '') + stamp;
    const next = prefix + insert + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + insert.length;
      el.setSelectionRange(pos, pos);
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!video) { setError('피드백을 받을 영상을 선택해주세요.'); return; }
    if (!title.trim()) { setError('제목(요약)을 입력해주세요.'); return; }
    if (!body.trim()) { setError('피드백 요청 내용을 입력해주세요.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: video.id, title: title.trim(), body: body.trim(), author_name: authorName.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '등록 실패');
      router.push(`/feedback/${json.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류 발생');
      setSubmitting(false);
    }
  }

  const videoId = video ? extractYouTubeId(video.youtube_url) : null;
  const stamps = splitTimestamps(body).filter((p) => p.type === 'time');

  return (
    <form onSubmit={submit} className="space-y-5">
      <h1 className="text-xl font-bold" style={{ color: '#00462A' }}>
        피드백 요청하기
      </h1>

      {/* 1. 영상 */}
      <section>
        <Label>영상 *</Label>
        {loadingInitial ? (
          <p className="text-sm py-6 text-center" style={{ color: '#B9B9B9' }}>영상을 불러오는 중...</p>
        ) : video && videoId ? (
          <div>
            <div className="relative w-full rounded-lg overflow-hidden" style={{ aspectRatio: '16/9', backgroundColor: '#000' }}>
              <YouTubePlayer ref={playerRef} videoId={videoId} startSeconds={video.chapters?.[0]?.seconds ?? 0} />
            </div>
            <LiveTimeBar playerRef={playerRef} onInsert={insertTime} />
            <div className="flex items-center justify-between gap-2 mt-2">
              <p className="text-sm font-medium truncate" style={{ color: '#374151' }}>{video.title}</p>
              <button
                type="button"
                onClick={() => setVideo(null)}
                className="flex-shrink-0 text-xs px-3 py-1 rounded border"
                style={{ borderColor: '#e0e0e0', color: '#6B7280' }}
              >
                영상 변경
              </button>
            </div>
          </div>
        ) : (
          <VideoPicker onSelect={setVideo} />
        )}
      </section>

      {/* 2. 제목(요약) */}
      <section>
        <Label>
          제목 * <span className="font-normal" style={{ color: '#B9B9B9' }}>(원하는 피드백을 20자 내외로 요약)</span>
        </Label>
        <div className="relative">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, FEEDBACK_TITLE_MAX))}
            placeholder="예: 머리치기 득점이 안 되는 이유"
            className="w-full h-10 pl-3 pr-14 text-sm rounded border focus:outline-none"
            style={{ borderColor: '#e0e0e0' }}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums" style={{ color: title.length > 20 ? '#D97706' : '#B9B9B9' }}>
            {title.length}/{FEEDBACK_TITLE_MAX}
          </span>
        </div>
      </section>

      {/* 3. 본문 */}
      <section>
        <Label>내용 *</Label>
        <textarea
          ref={bodyRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          placeholder={BODY_PLACEHOLDER}
          className="w-full px-3 py-2 text-sm rounded border focus:outline-none resize-y"
          style={{ borderColor: '#e0e0e0' }}
        />
        <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
          💡 본문에 <b>00:10</b>처럼 시간을 적으면, 누를 때 영상이 그 장면으로 이동하는 타임스탬프가 됩니다.
        </p>
        {stamps.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {stamps.map((s, i) => s.type === 'time' && (
              <button
                key={`${s.seconds}-${i}`}
                type="button"
                onClick={() => playerRef.current?.seekTo(s.seconds)}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(45,90,142,0.1)', color: '#2d5a8e' }}
              >
                ▶ {s.value}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 4. 작성자 */}
      <section>
        <Label>
          작성자 (선택) <span className="font-normal" style={{ color: '#B9B9B9' }}>(예: 29기 박수빈)</span>
        </Label>
        <input
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          className="w-full h-10 px-3 text-sm rounded border focus:outline-none"
          style={{ borderColor: '#e0e0e0' }}
        />
      </section>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2 pb-4">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 h-11 text-sm font-semibold rounded-lg text-white"
          style={{ backgroundColor: '#00462A', opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? '등록 중...' : '피드백 요청 등록'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="h-11 px-5 text-sm rounded-lg border"
          style={{ borderColor: '#e0e0e0', color: '#374151' }}
        >
          취소
        </button>
      </div>
    </form>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>{children}</label>;
}

// 영상을 보는 동안 현재 재생 시간을 실시간으로 보여주고, 본문 커서 위치에 넣을 수 있게 함
function LiveTimeBar({
  playerRef, onInsert,
}: {
  playerRef: React.RefObject<YouTubePlayerHandle>;
  onInsert: (seconds: number) => void;
}) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const t = playerRef.current?.getCurrentTime();
      if (t != null) setCurrent(t);
    }, 250);
    return () => clearInterval(timer);
  }, [playerRef]);

  return (
    <div
      className="flex items-center justify-between gap-2 mt-2 px-3 py-2 rounded-lg"
      style={{ backgroundColor: 'rgba(0,70,42,0.06)' }}
    >
      <span className="text-sm" style={{ color: '#374151' }}>
        ⏱ 현재 <b className="tabular-nums" style={{ color: '#00462A' }}>{formatTimestamp(current)}</b>
      </span>
      <button
        type="button"
        onClick={() => onInsert(current)}
        className="text-xs font-semibold px-3 py-1.5 rounded-full text-white"
        style={{ backgroundColor: '#00462A' }}
      >
        + 본문에 이 시간 넣기
      </button>
    </div>
  );
}

// 정규 영상(videos) 중에서 제목으로 검색해 선택 — 검색어가 없으면 최신 영상
function VideoPicker({ onSelect }: { onSelect: (video: Video) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    // 타이핑할 때마다 요청하지 않도록 잠깐 기다렸다가 검색
    const timer = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ order: 'date', limit: String(SEARCH_LIMIT) });
      if (query.trim()) params.set('search', query.trim());
      fetch(`/api/videos?${params.toString()}`, { signal: controller.signal })
        .then((r) => r.json())
        .then((json) => setResults(json.data || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);

  return (
    <div className="rounded-lg border" style={{ borderColor: '#e0e0e0' }}>
      <div className="p-2 border-b" style={{ borderColor: '#f0f0f0' }}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 영상 제목, 참가자 이름으로 검색"
          className="w-full h-9 px-3 text-sm rounded border focus:outline-none"
          style={{ borderColor: '#e0e0e0' }}
        />
      </div>
      <div className="max-h-80 overflow-y-auto">
        {loading && results.length === 0 ? (
          <p className="text-sm py-6 text-center" style={{ color: '#B9B9B9' }}>불러오는 중...</p>
        ) : results.length === 0 ? (
          <p className="text-sm py-6 text-center" style={{ color: '#B9B9B9' }}>검색 결과가 없습니다.</p>
        ) : (
          results.map((v) => {
            const id = extractYouTubeId(v.youtube_url);
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onSelect(v)}
                className="w-full flex items-center gap-3 px-2 py-2 text-left hover:bg-gray-50"
              >
                <div className="relative flex-shrink-0 w-28 rounded overflow-hidden" style={{ aspectRatio: '16/9', backgroundColor: '#e0e0e0' }}>
                  {id && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={getYouTubeThumbnail(id)} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2" style={{ color: '#111' }}>{v.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                    {formatDate(v.date)}{v.topic ? ` · ${v.topic}` : ''}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
