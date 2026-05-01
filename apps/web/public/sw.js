self.addEventListener("push", (event) => {
  const payload = event.data?.json() ?? {};

  event.waitUntil(
    self.registration.showNotification(payload.title ?? "Dear Hoomin", {
      body: payload.body ?? "Push notifications are wired up.",
      icon: "/icon.svg",
      badge: "/icon.svg",
      tag: payload.tag ?? "dear-hoomin-login-test",
      data: {
        url: payload.url ?? "/",
      },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data?.url ?? "/"));
});
