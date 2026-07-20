export const dynamic = 'force-dynamic';

import AppLayout from '@/components/AppLayout';
import { getSupabase } from '@/lib/supabase';
import { BracketMatch, Competition, Video } from '@/lib/types';
import CompetitionDetailView from '@/components/CompetitionDetailView';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CompetitionDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = getSupabase();

  const [compRes, videosRes, bracketRes] = await Promise.all([
    supabase
      .from('competitions')
      .select('*, venue:venues(*), participants:competition_participants(*), files:competition_files(*)')
      .eq('id', id)
      .single(),
    supabase
      .from('videos')
      .select('*')
      .eq('competition_id', id)
      .order('date', { ascending: true }),
    supabase
      .from('bracket_matches')
      .select('*')
      .eq('competition_id', id),
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

  const comp = compRes.data as Competition;
  const videos: Video[] = (videosRes.data as Video[]) || [];
  // bracket_matches 테이블이 아직 없어도(마이그레이션 전) 대회 상세 자체는 정상 노출되도록 별도 쿼리로 분리
  comp.bracket_matches = (bracketRes.data as BracketMatch[]) || [];

  return (
    <AppLayout>
      <CompetitionDetailView initialComp={comp} videos={videos} />
    </AppLayout>
  );
}
