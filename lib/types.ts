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
  created_at: string;
}
