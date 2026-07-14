'use client';

import { useState, useEffect, useRef } from 'react';
import { Competition, CompetitionFile, Venue } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { COMPETITION_SERIES } from '@/lib/competitionSeries';
import KendoIcon from './KendoIcon';

interface Props {
  onMessage: (msg: string) => void;
  initialEditId?: string | null;
}

type SubTab = 'competitions' | 'venues' | 'thumbnails';

export default function AdminCompetition({ onMessage, initialEditId }: Props) {
  const [subTab, setSubTab] = useState<SubTab>('competitions');
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompForm, setShowCompForm] = useState(false);
  const [showVenueForm, setShowVenueForm] = useState(false);
  const [editComp, setEditComp] = useState<Competition | null>(null);
  const [editVenue, setEditVenue] = useState<Venue | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [compRes, venueRes] = await Promise.all([
      fetch('/api/competitions', { cache: 'no-store' }).then((r) => r.json()),
      fetch('/api/venues', { cache: 'no-store' }).then((r) => r.json()),
    ]);
    setCompetitions(compRes.data || []);
    setVenues(venueRes.data || []);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    if (!initialEditId || competitions.length === 0) return;
    const target = competitions.find((c) => c.id === initialEditId);
    if (target) {
      setSubTab('competitions');
      setEditComp(target);
      setShowCompForm(true);
      setExpandedId(target.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEditId, competitions.length]);

  return (
    <div>
      {/* 서브 탭 */}
      <div className="flex gap-1 mb-5 border-b" style={{ borderColor: '#e0e0e0' }}>
        {[
          { key: 'competitions' as SubTab, label: '대회 목록' },
          { key: 'venues' as SubTab, label: '대회장 관리' },
          { key: 'thumbnails' as SubTab, label: '시리즈 썸네일' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            className="h-8 px-3 text-xs font-medium border-b-2 -mb-[1px] transition-colors"
            style={{
              borderBottomColor: subTab === t.key ? '#00462A' : 'transparent',
              color: subTab === t.key ? '#00462A' : '#B9B9B9',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm py-8 text-center" style={{ color: '#B9B9B9' }}>불러오는 중...</p>
      ) : (
        <>
          {/* 대회 목록 */}
          {subTab === 'competitions' && (
            <div>
              <div className="flex justify-end mb-3">
                <button
                  onClick={() => { setEditComp(null); setShowCompForm(true); }}
                  className="h-8 px-3 text-xs font-semibold rounded text-white"
                  style={{ backgroundColor: '#00462A' }}
                >
                  + 대회 등록
                </button>
              </div>

              {showCompForm && (
                <CompetitionForm
                  initial={editComp}
                  venues={venues}
                  onSave={async () => { await load(); setShowCompForm(false); setEditComp(null); onMessage(editComp ? '대회가 수정되었습니다.' : '대회가 등록되었습니다.'); }}
                  onCancel={() => { setShowCompForm(false); setEditComp(null); }}
                />
              )}

              <div className="space-y-3 mt-3">
                {competitions.length === 0 && (
                  <p className="text-sm text-center py-8" style={{ color: '#B9B9B9' }}>등록된 대회가 없습니다</p>
                )}
                {competitions.map((comp) => (
                  <CompetitionRow
                    key={comp.id}
                    comp={comp}
                    expanded={expandedId === comp.id}
                    onToggle={() => setExpandedId(expandedId === comp.id ? null : comp.id)}
                    onEdit={() => { setEditComp(comp); setShowCompForm(true); setExpandedId(null); }}
                    onDelete={async () => {
                      if (!confirm(`"${comp.year} ${comp.name}" 대회를 삭제하시겠습니까?\n출전자·파일 데이터도 함께 삭제됩니다.`)) return;
                      await fetch(`/api/competitions/${comp.id}`, { method: 'DELETE' });
                      await load();
                      onMessage('대회가 삭제되었습니다.');
                    }}
                    onMessage={onMessage}
                    onRefresh={load}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 대회장 관리 */}
          {subTab === 'venues' && (
            <div>
              <div className="flex justify-end mb-3">
                <button
                  onClick={() => { setEditVenue(null); setShowVenueForm(true); }}
                  className="h-8 px-3 text-xs font-semibold rounded text-white"
                  style={{ backgroundColor: '#00462A' }}
                >
                  + 대회장 등록
                </button>
              </div>

              {showVenueForm && (
                <VenueForm
                  initial={editVenue}
                  onSave={async () => { await load(); setShowVenueForm(false); setEditVenue(null); onMessage(editVenue ? '대회장이 수정되었습니다.' : '대회장이 등록되었습니다.'); }}
                  onCancel={() => { setShowVenueForm(false); setEditVenue(null); }}
                />
              )}

              <div className="space-y-2 mt-3">
                {venues.length === 0 && (
                  <p className="text-sm text-center py-8" style={{ color: '#B9B9B9' }}>등록된 대회장이 없습니다</p>
                )}
                {venues.map((venue) => (
                  <div key={venue.id} className="flex items-center justify-between px-4 py-3 rounded-lg border" style={{ borderColor: '#e0e0e0' }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#111' }}>{venue.name}</p>
                      {venue.address && <p className="text-xs" style={{ color: '#B9B9B9' }}>{venue.address}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditVenue(venue); setShowVenueForm(true); }}
                        className="text-xs px-2.5 py-1 rounded border"
                        style={{ borderColor: '#00462A', color: '#00462A' }}
                      >수정</button>
                      <button
                        onClick={async () => {
                          if (!confirm(`"${venue.name}" 대회장을 삭제하시겠습니까?`)) return;
                          await fetch(`/api/venues/${venue.id}`, { method: 'DELETE' });
                          await load();
                          onMessage('대회장이 삭제되었습니다.');
                        }}
                        className="text-xs px-2.5 py-1 rounded border"
                        style={{ borderColor: '#DC2626', color: '#DC2626' }}
                      >삭제</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 시리즈 썸네일 */}
          {subTab === 'thumbnails' && <SeriesThumbnailManager onMessage={onMessage} />}
        </>
      )}
    </div>
  );
}

// ─── 대회 행 (확장 가능) ─────────────────────────────────────────────────
function CompetitionRow({
  comp, expanded, onToggle, onEdit, onDelete, onMessage, onRefresh,
}: {
  comp: Competition;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMessage: (msg: string) => void;
  onRefresh: () => void;
}) {
  const [participantCsv, setParticipantCsv] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileType, setFileType] = useState('팸플릿');
  const fileRef = useRef<HTMLInputElement>(null);

  const participantCount = Array.isArray(comp.participants) ? comp.participants.length : 0;

  async function uploadFile(file: File) {
    setUploadingFile(true);
    try {
      const path = `${comp.id}/${Date.now()}_${file.name}`;
      const { data: storageData, error: storageError } = await supabase.storage
        .from('competition-files')
        .upload(path, file, { upsert: true });

      if (storageError) throw storageError;

      const { data: urlData } = supabase.storage.from('competition-files').getPublicUrl(path);
      const publicUrl = urlData?.publicUrl;

      await fetch(`/api/competitions/${comp.id}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_url: publicUrl, file_name: file.name, file_type: fileType }),
      });

      onMessage(`"${file.name}" 업로드 완료`);
      onRefresh();
    } catch (e) {
      alert('업로드 실패: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setUploadingFile(false);
    }
  }

  async function deleteFile(fileId: string, fileUrl: string) {
    if (!confirm('파일을 삭제하시겠습니까?')) return;
    const storagePath = fileUrl.includes('competition-files/')
      ? fileUrl.split('competition-files/')[1]
      : undefined;
    await fetch(`/api/competitions/${comp.id}/files`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_id: fileId, storage_path: storagePath }),
    });
    onMessage('파일이 삭제되었습니다.');
    onRefresh();
  }

  async function uploadParticipants() {
    if (!participantCsv.trim()) return;
    const res = await fetch(`/api/competitions/${comp.id}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv: participantCsv }),
    });
    const json = await res.json();
    if (!res.ok) { alert(json.error); return; }
    onMessage(`출전자 ${json.count}명이 등록되었습니다.`);
    setParticipantCsv('');
    onRefresh();
  }

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#e0e0e0' }}>
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: '#F8FBF9' }}>
        <button onClick={onToggle} className="flex-1 flex items-center gap-2 text-left">
          <span className="text-sm font-bold" style={{ color: '#00462A' }}>
            {comp.year} {comp.name}
          </span>
          {participantCount > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(0,70,42,0.1)', color: '#00462A' }}>
              {participantCount}명
            </span>
          )}
          {comp.result_summary && (
            <span className="text-xs truncate max-w-[120px]" style={{ color: '#B9B9B9' }}>
              {comp.result_summary}
            </span>
          )}
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B9B9B9" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s', flexShrink: 0 }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <div className="flex gap-2 ml-2">
          <button onClick={onEdit} className="text-xs px-2.5 py-1 rounded border" style={{ borderColor: '#00462A', color: '#00462A' }}>수정</button>
          <button onClick={onDelete} className="text-xs px-2.5 py-1 rounded border" style={{ borderColor: '#DC2626', color: '#DC2626' }}>삭제</button>
        </div>
      </div>

      {/* 확장 영역 */}
      {expanded && (
        <div className="px-4 py-4 space-y-5 border-t" style={{ borderColor: '#e0e0e0' }}>

          {/* 출전자 CSV 업로드 */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: '#374151' }}>출전자 CSV 등록</p>
            <p className="text-xs mb-1.5" style={{ color: '#B9B9B9' }}>
              헤더: <code className="bg-gray-100 px-1 rounded">name,gender,division,dan_kyu,result,notes</code>
            </p>
            <textarea
              value={participantCsv}
              onChange={(e) => setParticipantCsv(e.target.value)}
              placeholder={"name,gender,division,dan_kyu,result,notes\n홍길동,남,남자부,2단,8강,\n이화인,여,여자부,1단,우승,"}
              rows={4}
              className="w-full text-xs px-3 py-2 rounded border font-mono resize-y focus:outline-none"
              style={{ borderColor: '#e0e0e0' }}
            />
            {participantCount > 0 && (
              <p className="text-xs mt-1" style={{ color: '#B9B9B9' }}>
                현재 {participantCount}명 등록됨 — CSV 재업로드 시 추가됩니다
              </p>
            )}
            <button
              onClick={uploadParticipants}
              className="mt-2 h-8 px-4 text-xs font-semibold rounded text-white"
              style={{ backgroundColor: '#00462A' }}
            >
              출전자 등록
            </button>
          </div>

          {/* 파일 업로드 */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: '#374151' }}>파일 업로드</p>
            <div className="flex gap-2 mb-2">
              {['팸플릿', '대진표', '결과지', '사진', '기타'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFileType(t)}
                  className="text-xs px-2.5 py-1 rounded-full border transition-colors"
                  style={
                    fileType === t
                      ? { backgroundColor: '#00462A', borderColor: '#00462A', color: '#fff' }
                      : { borderColor: '#e0e0e0', color: '#374151' }
                  }
                >
                  {t}
                </button>
              ))}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadFile(file);
                if (fileRef.current) fileRef.current.value = '';
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadingFile}
              className="h-8 px-4 text-xs rounded border font-medium"
              style={{ borderColor: '#00462A', color: '#00462A', opacity: uploadingFile ? 0.6 : 1 }}
            >
              {uploadingFile ? '업로드 중...' : '파일 선택 (PDF / 이미지)'}
            </button>

            {/* 등록된 파일 목록 */}
            {Array.isArray(comp.files) && comp.files.length > 0 && (
              <div className="mt-2 space-y-1">
                {comp.files.map((f) => (
                  <div key={f.id} className="flex items-center justify-between px-3 py-1.5 rounded border text-xs" style={{ borderColor: '#e0e0e0' }}>
                    <span style={{ color: '#374151' }}>{f.file_name || f.file_type}</span>
                    <div className="flex gap-2">
                      <a href={f.file_url} target="_blank" rel="noopener noreferrer" style={{ color: '#2d5a8e' }}>보기</a>
                      <button onClick={() => void deleteFile(f.id, f.file_url)} style={{ color: '#DC2626' }}>삭제</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 대회 등록/수정 폼 ────────────────────────────────────────────────────
function CompetitionForm({
  initial, venues, onSave, onCancel,
}: {
  initial: Competition | null;
  venues: Venue[];
  onSave: () => void;
  onCancel: () => void;
}) {
  const PRESET_NAMES = [
    '사회인대회', '서울컵대회', '서울시 회장기대회', '서울시 춘계 대학연맹전', '서울시 추계 대학연맹전',
    '금천구청장기 대회', '대선기대회', '도봉구청장기 대회',
  ];

  const [name, setName] = useState(initial?.name || '');
  const [customName, setCustomName] = useState(
    initial?.name && !PRESET_NAMES.includes(initial.name) ? initial.name : ''
  );
  const [useCustom, setUseCustom] = useState(
    !!initial?.name && !PRESET_NAMES.includes(initial.name)
  );
  const [year, setYear] = useState(String(initial?.year || new Date().getFullYear()));
  const [dateStart, setDateStart] = useState(initial?.date_start || '');
  const [dateEnd, setDateEnd] = useState(initial?.date_end || '');
  const [venueId, setVenueId] = useState(initial?.venue_id || '');
  const [customVenueName, setCustomVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState(initial?.venue?.address || '');
  const [venueNearbyInfo, setVenueNearbyInfo] = useState(initial?.venue?.nearby_info || '');
  const [venueNotes, setVenueNotes] = useState(initial?.venue?.notes || '');
  const [resultSummary, setResultSummary] = useState(initial?.result_summary || '');
  const [entryFee, setEntryFee] = useState(String(initial?.entry_fee || ''));
  const [notes, setNotes] = useState(initial?.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // 대회장 선택(기존 대회장)이 바뀌면 해당 대회장의 현재 정보로 채워줌
  useEffect(() => {
    if (!venueId || venueId === '__custom__' || venueId.startsWith('__new__:')) return;
    const v = venues.find((x) => x.id === venueId);
    if (v) {
      setVenueAddress(v.address || '');
      setVenueNearbyInfo(v.nearby_info || '');
      setVenueNotes(v.notes || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueId]);

  const PRESET_VENUE_NAMES = [
    '과학기술대학교 체육관',
    '올림픽공원 학생체육관',
    '올림픽공원 핸드볼경기장',
    '금천문화센터',
    '경기도검도수련원',
    '한석봉체육관',
  ];
  // 프리셋 대회장이 이미 등록되어 있으면 그 id를, 아니면 저장 시점에 자동 등록하도록 임시 값을 사용
  const presetVenueOptions = PRESET_VENUE_NAMES.map((n) => {
    const existing = venues.find((v) => v.name === n);
    return { value: existing ? existing.id : `__new__:${n}`, label: n };
  });
  const otherVenues = venues.filter((v) => !PRESET_VENUE_NAMES.includes(v.name));

  async function resolveVenueId(): Promise<string | null> {
    if (!venueId) return null;
    if (venueId === '__custom__') {
      const trimmed = customVenueName.trim();
      if (!trimmed) return null;
      const existing = venues.find((v) => v.name === trimmed);
      if (existing) return existing.id;
      const res = await fetch('/api/venues', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '대회장 등록 실패');
      return json.data.id;
    }
    if (venueId.startsWith('__new__:')) {
      const presetName = venueId.slice('__new__:'.length);
      const res = await fetch('/api/venues', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: presetName }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '대회장 등록 실패');
      return json.data.id;
    }
    return venueId;
  }

  async function handleSave() {
    const finalName = useCustom ? customName : name;
    if (!finalName || !year) { setError('대회명과 연도는 필수입니다'); return; }
    setSaving(true);
    setError('');
    try {
      const resolvedVenueId = await resolveVenueId();

      // 진행 장소 / 주변식당 및 편의시설 / 경기장 특이사항은 대회장(venue) 엔티티에 저장됨
      if (resolvedVenueId) {
        const resolvedVenueName =
          venueId === '__custom__' ? customVenueName.trim()
          : venueId.startsWith('__new__:') ? venueId.slice('__new__:'.length)
          : venues.find((v) => v.id === resolvedVenueId)?.name || '';
        await fetch(`/api/venues/${resolvedVenueId}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: resolvedVenueName,
            address: venueAddress || null,
            nearby_info: venueNearbyInfo || null,
            notes: venueNotes || null,
          }),
        });
      }

      const body = {
        name: finalName, year: Number(year),
        date_start: dateStart || null, date_end: dateEnd || null,
        venue_id: resolvedVenueId,
        result_summary: resultSummary || null,
        entry_fee: entryFee ? Number(entryFee) : null,
        notes: notes || null,
      };
      const url = initial ? `/api/competitions/${initial.id}` : '/api/competitions';
      const method = initial ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      onSave();
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 rounded-xl border mb-4 space-y-3" style={{ borderColor: '#00462A', backgroundColor: '#F8FBF9' }}>
      <h3 className="text-sm font-bold" style={{ color: '#00462A' }}>
        {initial ? '대회 수정' : '새 대회 등록'}
      </h3>

      {/* 대회명 */}
      <div>
        <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>대회명 *</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {PRESET_NAMES.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => { setName(n); setUseCustom(false); }}
              className="text-xs px-2.5 py-1 rounded-full border transition-colors"
              style={
                !useCustom && name === n
                  ? { backgroundColor: '#00462A', borderColor: '#00462A', color: '#fff' }
                  : { borderColor: '#e0e0e0', color: '#374151' }
              }
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setUseCustom(true)}
            className="text-xs px-2.5 py-1 rounded-full border transition-colors"
            style={
              useCustom
                ? { backgroundColor: '#374151', borderColor: '#374151', color: '#fff' }
                : { borderColor: '#e0e0e0', color: '#374151' }
            }
          >
            직접 입력
          </button>
        </div>
        {useCustom && (
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="대회명 직접 입력"
            className="w-full h-8 px-3 text-xs rounded border focus:outline-none"
            style={{ borderColor: '#e0e0e0' }}
          />
        )}
      </div>

      {/* 연도 */}
      <div className="w-24">
        <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>연도 *</label>
        <input type="number" value={year} onChange={(e) => setYear(e.target.value)}
          className="w-full h-8 px-2 text-xs rounded border focus:outline-none" style={{ borderColor: '#e0e0e0' }} />
      </div>

      <hr style={{ borderColor: '#e0e0e0' }} />

      {/* 📅 진행일자 */}
      <div>
        <label className="text-xs font-bold block mb-1.5" style={{ color: '#00462A' }}>📅 진행일자</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>시작일</label>
            <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)}
              className="w-full h-8 px-2 text-xs rounded border focus:outline-none" style={{ borderColor: '#e0e0e0' }} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>종료일</label>
            <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)}
              className="w-full h-8 px-2 text-xs rounded border focus:outline-none" style={{ borderColor: '#e0e0e0' }} />
          </div>
        </div>
      </div>

      {/* 경기장 정보 (대회장 선택 + 경기장명/특이사항) */}
      <div>
        <label className="text-xs font-bold block mb-1.5" style={{ color: '#00462A' }}>🏟️ 경기장 정보</label>
        <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>경기장명 (대회장 선택)</label>
        <select value={venueId} onChange={(e) => setVenueId(e.target.value)}
          className="w-full h-8 px-2 text-xs rounded border focus:outline-none bg-white" style={{ borderColor: '#e0e0e0' }}>
          <option value="">대회장 선택 안 함</option>
          {presetVenueOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          {otherVenues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          <option value="__custom__">기타 (직접 입력)</option>
        </select>
        {venueId === '__custom__' && (
          <input
            type="text"
            value={customVenueName}
            onChange={(e) => setCustomVenueName(e.target.value)}
            placeholder="대회장명 직접 입력"
            className="w-full h-8 px-3 text-xs rounded border focus:outline-none mt-2"
            style={{ borderColor: '#e0e0e0' }}
          />
        )}

        {!!venueId && (
          <div className="mt-2">
            <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>경기장 특이사항</label>
            <input type="text" value={venueNotes} onChange={(e) => setVenueNotes(e.target.value)}
              placeholder="냉방 시설 없음, 관람석 협소"
              className="w-full h-8 px-3 text-xs rounded border focus:outline-none" style={{ borderColor: '#e0e0e0' }} />
            <p className="text-xs mt-1" style={{ color: '#B9B9B9' }}>
              이 대회장에서 열린 다른 대회에도 함께 반영됩니다
            </p>
          </div>
        )}
      </div>

      {/* 📍 진행 장소 */}
      {!!venueId && (
        <div>
          <label className="text-xs font-bold block mb-1.5" style={{ color: '#00462A' }}>📍 진행 장소</label>
          <input type="text" value={venueAddress} onChange={(e) => setVenueAddress(e.target.value)}
            placeholder="서울시 송파구..."
            className="w-full h-8 px-3 text-xs rounded border focus:outline-none" style={{ borderColor: '#e0e0e0' }} />
        </div>
      )}

      {/* 🍽️ 주변식당 및 편의시설 */}
      {!!venueId && (
        <div>
          <label className="text-xs font-bold block mb-1.5" style={{ color: '#00462A' }}>🍽️ 주변식당 및 편의시설</label>
          <input type="text" value={venueNearbyInfo} onChange={(e) => setVenueNearbyInfo(e.target.value)}
            placeholder="체육관 1층 편의점, 인근 식당가 도보 5분"
            className="w-full h-8 px-3 text-xs rounded border focus:outline-none" style={{ borderColor: '#e0e0e0' }} />
        </div>
      )}

      <hr style={{ borderColor: '#e0e0e0' }} />

      {/* 결과 요약 */}
      <div>
        <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>결과 요약</label>
        <input type="text" value={resultSummary} onChange={(e) => setResultSummary(e.target.value)}
          placeholder="예: 여자부 3위 / 남자부 예선 탈락"
          className="w-full h-8 px-3 text-xs rounded border focus:outline-none" style={{ borderColor: '#e0e0e0' }} />
      </div>

      {/* 참가비 */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>참가비 (원)</label>
          <input type="number" value={entryFee} onChange={(e) => setEntryFee(e.target.value)}
            placeholder="50000"
            className="w-full h-8 px-3 text-xs rounded border focus:outline-none" style={{ borderColor: '#e0e0e0' }} />
        </div>
        <div />
      </div>

      {/* 📋 팜플렛 */}
      {initial && <PamphletManager competitionId={initial.id} initialFiles={initial.files || []} />}

      {/* 📝 특이사항 */}
      <div>
        <label className="text-xs font-bold block mb-1.5" style={{ color: '#00462A' }}>📝 특이사항</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          rows={2} placeholder="대회 전반적인 기록..."
          className="w-full px-3 py-2 text-xs rounded border focus:outline-none resize-y" style={{ borderColor: '#e0e0e0' }} />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving}
          className="h-8 px-4 text-xs font-semibold rounded text-white"
          style={{ backgroundColor: '#00462A', opacity: saving ? 0.7 : 1 }}>
          {saving ? '저장 중...' : initial ? '수정 완료' : '등록'}
        </button>
        <button onClick={onCancel}
          className="h-8 px-3 text-xs rounded border"
          style={{ borderColor: '#e0e0e0', color: '#374151' }}>
          취소
        </button>
      </div>
    </div>
  );
}

// ─── 팜플렛 업로드/삭제 ───────────────────────────────────────────────────
function PamphletManager({ competitionId, initialFiles }: { competitionId: string; initialFiles: CompetitionFile[] }) {
  const [files, setFiles] = useState<CompetitionFile[]>(initialFiles.filter((f) => f.file_type === '팸플릿'));
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setUploading(true);
    try {
      const path = `${competitionId}/${Date.now()}_${file.name}`;
      const { error: storageError } = await supabase.storage
        .from('competition-files')
        .upload(path, file, { upsert: true });
      if (storageError) throw storageError;

      const { data: urlData } = supabase.storage.from('competition-files').getPublicUrl(path);
      const publicUrl = urlData?.publicUrl;

      const res = await fetch(`/api/competitions/${competitionId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_url: publicUrl, file_name: file.name, file_type: '팸플릿' }),
      });
      const json = await res.json();
      if (json.data) setFiles((prev) => [...prev, json.data]);
    } catch (e) {
      alert('업로드 실패: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setUploading(false);
    }
  }

  async function remove(file: CompetitionFile) {
    if (!confirm('팜플렛을 삭제하시겠습니까?')) return;
    const storagePath = file.file_url.includes('competition-files/')
      ? file.file_url.split('competition-files/')[1]
      : undefined;
    await fetch(`/api/competitions/${competitionId}/files`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_id: file.id, storage_path: storagePath }),
    });
    setFiles((prev) => prev.filter((f) => f.id !== file.id));
  }

  return (
    <div>
      <label className="text-xs font-bold block mb-1.5" style={{ color: '#00462A' }}>📋 팜플렛</label>
      {files.length > 0 && (
        <div className="space-y-1 mb-2">
          {files.map((f) => (
            <div key={f.id} className="flex items-center justify-between px-3 py-1.5 rounded border text-xs" style={{ borderColor: '#e0e0e0' }}>
              <span style={{ color: '#374151' }}>{f.file_name || '팜플렛'}</span>
              <div className="flex gap-2">
                <a href={f.file_url} target="_blank" rel="noopener noreferrer" style={{ color: '#2d5a8e' }}>보기</a>
                <button type="button" onClick={() => void remove(f)} style={{ color: '#DC2626' }}>삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
          if (fileRef.current) fileRef.current.value = '';
        }}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="h-8 px-4 text-xs rounded border font-medium"
        style={{ borderColor: '#00462A', color: '#00462A', opacity: uploading ? 0.6 : 1 }}
      >
        {uploading ? '업로드 중...' : '팜플렛 파일 선택 (PDF / 이미지)'}
      </button>
    </div>
  );
}

// ─── 대회장 등록/수정 폼 ──────────────────────────────────────────────────
function VenueForm({
  initial, onSave, onCancel,
}: {
  initial: Venue | null;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name || '');
  const [address, setAddress] = useState(initial?.address || '');
  const [parkingInfo, setParkingInfo] = useState(initial?.parking_info || '');
  const [courtCount, setCourtCount] = useState(String(initial?.court_count || ''));
  const [floorType, setFloorType] = useState(initial?.floor_type || '');
  const [sizeMemo, setSizeMemo] = useState(initial?.size_memo || '');
  const [accessMemo, setAccessMemo] = useState(initial?.access_memo || '');
  const [nearbyInfo, setNearbyInfo] = useState(initial?.nearby_info || '');
  const [venueNotes, setVenueNotes] = useState(initial?.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!name) { setError('대회장명은 필수입니다'); return; }
    setSaving(true);
    try {
      const body = {
        name, address: address || null, parking_info: parkingInfo || null,
        court_count: courtCount ? Number(courtCount) : null,
        floor_type: floorType || null, size_memo: sizeMemo || null, access_memo: accessMemo || null,
        nearby_info: nearbyInfo || null, notes: venueNotes || null,
      };
      const url = initial ? `/api/venues/${initial.id}` : '/api/venues';
      const method = initial ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      onSave();
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 rounded-xl border mb-4 space-y-3" style={{ borderColor: '#00462A', backgroundColor: '#F8FBF9' }}>
      <h3 className="text-sm font-bold" style={{ color: '#00462A' }}>
        {initial ? '대회장 수정' : '새 대회장 등록'}
      </h3>
      {[
        { label: '대회장명 *', value: name, set: setName, placeholder: '올림픽공원 펜싱경기장' },
        { label: '주소', value: address, set: setAddress, placeholder: '서울시 송파구...' },
        { label: '🅿️ 주차 정보', value: parkingInfo, set: setParkingInfo, placeholder: '지하주차장 2시간 무료, 이후 30분당 500원' },
        { label: '🦶 바닥 재질', value: floorType, set: setFloorType, placeholder: '마루 / 매트 / 타일' },
        { label: '📐 규모 메모', value: sizeMemo, set: setSizeMemo, placeholder: '코트 6면, 관람석 500석' },
        { label: '🚇 교통/접근', value: accessMemo, set: setAccessMemo, placeholder: '올림픽공원역 3번 출구 도보 5분' },
        { label: '🍽️ 주변식당 및 편의시설', value: nearbyInfo, set: setNearbyInfo, placeholder: '체육관 1층 편의점, 인근 식당가 도보 5분' },
        { label: '📝 경기장 특이사항', value: venueNotes, set: setVenueNotes, placeholder: '냉방 시설 없음, 관람석 협소' },
      ].map(({ label, value, set, placeholder }) => (
        <div key={label}>
          <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>{label}</label>
          <input type="text" value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder}
            className="w-full h-8 px-3 text-xs rounded border focus:outline-none" style={{ borderColor: '#e0e0e0' }} />
        </div>
      ))}
      <div>
        <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>코트 수</label>
        <input type="number" value={courtCount} onChange={(e) => setCourtCount(e.target.value)}
          className="w-24 h-8 px-3 text-xs rounded border focus:outline-none" style={{ borderColor: '#e0e0e0' }} />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving}
          className="h-8 px-4 text-xs font-semibold rounded text-white"
          style={{ backgroundColor: '#00462A', opacity: saving ? 0.7 : 1 }}>
          {saving ? '저장 중...' : initial ? '수정 완료' : '등록'}
        </button>
        <button onClick={onCancel}
          className="h-8 px-3 text-xs rounded border"
          style={{ borderColor: '#e0e0e0', color: '#374151' }}>
          취소
        </button>
      </div>
    </div>
  );
}

// ─── 시리즈 썸네일 관리 ────────────────────────────────────────────────────
function SeriesThumbnailManager({ onMessage }: { onMessage: (msg: string) => void }) {
  const [thumbs, setThumbs] = useState<Record<string, string | undefined>>({});
  const [loading, setLoading] = useState(true);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function load() {
    setLoading(true);
    const res = await fetch('/api/series-thumbnails').then((r) => r.json());
    const map: Record<string, string | undefined> = {};
    for (const row of res.data || []) map[row.series_key] = row.thumbnail_url || undefined;
    setThumbs(map);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function uploadThumbnail(seriesKey: string, file: File) {
    setUploadingKey(seriesKey);
    try {
      const path = `series-thumbnails/${seriesKey}_${Date.now()}_${file.name}`;
      const { error: storageError } = await supabase.storage
        .from('competition-files')
        .upload(path, file, { upsert: true });
      if (storageError) throw storageError;

      const { data: urlData } = supabase.storage.from('competition-files').getPublicUrl(path);
      const publicUrl = urlData?.publicUrl;

      await fetch('/api/series-thumbnails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ series_key: seriesKey, thumbnail_url: publicUrl }),
      });

      await load();
      onMessage('썸네일이 업로드되었습니다.');
    } catch (e) {
      alert('업로드 실패: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setUploadingKey(null);
    }
  }

  async function removeThumbnail(seriesKey: string) {
    if (!confirm('썸네일을 제거하시겠습니까?')) return;
    await fetch('/api/series-thumbnails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ series_key: seriesKey, thumbnail_url: null }),
    });
    await load();
    onMessage('썸네일이 제거되었습니다.');
  }

  if (loading) return <p className="text-sm py-8 text-center" style={{ color: '#B9B9B9' }}>불러오는 중...</p>;

  return (
    <div className="space-y-2">
      {COMPETITION_SERIES.map((series) => (
        <div key={series.key} className="flex items-center justify-between px-4 py-3 rounded-lg border" style={{ borderColor: '#e0e0e0' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f3f4f6' }}>
              {thumbs[series.key] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbs[series.key]} alt={series.label} className="w-full h-full object-cover" />
              ) : (
                <KendoIcon size={18} color="#9CA3AF" />
              )}
            </div>
            <p className="text-sm font-medium" style={{ color: '#111' }}>{series.label}</p>
          </div>
          <div className="flex gap-2">
            <input
              ref={(el) => { fileRefs.current[series.key] = el; }}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadThumbnail(series.key, file);
                if (fileRefs.current[series.key]) fileRefs.current[series.key]!.value = '';
              }}
            />
            <button
              onClick={() => fileRefs.current[series.key]?.click()}
              disabled={uploadingKey === series.key}
              className="text-xs px-2.5 py-1 rounded border"
              style={{ borderColor: '#00462A', color: '#00462A', opacity: uploadingKey === series.key ? 0.6 : 1 }}
            >
              {uploadingKey === series.key ? '업로드 중...' : '이미지 변경'}
            </button>
            {thumbs[series.key] && (
              <button
                onClick={() => void removeThumbnail(series.key)}
                className="text-xs px-2.5 py-1 rounded border"
                style={{ borderColor: '#DC2626', color: '#DC2626' }}
              >제거</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
