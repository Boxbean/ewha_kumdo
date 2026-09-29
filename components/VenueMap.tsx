'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { VenuePoint } from '@/lib/kakaoGeocode';

// 카카오맵 JavaScript SDK 중 이 화면에서 쓰는 부분만 타입으로 선언
interface KakaoLatLng { getLat(): number; getLng(): number }
interface KakaoPoint { x: number; y: number }
interface KakaoMap {
  setCenter(latlng: KakaoLatLng): void;
  setLevel(level: number, opts?: { animate?: boolean }): void;
  getLevel(): number;
  getProjection(): { containerPointFromCoords(latlng: KakaoLatLng): KakaoPoint };
}
interface KakaoMaps {
  load(cb: () => void): void;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  Map: new (el: HTMLElement, opts: { center: KakaoLatLng; level: number }) => KakaoMap;
  Marker: new (opts: { map: KakaoMap; position: KakaoLatLng; title?: string; clickable?: boolean }) => unknown;
  CustomOverlay: new (opts: { map: KakaoMap; position: KakaoLatLng; content: HTMLElement; yAnchor: number; clickable?: boolean }) => unknown;
  event: { addListener(target: unknown, type: string, handler: () => void): void };
}

declare global {
  interface Window {
    kakao?: { maps: KakaoMaps };
  }
}

// 서울시청 기준. 확대 수준은 숫자가 클수록 넓게 보이고 한 단계마다 2배씩 달라짐 —
// 휴대폰 폭에서는 한 단계 넓게 봐야 서울 전역이 들어옴 (영역 맞춤 setBounds는 2배 단위로 반올림돼 경기도까지 너무 넓게 잡힘)
const SEOUL_CENTER = { lat: 37.5665, lng: 126.978 };
const seoulLevel = (width: number) => (width < 600 ? 10 : 9);

// 기본 마커 핀 크기(px) — 이름표가 다른 경기장의 핀을 가리지 않도록 충돌 계산에 포함
const PIN_W = 30;
const PIN_H = 42;

// 이름표를 마커 위(기본)에 둘지, 겹치면 아래에 둘지 — 마커 핀 높이 기준 픽셀 오프셋
const LABEL_ABOVE = -44;
const LABEL_BELOW = 26; // 이름표 높이(22) + 여백 — 핀 끝 바로 아래
const LABEL_H = 22;

let sdkPromise: Promise<KakaoMaps> | null = null;

// SDK 스크립트는 페이지당 한 번만 로드 (autoload=false → kakao.maps.load로 준비 완료 시점을 받음)
function loadKakaoMaps(appKey: string): Promise<KakaoMaps> {
  if (window.kakao?.maps?.Map) return Promise.resolve(window.kakao.maps);
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
    script.onload = () => window.kakao!.maps.load(() => resolve(window.kakao!.maps));
    script.onerror = () => {
      sdkPromise = null;
      reject(new Error('카카오맵을 불러오지 못했습니다'));
    };
    document.head.appendChild(script);
  });
  return sdkPromise;
}

interface Props {
  points: VenuePoint[];
}

// 대회 > 경기장 정보 상단 지도 — 서울 중심으로 시작하고, 확대·축소·이동은 자유롭게.
// 마커나 이름표를 누르면 해당 경기장 상세로 이동
export default function VenueMap({ points }: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<{ reset: () => void; zoom: (delta: number) => void } | null>(null);
  const [failed, setFailed] = useState(false);
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_JS_KEY;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !appKey) return;
    let cancelled = false;

    loadKakaoMaps(appKey)
      .then((maps) => {
        if (cancelled) return;
        el.innerHTML = '';
        const center = new maps.LatLng(SEOUL_CENTER.lat, SEOUL_CENTER.lng);
        const map = new maps.Map(el, { center, level: seoulLevel(el.clientWidth) });
        controlsRef.current = {
          reset: () => {
            map.setLevel(seoulLevel(el.clientWidth));
            map.setCenter(center);
          },
          zoom: (delta) => map.setLevel(map.getLevel() + delta, { animate: true }),
        };

        const labels = points.map((p) => {
          const position = new maps.LatLng(p.lat, p.lng);
          const marker = new maps.Marker({ map, position, title: p.name, clickable: true });
          maps.event.addListener(marker, 'click', () => router.push(`/venue/${p.id}`));

          // 이름은 사용자가 입력한 값이므로 innerHTML 대신 textContent로 넣음
          const label = document.createElement('button');
          label.type = 'button';
          label.textContent = p.name;
          label.style.cssText =
            `transform:translateY(${LABEL_ABOVE}px);height:${LABEL_H}px;padding:0 8px;border-radius:9999px;` +
            'background:#00462A;color:#fff;font-size:11px;font-weight:600;white-space:nowrap;' +
            'box-shadow:0 1px 3px rgba(0,0,0,0.25);font-family:inherit;cursor:pointer;border:0;';
          label.addEventListener('click', () => router.push(`/venue/${p.id}`));
          new maps.CustomOverlay({ map, position, content: label, yAnchor: 1, clickable: true });
          return { label, position };
        });

        // 가까운 경기장끼리(예: 잠실 학생체육관·올림픽공원) 이름표가 다른 이름표나 핀과 겹치면 아래쪽으로 옮기고, 그래도 겹치면 숨김 —
        // 마커는 그대로 누를 수 있고, 확대하면 간격이 벌어져 다시 보임. 지도를 움직이거나 확대할 때마다 다시 배치
        const layoutLabels = () => {
          const projection = map.getProjection();
          const pts = labels.map(({ position }) => projection.containerPointFromCoords(position));
          // 모든 핀 자리를 먼저 장애물로 등록
          const placed: { l: number; r: number; t: number; b: number }[] = pts.map((pt) => ({
            l: pt.x - PIN_W / 2, r: pt.x + PIN_W / 2, t: pt.y - PIN_H, b: pt.y,
          }));
          // 지도 위에 떠 있는 버튼 자리 — 왼쪽 위 "서울 중심으로", 오른쪽 아래 확대·축소
          const h = el.clientHeight;
          placed.push({ l: 0, r: 130, t: 0, b: 44 }, { l: el.clientWidth - 44, r: el.clientWidth, t: h - 80, b: h });
          const overlaps = (box: { l: number; r: number; t: number; b: number }) =>
            placed.some((o) => box.l < o.r && box.r > o.l && box.t < o.b && box.b > o.t);
          labels.forEach(({ label }, i) => {
            const pt = pts[i];
            const w = label.offsetWidth || label.textContent!.length * 11 + 16;
            let shown = false;
            for (const dy of [LABEL_ABOVE, LABEL_BELOW]) {
              const box = { l: pt.x - w / 2, r: pt.x + w / 2, t: pt.y + dy - LABEL_H, b: pt.y + dy };
              if (!overlaps(box)) {
                placed.push(box);
                label.style.transform = `translateY(${dy}px)`;
                label.style.visibility = 'visible';
                shown = true;
                break;
              }
            }
            if (!shown) label.style.visibility = 'hidden';
          });
        };
        maps.event.addListener(map, 'idle', layoutLabels);
        layoutLabels();
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      controlsRef.current = null;
    };
  }, [appKey, points, router]);

  // 키가 없거나(환경변수 미설정) SDK 로드 실패 시엔 지도 자리 없이 목록만 보여줌
  if (!appKey || failed) return null;

  return (
    <div data-tour="venue-map" className="relative mb-4 rounded-xl overflow-hidden border" style={{ borderColor: '#e0e0e0' }}>
      <div ref={containerRef} className="w-full h-[280px] md:h-[360px]" style={{ backgroundColor: '#f3f4f6' }} />
      <button
        type="button"
        onClick={() => controlsRef.current?.reset()}
        className="absolute left-2 top-2 z-10 h-8 px-3 text-xs font-semibold rounded-full shadow"
        style={{ backgroundColor: '#fff', color: '#00462A', border: '1px solid #e0e0e0' }}
      >
        서울 중심으로
      </button>
      {/* 카카오 기본 확대·축소 막대는 휴대폰 지도 높이의 대부분을 차지해 이름표를 가려서, 작은 +/− 버튼으로 대체 (휴대폰은 두 손가락으로도 확대 가능) */}
      <div className="absolute right-2 bottom-2 z-10 flex flex-col rounded-lg overflow-hidden shadow" style={{ border: '1px solid #e0e0e0' }}>
        {[
          { label: '확대', text: '+', delta: -1 },
          { label: '축소', text: '−', delta: 1 },
        ].map((b, i) => (
          <button
            key={b.label}
            type="button"
            aria-label={b.label}
            onClick={() => controlsRef.current?.zoom(b.delta)}
            className="w-8 h-8 flex items-center justify-center text-lg leading-none"
            style={{ backgroundColor: '#fff', color: '#374151', borderTop: i ? '1px solid #e0e0e0' : undefined }}
          >
            {b.text}
          </button>
        ))}
      </div>
    </div>
  );
}
