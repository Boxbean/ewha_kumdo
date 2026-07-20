import Link from 'next/link';
import { BracketMatch, WinnerSlot } from '@/lib/types';

interface Props {
  match: BracketMatch | null;
}

export default function BracketMatchNode({ match }: Props) {
  if (!match) {
    return (
      <div
        className="rounded-md border border-dashed flex items-center justify-center px-2"
        style={{ borderColor: '#e0e0e0', minHeight: 52, backgroundColor: '#fafafa' }}
      >
        <span className="text-xs" style={{ color: '#B9B9B9' }}>TBD</span>
      </div>
    );
  }

  const slots: { slot: WinnerSlot; name?: string; club?: string; isOurs: boolean }[] = [
    { slot: 'player1', name: match.player1_name, club: match.player1_club, isOurs: match.player1_is_ours },
    { slot: 'player2', name: match.player2_name, club: match.player2_club, isOurs: match.player2_is_ours },
  ];

  const videos = match.videos || [];
  const hasVideo = videos.length > 0;

  const body = (
    <div
      className="rounded-md border overflow-hidden relative"
      style={{
        borderColor: hasVideo ? '#00462A' : '#e0e0e0',
        backgroundColor: '#fff',
        transition: 'box-shadow 0.15s',
      }}
    >
      {hasVideo && (
        <span
          className="absolute -top-1.5 -right-1.5 flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
          style={{ backgroundColor: '#00462A' }}
          title={`영상 ${videos.length}개 보기`}
        >
          ▶ {videos.length > 1 ? videos.length : ''}
        </span>
      )}
      {slots.map((s, i) => {
        const isWinner = match.winner_slot === s.slot;
        const isLoser = !!match.winner_slot && match.winner_slot !== s.slot;
        const isByeSlot = match.is_bye && s.slot === 'player2';
        return (
          <div
            key={s.slot}
            className="flex items-center gap-1 px-2 py-1 text-xs"
            style={{
              backgroundColor: s.isOurs ? 'rgba(0,70,42,0.08)' : 'transparent',
              borderBottom: i === 0 ? '1px solid #f0f0f0' : undefined,
            }}
          >
            <span
              className="truncate"
              style={{
                fontWeight: isWinner ? 700 : 400,
                color: isByeSlot ? '#B9B9B9' : isWinner ? '#1d4ed8' : isLoser ? '#9CA3AF' : '#374151',
              }}
            >
              {s.name || (isByeSlot ? '부전승' : '—')}
            </span>
            {s.club && <span className="truncate" style={{ color: '#B9B9B9' }}>({s.club})</span>}
          </div>
        );
      })}
    </div>
  );

  if (!hasVideo) return body;

  return (
    <Link href={`/video/${videos[0].id}`} className="block hover:shadow-md" title="클릭해서 영상 보기">
      {body}
    </Link>
  );
}
