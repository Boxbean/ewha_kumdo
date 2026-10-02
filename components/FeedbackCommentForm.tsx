'use client';

import { useEffect, useState } from 'react';
import { getAuthorToken } from '@/lib/feedbackAuthorClient';
import FeedbackPasswordModal from './FeedbackPasswordModal';

const MAIN_PLACEHOLDER = '다양한 피드백을 남겨주세요. 즐거운 검도생활을 위하여 댓글은 둥글게 부탁드립니다 ☺️';
// 댓글 입력 영역 배경 — 대진표 카드·스플래시와 같은 크림색
const CREAM_BG = '#FFFDF1';
const CREAM_BORDER = '#EDE7CF';

interface FeedbackCommentFormProps {
  postId: string;
  onSuccess: () => void;
  // 대댓글 작성 시 부모 댓글 id — 있으면 작고 간결한 답글 입력창으로 표시
  parentId?: string;
  onCancel?: () => void;
}

export default function FeedbackCommentForm({ postId, onSuccess, parentId, onCancel }: FeedbackCommentFormProps) {
  const [body, setBody] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isReply = !!parentId;
  // 이 기기가 글쓴이 토큰을 갖고 있으면 댓글이 글쓴이로 표시됨
  const [isAuthor, setIsAuthor] = useState(false);
  const [showVerify, setShowVerify] = useState(false);

  useEffect(() => setIsAuthor(!!getAuthorToken(postId)), [postId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!body.trim()) {
      setError(isReply ? '답글 내용을 입력해주세요.' : '댓글 내용을 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/feedback/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body,
          author_name: authorName || undefined,
          parent_id: parentId,
          author_token: getAuthorToken(postId) || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '오류 발생');
      setBody('');
      setAuthorName('');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류 발생');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form data-tour="feedback-comment-form" onSubmit={handleSubmit} className="space-y-2">
      {/* 내용·이름·등록 버튼을 크림색 한 박스로 묶음 */}
      <div className="rounded-xl border p-2.5 space-y-2" style={{ backgroundColor: CREAM_BG, borderColor: CREAM_BORDER }}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={isReply ? 2 : 3}
          autoFocus={isReply}
          placeholder={isReply ? '답글을 남겨주세요 (00:10처럼 시간을 적으면 영상 이동 링크가 돼요)' : MAIN_PLACEHOLDER}
          className="w-full px-3 py-2 text-sm rounded-lg border focus:outline-none resize-none"
          style={{ borderColor: CREAM_BORDER, backgroundColor: '#ffffff' }}
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="이름 (선택)"
            className="flex-1 min-w-0 h-9 px-3 text-sm rounded-lg border focus:outline-none"
            style={{ borderColor: CREAM_BORDER, backgroundColor: '#ffffff' }}
          />
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="h-9 px-3 text-sm rounded-lg border shrink-0"
              style={{ borderColor: CREAM_BORDER, color: '#6B7280', backgroundColor: '#ffffff' }}
            >
              취소
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="h-9 px-4 text-sm font-semibold rounded-lg text-white shrink-0"
            style={{ backgroundColor: '#00462A', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? '작성 중...' : isReply ? '답글 작성' : '댓글 작성'}
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {isAuthor ? (
        <p className="text-xs" style={{ color: '#00462A' }}>✍️ 글쓴이로 작성돼요</p>
      ) : !isReply && (
        <button type="button" onClick={() => setShowVerify(true)} className="text-xs underline" style={{ color: '#9CA3AF' }}>
          이 글의 글쓴이신가요?
        </button>
      )}
      {showVerify && (
        <FeedbackPasswordModal
          postId={postId}
          title="글쓴이 확인"
          description="글을 등록할 때 정한 비밀번호(숫자 4자리)를 입력하면, 이 기기에서 쓰는 댓글이 글쓴이로 표시돼요."
          onClose={() => setShowVerify(false)}
          onSuccess={() => { setShowVerify(false); setIsAuthor(true); }}
        />
      )}
    </form>
  );
}
