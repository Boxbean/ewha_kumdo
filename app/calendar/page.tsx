export const dynamic = 'force-dynamic';

import AppLayout from '@/components/AppLayout';
import CalendarView from '@/components/CalendarView';
import { supabase } from '@/lib/supabase';
import { Video } from '@/lib/types';

export default async function CalendarPage() {
  // 모든 영상의 날짜·앵글만 조회
  const { data } = await supabase
    .from('videos')
    .select('id, date, angle, title, youtube_url, participants, topic, uploader, created_at')
    .order('date', { ascending: false });

  const videos: Video[] = (data as Video[]) || [];

  const now = new Date();

  return (
    <AppLayout>
      <h1 className="text-xl font-bold mb-4" style={{ color: '#00462A' }}>
        캘린더 보기
      </h1>
      <CalendarView
        videos={videos}
        initialYear={now.getFullYear()}
        initialMonth={now.getMonth()}
      />
    </AppLayout>
  );
}
