export const revalidate = 30;

import { notFound } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import ShortsPlayer from '@/components/ShortsPlayer';
import { getSupabase } from '@/lib/supabase';
import { Shorts } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ShortsDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('shorts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) notFound();

  const shorts = data as Shorts;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <ShortsPlayer videoUrl={shorts.video_url} platform={shorts.platform} title={shorts.title} />

        <div
          className="rounded-lg p-4 mt-4 mb-4"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }}
        >
          <h1 className="text-lg font-bold leading-snug mb-2" style={{ color: '#111111' }}>
            {shorts.title}
          </h1>
          <p className="text-sm" style={{ color: '#B9B9B9' }}>
            {formatDate(shorts.created_at.slice(0, 10))} 등록
            {shorts.submitter_name && ` · ${shorts.submitter_name}`}
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
