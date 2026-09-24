import Link from 'next/link';
import { FeedbackPost } from '@/lib/types';
import { formatTimestamp } from '@/lib/utils';

interface FeedbackPostCardProps {
  post: FeedbackPost;
}

export default function FeedbackPostCard({ post }: FeedbackPostCardProps) {
  const videoTitle = post.video_type === 'video' ? post.video?.title : post.shorts?.title;

  return (
    <Link href={`/feedback/${post.id}`} className="block">
      <div
        className="rounded-lg p-4"
        style={{ backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-xs font-semibold px-1.5 py-0.5 rounded"
            style={{ backgroundColor: 'rgba(0,70,42,0.1)', color: '#00462A' }}
          >
            {formatTimestamp(post.timestamp_seconds)}
          </span>
          {videoTitle && (
            <span className="text-xs line-clamp-1" style={{ color: '#B9B9B9' }}>
              {videoTitle}
            </span>
          )}
        </div>

        <p className="text-sm leading-snug line-clamp-3 mb-3" style={{ color: '#111111' }}>
          {post.body}
        </p>

        <div className="flex items-center justify-between text-xs" style={{ color: '#B9B9B9' }}>
          <span>{post.author_name || '익명'}</span>
          <span>댓글 {post.comment_count ?? 0}개</span>
        </div>
      </div>
    </Link>
  );
}
