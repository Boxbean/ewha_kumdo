'use client';

import { useEffect, useRef, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import AdminLogin from '@/components/AdminLogin';
import VideoForm from '@/components/VideoForm';
import CsvUpload from '@/components/CsvUpload';
import AdminVideoList from '@/components/AdminVideoList';
import { supabase } from '@/lib/supabase';
import { Video } from '@/lib/types';

type Tab = 'register' | 'csv' | 'list';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tab, setTab] = useState<Tab>('register');
  const [refreshKey, setRefreshKey] = useState(0);
  const [successMsg, setSuccessMsg] = useState('');
  const [editVideo, setEditVideo] = useState<Video | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem('admin_auth') === '1') {
      setIsAuthenticated(true);
      const editId = sessionStorage.getItem('admin_edit_id');
      if (editId) {
        sessionStorage.removeItem('admin_edit_id');
        supabase.from('videos').select('*').eq('id', editId).single()
          .then(({ data }) => {
            if (data) { setEditVideo(data as Video); setTab('register'); }
          });
      }
    }
  }, []);

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSuccessMsg(''), 3000);
  }

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <AdminLogin onSuccess={() => setIsAuthenticated(true)} />
      </AppLayout>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'register', label: '단건 등록' },
    { key: 'csv', label: 'CSV 대량 업로드' },
    { key: 'list', label: '영상 목록' },
  ];

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold" style={{ color: '#00462A' }}>
            관리자 대시보드
          </h1>
          <button
            onClick={() => {
              sessionStorage.removeItem('admin_auth');
              sessionStorage.removeItem('admin_pwd');
              setIsAuthenticated(false);
            }}
            className="text-sm"
            style={{ color: '#B9B9B9' }}
          >
            로그아웃
          </button>
        </div>

        {/* 성공 메시지 */}
        {successMsg && (
          <div
            className="flex items-center justify-between px-4 py-2 rounded-lg mb-4 text-sm font-medium"
            style={{ backgroundColor: 'rgba(0,70,42,0.1)', color: '#00462A' }}
          >
            <span>✓ {successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="ml-2 hover:opacity-60">✕</button>
          </div>
        )}

        {/* 탭 */}
        <div className="flex gap-1 mb-6 border-b" style={{ borderColor: '#e0e0e0' }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="h-9 px-4 text-sm font-medium border-b-2 -mb-[1px] transition-colors"
              style={{
                borderBottomColor: tab === t.key ? '#00462A' : 'transparent',
                color: tab === t.key ? '#00462A' : '#B9B9B9',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'register' && (
          <div
            className="p-5 rounded-lg"
            style={{ backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }}
          >
            <h2 className="text-base font-bold mb-4" style={{ color: '#374151' }}>
              영상 {editVideo ? '수정' : '등록'}
            </h2>
            <VideoForm
              initial={editVideo || undefined}
              onSuccess={() => {
                setRefreshKey((k) => k + 1);
                setEditVideo(null);
                showSuccess(editVideo ? '영상이 수정되었습니다.' : '영상이 등록되었습니다.');
              }}
              onCancel={editVideo ? () => setEditVideo(null) : undefined}
            />
          </div>
        )}

        {tab === 'csv' && (
          <div
            className="p-5 rounded-lg"
            style={{ backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }}
          >
            <h2 className="text-base font-bold mb-4" style={{ color: '#374151' }}>
              CSV 대량 업로드
            </h2>
            <CsvUpload onSuccess={() => {
              setRefreshKey((k) => k + 1);
              showSuccess('CSV 업로드가 완료되었습니다.');
            }} />
          </div>
        )}

        {tab === 'list' && (
          <div>
            <h2 className="text-base font-bold mb-4" style={{ color: '#374151' }}>
              등록된 영상
            </h2>
            <AdminVideoList key={refreshKey} />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
