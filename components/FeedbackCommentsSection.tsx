'use client';

import { useState } from 'react';
import { FeedbackComment } from '@/lib/types';
import FeedbackCommentForm from './FeedbackCommentForm';

interface FeedbackCommentsSectionProps {
  postId: string;
  initialComments: FeedbackComment[];
}

export default function FeedbackCommentsSection({ postId, initialComments }: FeedbackCommentsSectionProps) {
  const [comments, setComments] = useState(initialComments);

  async function refreshComments() {
    const res = await fetch(`/api/feedback/${postId}`);
    const json = await res.json();
    if (json.data?.comments) setComments(json.data.comments);
  }

  return (
    <div>
      <h2 className="text-base font-bold mb-3" style={{ color: '#374151' }}>
        댓글 {comments.length}개
      </h2>

      {comments.length > 0 && (
        <div className="space-y-3 mb-4">
          {comments.map((c) => (
            <div key={c.id} className="rounded-lg p-3" style={{ backgroundColor: '#F8FBF9' }}>
              <p className="text-sm mb-1" style={{ color: '#111111' }}>{c.body}</p>
              <p className="text-xs" style={{ color: '#B9B9B9' }}>{c.author_name || '익명'}</p>
            </div>
          ))}
        </div>
      )}

      <FeedbackCommentForm postId={postId} onSuccess={refreshComments} />
    </div>
  );
}
