import { Competition } from '@/lib/types';
import EditableField from './EditableField';

interface Props {
  comp: Competition;
  editMode: boolean;
  onUpdateComp: (patch: Record<string, unknown>) => Promise<void>;
  onUpdateVenue: (patch: Record<string, unknown>) => Promise<void>;
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

function VenueNotLinked() {
  return (
    <span className="text-xs" style={{ color: '#B9B9B9' }}>
      대회장이 연결되어 있지 않습니다 (관리자 페이지에서 연결)
    </span>
  );
}

export default function CompetitionDetailFields({ comp, editMode, onUpdateComp, onUpdateVenue }: Props) {
  const pamphlets = comp.files?.filter((f) => f.file_type === '팸플릿') || [];
  const hasVenue = !!comp.venue_id;

  return (
    <div className="rounded-xl border px-4" style={{ borderColor: '#e0e0e0', backgroundColor: '#fff' }}>
      <Field icon="📅" label="진행일자">
        {editMode ? (
          <div className="flex items-center gap-2 flex-wrap">
            <EditableField
              value={comp.date_start || ''}
              type="date"
              editable
              onSave={(v) => onUpdateComp({ date_start: v || null })}
            />
            <span style={{ color: '#B9B9B9' }}>~</span>
            <EditableField
              value={comp.date_end || ''}
              type="date"
              editable
              onSave={(v) => onUpdateComp({ date_end: v || null })}
            />
          </div>
        ) : comp.date_start ? (
          <span>
            {comp.date_start}
            {comp.date_end && comp.date_end !== comp.date_start ? ` ~ ${comp.date_end}` : ''}
          </span>
        ) : (
          <EmptyValue />
        )}
      </Field>

      <Field icon="📍" label="진행 장소">
        {hasVenue ? (
          <EditableField
            value={comp.venue?.address || ''}
            editable={editMode}
            placeholder="서울시 송파구..."
            onSave={(v) => onUpdateVenue({ address: v || null })}
            renderValue={(v) => <MapLink text={v} />}
          />
        ) : editMode ? (
          <VenueNotLinked />
        ) : (
          <EmptyValue />
        )}
      </Field>

      <Field icon="🍽️" label="주변식당 및 편의시설">
        {hasVenue ? (
          <EditableField
            value={comp.venue?.nearby_info || ''}
            editable={editMode}
            multiline
            placeholder="체육관 1층 편의점, 인근 식당가 도보 5분"
            onSave={(v) => onUpdateVenue({ nearby_info: v || null })}
            renderValue={(v) => <MapLink text={v} />}
          />
        ) : editMode ? (
          <VenueNotLinked />
        ) : (
          <EmptyValue />
        )}
      </Field>

      <Field icon="🏟️" label="경기장 정보">
        <div className="space-y-1">
          <p>
            <span className="text-xs" style={{ color: '#B9B9B9' }}>경기장명 </span>
            {hasVenue ? (
              <EditableField
                value={comp.venue?.name || ''}
                editable={editMode}
                onSave={(v) => onUpdateVenue({ name: v || null })}
              />
            ) : editMode ? (
              <VenueNotLinked />
            ) : (
              <EmptyValue />
            )}
          </p>
          <p>
            <span className="text-xs" style={{ color: '#B9B9B9' }}>특이사항 </span>
            {hasVenue ? (
              <EditableField
                value={comp.venue?.notes || ''}
                editable={editMode}
                multiline
                placeholder="냉방 시설 없음, 관람석 협소"
                onSave={(v) => onUpdateVenue({ notes: v || null })}
              />
            ) : editMode ? (
              <VenueNotLinked />
            ) : (
              <EmptyValue />
            )}
          </p>
          {editMode && hasVenue && (
            <p className="text-xs pt-1" style={{ color: '#B9B9B9' }}>
              * 경기장명·특이사항은 같은 대회장을 쓰는 다른 대회에도 함께 반영됩니다
            </p>
          )}
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
        {editMode && (
          <p className="text-xs mt-1" style={{ color: '#B9B9B9' }}>* 파일 업로드는 관리자 페이지에서 가능합니다</p>
        )}
      </Field>

      <Field icon="📝" label="특이사항">
        <EditableField
          value={comp.notes || ''}
          editable={editMode}
          multiline
          placeholder="대회 전반적인 기록..."
          onSave={(v) => onUpdateComp({ notes: v || null })}
        />
      </Field>
    </div>
  );
}
