'use client';

import { useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import { BracketMatch } from '@/lib/types';
import { groupByDivision, groupBySide, buildSideStructure, assignMatchNumbers } from '@/lib/bracket';
import { adminFetch } from '@/lib/adminClient';

interface Props {
  competitionId: string;
  matches: BracketMatch[];
  onDone: () => void;
}

interface LinkRow {
  match_number: string;
  youtube_url: string;
  title: string;
  date: string;
  angle: string;
  participants: string;
  topic: string;
  uploader: string;
}

const EMPTY_ROW: LinkRow = { match_number: '', youtube_url: '', title: '', date: '', angle: '', participants: '', topic: '', uploader: '' };

const CSV_COLUMN_MAP: Record<string, keyof LinkRow> = {
  match_number: 'match_number', 번호: 'match_number', 경기번호: 'match_number',
  youtube_url: 'youtube_url', 링크: 'youtube_url', 유튜브: 'youtube_url',
  title: 'title', 제목: 'title',
  date: 'date', 날짜: 'date',
  angle: 'angle', 앵글: 'angle',
  participants: 'participants', 참가자: 'participants',
  topic: 'topic', 주제: 'topic',
  uploader: 'uploader', 등록자: 'uploader',
};

export default function BracketVideoLinker({ competitionId, matches, onDone }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const groups = groupByDivision(matches);
  const [groupKey, setGroupKey] = useState(groups[0] ? `${groups[0].event_type}__${groups[0].division}` : '');
  const [rows, setRows] = useState<LinkRow[]>([{ ...EMPTY_ROW }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ inserted: number; errors: { row: number; reason: string }[] } | null>(null);

  const selectedGroup = groups.find((g) => `${g.event_type}__${g.division}` === groupKey) || groups[0];

  // 지금 화면(BracketView)에 뜨는 번호와 완전히 동일한 계산 — "① 김민지 vs 박서연" 형태로 참조표를 보여준다.
  const numberedMatches = useMemo(() => {
    if (!selectedGroup) return [];
    const bySide = groupBySide(selectedGroup.matches);
    const structureA = buildSideStructure(bySide.A);
    const structureB = buildSideStructure(bySide.B);
    const final = bySide.final[0] || null;
    const numbers = assignMatchNumbers(structureA, structureB, final);
    const byId = new Map(selectedGroup.matches.map((m) => [m.id, m]));
    return Array.from(numbers, ([matchId, number]) => ({ number, match: byId.get(matchId)! }))
      .sort((a, b) => a.number - b.number);
  }, [selectedGroup]);

  function updateRow(i: number, field: keyof LinkRow, value: string) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { ...EMPTY_ROW }]);
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
      if (parsed.errors.length > 0) {
        setError('CSV 파싱 오류: ' + parsed.errors[0].message);
        return;
      }
      const mapped: LinkRow[] = parsed.data.map((raw) => {
        const row: LinkRow = { ...EMPTY_ROW };
        Object.entries(raw).forEach(([col, val]) => {
          const key = CSV_COLUMN_MAP[col.trim()];
          if (key) row[key] = val;
        });
        return row;
      });
      if (mapped.length === 0) { setError('CSV에서 읽은 행이 없습니다'); return; }
      setRows((prev) => (prev.length === 1 && !prev[0].match_number && !prev[0].youtube_url ? mapped : [...prev, ...mapped]));
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  }

  async function handleSubmit() {
    if (!selectedGroup) return;
    const validRows = rows.filter((r) => r.match_number.trim() || r.youtube_url.trim());
    if (validRows.length === 0) { setError('입력된 행이 없습니다'); return; }

    setSaving(true);
    setError('');
    setResult(null);
    try {
      const payload = {
        division: selectedGroup.division,
        event_type: selectedGroup.event_type,
        rows: validRows.map((r) => ({
          match_number: Number(r.match_number),
          youtube_url: r.youtube_url.trim(),
          title: r.title.trim() || undefined,
          date: r.date.trim() || undefined,
          angle: r.angle.trim() || undefined,
          participants: r.participants.trim()
            ? r.participants.split(/[\s,\-\/|·]+/).map((p) => p.trim()).filter(Boolean)
            : undefined,
          topic: r.topic.trim() || undefined,
          uploader: r.uploader.trim() || undefined,
        })),
      };
      const res = await adminFetch(`/api/competitions/${competitionId}/bracket/bulk-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok && !json.inserted) throw new Error(json.error || '연결 실패');
      setResult({ inserted: json.inserted ?? 0, errors: json.errors ?? [] });
      if ((json.errors ?? []).length === 0) {
        setRows([{ ...EMPTY_ROW }]);
      }
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : '연결 실패');
    } finally {
      setSaving(false);
    }
  }

  if (groups.length === 0) {
    return <p className="text-xs" style={{ color: '#B9B9B9' }}>먼저 대진표 매치를 등록해주세요</p>;
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>부문 선택</label>
        <div className="flex flex-wrap gap-1.5">
          {groups.map((g) => {
            const key = `${g.event_type}__${g.division}`;
            const active = key === groupKey;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setGroupKey(key)}
                className="text-xs px-2.5 py-1 rounded-full border transition-colors"
                style={active
                  ? { backgroundColor: '#00462A', borderColor: '#00462A', color: '#fff' }
                  : { borderColor: '#e0e0e0', color: '#374151' }}
              >
                {g.event_type} · {g.division}
              </button>
            );
          })}
        </div>
      </div>

      {/* 번호 참조표 — 대진표 화면에서 보는 번호와 동일 */}
      {numberedMatches.length > 0 && (
        <div className="rounded border p-2" style={{ borderColor: '#e0e0e0', backgroundColor: '#F8FBF9' }}>
          <p className="text-xs font-semibold mb-1.5" style={{ color: '#00462A' }}>경기 번호 참조 (대진표 화면과 동일)</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {numberedMatches.map(({ number, match }) => (
              <span key={match.id} className="text-xs" style={{ color: '#374151' }}>
                <b style={{ color: '#00462A' }}>{number}</b>. {match.is_bye ? `${match.player1_name || '?'} (부전승)` : `${match.player1_name || '?'} vs ${match.player2_name || '?'}`}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="h-8 px-3 text-xs rounded border"
          style={{ borderColor: '#00462A', color: '#00462A' }}
        >
          CSV 파일 불러오기
        </button>
        <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
        <span className="text-xs" style={{ color: '#B9B9B9' }}>
          열: match_number(번호), youtube_url(링크), title/date/angle/participants/topic/uploader(선택)
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="text-xs border-collapse w-full" style={{ minWidth: 720 }}>
          <thead>
            <tr>
              {['번호*', '유튜브 링크*', '제목', '날짜', '각도', '참가자', '주제', '등록자', ''].map((col) => (
                <th key={col} className="border px-1.5 py-1 text-left font-medium whitespace-nowrap" style={{ borderColor: '#e0e0e0', color: '#374151' }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td className="border p-0.5" style={{ borderColor: '#e0e0e0', width: 56 }}>
                  <input type="number" min={1} value={row.match_number} onChange={(e) => updateRow(i, 'match_number', e.target.value)}
                    className="w-full h-7 px-1 text-xs focus:outline-none" placeholder="①" />
                </td>
                <td className="border p-0.5" style={{ borderColor: '#e0e0e0', minWidth: 160 }}>
                  <input type="text" value={row.youtube_url} onChange={(e) => updateRow(i, 'youtube_url', e.target.value)}
                    className="w-full h-7 px-1 text-xs focus:outline-none" placeholder="https://youtu.be/..." />
                </td>
                <td className="border p-0.5" style={{ borderColor: '#e0e0e0', minWidth: 120 }}>
                  <input type="text" value={row.title} onChange={(e) => updateRow(i, 'title', e.target.value)}
                    className="w-full h-7 px-1 text-xs focus:outline-none" placeholder="자동 생성" />
                </td>
                <td className="border p-0.5" style={{ borderColor: '#e0e0e0', width: 110 }}>
                  <input type="date" value={row.date} onChange={(e) => updateRow(i, 'date', e.target.value)}
                    className="w-full h-7 px-1 text-xs focus:outline-none" />
                </td>
                <td className="border p-0.5" style={{ borderColor: '#e0e0e0', width: 70 }}>
                  <select value={row.angle} onChange={(e) => updateRow(i, 'angle', e.target.value)} className="w-full h-7 px-1 text-xs focus:outline-none bg-white">
                    <option value="">전면</option>
                    <option value="전면">전면</option>
                    <option value="후면">후면</option>
                    <option value="기타">기타</option>
                  </select>
                </td>
                <td className="border p-0.5" style={{ borderColor: '#e0e0e0', minWidth: 100 }}>
                  <input type="text" value={row.participants} onChange={(e) => updateRow(i, 'participants', e.target.value)}
                    className="w-full h-7 px-1 text-xs focus:outline-none" placeholder="선수1,선수2" />
                </td>
                <td className="border p-0.5" style={{ borderColor: '#e0e0e0', minWidth: 90 }}>
                  <input type="text" value={row.topic} onChange={(e) => updateRow(i, 'topic', e.target.value)}
                    className="w-full h-7 px-1 text-xs focus:outline-none" />
                </td>
                <td className="border p-0.5" style={{ borderColor: '#e0e0e0', minWidth: 90 }}>
                  <input type="text" value={row.uploader} onChange={(e) => updateRow(i, 'uploader', e.target.value)}
                    className="w-full h-7 px-1 text-xs focus:outline-none" />
                </td>
                <td className="border p-0.5 text-center" style={{ borderColor: '#e0e0e0' }}>
                  <button type="button" onClick={() => removeRow(i)} style={{ color: '#DC2626' }}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" onClick={addRow} className="h-8 px-3 text-xs rounded border" style={{ borderColor: '#e0e0e0', color: '#374151' }}>
          + 행 추가
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="h-8 px-4 text-xs font-semibold rounded text-white"
          style={{ backgroundColor: '#00462A', opacity: saving ? 0.7 : 1 }}
        >
          {saving ? '연결 중...' : '일괄 연결'}
        </button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
      {result && (
        <div className="text-xs" style={{ color: result.errors.length > 0 ? '#DC2626' : '#00462A' }}>
          <p>{result.inserted}개 연결 완료{result.errors.length > 0 ? `, 실패 ${result.errors.length}개` : ''}</p>
          {result.errors.map((e) => (
            <p key={e.row} style={{ color: '#DC2626' }}>· {e.row}번째 행: {e.reason}</p>
          ))}
        </div>
      )}
    </div>
  );
}
