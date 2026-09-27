'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { FeedbackPost } from '@/lib/types';
import { extractYouTubeId } from '@/lib/utils';
import YouTubePlayer, { YouTubePlayerHandle } from './YouTubePlayer';
import ShortsPlayer from './ShortsPlayer';
import FeedbackPostBody from './FeedbackPostBody';
import FeedbackCommentsSection from './FeedbackCommentsSection';

// 피드백 상세: 본문·댓글의 타임스탬프를 누르면 위 영상이 그 시점으로 이동
export default function FeedbackDetail({ post }: { post: FeedbackPost }) {
  const playerRef = useRef<YouTubePlayerHandle>(null);
  const playerBoxRef = useRef<HTMLDivElement>(null);
  const youtubeId = post.video ? extractYouTubeId(post.video.youtube_url) : null;

  // 댓글을 한참 내려 읽다가 눌러도 영상이 보이도록 플레이어 위치로 스크롤
  function seek(seconds: number) {
    playerRef.current?.seekTo(seconds);
    playerBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  const onSeek = youtubeId ? seek : undefined;

  return (
    <div className="max-w-3xl mx-auto">
      <div ref={playerBoxRef} className="mb-2">
        {post.video ? (
          youtubeId ? (
            <div className="relative w-full rounded-lg overflow-hidden" style={{ aspectRatio: '16/9', backgroundColor: '#000' }}>
              <YouTubePlayer ref={playerRef} videoId={youtubeId} startSeconds={post.timestamp_seconds} />
            </div>
          ) : (
            <div
              className="w-full rounded-lg flex items-center justify-center text-sm"
              style={{ aspectRatio: '16/9', backgroundColor: '#e0e0e0', color: '#B9B9B9' }}
            >
              영상을 불러올 수 없습니다.
            </div>
          )
        ) : post.shorts ? (
          <ShortsPlayer videoUrl={post.shorts.video_url} platform={post.shorts.platform} title={post.shorts.title} />
        ) : null}
      </div>

      {post.video && (
        <Link href={`/video/${post.video.id}`} className="block text-sm mb-4 truncate hover:underline" style={{ color: '#B9B9B9' }}>
          {post.video.title} ›
        </Link>
      )}
      {post.shorts && (
        <p className="text-sm mb-4 truncate" style={{ color: '#B9B9B9' }}>{post.shorts.title}</p>
      )}

      <FeedbackPostBody post={post} onSeek={onSeek} />
      <FeedbackCommentsSection postId={post.id} initialComments={post.comments || []} onSeek={onSeek} />
    </div>
  );
}
