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

function IconBook() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/>
      <path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  );
}

const menus = [
  { href: '/', label: '홈', Icon: IconHome },
  { href: '/calendar', label: '캘린더 보기', Icon: IconCalendar },
  { href: '/topic', label: '주제별 보기', Icon: IconBook },
  { href: '/participant', label: '참가자별 보기', Icon: IconUsers },
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
          backgroundColor: '#FFFDF1',
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
      </aside>

      {/* 모바일 오버레이 슬라이드 */}
      {/* 딤 배경 */}
      <div
        className="fixed inset-0 z-40 md:hidden bg-black/40 transition-opacity duration-200"
        style={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none' }}
        onClick={onClose}
      />
      {/* 슬라이드 패널 */}
      <div
        className="fixed top-[52px] left-0 bottom-0 z-50 md:hidden w-[200px] flex flex-col transition-transform duration-200"
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          backgroundColor: '#FFFDF1',
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
      </div>
    </>
  );
}
