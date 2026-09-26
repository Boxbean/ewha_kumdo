// 홈 각 단락(최근 운동 / 검도쇼츠 / 날짜별 영상)의 제목 — 크기·들여쓰기를 한 곳에서 통일
export default function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-2 min-w-0 pl-[2px]">
      <h2 className="text-base font-bold flex-shrink-0" style={{ color: '#111' }}>
        {children}
      </h2>
      {sub && (
        <span className="text-xs truncate" style={{ color: '#6B7280' }}>
          {sub}
        </span>
      )}
    </div>
  );
}
