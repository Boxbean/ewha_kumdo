export const dynamic = 'force-dynamic';

import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import BracketView from '@/components/BracketView';
import { getSupabase } from '@/lib/supabase';
import { BracketMatch, Competition, CompetitionFile, Video } from '@/lib/types';

interface Props {
  params: Promise<{ id: string }>;
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
    videos: videos.filter((v) => v.bracket_match_id === m.id),
  }));

  return (
    <AppLayout>
      <div className="mb-5">
        <Link
          href={`/competition/${comp.id}`}
          className="inline-flex items-center gap-1 text-sm mb-4"
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
        </div>
      </div>

      <BracketView matches={matches} files={files} />
    </AppLayout>
  );
}
