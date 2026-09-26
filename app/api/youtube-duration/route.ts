import { NextRequest, NextResponse } from 'next/server';

const ONE_WEEK = 60 * 60 * 24 * 7;

// 영상 길이(초) — API 키 없이 유튜브 시청 페이지의 lengthSeconds 값을 읽음 (일부공개 영상도 링크로 접근 가능)
// 영상 길이는 바뀌지 않으므로 서버 fetch와 CDN 응답 모두 1주일 캐시
export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id') || '';
  if (!/^[\w-]{11}$/.test(id)) return NextResponse.json({ error: 'invalid id' }, { status: 400 });

  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${id}`, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'ko' },
      next: { revalidate: ONE_WEEK },
    });
    const html = await res.text();
    const match = html.match(/"lengthSeconds":"(\d+)"/);
    const seconds = match ? Number(match[1]) : null;
    return NextResponse.json({ seconds }, {
      headers: { 'Cache-Control': seconds ? `public, s-maxage=${ONE_WEEK}` : 'no-store' },
    });
  } catch {
    return NextResponse.json({ seconds: null });
  }
}
