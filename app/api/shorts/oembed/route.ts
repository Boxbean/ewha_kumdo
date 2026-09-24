import { NextRequest, NextResponse } from 'next/server';
import { detectPlatform, extractYouTubeId, getYouTubeThumbnail } from '@/lib/utils';
import { fetchYouTubeOEmbed } from '@/lib/oembed';

// 검도쇼츠 등록 폼의 자동완성 — 유튜브만 실제로 제목/썸네일을 가져올 수 있음.
// 인스타그램은 2020년 이후 Meta 승인 앱 + 액세스 토큰 없이는 메타데이터 조회가 불가능(Basic Display API는
// 2024년 완전 종료)하므로 manual:true 로 응답해 폼이 수동 입력으로 전환하도록 함.
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'missing url' }, { status: 400 });

  const platform = detectPlatform(url);

  if (platform === 'youtube') {
    const videoId = extractYouTubeId(url);
    if (!videoId) return NextResponse.json({ platform, title: null, thumbnail_url: null, manual: true });
    try {
      const data = await fetchYouTubeOEmbed(url);
      if (!data) return NextResponse.json({ platform, title: null, thumbnail_url: null, manual: true });
      return NextResponse.json({
        platform,
        title: data.title,
        thumbnail_url: getYouTubeThumbnail(videoId),
        manual: false,
      });
    } catch {
      return NextResponse.json({ platform, title: null, thumbnail_url: null, manual: true });
    }
  }

  // instagram / other — 향후 INSTAGRAM_OEMBED_ACCESS_TOKEN이 준비되면 여기서 분기 추가 가능
  return NextResponse.json({ platform, title: null, thumbnail_url: null, manual: true });
}
