'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Competition, Video } from '@/lib/types';
import { getSeriesByName } from '@/lib/competitionSeries';
import CompetitionDetailFields from './CompetitionDetailFields';
import CompetitionTabs from './CompetitionTabs';
import EditableField from './EditableField';

interface Props {
  initialComp: Competition;
  videos: Video[];
}

export default function CompetitionDetailView({ initialComp, videos }: Props) {
  const [comp, setComp] = useState(initialComp);
  const [editMode, setEditMode] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  function openEdit() {
    if (sessionStorage.getItem('admin_auth') === '1') {
      setEditMode(true);
    } else {
      setAuthOpen(true);
    }
  }

  function closeAuth() {
    setAuthOpen(false);
    setPassword('');
    setAuthError('');
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error('비밀번호가 올바르지 않습니다.');
      sessionStorage.setItem('admin_auth', '1');
      sessionStorage.setItem('admin_pwd', password);
      setEditMode(true);
      closeAuth();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : '오류 발생');
    } finally {
      setAuthLoading(false);
    }
  }

  async function updateComp(patch: Record<string, unknown>) {
    const res = await fetch(`/api/competitions/${comp.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const json = await res.json();
    if (!res.ok) {
      alert('저장 실패: ' + (json.error || '알 수 없는 오류'));
      throw new Error(json.error);
    }
    setComp((prev) => ({ ...prev, ...patch }) as Competition);
  }

  async function updateVenue(patch: Record<string, unknown>) {
    if (!comp.venue_id) return;
    const res = await fetch(`/api/venues/${comp.venue_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const json = await res.json();
    if (!res.ok) {
      alert('저장 실패: ' + (json.error || '알 수 없는 오류'));
      throw new Error(json.error);
    }
    setComp((prev) => (prev.venue ? { ...prev, venue: { ...prev.venue, ...patch } } : prev));
  }

  const series = getSeriesByName(comp.name);

  return (
    <>
      {/* 관리자 인증 모달 */}
      {authOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={closeAuth}
        >
          <div
            className="bg-white rounded-lg p-6 w-80 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold mb-1" style={{ color: '#374151' }}>
              관리자 인증
            </h3>
            <p className="text-xs mb-4" style={{ color: '#B9B9B9' }}>
              대회 정보를 수정하려면 관리자 비밀번호가 필요합니다.
            </p>
            <form onSubmit={handleAuth} className="space-y-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력"
                autoFocus
                className="w-full h-9 px-3 text-sm rounded border focus:outline-none"
                style={{ borderColor: '#e0e0e0' }}
              />
              {authError && <p className="text-xs text-red-500">{authError}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={authLoading}
                  className="flex-1 h-9 text-sm font-semibold rounded text-white"
                  style={{ backgroundColor: '#00462A', opacity: authLoading ? 0.7 : 1 }}
                >
                  {authLoading ? '확인 중...' : '확인'}
                </button>
                <button
                  type="button"
                  onClick={closeAuth}
                  className="h-9 px-4 text-sm rounded border"
                  style={{ borderColor: '#e0e0e0', color: '#374151' }}
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 상단 헤더 */}
      <div className="mb-6">
        <Link
          href={series ? `/competition/series/${series.key}` : '/competition'}
          className="inline-flex items-center gap-1 text-sm mb-4"
          style={{ color: '#B9B9B9' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {series ? `${series.label} 이력` : '대회 목록'}
        </Link>

        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: '#00462A' }}>
              <EditableField
                value={comp.name}
                editable={editMode}
                onSave={(v) => updateComp({ name: v })}
              />
            </span>
            <span className="text-sm font-semibold" style={{ color: '#374151' }}>
              {editMode ? (
                <span className="inline-block w-16">
                  <EditableField
                    value={String(comp.year)}
                    type="number"
                    editable
                    onSave={(v) => updateComp({ year: Number(v) })}
                  />
                </span>
              ) : (
                `${comp.year}년`
              )}
            </span>
          </div>

          <button
            onClick={() => (editMode ? setEditMode(false) : openEdit())}
            className="flex-shrink-0 text-xs px-3 py-1.5 rounded border transition-colors hover:bg-gray-50"
            style={{ borderColor: '#00462A', color: '#00462A' }}
          >
            {editMode ? '편집 완료' : '수정'}
          </button>
        </div>

        {/* 결과 요약 배너 */}
        {(comp.result_summary || editMode) && (
          <div
            className="mt-3 px-4 py-2.5 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: 'rgba(0,70,42,0.08)', color: '#00462A' }}
          >
            🏆{' '}
            <EditableField
              value={comp.result_summary || ''}
              editable={editMode}
              placeholder="예: 여자부 3위 / 남자부 예선 탈락"
              emptyText="결과 요약 없음"
              onSave={(v) => updateComp({ result_summary: v || null })}
            />
          </div>
        )}
      </div>

      {/* 대회 정보 6요소 (항상 노출, 없으면 '등록된 정보 없음') */}
      <div className="mb-6">
        <CompetitionDetailFields comp={comp} editMode={editMode} onUpdateComp={updateComp} onUpdateVenue={updateVenue} />
      </div>

      {/* 탭 컴포넌트 */}
      <CompetitionTabs comp={comp} videos={videos} />
    </>
  );
}
