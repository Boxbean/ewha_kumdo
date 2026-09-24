// YouTube oEmbed 공용 헬퍼 — 기존 영상 등록(app/api/oembed)과 검도쇼츠 등록(app/api/shorts/oembed)이
// 동일 로직을 공유하도록 분리
export async function fetchYouTubeOEmbed(url: string): Promise<{ title: string } | null> {
  const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
  if (!res.ok) return null;
  return res.json();
}
