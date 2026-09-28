// 스플래시는 앱을 새로 열 때(브라우저 탭/홈 화면 앱 세션당) 한 번만 — 새로고침이나 알림 탭으로 인한
// 전체 페이지 로드마다 1초 넘게 화면을 가리던 것을 없앰. sessionStorage는 탭(앱)이 살아있는 동안만 유지됨
export const SPLASH_SESSION_KEY = 'ekum-splash-shown';

// 이미 본 세션이면 HTML이 그려지기 전에 <html data-splash-skip>을 붙여 CSS로 스플래시를 즉시 숨김
// (React 하이드레이션까지 기다리면 그 사이 스플래시가 잠깐 비쳤다 사라짐)
export const SPLASH_SKIP_SCRIPT = `try{if(sessionStorage.getItem('${SPLASH_SESSION_KEY}'))document.documentElement.setAttribute('data-splash-skip','')}catch(e){}`;
