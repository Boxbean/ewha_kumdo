// 페이지/목록 로딩 공용 표시 — 스플래시와 같은 모티프(로고 + 바깥 원 그리기)를 작게 줄여 0.8초 주기로 반복
// 키프레임은 app/globals.css의 page-loading-* 참고 (prefers-reduced-motion 시 정지)
const SIZE = 64;
const LOGO_SIZE = 58;
const RING_RADIUS = 23;
const CENTER = SIZE / 2;

export default function PageLoading() {
  return (
    <div role="status" aria-label="로딩 중" className="py-12 flex justify-center select-none">
      <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
        {/* 원이 그려졌다가 끝부터 지워지는 연출 (pathLength=100 기준 stroke-dashoffset: 100 → 0 → -100) */}
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}
        >
          <circle
            className="page-loading-ring"
            cx={CENTER}
            cy={CENTER}
            r={RING_RADIUS}
            fill="none"
            stroke="#00462A"
            strokeOpacity={0.8}
            strokeWidth={1.5}
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={100}
            strokeDashoffset={100}
          />
        </svg>

        {/* 로고 — 스플래시와 동일하게 PNG 마스크로 #00462A 채색, 원 주기에 맞춰 살짝 숨쉬듯 깜빡임 */}
        <div
          className="page-loading-logo"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: LOGO_SIZE,
            height: LOGO_SIZE,
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#00462A',
            WebkitMaskImage: 'url(/logo.png)',
            maskImage: 'url(/logo.png)',
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
          }}
        />
      </div>
    </div>
  );
}
