'use client';

import { useEffect, useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import TutorialTour from './TutorialTour';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 튜토리얼이 "등록하기" 단계(햄버거 메뉴 안)를 가리킬 때 메뉴를 강제로 열고/닫기 위한 이벤트
  useEffect(() => {
    function handleOpen() { setSidebarOpen(true); }
    function handleClose() { setSidebarOpen(false); }
    window.addEventListener('tutorial-open-sidebar', handleOpen);
    window.addEventListener('tutorial-close-sidebar', handleClose);
    return () => {
      window.removeEventListener('tutorial-open-sidebar', handleOpen);
      window.removeEventListener('tutorial-close-sidebar', handleClose);
    };
  }, []);

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
      <TutorialTour />
    </>
  );
}
