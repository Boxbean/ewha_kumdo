import { Competition } from '@/lib/types';

interface Props {
  comp: Competition;
}

function EmptyValue() {
  return <span style={{ color: '#B9B9B9', fontStyle: 'italic' }}>등록된 정보 없음</span>;
}

function MapLink({ text }: { text: string }) {
  return (
    <a
      href={`https://map.kakao.com/link/search/${encodeURIComponent(text)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:underline"
      style={{ color: '#2d5a8e' }}
    >
      🗺️ {text}
    </a>
  );
}

function Field({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <div className="py-3 border-b last:border-b-0" style={{ borderColor: '#f0f0f0' }}>
      <p className="text-xs font-bold mb-1" style={{ color: '#00462A' }}>
        {icon} {label}
      </p>
      <div className="text-sm" style={{ color: '#374151' }}>
        {children}
      </div>
    </div>
  );
}

export default function CompetitionDetailFields({ comp }: Props) {
  const pamphlets = comp.files?.filter((f) => f.file_type === '팸플릿') || [];

  return (
    <div className="rounded-xl border px-4" style={{ borderColor: '#e0e0e0', backgroundColor: '#fff' }}>
      <Field icon="📅" label="진행일자">
        {comp.date_start ? (
          <span>
            {comp.date_start}
            {comp.date_end && comp.date_end !== comp.date_start ? ` ~ ${comp.date_end}` : ''}
          </span>
        ) : (
          <EmptyValue />
        )}
      </Field>

      <Field icon="📍" label="진행 장소">
        {comp.venue?.address ? <MapLink text={comp.venue.address} /> : <EmptyValue />}
      </Field>

      <Field icon="🍽️" label="주변식당 및 편의시설">
        {comp.venue?.nearby_info ? (
          <span className="whitespace-pre-wrap">
            <MapLink text={comp.venue.nearby_info} />
          </span>
        ) : (
          <EmptyValue />
        )}
      </Field>

      <Field icon="🏟️" label="경기장 정보">
        <div className="space-y-1">
          <p>
            <span className="text-xs" style={{ color: '#B9B9B9' }}>경기장명 </span>
            {comp.venue?.name ? comp.venue.name : <EmptyValue />}
          </p>
          <p>
            <span className="text-xs" style={{ color: '#B9B9B9' }}>특이사항 </span>
            {comp.venue?.notes ? <span className="whitespace-pre-wrap">{comp.venue.notes}</span> : <EmptyValue />}
          </p>
        </div>
      </Field>

      <Field icon="📋" label="팜플렛">
        {pamphlets.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {pamphlets.map((file) => (
              <a
                key={file.id}
                href={file.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold px-3 py-1.5 rounded-full hover:opacity-80"
                style={{ backgroundColor: 'rgba(0,70,42,0.08)', color: '#00462A' }}
              >
                {file.file_name || '팜플렛'} 보기
              </a>
            ))}
          </div>
        ) : (
          <EmptyValue />
        )}
      </Field>

      <Field icon="📝" label="특이사항">
        {comp.notes ? <span className="whitespace-pre-wrap">{comp.notes}</span> : <EmptyValue />}
      </Field>
    </div>
  );
}
