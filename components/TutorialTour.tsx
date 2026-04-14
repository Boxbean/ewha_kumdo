'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface TourStep {
  targetId: string;
  fallbackId?: string;
  title: string;
  body: string;
}

const STEPS: TourStep[] = [
  {
    targetId: 'tour-home',
    title: '👋 환영합니다! \n 홈페이지 사용법을 알려드릴게요.',
    body: '메인 화면에서는 최근 운동 영상을 볼 수 있어요. 날짜·앵글·참가자 정보를 한눈에 확인하세요.',
  },
  {
    targetId: 'tour-search',
    fallbackId: 'tour-search-mobile',
    title: '검색창',
    body: '이름, 날짜, 주제로 영상을 검색할 수 있습니다.',
  },
  {
    targetId: 'tour-filterbar',
    title: '해시태그',
    body: '앵글(전면·후면·기타)과 참가자 이름 태그를 눌러 원하는 영상만 필터링하세요.',
  },
  {
    targetId: 'tour-hamburger',
    title: '메뉴',
    body: '리스트·캘린더·주제별 등 다양한 방식으로 영상을 탐색할 수 있습니다.',
  },
  {
    targetId: 'tour-admin',
    title: '영상 등록',
    body: '영상을 자유롭게 등록·수정·삭제할 수 있습니다. 영상 등록을 원하시면 관리자에게 문의해주세요.\n\n📞박수빈 010-5318-3479',
  },
  {
    targetId: 'tour-help-btn',
    title: '튜토리얼 다시보기',
    body: '이 안내가 다시 필요하시면 상단의 [?] 버튼을 눌러주세요.\n언제든지 처음부터 다시 볼 수 있습니다.',
  },
];

const STORAGE_KEY = 'ewha_tutorial_done';
const TOOLTIP_W = 272;
const TOOLTIP_H_APPROX = 200;

export default function TutorialTour() {
  const pathname = usePathname();
  const [step, setStep] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  // 첫 방문 자동 실행 + sessionStorage 재시작 감지
  useEffect(() => {
    if (pathname !== '/') return;
    if (sessionStorage.getItem('pendingTutorial')) {
      sessionStorage.removeItem('pendingTutorial');
      const t = setTimeout(() => setStep(0), 100);
      return () => clearTimeout(t);
    }
    if (localStorage.getItem(STORAGE_KEY)) return;
    const t = setTimeout(() => setStep(0), 500);
    return () => clearTimeout(t);
  }, [pathname]);

  // 버튼으로 재시작
  useEffect(() => {
    function handleRestart() {
      setStep(0);
    }
    window.addEventListener('restart-tutorial', handleRestart);
    return () => window.removeEventListener('restart-tutorial', handleRestart);
  }, []);

  useEffect(() => {
    if (step === null) return;
    const current = STEPS[step];

    // Step 0: centered welcome card, no highlight
    if (current.targetId === 'tour-home') {
      setHighlightRect(null);
      setTooltipPos({
        top: 90,
        left: Math.max(12, (window.innerWidth - TOOLTIP_W) / 2),
      });
      return;
    }

    let el = document.getElementById(current.targetId);
    if (!el || el.getBoundingClientRect().width === 0) {
      if (current.fallbackId) el = document.getElementById(current.fallbackId);
    }
    // 엘리먼트 없거나 숨겨진 경우 다음 스텝으로 건너뜀
    if (!el || el.getBoundingClientRect().width === 0) {
      if (step < STEPS.length - 1) setStep(step + 1);
      else finish();
      return;
    }

    const rect = el.getBoundingClientRect();
    setHighlightRect(rect);
    setTooltipPos(calcPos(rect));
  }, [step]);

  function calcPos(rect: DOMRect) {
    const GAP = 10;
    const PAD = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const spaceBelow = vh - rect.bottom - GAP;
    const spaceAbove = rect.top - GAP;
    const preferBelow = spaceBelow >= spaceAbove;
    let top = preferBelow
      ? rect.bottom + GAP
      : rect.top - GAP - TOOLTIP_H_APPROX;
    // 뷰포트 범위 안으로 강제 클램프
    top = Math.max(PAD, Math.min(top, vh - TOOLTIP_H_APPROX - PAD));
    const left = Math.max(PAD, Math.min(rect.left, vw - TOOLTIP_W - PAD));
    return { top, left };
  }

  function next() {
    if (step === null) return;
    if (step < STEPS.length - 1) setStep(step + 1);
    else finish();
  }

  function finish() {
    localStorage.setItem(STORAGE_KEY, '1');
    setStep(null);
  }

  if (step === null) return null;

  const current = STEPS[step];

  return (
    <>
      {/* Dim overlay */}
      <div
        className="fixed inset-0 z-[9000]"
        style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
        onClick={finish}
      />

      {/* Highlight ring */}
      {highlightRect && (
        <div
          className="fixed z-[9001] pointer-events-none rounded-lg"
          style={{
            top: highlightRect.top - 4,
            left: highlightRect.left - 4,
            width: highlightRect.width + 8,
            height: highlightRect.height + 8,
            border: '2px solid #ffffff',
            boxShadow: '0 0 0 3px rgba(255,255,255,0.25)',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="fixed z-[9002] rounded-2xl shadow-2xl p-4"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          width: TOOLTIP_W,
          backgroundColor: '#FFFDF1',
          border: '1px solid #e0e0e0',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold" style={{ color: '#00462A' }}>
            {step + 1} / {STEPS.length}
          </span>
          <button onClick={finish} className="text-xs" style={{ color: '#B9B9B9' }}>
            건너뛰기
          </button>
        </div>
        <p className="font-bold text-sm mb-3" style={{ color: '#1a1a1a' }}>
          {current.title}
        </p>
        <p
          className="text-sm whitespace-pre-line mb-4"
          style={{ color: '#374151', lineHeight: '1.6' }}
        >
          {current.body}
        </p>
        <div className="flex justify-end">
          <button
            onClick={next}
            className="h-8 px-4 text-sm font-semibold rounded-lg"
            style={{ backgroundColor: '#00462A', color: '#fff' }}
          >
            {step < STEPS.length - 1 ? '다음 →' : '완료 ✓'}
          </button>
        </div>
      </div>
    </>
  );
}
