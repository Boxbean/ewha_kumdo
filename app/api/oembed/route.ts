import { NextRequest, NextResponse } from 'next/server';
import { fetchYouTubeOEmbed } from '@/lib/oembed';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'missing url' }, { status: 400 });

  const data = await fetchYouTubeOEmbed(url);
  if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 });

  return NextResponse.json(data);
}
