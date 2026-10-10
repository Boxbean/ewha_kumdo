'use client';

import { useEffect, useState } from 'react';
import { SPLASH_DONE_ATTR, SPLASH_DONE_EVENT, SPLASH_SESSION_KEY } from '@/lib/splash';

// 로고 크기와 바깥 원 반지름을 독립적으로 조절 — 원은 로고 꽃잎 끝단 기준 약 10px 간격을 두고 감쌈
const SIZE = 220;
const LOGO_SIZE = 200;
const RING_RADIUS = 78;
const CENTER = SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// 타임라인: 0~0.6s 원 그리기 → 0.45~0.95s 로고 페이드인(겹침) → ~1.3s까지 유지
// → 0.35s 동안 스플래시는 왼쪽으로, 홈 화면은 오른쪽에서 같은 속도로 밀려들어와 자리를 교체(푸시 전환)
const HOLD_MS = 1300;
const EXIT_MS = 350;

interface SplashScreenProps {
  children: React.ReactNode;
}

export default function SplashScreen({ children }: SplashScreenProps) {
  const [phase, setPhase] = useState<'show' | 'exiting' | 'done'>('show');

  useEffect(() => {
    // 이번 앱 세션에서 이미 봤으면 즉시 생략 (lib/splash.ts의 헤드 스크립트가 CSS로 먼저 숨겨둔 상태)
    if (document.documentElement.hasAttribute('data-splash-skip')) {
      setPhase('done');
      return;
    }
    try {
      sessionStorage.setItem(SPLASH_SESSION_KEY, '1');
    } catch {}

    // 애니메이션(CSS)은 HTML이 처음 그려질 때 이미 시작되므로, 유지 시간도 하이드레이션 시점이 아니라 첫 화면 표시 시점 기준으로 계산 —
    // 느린 기기에서 JS 로딩 시간 위에 1.3초가 통째로 더해지던 것을 방지
    const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0;
    const hold = Math.max(0, fcp + HOLD_MS - performance.now());
    const t1 = setTimeout(() => setPhase('exiting'), hold);
    const t2 = setTimeout(() => setPhase('done'), hold + EXIT_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // 전환이 끝나기 전까지 바디 스크롤을 잠가서 실제 콘텐츠가 화면 밖(오른쪽)에 대기하는 동안 끌려나오지 않게 함
  useEffect(() => {
    document.body.style.overflow = phase === 'done' ? '' : 'hidden';
    // 튜토리얼처럼 화면 전체를 덮는 안내는 스플래시가 끝난 뒤에 시작해야 함 (components/TutorialTour.tsx)
    if (phase === 'done') {
      document.documentElement.setAttribute(SPLASH_DONE_ATTR, '');
      window.dispatchEvent(new Event(SPLASH_DONE_EVENT));
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [phase]);

  return (
    <>
      {/* 홈 화면 콘텐츠 — 전환 중에는 화면에 고정(fixed)된 뷰포트 크기 상자로 두어 fixed 헤더/하단바가 실제 화면 기준으로 붙어있게 함.
          예전처럼 일반 상자(height: 100vh)를 오른쪽으로 밀어두면 문서 폭이 화면의 2배가 되어, 확대 제한(user-scalable=no)을
          무시하는 삼성 인터넷(갤럭시 홈 화면 앱)이 페이지 전체를 절반 크기로 축소해 보여줌 — fixed 상자는 문서 폭에 포함되지 않음 */}
      <div
        className="splash-content"
        style={
          phase === 'done'
            ? undefined
            : {
                position: 'fixed',
                inset: 0,
                overflow: 'hidden',
                transform: phase === 'show' ? 'translateX(100%)' : 'translateX(0)',
                transition: phase === 'exiting' ? `transform ${EXIT_MS}ms ease-out` : 'none',
              }
        }
      >
        {children}
      </div>

      {phase !== 'done' && (
        <div
          className="splash-overlay fixed inset-0 z-[9999] flex items-center justify-center"
          style={{
            backgroundColor: '#FFFDF1',
            transform: phase === 'exiting' ? 'translateX(-100%)' : 'translateX(0)',
            transition: phase === 'exiting' ? `transform ${EXIT_MS}ms ease-in` : 'none',
          }}
        >
          <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
            {/* 로고의 가장 바깥쪽 원이 그려지는 연출 (stroke-dashoffset 애니메이션) */}
            <svg
              width={SIZE}
              height={SIZE}
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}
            >
              <circle
                cx={CENTER}
                cy={CENTER}
                r={RING_RADIUS}
                fill="none"
                stroke="#00462A"
                strokeOpacity={0.8}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE}
                style={{ animation: 'splash-draw-circle 0.6s ease-out forwards' }}
              />
            </svg>

            {/* 로고 — PNG를 마스크로 사용해 #00462A로 채색, 원이 그려지는 도중부터 겹쳐서 페이드인 */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: LOGO_SIZE,
                height: LOGO_SIZE,
                transform: 'translate(-50%, -50%)',
                opacity: 0,
                backgroundColor: '#00462A',
                WebkitMaskImage: 'url(/logo.png)',
                maskImage: 'url(/logo.png)',
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
                animation: 'splash-logo-in 0.5s ease-out 0.45s forwards',
              }}
            />
          </div>

          <style>{`
            @keyframes splash-draw-circle {
              to { stroke-dashoffset: 0; }
            }
            @keyframes splash-logo-in {
              to { opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
