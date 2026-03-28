'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menus = [
  { href: '/', label: '홈', icon: '🏠' },
  { href: '/calendar', label: '캘린더', icon: '📅' },
  { href: '/topic', label: '주제별', icon: '📚' },
  { href: '/participant', label: '참가자', icon: '👤' },
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
            <span className="text-lg">{menu.icon}</span>
            <span>{menu.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
