import { CSSProperties } from 'react';

interface Props {
  mirrored?: boolean;
  label?: string;
}

const LINE_COLOR = '#cbd5e1';

// 두 자식 매치를 하나의 부모 매치로 잇는 꺾쇠(⊢) 연결선.
// 셀 자신의 높이(그리드 span으로 이미 결정됨)에 대한 상대(%) 좌표만 사용 — DOM 측정 불필요.
export default function BracketConnector({ mirrored, label }: Props) {
  const stubNear: CSSProperties = mirrored
    ? { right: 0, width: '50%' }
    : { left: 0, width: '50%' };
  const stubFar: CSSProperties = mirrored
    ? { left: 0, width: '50%' }
    : { right: 0, width: '50%' };
  const verticalBar: CSSProperties = mirrored
    ? { right: '50%', borderRight: `2px solid ${LINE_COLOR}` }
    : { left: '50%', borderLeft: `2px solid ${LINE_COLOR}` };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* 위쪽 자식 → 가운데 */}
      <div style={{ position: 'absolute', top: '25%', height: 0, borderTop: `2px solid ${LINE_COLOR}`, ...stubNear }} />
      {/* 아래쪽 자식 → 가운데 */}
      <div style={{ position: 'absolute', top: '75%', height: 0, borderTop: `2px solid ${LINE_COLOR}`, ...stubNear }} />
      {/* 세로 연결선 */}
      <div style={{ position: 'absolute', top: '25%', height: '50%', width: 0, ...verticalBar }} />
      {/* 가운데 → 부모 매치 */}
      <div style={{ position: 'absolute', top: '50%', height: 0, borderTop: `2px solid ${LINE_COLOR}`, ...stubFar }} />
      {label && (
        <span
          className="text-[10px] whitespace-nowrap"
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#fff', color: '#B9B9B9', padding: '0 3px',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
