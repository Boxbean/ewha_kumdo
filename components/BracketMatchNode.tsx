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

  return (
    <div className="rounded-md border overflow-hidden" style={{ borderColor: '#e0e0e0', backgroundColor: '#fff' }}>
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
}
