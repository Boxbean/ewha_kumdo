'use client';

import { useEffect, useRef, useState } from 'react';
import { CompetitionFile } from '@/lib/types';
import { adminFetch } from '@/lib/adminClient';
import { THUMBNAIL_CARD_FILE_TYPE, THUMBNAIL_FILE_TYPE } from '@/lib/utils';
import ImageCropModal, { SquareCrop } from './ImageCropModal';

interface Props {
  competitionId: string;
  files: CompetitionFile[];
  editMode: boolean;
  onFilesChange: (files: CompetitionFile[]) => void;
}

const CARD_OUTPUT_SIZE = 600;

function storagePathOf(fileUrl: string) {
  return fileUrl.includes('competition-files/') ? fileUrl.split('competition-files/')[1] : undefined;
}

// 선택한 정사각형 영역을 잘라 JPEG로 — 대회 탭 카드용 이미지
function cropToBlob(img: HTMLImageElement, crop: SquareCrop): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const out = Math.min(CARD_OUTPUT_SIZE, crop.size);
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('이미지를 처리할 수 없습니다.'));
  ctx.drawImage(img, crop.x, crop.y, crop.size, crop.size, 0, 0, out, out);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('이미지를 처리할 수 없습니다.'))), 'image/jpeg', 0.9)
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지를 불러올 수 없습니다.'));
    img.src = src;
  });
}

// 대회 썸네일: 원본(file_type='썸네일') + 대회 탭 카드용 정사각형 잘라낸 이미지(file_type='썸네일_카드')
// 별도 테이블 없이 competition_files에 각각 1장씩 저장
export default function CompetitionThumbnail({ competitionId, files, editMode, onFilesChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  // 영역 선택 중인 이미지 — 새로 고른 파일(file 있음) 또는 이미 등록된 원본의 카드 영역 변경(file 없음)
  const [cropping, setCropping] = useState<{ src: string; file?: File } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const thumbnail = files.find((f) => f.file_type === THUMBNAIL_FILE_TYPE);
  const card = files.find((f) => f.file_type === THUMBNAIL_CARD_FILE_TYPE);

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

  async function uploadFile(body: Blob, path: string, fileName: string, fileType: string): Promise<CompetitionFile> {
    // 업로드는 관리자만 쓰므로 Supabase 라이브러리(약 200KB)를 이때 불러옴 — 대회 상세를 보는 부원에게는 내려보내지 않음
    const { supabase } = await import('@/lib/supabase');
    const { error: storageError } = await supabase.storage
      .from('competition-files')
      .upload(path, body, { upsert: true, contentType: body.type || undefined });
    if (storageError) throw storageError;
    const { data: urlData } = supabase.storage.from('competition-files').getPublicUrl(path);
    const res = await adminFetch(`/api/competitions/${competitionId}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_url: urlData.publicUrl, file_name: fileName, file_type: fileType }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || '저장 실패');
    return json.data;
  }

  // 정사각형 이미지는 영역 선택 없이 전체를 쓰고, 아니면 카드에 보일 부분을 고르게 함
  async function chooseFile(file: File) {
    const src = URL.createObjectURL(file);
    try {
      const img = await loadImage(src);
      if (img.naturalWidth === img.naturalHeight) {
        await save({ x: 0, y: 0, size: img.naturalWidth }, img, file);
        URL.revokeObjectURL(src);
      } else {
        setCropping({ src, file });
      }
    } catch (e) {
      URL.revokeObjectURL(src);
      alert('업로드 실패: ' + (e instanceof Error ? e.message : String(e)));
    }
  }

  // 새 파일이면 원본 + 카드 이미지를 올리고, 기존 원본의 영역 변경이면 카드 이미지만 교체
  async function save(crop: SquareCrop, img: HTMLImageElement, file?: File) {
    setUploading(true);
    try {
      const stamp = Date.now();
      const replaced: CompetitionFile[] = [];
      const added: CompetitionFile[] = [];

      if (file) {
        const ext = file.name.split('.').pop() || 'jpg';
        added.push(await uploadFile(file, `${competitionId}/thumbnail_${stamp}.${ext}`, file.name, THUMBNAIL_FILE_TYPE));
        if (thumbnail) replaced.push(thumbnail);
      }
      const cardBlob = await cropToBlob(img, crop);
      const baseName = file?.name || thumbnail?.file_name || 'thumbnail';
      added.push(await uploadFile(cardBlob, `${competitionId}/thumbnail_card_${stamp}.jpg`, `${baseName} (카드)`, THUMBNAIL_CARD_FILE_TYPE));
      if (card) replaced.push(card);

      // 새 이미지가 저장된 뒤에 기존 것을 지워서, 중간에 실패해도 썸네일이 사라지지 않도록 함
      await Promise.all(replaced.map((f) => deleteFile(f).catch(() => {})));
      onFilesChange([...files.filter((f) => !replaced.some((r) => r.id === f.id)), ...added]);
    } catch (e) {
      alert('업로드 실패: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setUploading(false);
    }
  }

  function closeCropper() {
    if (cropping?.file) URL.revokeObjectURL(cropping.src);
    setCropping(null);
  }

  async function remove() {
    if (!thumbnail || !confirm('썸네일 이미지를 삭제하시겠습니까?')) return;
    try {
      await deleteFile(thumbnail);
      if (card) await deleteFile(card).catch(() => {});
      onFilesChange(files.filter((f) => f.id !== thumbnail.id && f.id !== card?.id));
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
        <div className="flex items-center gap-2">
          {/* 수정 모드에서는 대회 탭 카드에 실제로 보일 모습을 작게 미리 보여줌 */}
          {editMode && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card?.file_url || thumbnail.file_url}
              alt="카드 미리보기"
              title="대회 탭 카드에 보이는 모습"
              className="flex-shrink-0 w-10 h-10 rounded object-cover"
              style={{ backgroundColor: '#f3f4f6' }}
            />
          )}
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="min-w-0 max-w-full truncate text-left hover:underline"
            style={{ color: '#2d5a8e' }}
          >
            🖼️ {thumbnail.file_name || '썸네일 이미지'}
          </button>
        </div>
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
        <div className={`flex flex-wrap gap-2 ${thumbnail ? 'mt-2' : ''}`}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void chooseFile(file);
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
              // 같은 주소가 CORS 없이 이미 캐시돼 있으면 캔버스에서 읽을 수 없으므로 쿼리를 붙여 새로 받음
              onClick={() => setCropping({ src: `${thumbnail.file_url}?crop=${Date.now()}` })}
              disabled={uploading}
              className="h-8 px-4 text-xs rounded border font-medium"
              style={{ borderColor: '#00462A', color: '#00462A' }}
            >
              카드 노출 영역 변경
            </button>
          )}
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

      {cropping && (
        <ImageCropModal
          src={cropping.src}
          title="대회 탭 카드에 보일 부분 선택"
          onCancel={closeCropper}
          onConfirm={(crop, img) => {
            const file = cropping.file;
            void save(crop, img, file).finally(closeCropper);
          }}
        />
      )}
    </div>
  );
}
