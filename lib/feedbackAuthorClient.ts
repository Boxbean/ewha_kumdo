// 이 기기에서 쓴(또는 비밀번호로 확인한) 피드백 글의 글쓴이 토큰 — 댓글을 "글쓴이"로 표시할 때 사용

const STORAGE_KEY = 'feedback_author_tokens';

function readAll(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function getAuthorToken(postId: string): string | null {
  return readAll()[postId] || null;
}

export function saveAuthorToken(postId: string, token: string) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readAll(), [postId]: token }));
  } catch {
    // 저장소를 쓸 수 없는 환경(사생활 보호 모드 등)에서는 저장하지 않음
  }
}
