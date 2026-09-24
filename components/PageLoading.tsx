// 라우트 세그먼트별 loading.tsx에서 공용으로 쓰는 로딩 표시 — 탭 이동 시 화면이 멈춘 것처럼 보이지 않도록
// (기존 HomeContent 등에서 쓰던 문구/스타일과 통일)
export default function PageLoading() {
  return (
    <p
      className="py-12 text-center text-sm tracking-widest select-none"
      style={{ color: '#00462A', fontFamily: 'var(--font-pretendard), sans-serif' }}
    >
      Loading... : ▮▮▮▮▮▮▯▯▯
    </p>
  );
}
