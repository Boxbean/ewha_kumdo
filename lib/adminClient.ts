// 관리자 로그인/인증 모달에서 저장한 비밀번호를 관리자 쓰기 요청에 실어 보내기 위한 클라이언트 헬퍼

export function getAdminPassword(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('admin_pwd');
}

// fetch와 동일하게 쓰되, 저장된 관리자 비밀번호가 있으면 x-admin-password 헤더를 자동으로 실어 보냄
export function adminFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const password = getAdminPassword();
  if (password) headers.set('x-admin-password', password);
  return fetch(input, { ...init, headers });
}
