'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    setMobileSearchOpen(false);
    if (q) {
      router.push(`/?search=${encodeURIComponent(q)}`);
    } else {
      router.push('/');
    }
  }

  return (
    <>
      <header
        style={{ backgroundColor: '#00462A' }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center h-[52px] px-3 gap-3"
      >
        {/* 사이드바 토글 */}
        <button
          onClick={onToggleSidebar}
          className="text-white text-xl w-9 h-9 flex items-center justify-center rounded hover:bg-white/10 flex-shrink-0"
          aria-label="메뉴"
        >
          ☰
        </button>

        {/* 로고 */}
        <Link href="/" className="text-white font-bold text-lg flex-shrink-0 leading-none">
          EWHA Kumdo
        </Link>

        {/* 검색창 — 데스크톱 */}
        <form onSubmit={handleSearch} className="flex-1 hidden md:flex">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름, 날짜, 주제 검색..."
            className="w-full max-w-sm h-8 px-3 text-sm rounded-l bg-white/15 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:bg-white/20"
          />
          <button
            type="submit"
            className="h-8 px-3 text-sm bg-white/20 text-white border border-white/30 border-l-0 rounded-r hover:bg-white/30"
          >
            검색
          </button>
        </form>

        {/* 모바일: spacer + 검색 아이콘 */}
        <div className="flex-1 md:hidden" />
        <button
          onClick={() => setMobileSearchOpen((v) => !v)}
          className="flex md:hidden text-white w-9 h-9 items-center justify-center rounded hover:bg-white/10 flex-shrink-0 text-lg"
          aria-label="검색"
        >
          🔍
        </button>

        {/* 영상 등록 버튼 */}
        <Link
          href="/admin"
          className="flex-shrink-0 h-8 px-3 text-sm bg-white text-[#00462A] font-semibold rounded hover:bg-white/90"
          style={{ lineHeight: '2rem' }}
        >
          + 영상 등록
        </Link>
      </header>

      {/* 모바일 검색바 드롭다운 */}
      {mobileSearchOpen && (
        <div
          className="fixed top-[52px] left-0 right-0 z-40 md:hidden px-3 py-2"
          style={{ backgroundColor: '#003d25' }}
        >
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름, 날짜, 주제 검색..."
              autoFocus
              className="flex-1 h-9 px-3 text-sm rounded bg-white/15 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:bg-white/20"
            />
            <button
              type="submit"
              className="h-9 px-4 text-sm bg-white text-[#00462A] font-semibold rounded"
            >
              검색
            </button>
            <button
              type="button"
              onClick={() => setMobileSearchOpen(false)}
              className="h-9 px-2 text-white/60 hover:text-white"
            >
              ✕
            </button>
          </form>
        </div>
      )}
    </>
  );
}
