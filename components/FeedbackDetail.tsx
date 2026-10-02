'use client';

import { RefObject, useRef, useState } from 'react';
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
  // 유튜브 쇼츠도 같은 플레이어로 띄워 타임스탬프 이동이 되게 함 (인스타 등은 기존 ShortsPlayer)
  const youtubeId = post.video
    ? extractYouTubeId(post.video.youtube_url)
    : post.shorts?.platform === 'youtube' ? extractYouTubeId(post.shorts.video_url) : null;
  const mediaTitle = post.video?.title ?? post.shorts?.title ?? '';

  // 댓글을 한참 내려 읽다가 눌러도 영상이 보이도록 플레이어 위치로 스크롤
  function seek(seconds: number) {
    playerRef.current?.seekTo(seconds);
    playerBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  const onSeek = youtubeId ? seek : undefined;

  const uploader = post.video ? post.video.uploader : post.shorts?.submitter_name;
  const participants = post.video?.participants?.filter(Boolean) ?? [];

  return (
    <div className="max-w-3xl mx-auto">
      <div ref={playerBoxRef} className="mb-2">
        {youtubeId ? (
          <CoveredYouTubePlayer playerRef={playerRef} videoId={youtubeId} title={mediaTitle} startSeconds={post.timestamp_seconds} />
        ) : post.video ? (
          <div
            className="w-full rounded-lg flex items-center justify-center text-sm"
            style={{ aspectRatio: '16/9', backgroundColor: '#e0e0e0', color: '#B9B9B9' }}
          >
            영상을 불러올 수 없습니다.
          </div>
        ) : post.shorts ? (
          <ShortsPlayer videoUrl={post.shorts.video_url} platform={post.shorts.platform} title={post.shorts.title} />
        ) : null}
      </div>

      {/* 영상 정보 — 제목 / 작성자 / 참가 선수를 작게 */}
      {(post.video || post.shorts) && (
        <div className="mb-4 px-0.5 space-y-0.5">
          {post.video ? (
            <Link href={`/video/${post.video.id}`} className="block text-sm font-medium truncate hover:underline" style={{ color: '#374151' }}>
              {post.video.title} ›
            </Link>
          ) : (
            <p className="text-sm font-medium truncate" style={{ color: '#374151' }}>{post.shorts?.title}</p>
          )}
          {uploader && (
            <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>작성자 {uploader}</p>
          )}
          {participants.length > 0 && (
            <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>참가 {participants.join(', ')}</p>
          )}
        </div>
      )}

      <FeedbackPostBody post={post} onSeek={onSeek} />
      <FeedbackCommentsSection postId={post.id} initialComments={post.comments || []} onSeek={onSeek} />
    </div>
  );
}

// 재생 전에는 유튜브 기본 UI(제목·공유·YouTube에서 보기 등)를 썸네일 + 재생 버튼으로 덮음 (홈 히어로와 같은 방식).
// 덮개는 터치를 통과시켜(pointer-events-none) 아래 유튜브 플레이어가 한 번의 탭으로 재생되게 하고, 재생이 시작되면 걷어냄
function CoveredYouTubePlayer({
  playerRef, videoId, title, startSeconds,
}: {
  playerRef: RefObject<YouTubePlayerHandle>;
  videoId: string;
  title: string;
  startSeconds: number;
}) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative w-full rounded-lg overflow-hidden" style={{ aspectRatio: '16/9', backgroundColor: '#000' }}>
      <YouTubePlayer ref={playerRef} videoId={videoId} startSeconds={startSeconds} onPlaying={() => setPlaying(true)} />
      {!playing && (
        <div className="absolute inset-0 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="68" height="48" viewBox="0 0 68 48" aria-hidden="true">
              <path
                d="M66.5 7.7c-.8-2.9-2.5-5.4-5.4-6.2C55.8.1 34 0 34 0S12.2.1 6.9 1.6c-3 .8-4.6 3.3-5.4 6.2C.1 13 0 24 0 24s.1 11 1.5 16.3c.8 2.9 2.5 5.4 5.4 6.2C12.2 47.9 34 48 34 48s21.8-.1 27.1-1.6c3-.8 4.6-3.3 5.4-6.2C67.9 35 68 24 68 24s-.1-11-1.5-16.3z"
                fill="#f00"
              />
              <path d="M45 24 27 14v20" fill="#fff" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
