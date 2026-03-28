import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EWHA Kumdo",
  description: "이화여대 검도부 훈련 영상 아카이브",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "'Pretendard', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
