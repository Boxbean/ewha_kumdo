'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function IconHome() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}

function IconBulb() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21h6"/>
      <path d="M10 17h4"/>
      <path d="M12 3a6 6 0 0 1 6 6c0 2.2-1.1 3.8-2.5 4.8V16a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-2.2C7.1 12.8 6 11.2 6 9a6 6 0 0 1 6-6z"/>
    </svg>
  );
}

function IconList() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8M12 17v4"/>
      <path d="M7 4H4a1 1 0 0 0-1 1v3c0 2.8 1.8 5.1 4.3 5.8"/>
      <path d="M17 4h3a1 1 0 0 1 1 1v3c0 2.8-1.8 5.1-4.3 5.8"/>
      <path d="M7 4h10v8a5 5 0 0 1-10 0V4z"/>
    </svg>
  );
}

const menus = [
  { href: '/', label: '홈', Icon: IconHome },
  { href: '/list', label: '목록', Icon: IconList },
  { href: '/calendar', label: '캘린더', Icon: IconCalendar },
  { href: '/topic', label: '주제별', Icon: IconBulb },
  { href: '/competition', label: '대회', Icon: IconTrophy },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden border-t"
      style={{ backgroundColor: '#FFFDF1', borderColor: '#e0e0e0' }}
    >
      {menus.map((menu) => {
        const isActive = pathname === menu.href;
        return (
          <Link
            key={menu.href}
            href={menu.href}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs"
            style={{ color: isActive ? '#00462A' : '#B9B9B9', fontWeight: isActive ? 600 : 400 }}
          >
            <menu.Icon />
            <span>{menu.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
