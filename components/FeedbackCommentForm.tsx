'use client';

import { useState } from 'react';

interface FeedbackCommentFormProps {
  postId: string;
  onSuccess: () => void;
}

export default function FeedbackCommentForm({ postId, onSuccess }: FeedbackCommentFormProps) {
  const [body, setBody] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!body.trim()) {
      setError('댓글 내용을 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/feedback/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, author_name: authorName || undefined }),
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
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
        placeholder="피드백 댓글을 남겨주세요..."
        className="w-full px-3 py-2 text-sm rounded border focus:outline-none resize-none"
        style={{ borderColor: '#e0e0e0' }}
      />
      <div className="flex gap-2">
        <input
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="이름 (선택)"
          className="flex-1 h-9 px-3 text-sm rounded border focus:outline-none"
          style={{ borderColor: '#e0e0e0' }}
        />
        <button
          type="submit"
          disabled={loading}
          className="h-9 px-4 text-sm font-semibold rounded text-white shrink-0"
          style={{ backgroundColor: '#00462A', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? '작성 중...' : '댓글 작성'}
        </button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </form>
  );
}
