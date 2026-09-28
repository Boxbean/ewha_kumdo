'use client';

import { useEffect, useRef, useState } from 'react';

export interface SquareCrop {
  x: number;    // 원본 이미지 픽셀 기준
  y: number;
  size: number;
}

interface Props {
  src: string;
  title?: string;
  onConfirm: (crop: SquareCrop, image: HTMLImageElement) => void;
  onCancel: () => void;
}

const MAX_VIEW_HEIGHT_RATIO = 0.55;
const MIN_SIZE_RATIO = 0.3;

// 정사각형 영역 선택 — 선택 상자를 끌어 옮기고, 슬라이더로 크기 조절 (터치/마우스 공통 Pointer Events)
export default function ImageCropModal({ src, title = '카드에 보일 부분 선택', onConfirm, onCancel }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<{ w: number; h: number; scale: number } | null>(null);
  const [size, setSize] = useState(0);        // 화면 표시 픽셀 기준
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  // 이미지 로드 후 화면 폭·높이에 맞춰 표시 크기를 정하고, 가장 큰 정사각형을 가운데에 둠
  function handleLoad() {
    const img = imgRef.current;
    const box = boxRef.current;
    if (!img || !box) return;
    const maxW = box.clientWidth;
    const maxH = window.innerHeight * MAX_VIEW_HEIGHT_RATIO;
    const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const s = Math.min(w, h);
    setView({ w, h, scale });
    setSize(s);
    setPos({ x: (w - s) / 2, y: (h - s) / 2 });
  }

  // 모달이 떠 있는 동안 뒤 페이지 스크롤 방지 (상자를 끄는 동작과 겹치지 않게)
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const clamp = (x: number, y: number, s: number) => {
    if (!view) return { x, y };
    return { x: Math.min(Math.max(0, x), view.w - s), y: Math.min(Math.max(0, y), view.h - s) };
  };

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    setPos(clamp(d.origX + e.clientX - d.startX, d.origY + e.clientY - d.startY, size));
  }
  function onPointerUp() {
    dragRef.current = null;
  }

  // 크기를 바꿀 때는 상자 중심을 유지
  function changeSize(next: number) {
    const cx = pos.x + size / 2;
    const cy = pos.y + size / 2;
    setSize(next);
    setPos(clamp(cx - next / 2, cy - next / 2, next));
  }

  function confirm() {
    if (!view || !imgRef.current) return;
    onConfirm(
      { x: Math.round(pos.x / view.scale), y: Math.round(pos.y / view.scale), size: Math.round(size / view.scale) },
      imgRef.current
    );
  }

  const maxSize = view ? Math.min(view.w, view.h) : 0;
  const minSize = maxSize * MIN_SIZE_RATIO;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white rounded-xl p-4 w-full max-w-md shadow-xl">
        <h3 className="text-base font-bold mb-1" style={{ color: '#374151' }}>{title}</h3>
        <p className="text-xs mb-3" style={{ color: '#6B7280' }}>
          밝은 네모를 끌어서 위치를, 아래 막대로 크기를 조절하세요.
        </p>

        <div ref={boxRef} className="w-full flex justify-center">
          <div
            className="relative overflow-hidden rounded select-none"
            style={{ width: view?.w, height: view?.h, backgroundColor: '#111', touchAction: 'none' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={src}
              alt=""
              crossOrigin="anonymous"
              onLoad={handleLoad}
              draggable={false}
              className="block"
              style={view ? { width: view.w, height: view.h } : { maxWidth: '100%', visibility: 'hidden' }}
            />
            {/* 선택 영역 바깥을 어둡게 — 위/아래/왼쪽/오른쪽 네 조각 */}
            {view && (
              <>
                <div className="absolute inset-x-0 top-0 z-10 pointer-events-none" style={{ height: pos.y, backgroundColor: 'rgba(0,0,0,0.55)' }} />
                <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none" style={{ top: pos.y + size, backgroundColor: 'rgba(0,0,0,0.55)' }} />
                <div className="absolute left-0 z-10 pointer-events-none" style={{ top: pos.y, height: size, width: pos.x, backgroundColor: 'rgba(0,0,0,0.55)' }} />
                <div className="absolute right-0 z-10 pointer-events-none" style={{ top: pos.y, height: size, left: pos.x + size, backgroundColor: 'rgba(0,0,0,0.55)' }} />
              </>
            )}
            {view && (
              <div
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                className="absolute z-20 cursor-move"
                style={{
                  left: pos.x,
                  top: pos.y,
                  width: size,
                  height: size,
                  border: '2px solid #fff',
                }}
              />
            )}
          </div>
        </div>

        {view && (
          // 표시 크기가 소수 픽셀이라 슬라이더는 0~100% 단위로 받아 변환 (소수 min/max는 브라우저마다 단계가 어긋남)
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(((size - minSize) / (maxSize - minSize || 1)) * 100)}
            onChange={(e) => changeSize(minSize + ((maxSize - minSize) * Number(e.target.value)) / 100)}
            className="w-full mt-4"
            style={{ accentColor: '#00462A' }}
            aria-label="선택 영역 크기"
          />
        )}

        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={confirm}
            disabled={!view}
            className="flex-1 h-10 text-sm font-semibold rounded-lg text-white"
            style={{ backgroundColor: '#00462A', opacity: view ? 1 : 0.6 }}
          >
            이 부분으로 적용
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="h-10 px-4 text-sm rounded-lg border"
            style={{ borderColor: '#e0e0e0', color: '#374151' }}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
