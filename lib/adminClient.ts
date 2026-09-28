// 관리자 로그인/인증 모달에서 저장한 비밀번호를 관리자 쓰기 요청에 실어 보내기 위한 클라이언트 헬퍼

export function getAdminPassword(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('admin_pwd');
}

// fetch와 동일하게 쓰되, 저장된 관리자 비밀번호가 있으면 x-admin-password 헤더를 자동으로 실어 보냄
export async function adminFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const password = getAdminPassword();
  if (password) headers.set('x-admin-password', password);
  const res = await fetch(input, { ...init, headers });
  // 등록·수정·삭제가 성공하면 브라우저에 남아 있는 페이지 캐시를 비우도록 알림 (components/AdminDataRefresher.tsx)
  // — 서버 캐시는 API에서 비우지만(lib/revalidate.ts), 이미 받아둔 탭 화면은 최대 5분까지 그대로 재사용되기 때문
  const method = (init.method || 'GET').toUpperCase();
  if (res.ok && method !== 'GET') window.dispatchEvent(new Event(ADMIN_DATA_CHANGED));
  return res;
}

export const ADMIN_DATA_CHANGED = 'admin-data-changed';
