'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

// 전체 탭 튜토리얼 — 화면 구성 요소를 하나씩 짚어 설명하고, 탭의 설명이 끝나면
// 사용자가 다음 탭을 "직접 눌러" 이동하도록 유도하는 방식 (페이지를 넘나들며 이어짐)

type PageMatch = (path: string) => boolean;
const onPage = (p: string): PageMatch => (path) => path === p;
const FEEDBACK_POST: PageMatch = (path) => /^\/feedback\/(?!new$)[^/]+$/.test(path);
const FEEDBACK_ANY: PageMatch = (path) => path === '/feedback' || FEEDBACK_POST(path);

interface TourStep {
  section: string;
  page: PageMatch;
  // 가리킬 요소(CSS 선택자). 없으면 화면 가운데 안내 카드
  target?: string;
  // 대상이 숨겨져 있을 때 대신 가리킬 요소 (휴대폰 하단 탭바 ↔ 데스크톱 사이드바 등)
  fallback?: string;
  title: string;
  body: string;
  // 지정하면 "다음" 버튼 대신 사용자가 대상을 직접 눌러 이 화면으로 이동해야 다음 단계로 진행
  clickTo?: PageMatch;
  // 햄버거 메뉴 안에 있는 대상 — 메뉴를 열어둔 채로 가리킴
  openMenu?: boolean;
}

const tab = (key: string) => ({ target: `#tour-tab-${key}`, fallback: `#tour-tab-${key}-desktop` });

const STEPS: TourStep[] = [
  // ── 홈 ──
  {
    section: '홈',
    page: onPage('/'),
    title: '👋 환영합니다!',
    body: 'EWHA Kumdo 사용법을 탭별로 하나씩 알려드릴게요.\n중간중간 안내에 따라 화면을 직접 눌러보세요.',
  },
  {
    section: '홈',
    page: onPage('/'),
    target: '[data-tour="home-hero-player"]',
    title: '🎬 최근 운동',
    body: '가장 최근 운동 영상이에요. 누르면 이 자리에서 바로 재생돼요.\n영상 아래 ⋮ 버튼으로 피드백 요청과 공유도 할 수 있어요.',
  },
  {
    section: '홈',
    page: onPage('/'),
    target: '[data-tour="home-hero-buttons"]',
    title: '🎥 각도 · 구간 버튼',
    body: '[전면]·[후면] 버튼으로 같은 날 다른 각도에서 찍은 영상으로 바꿔 볼 수 있어요.\n[대련 21:35]처럼 시간이 적힌 버튼을 누르면 그 장면으로 바로 이동해요.',
  },
  {
    section: '홈',
    page: onPage('/'),
    target: '[data-tour="home-shorts"]',
    title: '⚡ 검도쇼츠',
    body: '짧은 검도 영상 모음이에요. 옆으로 넘기며 구경해보세요.\n공유하고 싶은 영상이 있다면 쇼츠 탭에서 올려주세요!',
  },
  {
    section: '홈',
    page: onPage('/'),
    target: '[data-tour="home-videos"]',
    title: '📅 운동 영상 목록',
    body: '지난 운동 영상을 날짜별로 모두 볼 수 있어요.\n카드를 누르면 영상 화면으로 이동해 바로 재생되고, 그 화면의 [이 영상 피드백 요청하기]로 바로 피드백을 요청할 수 있어요.',
  },
  {
    section: '홈',
    page: onPage('/'),
    target: '#tour-search',
    fallback: '#tour-search-mobile',
    title: '🔍 검색',
    body: '이름, 날짜, 주제로 영상을 찾을 수 있어요. 내가 나온 영상을 이름으로 검색해보세요!',
  },
  {
    section: '홈',
    page: onPage('/'),
    target: '[data-tour="push"]',
    title: '🔔 새 영상 알림',
    body: '알림을 켜두면 새 운동 영상이 올라올 때 알려드려요. 알림을 누르면 영상이 바로 재생돼요.\n\n아이폰은 Safari 공유 버튼 → "홈 화면에 추가"로 설치한 뒤 켤 수 있어요.',
  },
  {
    section: '홈',
    page: onPage('/'),
    ...tab('list'),
    title: '📋 목록 탭으로 가볼까요?',
    body: '아래 표시된 [목록] 탭을 눌러주세요.',
    clickTo: onPage('/list'),
  },

  // ── 목록 ──
  {
    section: '목록',
    page: onPage('/list'),
    target: '[data-tour="list-row"]',
    title: '📋 전체 목록',
    body: '등록된 모든 영상을 운동 날짜 최신순으로 볼 수 있어요.\n썸네일 오른쪽 아래에 영상 길이가, 제목 아래에 함께 운동한 사람들이 #태그로 보여요.',
  },
  {
    section: '목록',
    page: onPage('/list'),
    target: '[aria-label="더보기"]',
    title: '⋮ 더보기',
    body: '영상 정보 보기, 피드백 요청하기, YouTube에서 보기, 공유하기를 할 수 있어요.',
  },
  {
    section: '목록',
    page: onPage('/list'),
    ...tab('shorts'),
    title: '⚡ 쇼츠 탭으로 가볼까요?',
    body: '[쇼츠] 탭을 눌러주세요.',
    clickTo: onPage('/shorts'),
  },

  // ── 쇼츠 ──
  {
    section: '쇼츠',
    page: onPage('/shorts'),
    target: '.shorts-card',
    title: '⚡ 검도쇼츠',
    body: '부원들이 공유한 짧은 검도 영상 모음이에요.\n\n카드를 누르면 전체 화면으로 보고, 위아래로 넘기며 다음 영상을 볼 수 있어요. 영상 속 공유 버튼으로 카카오톡·인스타그램에 보내거나 링크를 복사하고, [원본 보기]로 원래 영상을 열 수 있어요.',
  },
  {
    section: '쇼츠',
    page: onPage('/shorts'),
    target: '[aria-label="쇼츠 등록하기"]',
    title: '➕ 쇼츠 올리기',
    body: '공유하고 싶은 영상이 있다면 여기서 올려주세요!\n인스타그램·유튜브 링크를 붙여넣으면 제목과 썸네일이 자동으로 채워져요. 로그인 없이 누구나 올릴 수 있어요.',
  },
  {
    section: '쇼츠',
    page: onPage('/shorts'),
    ...tab('feedback'),
    title: '💬 피드백 탭으로 가볼까요?',
    body: '[피드백] 탭을 눌러주세요.',
    clickTo: onPage('/feedback'),
  },

  // ── 피드백 ──
  {
    section: '피드백',
    page: onPage('/feedback'),
    title: '💬 피드백',
    body: '운동을 하며 "왜 손목 타이밍이 맞지 않을까?", "어떻게 하면 시합 때 상대방 머리를 빠르게 칠 수 있을까?" 여러 가지 궁금한 점이 있었나요?\n\n운동 영상을 올려 다양한 사람들에게 피드백을 받아보세요.',
  },
  {
    section: '피드백',
    page: onPage('/feedback'),
    target: '[aria-label="피드백 요청하기"]',
    title: '✍️ 피드백 요청하기',
    body: '사이트에 있는 운동 영상을 고르거나 유튜브 링크를 붙여넣고, 궁금한 점을 적어주세요.\n\n영상을 보며 00:10처럼 시간을 적으면 그 장면으로 바로 이동하는 링크가 돼요. 숫자 4자리 비밀번호는 나중에 글을 고치거나 지울 때 필요해요.',
  },
  {
    section: '피드백',
    page: onPage('/feedback'),
    target: 'main a[href^="/feedback/"]:not([href="/feedback/new"])',
    title: '📖 게시글을 열어볼까요?',
    body: '표시된 게시글을 눌러주세요.',
    clickTo: FEEDBACK_POST,
  },
  {
    section: '피드백',
    page: FEEDBACK_POST,
    target: '[data-tour="feedback-post"]',
    title: '📖 요청 글',
    body: '위 영상과 함께 글쓴이의 질문을 읽어보세요.\n본문에 적힌 파란색 시간(예: 00:40)을 누르면 영상이 그 장면으로 이동해요.',
  },
  {
    section: '피드백',
    page: FEEDBACK_POST,
    target: '[data-tour="feedback-comment-form"]',
    title: '💬 댓글 남기기',
    body: '영상을 보고 느낀 점이나 조언을 댓글로 남겨주세요.\n이름을 적어도 되고, 비워두면 익명으로 남아요. 댓글에도 00:10처럼 시간을 적으면 영상 이동 링크가 돼요.',
  },
  {
    section: '피드백',
    page: FEEDBACK_POST,
    target: '[data-tour="feedback-comments"]',
    title: '👍 좋아요 · 답글',
    body: '댓글에 공감한다면 👍 좋아요를, 덧붙이고 싶은 말이 있다면 답글을 달아주세요!\n\n글쓴이가 "이 글의 글쓴이신가요?"로 인증하고 남긴 댓글은 왼쪽 말풍선으로 구분돼요.',
  },
  {
    section: '피드백',
    page: FEEDBACK_ANY,
    ...tab('competition'),
    title: '🏆 대회 탭으로 가볼까요?',
    body: '[대회] 탭을 눌러주세요.',
    clickTo: onPage('/competition'),
  },

  // ── 대회 ──
  {
    section: '대회',
    page: onPage('/competition'),
    target: '[data-tour="competition-subtabs"]',
    title: '🏆 대회 기록',
    body: '[대회 정보]에서 지금까지 출전한 대회를, [경기장 정보]에서 경기장 위치와 시설을 볼 수 있어요.',
  },
  {
    section: '대회',
    page: onPage('/competition'),
    target: '[data-tour="series-buttons"]',
    title: '📑 대회 카드',
    body: '[대회요강] 일정·장소·요강 파일과 결과\n[대진표] 경기 대진과 결과 — 경기 번호 동그라미를 누르면 그 경기 영상으로 바로 이동해요\n[영상목록] 그 대회의 경기 영상 모아보기',
  },
  {
    section: '대회',
    page: onPage('/competition'),
    target: '[data-tour="subtab-venues"]',
    title: '🗺️ 경기장 정보로 가볼까요?',
    body: '[경기장 정보]를 눌러주세요.',
    clickTo: onPage('/competition/venues'),
  },
  {
    section: '대회',
    page: onPage('/competition/venues'),
    target: '[data-tour="venue-map"]',
    title: '🗺️ 경기장 지도',
    body: '대회가 열렸던 경기장 위치예요. 손가락으로 움직이거나 확대해보세요.\n이름표나 아래 목록을 누르면 주차, 코트 수, 가는 길 같은 경기장 정보를 볼 수 있어요.',
  },

  // ── 메뉴 ──
  {
    section: '메뉴',
    page: onPage('/competition/venues'),
    target: '#tour-hamburger',
    title: '☰ 메뉴',
    body: '탭 말고도 메뉴 안에 [캘린더 보기](달력에서 날짜별 영상 찾기)와 [주제별 보기](대회·교류전 등 주제별 모음)가 있어요.',
  },
  {
    section: '메뉴',
    page: onPage('/competition/venues'),
    target: '#tour-admin',
    fallback: '#tour-admin-mobile',
    openMenu: true,
    title: '🎈 영상 등록하기',
    body: '운동 영상 등록과 수정은 메뉴 안 [영상 등록하기]에서 해요. (관리자 비밀번호 필요)',
  },
  {
    section: '메뉴',
    page: onPage('/competition/venues'),
    target: '#tour-help-btn',
    title: '👍 끝! 튜토리얼 다시보기',
    body: '안내를 다시 보려면 상단의 [ ? ] 버튼을 눌러주세요. 언제든지 다시 볼 수 있어요.',
  },
];

// 새 버전 튜토리얼 — 예전 튜토리얼을 본 사람도 한 번은 자동으로 보도록 키를 바꿈
const STORAGE_KEY = 'ewha_tutorial_v2_done';
// 페이지를 이동하면 이 컴포넌트가 새로 그려지므로 진행 중인 단계를 세션에 보관
const SESSION_KEY = 'ewha_tutorial_step';
const GAP = 12;
const PAD = 12;
const WAIT_MS = 3000; // 목록처럼 늦게 그려지는 요소를 기다리는 최대 시간

function findTarget(step: TourStep): HTMLElement | null {
  const visible = (sel?: string) => {
    if (!sel) return null;
    const el = document.querySelector<HTMLElement>(sel);
    return el && el.getBoundingClientRect().width > 0 ? el : null;
  };
  return visible(step.target) || visible(step.fallback);
}

// 이 단계를 보여줄 수 없을 때(대상 없음) 현재 화면에서 이어갈 다음 단계 —
// "눌러서 이동" 단계를 건너뛰면 그 다음 화면용 단계들도 함께 건너뜀
function nextOnPage(from: number, path: string): number | null {
  for (let i = from + 1; i < STEPS.length; i++) if (STEPS[i].page(path)) return i;
  return null;
}

// 임시 비활성화: 갤럭시 폰 홈에서 튜토리얼이 다음 단계로 넘어가지 않는 오류 — 원인 수정 전까지 모든 기기에서 끔 (true로 바꾸면 복구)
export const TUTORIAL_ENABLED = false;

export default function TutorialTour() {
  const pathname = usePathname();
  const [step, setStep] = useState<number | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [tipH, setTipH] = useState(220);
  const tipRef = useRef<HTMLDivElement>(null);

  function go(i: number) {
    try { sessionStorage.setItem(SESSION_KEY, String(i)); } catch {}
    setRect(null);
    setStep(i);
  }

  function finish() {
    window.dispatchEvent(new Event('tutorial-close-sidebar'));
    try {
      localStorage.setItem(STORAGE_KEY, '1');
      sessionStorage.removeItem(SESSION_KEY);
    } catch {}
    setStep(null);
  }

  // 화면에 들어올 때: 진행 중이던 튜토리얼 이어가기 / 첫 방문 자동 시작 / [?] 버튼으로 요청된 재시작
  useEffect(() => {
    let saved: string | null = null;
    let pending = false;
    try {
      saved = sessionStorage.getItem(SESSION_KEY);
      pending = pathname === '/' && !!sessionStorage.getItem('pendingTutorial');
    } catch {}
    // 다른 화면에서 [?]를 눌러 홈으로 온 경우엔 진행 중이던 단계가 있어도 처음부터 다시
    if (saved !== null && !pending) {
      let i = Number(saved);
      // 안내대로 대상을 눌러 이동해 왔으면 다음 단계로
      if (STEPS[i]?.clickTo?.(pathname)) i += 1;
      if (STEPS[i]?.page(pathname)) {
        go(i);
      } else {
        // 안내와 다른 화면으로 이동했으면 튜토리얼을 멈춤 (다시 보기는 [?] 버튼)
        try { sessionStorage.removeItem(SESSION_KEY); } catch {}
        setStep(null);
      }
      return;
    }
    if (pathname !== '/') return;
    let done = false;
    try {
      if (pending) sessionStorage.removeItem('pendingTutorial');
      done = !!localStorage.getItem(STORAGE_KEY);
    } catch {}
    if (!pending && done) return;
    const t = setTimeout(() => go(0), pending ? 100 : 600);
    return () => clearTimeout(t);
  }, [pathname]);

  // 홈에서 [?] 버튼으로 재시작
  useEffect(() => {
    const restart = () => go(0);
    window.addEventListener('restart-tutorial', restart);
    return () => window.removeEventListener('restart-tutorial', restart);
  }, []);

  // 현재 단계의 대상을 찾아 화면 안으로 스크롤하고 위치를 잼
  useEffect(() => {
    if (step === null) return;
    const current = STEPS[step];
    window.dispatchEvent(new Event(current.openMenu ? 'tutorial-open-sidebar' : 'tutorial-close-sidebar'));
    if (!current.target) {
      setRect(null);
      return;
    }

    let cancelled = false;
    let el: HTMLElement | null = null;
    const started = Date.now();
    const update = () => {
      if (el && !cancelled) setRect(el.getBoundingClientRect());
    };

    // 메뉴를 여는 단계는 슬라이드가 끝난 뒤 재야 정확함
    const poll = () => {
      if (cancelled) return;
      el = findTarget(current);
      if (!el) {
        if (Date.now() - started < WAIT_MS) {
          timer = setTimeout(poll, 150);
        } else {
          const next = nextOnPage(step, pathname);
          if (next === null) finish();
          else go(next);
        }
        return;
      }
      const r = el.getBoundingClientRect();
      const fullyVisible = r.top >= 60 && r.bottom <= window.innerHeight - 70;
      if (!fullyVisible && getComputedStyle(el).position !== 'fixed') {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        timer = setTimeout(update, 450);
      } else {
        update();
      }
    };
    let timer = setTimeout(poll, current.openMenu ? 280 : 0);

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, pathname]);

  // 안내 카드의 실제 높이를 재서 위치 계산에 사용 (문구 길이가 단계마다 다름)
  useLayoutEffect(() => {
    if (tipRef.current) setTipH(tipRef.current.offsetHeight);
  }, [step, rect]);

  if (step === null) return null;
  const current = STEPS[step];
  const vw = typeof window !== 'undefined' ? window.innerWidth : 375;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 700;
  const tipW = Math.min(320, vw - PAD * 2);

  // 대상이 있는데 아직 위치를 못 잰 동안엔 어둡게만 두고 카드는 숨김
  const waiting = !!current.target && !rect;

  let tipTop: number;
  let tipLeft: number;
  if (!rect) {
    tipTop = Math.max(PAD, (vh - tipH) / 2 - 40);
    tipLeft = (vw - tipW) / 2;
  } else {
    const below = vh - rect.bottom - GAP;
    const above = rect.top - GAP;
    tipTop = below >= tipH || below >= above ? rect.bottom + GAP : rect.top - GAP - tipH;
    tipTop = Math.max(PAD, Math.min(tipTop, vh - tipH - PAD));
    tipLeft = Math.max(PAD, Math.min(rect.left + rect.width / 2 - tipW / 2, vw - tipW - PAD));
  }

  const prevAllowed = step > 0 && STEPS[step - 1].page(pathname) && !STEPS[step - 1].clickTo;
  const isLast = step === STEPS.length - 1;
  const hole = rect && {
    top: rect.top - 6,
    left: rect.left - 6,
    width: rect.width + 12,
    height: rect.height + 12,
  };
  // 대상 주변을 막는 투명 판 — 안내 중엔 다른 곳이 눌리지 않게 하고, "눌러서 이동" 단계만 대상 자리를 비워둠
  const blockers = hole
    ? [
        { top: 0, left: 0, right: 0, height: Math.max(0, hole.top) },
        { top: hole.top + hole.height, left: 0, right: 0, bottom: 0 },
        { top: hole.top, left: 0, width: Math.max(0, hole.left), height: hole.height },
        { top: hole.top, left: hole.left + hole.width, right: 0, height: hole.height },
        ...(current.clickTo ? [] : [hole]),
      ]
    : [{ top: 0, left: 0, right: 0, bottom: 0 }];

  return (
    <>
      {/* 어둡게 + 대상 자리만 밝게 뚫린 스포트라이트 */}
      {hole ? (
        <div
          className="fixed z-[9000] pointer-events-none rounded-xl"
          style={{
            ...hole,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
            border: current.clickTo ? '2px solid #fff' : '2px solid rgba(255,255,255,0.85)',
            transition: 'top 0.2s, left 0.2s, width 0.2s, height 0.2s',
          }}
        />
      ) : (
        <div className="fixed inset-0 z-[9000] pointer-events-none" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }} />
      )}
      {current.clickTo && hole && (
        <div
          className="fixed z-[9000] pointer-events-none rounded-xl animate-ping"
          style={{ ...hole, border: '2px solid #fff', opacity: 0.6 }}
        />
      )}
      {blockers.map((b, i) => (
        <div key={i} className="fixed z-[9001]" style={b} onClick={(e) => e.stopPropagation()} />
      ))}

      {!waiting && (
        <div
          ref={tipRef}
          role="dialog"
          aria-label={current.title}
          className="fixed z-[9002] rounded-2xl shadow-2xl p-4"
          style={{ top: tipTop, left: tipLeft, width: tipW, backgroundColor: '#ffffff' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold" style={{ color: '#00462A' }}>
              {current.section} · {step + 1} / {STEPS.length}
            </span>
            <button onClick={finish} className="text-xs py-1 -my-1 pl-3" style={{ color: '#9CA3AF' }}>
              건너뛰기
            </button>
          </div>
          <p className="font-bold text-[15px] mb-2" style={{ color: '#111' }}>
            {current.title}
          </p>
          <p className="text-sm whitespace-pre-line" style={{ color: '#374151', lineHeight: 1.6 }}>
            {current.body}
          </p>
          <div className="flex items-center justify-between mt-4">
            {prevAllowed ? (
              <button onClick={() => go(step - 1)} className="h-8 px-3 text-sm rounded-lg" style={{ color: '#6B7280' }}>
                ← 이전
              </button>
            ) : (
              <span />
            )}
            {current.clickTo ? (
              <span className="text-sm font-semibold" style={{ color: '#00462A' }}>
                👆 표시된 곳을 눌러주세요
              </span>
            ) : (
              <button
                onClick={() => (isLast ? finish() : go(step + 1))}
                className="h-8 px-4 text-sm font-semibold rounded-lg"
                style={{ backgroundColor: '#00462A', color: '#fff' }}
              >
                {isLast ? '완료 ✓' : '다음 →'}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
