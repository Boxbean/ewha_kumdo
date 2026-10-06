'use client';

import { sharePath } from '@/lib/share';

// 화면 링크 공유 버튼 (대진표 등)
export default function ShareButton({ path, title }: { path: string; title: string }) {
  return (
    <button
      type="button"
      onClick={() => void sharePath(path, title)}
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border hover:bg-gray-50"
      style={{ color: '#374151', borderColor: '#e0e0e0' }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
        <path d="M16 6l-4-4-4 4" />
        <path d="M12 2v13" />
      </svg>
      공유
    </button>
  );
}
