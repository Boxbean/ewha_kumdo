'use client';

import { useEffect, useRef, useState } from 'react';
import { CompetitionFile } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { adminFetch } from '@/lib/adminClient';
import { THUMBNAIL_FILE_TYPE } from '@/lib/utils';

interface Props {
  competitionId: string;
  files: CompetitionFile[];
  editMode: boolean;
  onFilesChange: (files: CompetitionFile[]) => void;
}

function storagePathOf(fileUrl: string) {
  return fileUrl.includes('competition-files/') ? fileUrl.split('competition-files/')[1] : undefined;
}

// 대회 썸네일은 별도 테이블 없이 competition_files에 file_type='썸네일'로 1장만 저장
export default function CompetitionThumbnail({ competitionId, files, editMode, onFilesChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const thumbnail = files.find((f) => f.file_type === THUMBNAIL_FILE_TYPE);

  // 팝업이 열려 있을 때 ESC로 닫기
  useEffect(() => {
    if (!previewOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPreviewOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previewOpen]);

  async function deleteFile(file: CompetitionFile) {
    const res = await adminFetch(`/api/competitions/${competitionId}/files`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_id: file.id, storage_path: storagePathOf(file.file_url) }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error || '삭제 실패');
    }
  }

  async function upload(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${competitionId}/thumbnail_${Date.now()}.${ext}`;
      const { error: storageError } = await supabase.storage
        .from('competition-files')
        .upload(path, file, { upsert: true });
      if (storageError) throw storageError;

      const { data: urlData } = supabase.storage.from('competition-files').getPublicUrl(path);
      const res = await adminFetch(`/api/competitions/${competitionId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_url: urlData.publicUrl, file_name: file.name, file_type: THUMBNAIL_FILE_TYPE }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '저장 실패');

      // 새 이미지가 저장된 뒤에 기존 썸네일을 지워서, 중간에 실패해도 썸네일이 사라지지 않도록 함
      if (thumbnail) await deleteFile(thumbnail).catch(() => {});
      onFilesChange([...files.filter((f) => f.id !== thumbnail?.id), json.data]);
    } catch (e) {
      alert('업로드 실패: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setUploading(false);
    }
  }

  async function remove() {
    if (!thumbnail || !confirm('썸네일 이미지를 삭제하시겠습니까?')) return;
    try {
      await deleteFile(thumbnail);
      onFilesChange(files.filter((f) => f.id !== thumbnail.id));
    } catch (e) {
      alert('삭제 실패: ' + (e instanceof Error ? e.message : String(e)));
    }
  }

  if (!thumbnail && !editMode) {
    return <span style={{ color: '#B9B9B9', fontStyle: 'italic' }}>등록된 정보 없음</span>;
  }

  return (
    <div>
      {thumbnail && (
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="max-w-full truncate text-left hover:underline"
          style={{ color: '#2d5a8e' }}
        >
          🖼️ {thumbnail.file_name || '썸네일 이미지'}
        </button>
      )}

      {/* 파일명을 누르면 이미지를 팝업으로 확인 */}
      {previewOpen && thumbnail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewOpen(false)}
        >
          <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnail.file_url}
              alt={thumbnail.file_name || '대회 썸네일'}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              aria-label="닫기"
              className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full text-white"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {editMode && (
        <div className={`flex gap-2 ${thumbnail ? 'mt-2' : ''}`}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
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
            {uploading ? '업로드 중...' : thumbnail ? '이미지 변경' : '이미지 선택'}
          </button>
          {thumbnail && (
            <button
              type="button"
              onClick={() => void remove()}
              disabled={uploading}
              className="h-8 px-4 text-xs rounded border font-medium"
              style={{ borderColor: '#DC2626', color: '#DC2626' }}
            >
              삭제
            </button>
          )}
        </div>
      )}
    </div>
  );
}
