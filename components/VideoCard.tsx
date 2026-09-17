import Link from 'next/link';
import Image from 'next/image';
import { Video } from '@/lib/types';
import { extractYouTubeId, getYouTubeThumbnail, formatDate, getCompetitionColor } from '@/lib/utils';

interface VideoCardProps {
  video: Video;
}

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

// 대진표 연결 데이터에서 "우리 쪽이 아닌" 선수를 상대로 판단
// 두 선수 중 정확히 한쪽만 우리 팀일 때만 의미 있는 "상대"이므로, 그 외(둘 다 아니거나 둘 다 우리팀)는 표시하지 않음
function getOpponent(video: Video): { name?: string; club?: string } | null {
  const bm = video.bracket_match;
  if (!bm || bm.player1_is_ours === bm.player2_is_ours) return null;
  const opponent = bm.player1_is_ours
    ? { name: bm.player2_name, club: bm.player2_club }
    : { name: bm.player1_name, club: bm.player1_club };
  return opponent.name ? opponent : null;
}

// 문자열을 안정적인 정수 해시로 변환 — 같은 입력엔 항상 같은 결과 (매 로딩마다 바뀌지 않음)
function hashStringToIndex(str: string, mod: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash % mod;
}

// 참가자가 3명 이상이면 한 명만 헤드라인에 노출되는데, 항상 첫 번째 태그만 나오면 그 사람만 계속 보이게 되므로
// 영상 id로 해시를 내 다른 참가자가 골고루 걸리게 함 (영상별로 고정, 로딩마다 바뀌지는 않음)
function getParticipantsHeadline(video: Video): string | null {
  const participants = video.participants;
  if (participants.length === 0) return null;
  if (participants.length <= 2) return participants.join(', ');
  const featuredIndex = hashStringToIndex(video.id, participants.length);
  return `${participants[featuredIndex]} 외 ${participants.length - 1}명`;
}

export default function VideoCard({ video }: VideoCardProps) {
  const isNew = Date.now() - new Date(video.created_at).getTime() < THREE_DAYS_MS;
  const videoId = extractYouTubeId(video.youtube_url);
  const thumbnail = videoId ? getYouTubeThumbnail(videoId) : null;

  const competitionName = video.competition?.name;
  const opponent = getOpponent(video);
  const headline = opponent?.name ? `vs ${opponent.name}` : getParticipantsHeadline(video);

  return (
    <Link href={`/video/${video.id}`} className="block group h-full">
      <div
        className="rounded-lg overflow-hidden border transition-transform duration-150 group-hover:-translate-y-0.5 h-full flex flex-col"
        style={{
          borderColor: '#e0e0e0',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        {/* 썸네일 (4:3 비율) */}
        <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={video.title}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full" style={{ backgroundColor: '#e0e0e0' }} />
          )}

          {/* 하단 텍스트 가독성을 위한 그라데이션 */}
          <div
            className="absolute inset-x-0 bottom-0 pointer-events-none"
            style={{
              height: '75%',
              background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.72) 78%)',
            }}
          />

          {/* 좌상단: 대회명 또는 주제 배지 / 우상단: New 배지 */}
          <div className="absolute top-1.5 left-1.5 right-1.5 flex items-start justify-between gap-1">
            {competitionName ? (
              <span
                className="text-xs font-semibold px-1.5 py-0.5 rounded"
                style={{ backgroundColor: getCompetitionColor(competitionName), color: '#ffffff' }}
              >
                {competitionName}
              </span>
            ) : video.topic ? (
              <span
                className="text-xs font-semibold px-1.5 py-0.5 rounded"
                style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: '#374151' }}
              >
                {video.topic}
              </span>
            ) : (
              <span />
            )}
            {isNew && (
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0"
                style={{ backgroundColor: '#00462A', color: '#ffffff' }}
              >
                New
              </span>
            )}
          </div>

          {/* 하단: 상대 이름 또는 참가자 헤드라인 */}
          {headline && (
            <div className="absolute left-2 right-2 bottom-2">
              <p className="text-sm font-bold leading-snug line-clamp-2" style={{ color: '#ffffff' }}>
                {headline}
              </p>
              {opponent?.club && (
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  {opponent.club}
                </p>
              )}
            </div>
          )}
        </div>

        {/* 카드 정보 */}
        <div className="p-2.5 flex flex-col flex-grow">
          <p className="text-xs" style={{ color: '#374151' }}>
            {formatDate(video.date)}
          </p>
        </div>
      </div>
    </Link>
  );
}
