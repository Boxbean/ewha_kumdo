'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

interface InstagramEmbedProps {
  url: string;
}

// 인스타그램 공식 embed.js 위젯 — 비공개 계정/삭제된 게시물/광고 차단기 등으로
// 위젯이 조용히 렌더링에 실패할 수 있어, 항상 링크아웃 버튼과 함께 쓰는 것을 전제로 함 (ShortsPlayer 참고)
export default function InstagramEmbed({ url }: InstagramEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.instgrm?.Embeds.process();
  }, [url]);

  return (
    <div ref={containerRef}>
      <Script
        src="https://www.instagram.com/embed.js"
        strategy="lazyOnload"
        onLoad={() => window.instgrm?.Embeds.process()}
      />
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={url}
        data-instgrm-version="14"
        style={{ width: '100%', margin: 0 }}
      />
    </div>
  );
}
