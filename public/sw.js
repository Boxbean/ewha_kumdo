self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {});

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || "영상이 업로드되었어요", {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (wins) => {
      // 앱이 이미 열려 있으면 새 창 대신 그 창을 알림 주소로 이동
      const win = wins[0];
      if (win && "navigate" in win) {
        try {
          const navigated = await win.navigate(url);
          return (navigated || win).focus();
        } catch (e) {
          // 이 서비스워커가 제어하지 않는 창이면 navigate가 실패 — 새 창으로 대체
        }
      }
      return clients.openWindow(url);
    })
  );
});
