export const dynamic = 'force-dynamic';

import AppLayout from '@/components/AppLayout';
import VideoGrid from '@/components/VideoGrid';
import { getSupabase } from '@/lib/supabase';
import { Video } from '@/lib/types';

export default async function ParticipantPage() {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('videos')
    .select('*')
    .order('date', { ascending: false });

  const videos: Video[] = (data as Video[]) || [];

  // 참가자별 그룹핑
  const grouped = new Map<string, Video[]>();
  videos.forEach((v) => {
    v.participants.forEach((p) => {
      const list = grouped.get(p) || [];
      list.push(v);
      grouped.set(p, list);
    });
  });

  // 참가자 없는 영상
  const noParticipant = videos.filter((v) => v.participants.length === 0);
  if (noParticipant.length > 0) grouped.set('미지정', noParticipant);

  const entries = Array.from(grouped.entries()).sort(([a], [b]) => {
    if (a === '미지정') return 1;
    if (b === '미지정') return -1;
    return a.localeCompare(b, 'ko');
  });

  return (
    <AppLayout>
      <h1 className="text-xl font-bold mb-6" style={{ color: '#00462A' }}>
        참가자별 보기
      </h1>
      {entries.length === 0 ? (
        <p className="text-center py-16" style={{ color: '#B9B9B9' }}>
          등록된 영상이 없습니다.
        </p>
      ) : (
        <div className="space-y-8">
          {entries.map(([participant, vids]) => (
            <section key={participant}>
              <h2
                className="text-base font-bold mb-3 pb-2 border-b"
                style={{ color: '#374151', borderColor: '#e0e0e0' }}
              >
                #{participant}
                <span className="ml-2 text-sm font-normal" style={{ color: '#B9B9B9' }}>
                  ({vids.length}개)
                </span>
              </h2>
              <VideoGrid videos={vids} />
            </section>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
