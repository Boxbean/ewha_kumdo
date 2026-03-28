'use client';

import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Header onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {/* 모바일: margin 없음 / 데스크톱: 사이드바 너비만큼 margin */}
      <main
        className="pt-[52px] pb-16 md:pb-0 transition-all duration-200"
        style={{ '--sidebar-w': sidebarOpen ? '200px' : '56px' } as React.CSSProperties}
      >
        <style>{`
          @media (min-width: 768px) {
            main { margin-left: var(--sidebar-w, 200px); }
          }
        `}</style>
        <div className="p-4 md:p-6">{children}</div>
      </main>
      <BottomNav />
    </>
  );
}
