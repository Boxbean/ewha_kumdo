import Link from 'next/link';
import { Competition } from '@/lib/types';
import { CompetitionSeries } from '@/lib/competitionSeries';
import KendoIcon from './KendoIcon';

interface Props {
  series: CompetitionSeries;
  latest: Competition | null;
  thumbnailUrl?: string;
  color: string;
}

export default function SeriesCard({ series, latest, thumbnailUrl, color }: Props) {
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: '#e0e0e0', backgroundColor: '#fff' }}>
      <div className="flex gap-3">
        {/* 썸네일 */}
        <div
          className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden flex items-center justify-center"
          style={{ backgroundColor: thumbnailUrl ? '#f3f4f6' : color }}
        >
          {thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbnailUrl} alt={series.label} className="w-full h-full object-cover" />
          ) : (
            <KendoIcon size={28} color="#fff" />
          )}
        </div>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold mb-1" style={{ color: '#111' }}>
            {series.label}
          </h3>
          {latest ? (
            <div className="space-y-0.5">
              {latest.date_start && (
                <p className="text-xs" style={{ color: '#6B7280' }}>
                  🗓️ {latest.date_start}
                </p>
              )}
              {latest.venue?.name && (
                <p className="text-xs truncate" style={{ color: '#6B7280' }}>
                  📍 {latest.venue.name}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs" style={{ color: '#B9B9B9' }}>
              아직 등록된 기록이 없습니다
            </p>
          )}
        </div>
      </div>

      {/* 버튼 */}
      {latest && (
        <div className="flex gap-2 mt-3">
          <Link
            href={`/competition/${latest.id}`}
            className="flex-1 text-center text-xs font-semibold py-1.5 rounded-md hover:opacity-80"
            style={{ backgroundColor: 'rgba(0,70,42,0.08)', color: '#00462A' }}
          >
            대회정보
          </Link>
          <Link
            href={`/competition/series/${series.key}/videos`}
            className="flex-1 text-center text-xs font-semibold py-1.5 rounded-md text-white hover:opacity-90"
            style={{ backgroundColor: '#00462A' }}
          >
            영상보기
          </Link>
        </div>
      )}
    </div>
  );
}
