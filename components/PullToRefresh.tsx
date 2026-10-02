'use client';

import { useEffect, useRef, useState } from 'react';

// 이만큼(px) 끌어내린 뒤 손을 떼면 새로고침
const THRESHOLD = 70;
// 인디케이터가 내려오는 최대 거리
const MAX_PULL = 110;
// 손가락 이동량 대비 화면이 따라오는 비율 — 1보다 작아야 "당기는" 저항감이 생김
const RESISTANCE = 0.5;

interface Props {
  onRefresh: () => Promise<unknown>;
  // 쇼츠 뷰어·등록 폼처럼 위에 덮인 화면이 열려 있을 때는 끔
  disabled?: boolean;
}

// 페이지 맨 위에서 아래로 끌어내리면 새로고침 (홈 화면 앱(PWA)에는 브라우저 기본 당겨서 새로고침이 없어서 직접 구현)
// 문서(window) 스크롤 기준 — 맨 위가 아니거나 가로 스와이프(쇼츠 줄 등)면 반응하지 않음
export default function PullToRefresh({ onRefresh, disabled = false }: Props) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  // 손가락으로 끄는 동안에는 애니메이션 없이 바로 따라오고, 놓았을 때만 부드럽게 움직임
  const [dragging, setDragging] = useState(false);

  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;
  const refreshingRef = useRef(false);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  useEffect(() => {
    // 안드로이드 크롬 기본 당겨서 새로고침과 겹치지 않게 끔 (페이지 떠날 때 원래대로)
    const html = document.documentElement;
    const prevOverscroll = html.style.overscrollBehaviorY;
    html.style.overscrollBehaviorY = 'contain';

    let startX = 0;
    let startY = 0;
    let tracking = false; // 맨 위에서 시작한 터치인지
    let pulling = false;  // 세로로 끌어내리는 중으로 확정됐는지
    let distance = 0;

    function onTouchStart(e: TouchEvent) {
      // 본문(main) 밖(헤더·햄버거 메뉴·하단 탭바)에서 시작한 터치는 무시
      // 쇼츠 뷰어처럼 data-no-pull-refresh가 붙은 전체화면 오버레이 안의 터치도 무시
      const inMain = e.target instanceof Element && !!e.target.closest('main') && !e.target.closest('[data-no-pull-refresh]');
      if (disabledRef.current || !inMain || refreshingRef.current || e.touches.length !== 1 || window.scrollY > 0) {
        tracking = false;
        return;
      }
      tracking = true;
      pulling = false;
      distance = 0;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }

    function onTouchMove(e: TouchEvent) {
      if (!tracking) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (!pulling) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        // 위로 밀거나 가로 스와이프면 이번 터치는 무시
        if (dy <= 0 || Math.abs(dx) > Math.abs(dy) || window.scrollY > 0) {
          tracking = false;
          return;
        }
        pulling = true;
        setDragging(true);
      }
      // iOS 고무줄 바운스 대신 인디케이터가 내려오도록 기본 스크롤을 막음
      if (e.cancelable) e.preventDefault();
      distance = Math.min(MAX_PULL, Math.max(0, dy * RESISTANCE));
      setPull(distance);
    }

    async function onTouchEnd() {
      if (!tracking) return;
      tracking = false;
      if (!pulling) return;
      pulling = false;
      setDragging(false);
      if (distance < THRESHOLD) {
        setPull(0);
        return;
      }
      refreshingRef.current = true;
      setRefreshing(true);
      setPull(THRESHOLD);
      try {
        await onRefreshRef.current();
      } finally {
        refreshingRef.current = false;
        setRefreshing(false);
        setPull(0);
      }
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);
    return () => {
      html.style.overscrollBehaviorY = prevOverscroll;
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  const visible = pull > 0 || refreshing;
  const progress = Math.min(1, pull / THRESHOLD);

  return (
    // 헤더(52px) 바로 아래에서 내려옴
    <div
      className="fixed left-0 right-0 top-[52px] z-30 flex justify-center pointer-events-none"
      style={{
        transform: `translateY(${pull - 40}px)`,
        opacity: visible ? 1 : 0,
        transition: dragging ? 'none' : 'transform 0.2s, opacity 0.2s',
      }}
      aria-hidden={!visible}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shadow-md"
        style={{ backgroundColor: '#ffffff' }}
      >
        <svg
          width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00462A" strokeWidth="2.5" strokeLinecap="round"
          className={refreshing ? 'animate-spin' : undefined}
          style={refreshing ? undefined : { transform: `rotate(${progress * 270}deg)`, opacity: 0.4 + progress * 0.6 }}
        >
          <path d="M21 12a9 9 0 1 1-3-6.7" />
          <path d="M21 3v6h-6" />
        </svg>
      </div>
    </div>
  );
}
