export const revalidate = 30;
// 빈 배열을 내보내야 동적 경로([id])도 첫 방문 때 그려 30초 캐시(ISR)함 — 없으면 revalidate가 무시되고 매 요청마다 DB를 조회함
export async function generateStaticParams() {
  return [];
}

import type { Metadata } from 'next';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import BracketView from '@/components/BracketView';
import ShareButton from '@/components/ShareButton';
import { getSupabase } from '@/lib/supabase';
import { videosForMatch } from '@/lib/bracket';
import { BracketMatch, Competition, CompetitionFile, Video } from '@/lib/types';

interface Props {
  params: Promise<{ id: string }>;
}

// 카톡 등 링크 미리보기에 대회명이 보이도록
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data } = await getSupabase().from('competitions').select('name, year').eq('id', id).single();
  if (!data) return {};
  const title = `${data.year} ${data.name} 대진표 | EWHA Kumdo`;
  const description = `${data.name} 대진표와 경기 영상`;
  return { title, description, openGraph: { title, description } };
}

export default async function CompetitionBracketPage({ params }: Props) {
  const { id } = await params;
  const supabase = getSupabase();

  const [compRes, filesRes, bracketRes, videosRes] = await Promise.all([
    supabase.from('competitions').select('id, name, year').eq('id', id).single(),
    supabase.from('competition_files').select('*').eq('competition_id', id),
    supabase.from('bracket_matches').select('*').eq('competition_id', id),
    supabase.from('videos').select('*').eq('competition_id', id),
  ]);

  if (compRes.error || !compRes.data) {
    return (
      <AppLayout>
        <div className="text-center py-20" style={{ color: '#B9B9B9' }}>
          대회 정보를 찾을 수 없습니다.
        </div>
      </AppLayout>
    );
  }

  const comp = compRes.data as Pick<Competition, 'id' | 'name' | 'year'>;
  const files = (filesRes.data as CompetitionFile[]) || [];
  const videos = (videosRes.data as Video[]) || [];
  const bracketMatches = (bracketRes.data as BracketMatch[]) || [];
  const matches = bracketMatches.map((m) => ({
    ...m,
    videos: videosForMatch(videos, m.id),
  }));

  return (
    <AppLayout>
      <div className="mb-5">
        <Link
          href={`/competition/${comp.id}`}
          className="inline-flex items-center gap-1 text-sm py-2 -my-2 mb-2"
          style={{ color: '#B9B9B9' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          대회 정보로 돌아가기
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: '#00462A' }}>
            {comp.name}
          </span>
          <span className="text-sm font-semibold" style={{ color: '#374151' }}>{comp.year}년</span>
          <div className="ml-auto">
            <ShareButton path={`/competition/${comp.id}/bracket`} title={`${comp.year} ${comp.name} 대진표`} />
          </div>
        </div>
      </div>

      <BracketView matches={matches} files={files} />
    </AppLayout>
  );
}
