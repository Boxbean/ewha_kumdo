// 현재 사이트 기준 경로를 공유 — 모바일은 공유 시트, 미지원 환경은 링크 복사
export async function sharePath(path: string, title: string) {
  const url = `${window.location.origin}${path}`;
  try {
    if (navigator.share) await navigator.share({ title, url });
    else {
      await navigator.clipboard.writeText(url);
      alert('링크가 복사되었습니다.');
    }
  } catch {
    // 공유 시트를 닫은 경우 등은 무시
  }
}
