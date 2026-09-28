import { revalidatePath } from 'next/cache';
import { supabase } from './supabase';
import { fetchYouTubeOEmbed } from './oembed';
import { extractYouTubeId } from './utils';

type Result = { id: string } | { error: string };

function todayKST(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// 피드백 요청에 붙인 유튜브 링크를 정규 영상(videos)으로 연결 — 이미 등록된 영상이면 그대로 쓰고, 없으면 새로 등록
// 새 영상은 제목만 유튜브에서 가져오고 날짜(오늘)·각도(기타)는 임시값 → 관리자가 나중에 영상 정보를 고침
// 관리자 등록이 아니므로 새 영상 푸시 알림은 보내지 않음
export async function findOrCreateVideoFromYouTube(url: string, uploader: string | null): Promise<Result> {
  const youtubeId = extractYouTubeId(url);
  if (!youtubeId) return { error: '유튜브 영상 링크를 확인해주세요.' };

  const { data: existing } = await supabase
    .from('videos')
    .select('id')
    .ilike('youtube_url', `%${youtubeId}%`)
    .limit(1);
  if (existing?.[0]) return { id: existing[0].id };

  const youtubeUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
  const meta = await fetchYouTubeOEmbed(youtubeUrl).catch(() => null);
  // 비공개 영상은 oEmbed도, 사이트 재생도 안 됨
  if (!meta?.title) return { error: '영상을 불러올 수 없어요. 비공개 영상이라면 "일부 공개"나 "공개"로 바꿔주세요.' };

  const { data, error } = await supabase
    .from('videos')
    .insert({ youtube_url: youtubeUrl, title: meta.title, date: todayKST(), angle: '기타', participants: [], uploader })
    .select('id')
    .single();
  if (error || !data) return { error: error?.message || '영상 등록에 실패했어요.' };

  revalidatePath('/');
  return { id: data.id };
}
