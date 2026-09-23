'use client';

import { useEffect, useState } from 'react';

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
    const t1 = setTimeout(() => setPhase('exiting'), HOLD_MS);
    const t2 = setTimeout(() => setPhase('done'), HOLD_MS + EXIT_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // 전환이 끝나기 전까지 바디 스크롤을 잠가서 실제 콘텐츠가 화면 밖(오른쪽)에 대기하는 동안 끌려나오지 않게 함
  useEffect(() => {
    document.body.style.overflow = phase === 'done' ? '' : 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [phase]);

  return (
    <>
      {/* 홈 화면 콘텐츠 — 전환 중에는 뷰포트 크기로 고정해 fixed 헤더/하단바가 실제 화면 기준으로 붙어있게 함 */}
      <div
        style={
          phase === 'done'
            ? undefined
            : {
                height: '100vh',
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
          className="fixed inset-0 z-[9999] flex items-center justify-center"
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
