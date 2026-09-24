interface Props {
  name?: string;
  club?: string;
  isOurs: boolean;
  mirrored: boolean; // true = B조(오른쪽) → 오른쪽 정렬, false = A조(왼쪽) → 왼쪽 정렬
  width: number;
}

const GREEN = '#00462A';
const OURS_BG = 'rgba(0,70,42,0.10)';
const CREAM_BG = '#FFFDF1'; // 스플래시 화면과 동일한 크림색

// 대진표 리프(1라운드) 선수 카드 — 대진표 전체에서 가장 긴 이름/소속 기준으로 계산된 공통 폭(width)을 받아
// 모든 카드가 같은 폭을 갖는다. 이름은 여기서만 표시되고, 이후 라운드는 번호 원만 이어진다.
export default function BracketPlayerCard({ name, club, isOurs, mirrored, width }: Props) {
  return (
    <div
      className={`rounded-md border px-2 py-1 flex flex-col justify-center ${mirrored ? 'items-end text-right' : 'items-start text-left'}`}
      style={{ width, backgroundColor: isOurs ? OURS_BG : CREAM_BG, borderColor: isOurs ? 'rgba(0,70,42,0.25)' : '#EDE7CF' }}
    >
      <span className="text-xs font-bold whitespace-nowrap" style={{ color: isOurs ? GREEN : '#111' }}>
        {name || 'TBD'}
      </span>
      {club && (
        <span className="text-[10px] whitespace-nowrap" style={{ color: isOurs ? GREEN : '#8A8368', opacity: isOurs ? 0.85 : 1 }}>
          {club}
        </span>
      )}
    </div>
  );
}
