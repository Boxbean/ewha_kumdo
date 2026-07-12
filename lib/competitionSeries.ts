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

export function getSeriesByKey(key: string): CompetitionSeries | undefined {
  return COMPETITION_SERIES.find((s) => s.key === key);
}
