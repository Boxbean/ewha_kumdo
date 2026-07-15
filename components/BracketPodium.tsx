import { BracketMatch } from '@/lib/types';
import { deriveStandings } from '@/lib/bracket';

interface Props {
  matches: BracketMatch[];
}

const PLACE_STYLE: Record<string, { icon: string; bg: string; color: string }> = {
  '1위': { icon: '🥇', bg: '#fef9c3', color: '#92400e' },
  '2위': { icon: '🥈', bg: '#e5e7eb', color: '#374151' },
  '3위': { icon: '🥉', bg: '#fde8d5', color: '#9a3412' },
};

export default function BracketPodium({ matches }: Props) {
  const standings = deriveStandings(matches);
  if (standings.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {standings.map((s, i) => {
        const style = PLACE_STYLE[s.place];
        return (
          <div
            key={i}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: style.bg, color: style.color }}
          >
            <span>{style.icon}</span>
            <span>{s.place}</span>
            <span>{s.name || '미정'}</span>
            {s.club && <span className="font-normal" style={{ opacity: 0.8 }}>({s.club})</span>}
          </div>
        );
      })}
    </div>
  );
}
