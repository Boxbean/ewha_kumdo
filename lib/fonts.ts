import localFont from 'next/font/local';

// 외부 CDN(jsdelivr)에서 렌더 블로킹으로 받아오던 Pretendard를 next/font로 자체 호스팅 —
// 빌드 시 정적 자산으로 번들되어 preload/캐싱되고, 별도 네트워크 왕복이 사라짐
export const pretendard = localFont({
  src: '../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2',
  display: 'swap',
  weight: '45 920',
  variable: '--font-pretendard',
});
