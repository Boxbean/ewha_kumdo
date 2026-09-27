'use client';

import { useEffect, useState } from 'react';
import { FeedbackComment } from '@/lib/types';
import FeedbackCommentForm from './FeedbackCommentForm';
import TimestampText from './TimestampText';
import RelativeTime from './RelativeTime';

interface FeedbackCommentsSectionProps {
  postId: string;
  initialComments: FeedbackComment[];
  onSeek?: (seconds: number) => void;
}

// 말풍선 색 — 같은 톤(연한 파스텔) 안에서만 바뀌어 전체 통일감은 유지
const BUBBLE_COLORS = ['#E8F3EC', '#EEF2F7', '#FBF3E4', '#F3EEF8', '#E6F4F3'];
const LIKED_STORAGE_KEY = 'feedback_liked_comments';

// 댓글 id로 색·꼬리 방향을 정함 — 무작위처럼 보이지만 새로고침해도 같은 댓글은 같은 모양
function hashOf(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function readLiked(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(LIKED_STORAGE_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function writeLiked(liked: Set<string>) {
  try {
    localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify([...liked]));
  } catch {
    // 저장소를 쓸 수 없는 환경(사생활 보호 모드 등)에서는 이번 방문 동안만 유지
  }
}

export default function FeedbackCommentsSection({ postId, initialComments, onSeek }: FeedbackCommentsSectionProps) {
  const [comments, setComments] = useState(initialComments);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [liked, setLiked] = useState<Set<string>>(new Set());

  useEffect(() => setLiked(readLiked()), []);

  async function refreshComments() {
    const res = await fetch(`/api/feedback/${postId}`);
    const json = await res.json();
    if (json.data?.comments) setComments(json.data.comments);
  }

  // 기기당 1회 — 다시 누르면 취소. 화면은 먼저 바꾸고 실패하면 되돌림
  async function toggleLike(commentId: string) {
    const wasLiked = liked.has(commentId);
    const delta = wasLiked ? -1 : 1;
    const nextLiked = new Set(liked);
    if (wasLiked) nextLiked.delete(commentId);
    else nextLiked.add(commentId);
    setLiked(nextLiked);
    writeLiked(nextLiked);
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, like_count: Math.max(0, (c.like_count ?? 0) + delta) } : c)));

    try {
      const res = await fetch(`/api/feedback/${postId}/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, like_count: json.like_count } : c)));
    } catch {
      setLiked(liked);
      writeLiked(liked);
      setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, like_count: Math.max(0, (c.like_count ?? 0) - delta) } : c)));
    }
  }

  const topLevel = comments.filter((c) => !c.parent_id);
  const repliesOf = (id: string) => comments.filter((c) => c.parent_id === id);

  return (
    <div>
      <style>{`
        @keyframes bubble-pop {
          from { opacity: 0; transform: translateY(10px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .bubble-pop { animation: bubble-pop 0.35s ease-out both; }
      `}</style>

      <h2 className="text-base font-bold mb-3" style={{ color: '#374151' }}>
        댓글 {comments.length}개
      </h2>

      {topLevel.length > 0 && (
        <div className="space-y-4 mb-5">
          {topLevel.map((c, i) => (
            <div key={c.id}>
              <Bubble
                comment={c}
                index={i}
                liked={liked.has(c.id)}
                onLike={() => void toggleLike(c.id)}
                onReply={() => setReplyTo(replyTo === c.id ? null : c.id)}
                onSeek={onSeek}
              />

              {/* 대댓글: 한 단계만 들여써서 표시, 답글에는 다시 답글 버튼 없음 */}
              {(repliesOf(c.id).length > 0 || replyTo === c.id) && (
                <div className="ml-6 mt-2 pl-3 space-y-2 border-l-2" style={{ borderColor: '#EEF0F2' }}>
                  {repliesOf(c.id).map((r, j) => (
                    <Bubble
                      key={r.id}
                      comment={r}
                      index={j}
                      isReply
                      liked={liked.has(r.id)}
                      onLike={() => void toggleLike(r.id)}
                      onSeek={onSeek}
                    />
                  ))}
                  {replyTo === c.id && (
                    <FeedbackCommentForm
                      postId={postId}
                      parentId={c.id}
                      onCancel={() => setReplyTo(null)}
                      onSuccess={() => { setReplyTo(null); void refreshComments(); }}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <FeedbackCommentForm postId={postId} onSuccess={refreshComments} />
    </div>
  );
}

function Bubble({
  comment, index, isReply, liked, onLike, onReply, onSeek,
}: {
  comment: FeedbackComment;
  index: number;
  isReply?: boolean;
  liked: boolean;
  onLike: () => void;
  onReply?: () => void;
  onSeek?: (seconds: number) => void;
}) {
  const hash = hashOf(comment.id);
  const color = BUBBLE_COLORS[hash % BUBBLE_COLORS.length];
  // 대댓글은 들여쓴 줄 안에서 읽기 쉽도록 항상 왼쪽 정렬, 일반 댓글만 좌우가 섞임
  const right = !isReply && (hash >> 3) % 2 === 1;

  return (
    <div
      className={`bubble-pop flex flex-col ${right ? 'items-end' : 'items-start'}`}
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <span className="text-xs mb-1 px-1" style={{ color: '#6B7280' }}>
        {comment.author_name || '익명'}
      </span>
      <div
        className={`relative max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed ${isReply ? 'rounded-xl' : 'rounded-2xl'}`}
        style={{
          backgroundColor: color,
          color: '#111',
          // 꼬리 쪽 모서리는 덜 둥글게 해서 말풍선 꼬리와 자연스럽게 이어지게
          [right ? 'borderBottomRightRadius' : 'borderBottomLeftRadius']: 4,
        }}
      >
        <TimestampText text={comment.body} onSeek={onSeek} />
        <span
          aria-hidden="true"
          className="absolute bottom-0 w-3 h-3"
          style={{
            backgroundColor: color,
            [right ? 'right' : 'left']: -6,
            clipPath: right ? 'polygon(0 0, 0 100%, 100% 100%)' : 'polygon(100% 0, 100% 100%, 0 100%)',
          }}
        />
      </div>
      <div className={`flex items-center gap-3 mt-1 px-1 text-xs ${right ? 'flex-row-reverse' : ''}`} style={{ color: '#9CA3AF' }}>
        <RelativeTime iso={comment.created_at} />
        <button
          type="button"
          onClick={onLike}
          aria-pressed={liked}
          aria-label="좋아요"
          className="flex items-center gap-1"
          style={{ color: liked ? '#00462A' : '#9CA3AF' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7 10v12" />
            <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
          </svg>
          {(comment.like_count ?? 0) > 0 && <span className="tabular-nums">{comment.like_count}</span>}
        </button>
        {onReply && (
          <button type="button" onClick={onReply} className="flex items-center gap-1" aria-label="답글 달기">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 17 4 12 9 7" />
              <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
            </svg>
            답글
          </button>
        )}
      </div>
    </div>
  );
}
