export type Angle = '전면' | '후면' | '기타';

export interface Video {
  id: string;
  youtube_url: string;
  title: string;
  date: string;        // YYYY-MM-DD
  angle: Angle;
  participants: string[];
  topic?: string;
  uploader?: string;
  competition_id?: string | null;  // 대회 연결 (null = 일반 훈련 영상)
  bracket_match_id?: string | null; // 대진표 매치 연결 (대진표에서 클릭 시 바로 재생)
  created_at: string;
}

export interface SeriesThumbnail {
  series_key: string;
  thumbnail_url?: string;
  updated_at: string;
}

export interface Venue {
  id: string;
  name: string;
  address?: string;
  parking_info?: string;
  court_count?: number;
  floor_type?: string;
  size_memo?: string;
  access_memo?: string;
  nearby_info?: string;
  notes?: string;
  created_at: string;
}

export interface Competition {
  id: string;
  name: string;        // "사회인대회"
  year: number;
  date_start?: string; // YYYY-MM-DD
  date_end?: string;
  venue_id?: string | null;
  result_summary?: string;
  entry_fee?: number;
  notes?: string;
  created_at: string;
  // 조인 데이터 (조회 시 포함)
  venue?: Venue;
  participants?: CompetitionParticipant[];
  files?: CompetitionFile[];
  videos?: Video[];
  bracket_matches?: BracketMatch[];
}

export interface CompetitionParticipant {
  id: string;
  competition_id: string;
  name: string;
  gender?: '여' | '남' | '혼성';
  division?: string;   // 자유 입력: "여자부", "30대 혼성부" 등
  dan_kyu?: string;    // 당시 기준 단/급
  result?: string;     // "8강", "우승", "예선탈락"
  notes?: string;
}

export interface CompetitionFile {
  id: string;
  competition_id: string;
  file_type?: string;  // "팸플릿", "대진표", "결과지", "사진"
  file_url: string;
  file_name?: string;
  created_at: string;
}

export type BracketSide = 'A' | 'B' | 'final';
export type WinnerSlot = 'player1' | 'player2';

export interface BracketMatch {
  id: string;
  competition_id: string;
  division: string;      // "남자노년부" 등
  event_type: string;    // "개인전" | "단체전"
  side: BracketSide;
  round: number;         // 1 = 해당 side의 첫 라운드, 결승 쪽으로 갈수록 증가
  match_no: number;      // (side, round) 내 왼쪽부터 1-index
  match_label?: string;  // 매치 코드 표기용 (예: "5-8"), 점수 아님
  player1_name?: string;
  player1_club?: string;
  player1_is_ours: boolean;
  player2_name?: string;
  player2_club?: string;
  player2_is_ours: boolean;
  winner_slot?: WinnerSlot | null;
  is_bye: boolean;
  third_place_match: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  // 조인 데이터 (조회 시 포함) — 이 매치에 연결된 영상들 (여러 각도 등으로 여러 개일 수 있음)
  videos?: Video[];
}
