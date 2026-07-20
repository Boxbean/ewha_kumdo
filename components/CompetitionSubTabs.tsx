import Link from 'next/link';

interface Props {
  active: 'series' | 'venues';
}

export default function CompetitionSubTabs({ active }: Props) {
  const tabs = [
    { key: 'series' as const, label: '대회 보기', href: '/competition' },
    { key: 'venues' as const, label: '경기장 보기', href: '/competition/venues' },
  ];

  return (
    <div className="flex gap-1 mb-6 border-b" style={{ borderColor: '#e0e0e0' }}>
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className="h-9 px-3 text-sm font-medium border-b-2 -mb-[1px] transition-colors"
          style={{
            borderBottomColor: active === t.key ? '#00462A' : 'transparent',
            color: active === t.key ? '#00462A' : '#B9B9B9',
          }}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
