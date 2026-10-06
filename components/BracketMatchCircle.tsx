import Link from 'next/link';

interface Props {
  number: number;
  videoId?: string;
  decided: boolean;
}

const GREEN = '#00462A';

// 원 안의 경기 번호 배지 — 영상이 연결된 경기는 초록색으로 채워 한눈에 구분되고, 클릭 시 바로 영상 페이지로 이동.
export default function BracketMatchCircle({ number, videoId, decided }: Props) {
  const style: React.CSSProperties = {
    width: 26, height: 26, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700,
    border: `2px solid ${decided ? GREEN : '#cbd5e1'}`,
    color: decided ? GREEN : '#9CA3AF',
    backgroundColor: '#fff',
    flexShrink: 0,
  };

  if (videoId) {
    return (
      <Link
        href={`/video/${videoId}`}
        // 대진표는 화면 폭에 맞춰 축소되어 휴대폰에선 원이 17px 정도로 작아짐 — 모양은 그대로 두고 터치 영역만 사방으로 넓힘
        className="relative after:absolute after:-inset-[9px] after:content-['']"
        style={{
          ...style,
          border: `2px solid ${GREEN}`,
          backgroundColor: GREEN,
          color: '#fff',
          cursor: 'pointer',
          boxShadow: '0 0 0 2px rgba(0,70,42,0.18), 0 1px 3px rgba(0,0,0,0.15)',
        }}
        title={`${number}경기 영상 보기`}
        aria-label={`${number}경기 영상 보기`}
      >
        {number}
      </Link>
    );
  }

  return (
    <span style={style} title={`${number}경기`}>
      {number}
    </span>
  );
}

// 대진표 위 범례용 작은 원 (영상 있음 / 없음)
export function BracketCircleLegend() {
  const dot = (filled: boolean): React.CSSProperties => ({
    width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
    border: `2px solid ${filled ? GREEN : '#cbd5e1'}`,
    backgroundColor: filled ? GREEN : '#fff',
  });
  return (
    <div className="flex items-center gap-3 text-[11px]" style={{ color: '#6B7280' }}>
      <span className="flex items-center gap-1"><span style={dot(true)} />영상 있음</span>
      <span className="flex items-center gap-1"><span style={dot(false)} />영상 없음</span>
    </div>
  );
}
