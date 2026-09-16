import { NextRequest, NextResponse, after } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminAuth';
import { sendPushToAllSubscribers } from '@/lib/push';
import Papa from 'papaparse';

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const { csv } = await req.json();
  if (!csv) return NextResponse.json({ error: 'CSV 데이터 없음' }, { status: 400 });

  const parsed = Papa.parse<{
    youtube_url: string;
    date: string;
    angle: string;
    participants: string;
    title: string;
    topic?: string;
    uploader?: string;
  }>(csv, { header: true, skipEmptyLines: true });

  if (parsed.errors.length > 0) {
    return NextResponse.json({ error: 'CSV 파싱 오류', details: parsed.errors }, { status: 400 });
  }

  const rows = parsed.data.map((row) => ({
    youtube_url: row.youtube_url,
    date: row.date,
    angle: row.angle,
    participants: row.participants
      ? row.participants.split(/[\s,\-\/|·]+/).map((p) => p.trim()).filter(Boolean)
      : [],
    title: row.title,
    topic: row.topic || null,
    uploader: row.uploader || null,
  }));

  const { data, error } = await supabase.from('videos').insert(rows).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 건별이 아니라 요청당 알림 1건으로 묶어 스팸 방지
  after(() =>
    sendPushToAllSubscribers({
      title: '영상이 업로드되었어요',
      body: `영상 ${rows.length}개가 새로 등록되었어요`,
      url: '/',
    })
  );

  return NextResponse.json({ data, count: rows.length }, { status: 201 });
}
