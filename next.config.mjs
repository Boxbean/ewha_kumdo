/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.youtube.com' },
    ],
    // YouTube가 이미 mqdefault.jpg(320x180)로 적절한 크기를 서빙하므로
    // Next의 재최적화(/_next/image)를 거치면 캐시 미스 시 장당 ~2초가 추가됨 — 원본을 그대로 사용
    unoptimized: true,
  },
};

export default nextConfig;
