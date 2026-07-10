import Link from 'next/link';
import { Venue } from '@/lib/types';

interface Props {
  venue: Venue;
  nameHref?: string;
}

export default function VenueInfoCard({ venue, nameHref }: Props) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#e0e0e0' }}>
      <div className="px-4 py-3 border-b" style={{ backgroundColor: '#F8FBF9', borderColor: '#e0e0e0' }}>
        {nameHref ? (
          <Link href={nameHref} className="text-base font-bold hover:underline" style={{ color: '#00462A' }}>
            {venue.name}
          </Link>
        ) : (
          <h3 className="text-base font-bold" style={{ color: '#00462A' }}>
            {venue.name}
          </h3>
        )}
        {venue.address && (
          <a
            href={`https://map.kakao.com/link/search/${encodeURIComponent(venue.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs flex items-center gap-1 mt-0.5 hover:underline"
            style={{ color: '#2d5a8e' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            {venue.address}
          </a>
        )}
      </div>

      <div className="divide-y divide-[#f0f0f0]">
        {[
          { label: '🅿️ 주차', value: venue.parking_info },
          { label: '🏟️ 코트 수', value: venue.court_count ? `${venue.court_count}면` : undefined },
          { label: '🦶 바닥', value: venue.floor_type },
          { label: '📐 규모', value: venue.size_memo },
          { label: '🚇 교통', value: venue.access_memo },
        ].filter((row) => row.value).map(({ label, value }) => (
          <div key={label} className="flex gap-3 px-4 py-3">
            <span className="text-sm flex-shrink-0 w-24" style={{ color: '#374151' }}>{label}</span>
            <span className="text-sm whitespace-pre-wrap" style={{ color: '#111' }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
