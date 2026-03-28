import { Angle } from '@/lib/types';

const ANGLE_STYLES: Record<Angle, { bg: string; text: string }> = {
  '전면': { bg: '#00462A', text: '#ffffff' },
  '후면': { bg: '#374151', text: '#ffffff' },
  '기타': { bg: '#B9B9B9', text: '#ffffff' },
};

interface AngleBadgeProps {
  angle: Angle;
  className?: string;
}

export default function AngleBadge({ angle, className = '' }: AngleBadgeProps) {
  const style = ANGLE_STYLES[angle] ?? ANGLE_STYLES['기타'];
  return (
    <span
      className={`inline-block text-xs font-semibold px-1.5 py-0.5 rounded ${className}`}
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {angle}
    </span>
  );
}
