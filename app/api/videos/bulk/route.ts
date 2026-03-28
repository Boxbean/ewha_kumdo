import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import Papa from 'papaparse';

export async function POST(req: NextRequest) {
  // 관리자 비밀번호 검증
  const adminPassword = req.headers.get('x-admin-password');
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 });
  }

  const { csv } = await req.json();
  if (!csv) return NextResponse.json({ error: 'CSV 데이터 없음' }, { status: 400 });

  const parsed = Papa.parse<{
    youtube_url: string;
    date: string;
    angle: string;
    participants: string;
    title: string;
    topic?: string;
  }>(csv, { header: true, skipEmptyLines: true });

  if (parsed.errors.length > 0) {
    return NextResponse.json({ error: 'CSV 파싱 오류', details: parsed.errors }, { status: 400 });
  }

  const rows = parsed.data.map((row) => ({
    youtube_url: row.youtube_url,
    date: row.date,
    angle: row.angle,
    participants: row.participants
      ? row.participants.split(',').map((p) => p.trim()).filter(Boolean)
      : [],
    title: row.title,
    topic: row.topic || null,
  }));

  const { data, error } = await supabase.from('videos').insert(rows).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, count: rows.length }, { status: 201 });
}
