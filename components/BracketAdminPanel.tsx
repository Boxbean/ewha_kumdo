'use client';

import { useEffect, useState } from 'react';
import { BracketMatch, BracketSide, Video, WinnerSlot } from '@/lib/types';
import { groupByDivision } from '@/lib/bracket';

interface Props {
  competitionId: string;
  initialMatches: BracketMatch[];
  onMessage: (msg: string) => void;
}

const SIDE_OPTIONS: { value: BracketSide; label: string }[] = [
  { value: 'A', label: 'A조' },
  { value: 'B', label: 'B조' },
  { value: 'final', label: '결승' },
];

export default function BracketAdminPanel({ competitionId, initialMatches, onMessage }: Props) {
  const [matches, setMatches] = useState<BracketMatch[]>(initialMatches);
  const [videos, setVideos] = useState<Video[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BracketMatch | null>(null);

  const divisionOptions = Array.from(new Set(matches.map((m) => m.division)));

  async function refresh() {
    const res = await fetch(`/api/competitions/${competitionId}/bracket`, { cache: 'no-store' }).then((r) => r.json());
    setMatches(res.data || []);
  }

  async function loadVideos() {
    const res = await fetch(`/api/videos?competition_id=${competitionId}&limit=500`, { cache: 'no-store' }).then((r) => r.json());
    setVideos(res.data || []);
  }

  // 초기 진입 시 매치를 다시 불러와 영상 연결 상태(m.videos)까지 채워줌 — initialMatches는 목록 API에서 온 값이라 영상 정보가 없음
  useEffect(() => { void refresh(); void loadVideos(); }, [competitionId]);

  async function linkVideo(videoId: string, matchId: string) {
    await fetch(`/api/videos/${videoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bracket_match_id: matchId }),
    });
    await Promise.all([refresh(), loadVideos()]);
  }

  async function unlinkVideo(videoId: string) {
    await fetch(`/api/videos/${videoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bracket_match_id: null }),
    });
    await Promise.all([refresh(), loadVideos()]);
  }

  async function handleDelete(match: BracketMatch) {
    if (!confirm('이 매치를 삭제하시겠습니까?')) return;
    await fetch(`/api/bracket/${match.id}`, { method: 'DELETE' });
    await refresh();
    onMessage('매치가 삭제되었습니다.');
  }

  const groups = groupByDivision(matches);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold" style={{ color: '#374151' }}>🏆 대진표 매치</p>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="text-xs px-2.5 py-1 rounded border"
          style={{ borderColor: '#00462A', color: '#00462A' }}
        >
          + 매치 추가
        </button>
      </div>

      {showForm && (
        <BracketMatchForm
          competitionId={competitionId}
          initial={editing}
          divisionOptions={divisionOptions}
          videos={videos}
          onLinkVideo={linkVideo}
          onUnlinkVideo={unlinkVideo}
          onSave={async () => { await refresh(); setShowForm(false); setEditing(null); onMessage(editing ? '매치가 수정되었습니다.' : '매치가 등록되었습니다.'); }}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {groups.length === 0 ? (
        <p className="text-xs text-center py-4" style={{ color: '#B9B9B9' }}>등록된 매치가 없습니다</p>
      ) : (
        <div className="space-y-3 mt-2">
          {groups.map((g) => (
            <div key={`${g.event_type}__${g.division}`}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#00462A' }}>
                {g.event_type} · {g.division} <span style={{ color: '#B9B9B9', fontWeight: 400 }}>({g.matches.length}매치)</span>
              </p>
              <div className="space-y-1">
                {g.matches
                  .slice()
                  .sort((a, b) => a.side.localeCompare(b.side) || a.round - b.round || a.match_no - b.match_no)
                  .map((m) => (
                    <div key={m.id} className="flex items-center justify-between px-3 py-1.5 rounded border text-xs" style={{ borderColor: '#e0e0e0' }}>
                      <span style={{ color: '#374151' }}>
                        [{SIDE_OPTIONS.find((s) => s.value === m.side)?.label} R{m.round}-{m.match_no}]{' '}
                        <span style={{ fontWeight: m.winner_slot === 'player1' ? 700 : 400 }}>{m.player1_name || '—'}</span>
                        {' vs '}
                        <span style={{ fontWeight: m.winner_slot === 'player2' ? 700 : 400 }}>{m.player2_name || '—'}</span>
                        {(m.videos?.length ?? 0) > 0 && (
                          <span className="ml-1.5" style={{ color: '#00462A' }} title={`영상 ${m.videos!.length}개 연결됨`}>
                            ▶{m.videos!.length > 1 ? m.videos!.length : ''}
                          </span>
                        )}
                      </span>
                      <div className="flex gap-2 flex-shrink-0 ml-2">
                        <button onClick={() => { setEditing(m); setShowForm(true); }} style={{ color: '#00462A' }}>수정</button>
                        <button onClick={() => void handleDelete(m)} style={{ color: '#DC2626' }}>삭제</button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BracketMatchForm({
  competitionId, initial, divisionOptions, videos, onLinkVideo, onUnlinkVideo, onSave, onCancel,
}: {
  competitionId: string;
  initial: BracketMatch | null;
  divisionOptions: string[];
  videos: Video[];
  onLinkVideo: (videoId: string, matchId: string) => Promise<void>;
  onUnlinkVideo: (videoId: string) => Promise<void>;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [eventType, setEventType] = useState(initial?.event_type || '개인전');
  const [division, setDivision] = useState(initial?.division || '');
  const [side, setSide] = useState<BracketSide>(initial?.side || 'A');
  const [round, setRound] = useState(String(initial?.round || 1));
  const [matchNo, setMatchNo] = useState(String(initial?.match_no || 1));
  const [matchLabel, setMatchLabel] = useState(initial?.match_label || '');
  const [p1Name, setP1Name] = useState(initial?.player1_name || '');
  const [p1Club, setP1Club] = useState(initial?.player1_club || '');
  const [p1Ours, setP1Ours] = useState(initial?.player1_is_ours || false);
  const [p2Name, setP2Name] = useState(initial?.player2_name || '');
  const [p2Club, setP2Club] = useState(initial?.player2_club || '');
  const [p2Ours, setP2Ours] = useState(initial?.player2_is_ours || false);
  const [isBye, setIsBye] = useState(initial?.is_bye || false);
  const [winnerSlot, setWinnerSlot] = useState<WinnerSlot | ''>(initial?.winner_slot || '');
  const [thirdPlaceMatch, setThirdPlaceMatch] = useState(initial?.third_place_match || false);
  const [notes, setNotes] = useState(initial?.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedVideoId, setSelectedVideoId] = useState('');
  const [linking, setLinking] = useState<string | null>(null);

  const linkedVideos = initial ? videos.filter((v) => v.bracket_match_id === initial.id) : [];
  const unlinkedVideos = videos.filter((v) => !v.bracket_match_id);

  async function handleLink() {
    if (!initial || !selectedVideoId) return;
    setLinking(selectedVideoId);
    try {
      await onLinkVideo(selectedVideoId, initial.id);
      setSelectedVideoId('');
    } finally {
      setLinking(null);
    }
  }

  async function handleUnlink(videoId: string) {
    setLinking(videoId);
    try {
      await onUnlinkVideo(videoId);
    } finally {
      setLinking(null);
    }
  }

  async function handleSave() {
    if (!division.trim()) { setError('부문은 필수입니다'); return; }
    setSaving(true);
    setError('');
    try {
      const body = {
        division: division.trim(), event_type: eventType, side,
        round: Number(round), match_no: Number(matchNo), match_label: matchLabel || null,
        player1_name: p1Name || null, player1_club: p1Club || null, player1_is_ours: p1Ours,
        player2_name: isBye ? null : (p2Name || null), player2_club: isBye ? null : (p2Club || null), player2_is_ours: isBye ? false : p2Ours,
        winner_slot: isBye ? 'player1' : (winnerSlot || null),
        is_bye: isBye, third_place_match: thirdPlaceMatch, notes: notes || null,
      };
      const url = initial ? `/api/bracket/${initial.id}` : `/api/competitions/${competitionId}/bracket`;
      const method = initial ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
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
    <div className="p-3 rounded-lg border mb-3 space-y-2.5" style={{ borderColor: '#00462A', backgroundColor: '#F8FBF9' }}>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>종목</label>
          <div className="flex gap-1.5">
            {['개인전', '단체전'].map((t) => (
              <button key={t} type="button" onClick={() => setEventType(t)}
                className="text-xs px-2.5 py-1 rounded-full border transition-colors"
                style={eventType === t ? { backgroundColor: '#00462A', borderColor: '#00462A', color: '#fff' } : { borderColor: '#e0e0e0', color: '#374151' }}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>부문 *</label>
          <input type="text" list="division-options" value={division} onChange={(e) => setDivision(e.target.value)}
            placeholder="남자노년부" className="w-full h-8 px-2 text-xs rounded border focus:outline-none" style={{ borderColor: '#e0e0e0' }} />
          <datalist id="division-options">
            {divisionOptions.map((d) => <option key={d} value={d} />)}
          </datalist>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>조</label>
        <div className="flex gap-1.5">
          {SIDE_OPTIONS.map((o) => (
            <button key={o.value} type="button" onClick={() => setSide(o.value)}
              className="text-xs px-2.5 py-1 rounded-full border transition-colors"
              style={side === o.value ? { backgroundColor: '#00462A', borderColor: '#00462A', color: '#fff' } : { borderColor: '#e0e0e0', color: '#374151' }}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>라운드</label>
          <input type="number" min={1} value={round} onChange={(e) => setRound(e.target.value)}
            className="w-full h-8 px-2 text-xs rounded border focus:outline-none" style={{ borderColor: '#e0e0e0' }} />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>순번</label>
          <input type="number" min={1} value={matchNo} onChange={(e) => setMatchNo(e.target.value)}
            className="w-full h-8 px-2 text-xs rounded border focus:outline-none" style={{ borderColor: '#e0e0e0' }} />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>매치 코드</label>
          <input type="text" value={matchLabel} onChange={(e) => setMatchLabel(e.target.value)}
            placeholder="5-8" className="w-full h-8 px-2 text-xs rounded border focus:outline-none" style={{ borderColor: '#e0e0e0' }} />
        </div>
      </div>
      <p className="text-xs" style={{ color: '#B9B9B9' }}>
        라운드는 1부터 시작해 결승 쪽으로 갈수록 커집니다. 순번은 같은 조·라운드 안에서 왼쪽부터 1, 2, 3...
      </p>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs font-medium block" style={{ color: '#374151' }}>선수1</label>
          <input type="text" value={p1Name} onChange={(e) => setP1Name(e.target.value)} placeholder="이름"
            className="w-full h-8 px-2 text-xs rounded border focus:outline-none" style={{ borderColor: '#e0e0e0' }} />
          <input type="text" value={p1Club} onChange={(e) => setP1Club(e.target.value)} placeholder="소속"
            className="w-full h-8 px-2 text-xs rounded border focus:outline-none" style={{ borderColor: '#e0e0e0' }} />
          <label className="flex items-center gap-1.5 text-xs" style={{ color: '#374151' }}>
            <input type="checkbox" checked={p1Ours} onChange={(e) => setP1Ours(e.target.checked)} /> 우리 클럽
          </label>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium block" style={{ color: '#374151' }}>선수2</label>
          <input type="text" value={p2Name} onChange={(e) => setP2Name(e.target.value)} placeholder="이름" disabled={isBye}
            className="w-full h-8 px-2 text-xs rounded border focus:outline-none" style={{ borderColor: '#e0e0e0', opacity: isBye ? 0.5 : 1 }} />
          <input type="text" value={p2Club} onChange={(e) => setP2Club(e.target.value)} placeholder="소속" disabled={isBye}
            className="w-full h-8 px-2 text-xs rounded border focus:outline-none" style={{ borderColor: '#e0e0e0', opacity: isBye ? 0.5 : 1 }} />
          <label className="flex items-center gap-1.5 text-xs" style={{ color: '#374151', opacity: isBye ? 0.5 : 1 }}>
            <input type="checkbox" checked={p2Ours} onChange={(e) => setP2Ours(e.target.checked)} disabled={isBye} /> 우리 클럽
          </label>
        </div>
      </div>

      <label className="flex items-center gap-1.5 text-xs" style={{ color: '#374151' }}>
        <input type="checkbox" checked={isBye} onChange={(e) => { setIsBye(e.target.checked); if (e.target.checked) setWinnerSlot('player1'); }} />
        부전승 (선수2 없이 선수1 자동 진출)
      </label>

      <div>
        <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>승자</label>
        <div className="flex gap-3 text-xs" style={{ color: '#374151' }}>
          <label className="flex items-center gap-1">
            <input type="radio" name={`winner-${initial?.id || 'new'}`} checked={winnerSlot === 'player1'} onChange={() => setWinnerSlot('player1')} disabled={isBye} /> 선수1
          </label>
          <label className="flex items-center gap-1">
            <input type="radio" name={`winner-${initial?.id || 'new'}`} checked={winnerSlot === 'player2'} onChange={() => setWinnerSlot('player2')} disabled={isBye} /> 선수2
          </label>
          <label className="flex items-center gap-1">
            <input type="radio" name={`winner-${initial?.id || 'new'}`} checked={winnerSlot === ''} onChange={() => setWinnerSlot('')} disabled={isBye} /> 미정
          </label>
        </div>
      </div>

      <label className="flex items-center gap-1.5 text-xs" style={{ color: '#374151' }}>
        <input type="checkbox" checked={thirdPlaceMatch} onChange={(e) => setThirdPlaceMatch(e.target.checked)} />
        3위 결정전 (드문 경우 — 없으면 준결승 패자 2명이 공동 3위로 표시됨)
      </label>

      {initial && (
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>
            🎬 연결된 영상 <span style={{ color: '#B9B9B9', fontWeight: 400 }}>(대진표에서 클릭 시 바로 재생)</span>
          </label>
          {linkedVideos.length === 0 ? (
            <p className="text-xs mb-2" style={{ color: '#B9B9B9' }}>연결된 영상이 없습니다</p>
          ) : (
            <div className="space-y-1 mb-2">
              {linkedVideos.map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-2 px-2 py-1 rounded border text-xs" style={{ borderColor: '#e0e0e0' }}>
                  <span className="truncate" style={{ color: '#374151' }}>{v.title}</span>
                  <button
                    type="button"
                    disabled={linking === v.id}
                    onClick={() => void handleUnlink(v.id)}
                    className="flex-shrink-0"
                    style={{ color: '#DC2626', opacity: linking === v.id ? 0.5 : 1 }}
                  >
                    {linking === v.id ? '처리 중...' : '해제'}
                  </button>
                </div>
              ))}
            </div>
          )}
          {unlinkedVideos.length > 0 && (
            <div className="flex gap-1.5">
              <select
                value={selectedVideoId}
                onChange={(e) => setSelectedVideoId(e.target.value)}
                className="flex-1 h-8 px-2 text-xs rounded border focus:outline-none bg-white"
                style={{ borderColor: '#e0e0e0', minWidth: 0 }}
              >
                <option value="">영상 선택해서 연결...</option>
                {unlinkedVideos.map((v) => (
                  <option key={v.id} value={v.id}>{v.title}</option>
                ))}
              </select>
              <button
                type="button"
                disabled={!selectedVideoId || linking === selectedVideoId}
                onClick={() => void handleLink()}
                className="h-8 px-3 text-xs rounded border flex-shrink-0"
                style={{ borderColor: '#00462A', color: '#00462A', opacity: !selectedVideoId ? 0.5 : 1 }}
              >
                {linking === selectedVideoId && linking ? '연결 중...' : '연결'}
              </button>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>메모</label>
        <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
          className="w-full h-8 px-2 text-xs rounded border focus:outline-none" style={{ borderColor: '#e0e0e0' }} />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving}
          className="h-8 px-4 text-xs font-semibold rounded text-white"
          style={{ backgroundColor: '#00462A', opacity: saving ? 0.7 : 1 }}>
          {saving ? '저장 중...' : initial ? '수정 완료' : '등록'}
        </button>
        <button onClick={onCancel} className="h-8 px-3 text-xs rounded border" style={{ borderColor: '#e0e0e0', color: '#374151' }}>
          취소
        </button>
      </div>
    </div>
  );
}
