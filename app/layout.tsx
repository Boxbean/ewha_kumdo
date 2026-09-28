import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import RegisterServiceWorker from "@/components/RegisterServiceWorker";
import AdminDataRefresher from "@/components/AdminDataRefresher";
import SplashScreen from "@/components/SplashScreen";
import { SPLASH_SKIP_SCRIPT } from "@/lib/splash";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "EWHA Kumdo",
  description: "이화여대 검도부 훈련 영상 아카이브",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "EKUM",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#00462A",
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 스플래시 생략 표시(data-splash-skip)는 아래 스크립트가 하이드레이션 전에 붙이므로 속성 불일치 경고를 끔
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SPLASH_SKIP_SCRIPT }} />
      </head>
      <body>
        <SplashScreen>{children}</SplashScreen>
        <RegisterServiceWorker />
        <AdminDataRefresher />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
