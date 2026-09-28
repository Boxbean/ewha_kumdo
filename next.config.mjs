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
  // 검색이 홈(/?search=)에서 /search로 옮겨감 — 예전 주소로 들어와도 결과가 보이도록
  async redirects() {
    return [
      {
        source: '/',
        has: [{ type: 'query', key: 'search', value: '(?<q>.+)' }],
        destination: '/search?q=:q',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
