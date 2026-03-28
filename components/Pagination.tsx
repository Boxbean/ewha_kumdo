'use client';

interface PaginationProps {
  hasMore: boolean;
  onLoadMore: () => void;
  loading?: boolean;
}

export default function Pagination({ hasMore, onLoadMore, loading }: PaginationProps) {
  if (!hasMore) return null;

  return (
    <div className="flex justify-center mt-8">
      <button
        onClick={onLoadMore}
        disabled={loading}
        className="h-10 px-6 text-sm rounded border font-medium transition-colors"
        style={{
          borderColor: '#00462A',
          color: '#00462A',
          backgroundColor: 'transparent',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? '불러오는 중...' : '10개 더 불러오기'}
      </button>
    </div>
  );
}
