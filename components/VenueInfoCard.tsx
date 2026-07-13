import Link from 'next/link';
import { Venue } from '@/lib/types';

interface Props {
  venue: Venue;
  nameHref?: string;
}

export default function VenueInfoCard({ venue, nameHref }: Props) {
  const facts = [
    { icon: '🅿️', value: venue.parking_info },
    { icon: '🏟️', value: venue.court_count ? `${venue.court_count}면` : undefined },
    { icon: '🦶', value: venue.floor_type },
    { icon: '📐', value: venue.size_memo },
    { icon: '🚇', value: venue.access_memo },
    { icon: '📝', value: venue.notes },
  ].filter((f) => f.value);

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: '#e0e0e0', backgroundColor: '#F8FBF9' }}>
      <div className="flex items-center gap-2 flex-wrap mb-2">
        {nameHref ? (
          <Link href={nameHref} className="text-sm font-bold hover:underline" style={{ color: '#00462A' }}>
            📍 {venue.name}
          </Link>
        ) : (
          <h3 className="text-sm font-bold" style={{ color: '#00462A' }}>
            📍 {venue.name}
          </h3>
        )}
        {venue.address && (
          <a
            href={`https://map.kakao.com/link/search/${encodeURIComponent(venue.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-2 py-0.5 rounded-full hover:opacity-80"
            style={{ backgroundColor: 'rgba(45,90,142,0.08)', color: '#2d5a8e' }}
          >
            🗺️ {venue.address}
          </a>
        )}
      </div>

      {(venue.nearby_info || facts.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {venue.nearby_info && (
            <a
              href={`https://map.kakao.com/link/search/${encodeURIComponent(venue.nearby_info)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-2 py-0.5 rounded-full whitespace-pre-wrap hover:opacity-80"
              style={{ backgroundColor: 'rgba(45,90,142,0.08)', color: '#2d5a8e' }}
            >
              🍽️ {venue.nearby_info}
            </a>
          )}
          {facts.map((f) => (
            <span
              key={f.icon}
              className="text-xs px-2 py-0.5 rounded-full whitespace-pre-wrap"
              style={{ backgroundColor: 'rgba(55,65,81,0.08)', color: '#374151' }}
            >
              {f.icon} {f.value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
