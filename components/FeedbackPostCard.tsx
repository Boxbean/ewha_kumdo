import Link from 'next/link';
import { FeedbackPost } from '@/lib/types';
import { extractYouTubeId, formatRelativeTime, getYouTubeThumbnail } from '@/lib/utils';

interface FeedbackPostCardProps {
  post: FeedbackPost;
}

function thumbnailOf(post: FeedbackPost): string | null {
  if (post.video) {
    const id = extractYouTubeId(post.video.youtube_url);
    return id ? getYouTubeThumbnail(id) : null;
  }
  return post.shorts?.thumbnail_url || null;
}

// 목록 탭과 같은 형태: 왼쪽 영상 썸네일 · 오른쪽 제목(메인) / 본문 일부 / 작성자·시간·댓글 수
export default function FeedbackPostCard({ post }: FeedbackPostCardProps) {
  const thumbnail = thumbnailOf(post);
  // 개편 전 글은 제목이 없어 본문 첫 줄을 제목 자리에 대신 보여줌
  const title = post.title || post.body.split('\n')[0];
  const excerpt = post.title ? post.body : '';

  return (
    <Link href={`/feedback/${post.id}`} className="flex items-start gap-3 py-2">
      <div
        className="relative flex-shrink-0 w-[44%] max-w-[240px] rounded-lg overflow-hidden"
        style={{ aspectRatio: '16/9', backgroundColor: '#e0e0e0' }}
      >
        {thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-[15px] font-semibold leading-snug line-clamp-2" style={{ color: '#111' }}>
          {title}
        </p>
        {excerpt && (
          <p className="text-xs mt-1 leading-snug line-clamp-2" style={{ color: '#6B7280' }}>
            {excerpt}
          </p>
        )}
        <p className="text-xs mt-1.5 truncate" style={{ color: '#B9B9B9' }}>
          {post.author_name || '익명'} · {formatRelativeTime(post.created_at)} · 댓글 {post.comment_count ?? 0}
        </p>
      </div>
    </Link>
  );
}
