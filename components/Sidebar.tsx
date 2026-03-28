'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  isOpen: boolean;
}

const menus = [
  { href: '/', label: '홈', icon: '🏠' },
  { href: '/calendar', label: '캘린더 보기', icon: '📅' },
  { href: '/topic', label: '주제별 보기', icon: '📚' },
  { href: '/participant', label: '참가자별 보기', icon: '👤' },
];

export default function Sidebar({ isOpen }: SidebarProps) {
  const pathname = usePathname();

  return (
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
              <span className="text-base flex-shrink-0">{menu.icon}</span>
              {isOpen && <span className="truncate">{menu.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
