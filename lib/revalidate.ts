import { revalidatePath } from 'next/cache';

// 관리자 변경(영상·대회·대진표·경기장 등) API를 감싸, 성공하면 사이트 전체 페이지 캐시(ISR 30초)를 즉시 무효화.
// 한 데이터가 홈·목록·캘린더·대회 탭 등 여러 페이지에 동시에 쓰이므로 경로를 하나하나 고르지 않고 전체를 갱신 —
// 페이지 수가 적어 다음 방문 때 다시 그리는 비용은 무시할 만함.
// 변경이 DB에 반영된 "뒤"에 무효화해야, 그 사이 들어온 요청이 옛 데이터로 캐시를 다시 채우지 않음
// (브라우저에 남은 페이지 캐시는 lib/adminClient.ts → components/AdminDataRefresher.tsx에서 비움)
export function revalidatesSite<A extends unknown[]>(handler: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    const res = await handler(...args);
    if (res.ok) revalidatePath('/', 'layout');
    return res;
  };
}
