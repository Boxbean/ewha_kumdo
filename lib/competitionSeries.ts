export interface CompetitionSeries {
  key: string;
  label: string;
  names: string[];
}

export const COMPETITION_SERIES: CompetitionSeries[] = [
  { key: 'adult', label: '사회인대회', names: ['사회인대회'] },
  { key: 'seoul-cup', label: '서울컵대회', names: ['서울컵대회'] },
  { key: 'seoul-chairman', label: '서울시 회장기대회', names: ['서울시 회장기대회'] },
  { key: 'univ-league', label: '춘·추계 서울시 대학연맹전', names: ['서울시 춘계 대학연맹전', '서울시 추계 대학연맹전'] },
  { key: 'geumcheon', label: '금천구청장기 대회', names: ['금천구청장기 대회'] },
  { key: 'daeseon', label: '대선기대회', names: ['대선기대회'] },
  { key: 'dobong', label: '도봉구청장기 대회', names: ['도봉구청장기 대회'] },
];

// 관리자에서 프리셋 외 이름으로 등록된 대회(직접 입력)를 위한 임시 시리즈 키 접두어
const CUSTOM_KEY_PREFIX = 'custom__';

export function makeCustomSeriesKey(name: string): string {
  return CUSTOM_KEY_PREFIX + encodeURIComponent(name);
}

function customSeriesFromKey(key: string): CompetitionSeries | undefined {
  if (!key.startsWith(CUSTOM_KEY_PREFIX)) return undefined;
  const name = decodeURIComponent(key.slice(CUSTOM_KEY_PREFIX.length));
  return { key, label: name, names: [name] };
}

export function getSeriesByKey(key: string): CompetitionSeries | undefined {
  return COMPETITION_SERIES.find((s) => s.key === key) || customSeriesFromKey(key);
}

export function getSeriesByName(name: string): CompetitionSeries | undefined {
  return (
    COMPETITION_SERIES.find((s) => s.names.includes(name)) ||
    (name ? { key: makeCustomSeriesKey(name), label: name, names: [name] } : undefined)
  );
}

/**
 * 프리셋 시리즈 + DB에 존재하지만 프리셋에 없는 대회명(관리자 "직접 입력")을 개별 시리즈로 합친 합집합 목록.
 * 관리자 대회 목록과 대회 탭 카드 목록이 항상 같은 대회 집합을 반영하도록 한다.
 */
export function buildSeriesUnion(existingNames: string[]): CompetitionSeries[] {
  const presetNames = new Set(COMPETITION_SERIES.flatMap((s) => s.names));
  const extraNames = Array.from(new Set(existingNames.filter((n) => n && !presetNames.has(n))));
  const extraSeries: CompetitionSeries[] = extraNames.map((name) => ({
    key: makeCustomSeriesKey(name),
    label: name,
    names: [name],
  }));
  return [...COMPETITION_SERIES, ...extraSeries];
}
