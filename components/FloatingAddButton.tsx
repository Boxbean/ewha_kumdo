interface FloatingAddButtonProps {
  label: string;
  onClick: () => void;
}

// 글리프 '+'는 폰트 메트릭 때문에 원 중앙에서 어긋나므로 SVG 십자로 그림
export default function FloatingAddButton({ label, onClick }: FloatingAddButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="fixed z-40 flex items-center justify-center rounded-full shadow-lg"
      style={{
        width: 52,
        height: 52,
        right: '1rem',
        bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))',
        backgroundColor: '#00462A',
        color: '#ffffff',
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <line x1="12" y1="4" x2="12" y2="20" />
        <line x1="4" y1="12" x2="20" y2="12" />
      </svg>
    </button>
  );
}
