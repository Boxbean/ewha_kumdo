interface Props {
  size?: number;
  color?: string;
}

// 교차된 죽도(竹刀) 형태의 검도 아이콘 — 썸네일 미등록 시 목업으로 사용
export default function KendoIcon({ size = 28, color = '#fff' }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="4" y1="4" x2="20" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="20" y1="4" x2="4" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2.6" fill={color} />
    </svg>
  );
}
