export const revalidate = 30;

import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import CompetitionSubTabs from '@/components/CompetitionSubTabs';
import { getSupabase } from '@/lib/supabase';
import { Venue } from '@/lib/types';
import { geocodeVenues } from '@/lib/kakaoGeocode';
import VenueMap from '@/components/VenueMap';

// 서울특별시 경계를 감싸는 대략적인 사각형
const SEOUL_BOUNDS = { south: 37.41, north: 37.72, west: 126.76, east: 127.19 };

export default async function CompetitionVenuesPage() {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('venues')
    .select('*')
    .order('name');

  const venues: Venue[] = (data as Venue[]) || [];
  const points = await geocodeVenues(venues);
  // 지도는 서울 중심으로 고정해 시작하므로, 처음 화면 밖에 있는 경기장이 있다는 걸 알려줌
  const outsideSeoul = points.filter(
    (p) => p.lat < SEOUL_BOUNDS.south || p.lat > SEOUL_BOUNDS.north || p.lng < SEOUL_BOUNDS.west || p.lng > SEOUL_BOUNDS.east
  );

  return (
    <AppLayout>
      <h1 className="text-xl font-bold mb-4" style={{ color: '#00462A' }}>대회 기록</h1>

      <CompetitionSubTabs active="venues" />

      {points.length > 0 && (
        <>
          <VenueMap points={points} />
          {outsideSeoul.length > 0 && (
            <p className="text-xs -mt-2 mb-4" style={{ color: '#6B7280' }}>
              서울 밖 경기장: {outsideSeoul.map((p) => p.name).join(', ')}
            </p>
          )}
        </>
      )}

      {venues.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">📍</p>
          <p className="text-base font-medium mb-1" style={{ color: '#374151' }}>등록된 대회장이 없습니다</p>
          <p className="text-sm" style={{ color: '#B9B9B9' }}>관리자 페이지에서 대회장을 등록해주세요</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {venues.map((venue) => (
            <Link
              key={venue.id}
              href={`/venue/${venue.id}`}
              className="block rounded-xl border p-4 transition-all hover:shadow-md"
              style={{ borderColor: '#e0e0e0', backgroundColor: '#fff' }}
            >
              <p className="text-sm font-bold mb-0.5" style={{ color: '#00462A' }}>
                {venue.name}
              </p>
              {venue.address && (
                <p className="text-xs" style={{ color: '#B9B9B9' }}>{venue.address}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
