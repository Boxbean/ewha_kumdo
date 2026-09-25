'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function IconHome() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}

function IconBulb() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21h6"/>
      <path d="M10 17h4"/>
      <path d="M12 3a6 6 0 0 1 6 6c0 2.2-1.1 3.8-2.5 4.8V16a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-2.2C7.1 12.8 6 11.2 6 9a6 6 0 0 1 6-6z"/>
    </svg>
  );
}

function IconList() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/>
      <line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  );
}

function IconTrophy() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8M12 17v4"/>
      <path d="M7 4H4a1 1 0 0 0-1 1v3c0 2.8 1.8 5.1 4.3 5.8"/>
      <path d="M17 4h3a1 1 0 0 1 1 1v3c0 2.8-1.8 5.1-4.3 5.8"/>
      <path d="M7 4h10v8a5 5 0 0 1-10 0V4z"/>
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

function IconShorts() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="4"/>
      <path d="M10 9l5 3-5 3V9z"/>
    </svg>
  );
}

function IconFeedback() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
    </svg>
  );
}

const menus = [
  { href: '/', label: '홈', Icon: IconHome },
  { href: '/list', label: '목록', Icon: IconList },
  { href: '/shorts', label: '쇼츠', Icon: IconShorts },
  { href: '/feedback', label: '피드백', Icon: IconFeedback },
  { href: '/calendar', label: '캘린더 보기', Icon: IconCalendar },
  { href: '/topic', label: '주제별 보기', Icon: IconBulb },
  { href: '/competition', label: '대회 기록', Icon: IconTrophy },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* 데스크톱 사이드바 */}
      <aside
        className="fixed top-[52px] left-0 bottom-0 z-40 hidden md:flex flex-col overflow-hidden transition-all duration-200"
        style={{
          width: isOpen ? '200px' : '56px',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e0e0e0',
        }}
      >
        <nav className="flex-1 py-2">
          {menus.map((menu) => {
            const isActive = pathname === menu.href;
            return (
              <Link
                key={menu.href}
                href={menu.href}
                className="flex items-center h-10 px-4 gap-3 text-sm transition-colors"
                style={{
                  backgroundColor: isActive ? 'rgba(0,70,42,0.12)' : 'transparent',
                  color: isActive ? '#00462A' : '#374151',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                <span className="flex-shrink-0"><menu.Icon /></span>
                {isOpen && <span className="truncate">{menu.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="px-2 pb-3" style={{ borderTop: '1px solid #e0e0e0', paddingTop: '10px' }}>
          <Link
            id="tour-admin"
            href="/admin"
            className="flex items-center h-9 px-2 gap-3 text-sm font-semibold rounded"
            style={{ backgroundColor: '#00462A', color: '#ffffff' }}
          >
            <span className="flex-shrink-0"><IconPlus /></span>
            {isOpen && <span className="truncate">영상 등록하기</span>}
          </Link>
        </div>
      </aside>

      {/* 모바일 오버레이 슬라이드 */}
      {/* 딤 배경 */}
      <div
        className="fixed inset-0 z-40 md:hidden bg-black/40 transition-opacity duration-200"
        style={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none' }}
        onClick={onClose}
      />
      {/* 슬라이드 패널 — 햄버거 아이콘이 헤더 오른쪽에 있으므로 오른쪽에서 슬라이드 / 하단 BottomNav(모바일 전용, z-50, 같은 z-index로 뒤에서 겹침 + 홈 인디케이터 안전영역)에 가리지 않게 공간 확보 */}
      <div
        className="fixed top-[52px] right-0 bottom-0 z-50 md:hidden w-[200px] flex flex-col pb-[calc(4rem+env(safe-area-inset-bottom,0px))] transition-transform duration-200"
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          backgroundColor: '#ffffff',
          borderLeft: '1px solid #e0e0e0',
        }}
      >
        <nav className="flex-1 py-2">
          {menus.map((menu) => {
            const isActive = pathname === menu.href;
            return (
              <Link
                key={menu.href}
                href={menu.href}
                onClick={onClose}
                className="flex items-center h-10 px-4 gap-3 text-sm transition-colors"
                style={{
                  backgroundColor: isActive ? 'rgba(0,70,42,0.12)' : 'transparent',
                  color: isActive ? '#00462A' : '#374151',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                <span className="flex-shrink-0"><menu.Icon /></span>
                <span className="truncate">{menu.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-3 pb-4" style={{ borderTop: '1px solid #e0e0e0', paddingTop: '12px' }}>
          <Link
            id="tour-admin-mobile"
            href="/admin"
            onClick={onClose}
            className="flex items-center h-10 px-3 gap-3 text-sm font-semibold rounded"
            style={{ backgroundColor: '#00462A', color: '#ffffff' }}
          >
            <span className="flex-shrink-0"><IconPlus /></span>
            <span className="truncate">영상 등록하기</span>
          </Link>
        </div>
      </div>
    </>
  );
}
