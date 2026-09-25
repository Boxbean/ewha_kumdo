import { NextRequest, NextResponse } from 'next/server';
import { detectPlatform } from '@/lib/utils';
import { fetchLinkMeta } from '@/lib/linkMeta';

// 검도쇼츠 등록 폼 자동완성 — 링크 페이지에서 제목/썸네일을 시도해서 가져오고,
// 못 가져오면 manual:true (폼은 비워둔 채 등록 가능, 서버가 기본 제목/썸네일 없음으로 저장)
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'missing url' }, { status: 400 });

  const meta = await fetchLinkMeta(url);
  return NextResponse.json({
    platform: detectPlatform(url),
    title: meta.title,
    thumbnail_url: meta.thumbnail_url,
    manual: !meta.title,
  });
}
