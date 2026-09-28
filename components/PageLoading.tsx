// 페이지/목록 로딩 공용 표시 — 스플래시와 같은 모티프(로고 + 바깥 원 그리기)를 작게 줄여 반복 (주기는 globals.css)
// 키프레임은 app/globals.css의 page-loading-* 참고 (prefers-reduced-motion 시 원은 멈추고 로고 깜빡임만 유지)
const SIZE = 64;
const LOGO_SIZE = 58;
const RING_RADIUS = 23;
const CENTER = SIZE / 2;
// pathLength 대신 실제 둘레(px)를 씀 — iOS Safari는 circle의 pathLength를 dash 애니메이션에 제대로 적용하지 않음
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function PageLoading() {
  return (
    <div role="status" aria-label="로딩 중" className="py-12 flex justify-center select-none">
      <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
        {/* 원이 그려졌다가 끝부터 지워지는 연출 (stroke-dashoffset: 둘레 → 0 → -둘레) */}
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
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE}
            style={{ ['--ring-c' as string]: `${CIRCUMFERENCE}px` }}
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
