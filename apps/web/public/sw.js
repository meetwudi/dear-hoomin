self.addEventListener("push", (event) => {
  event.waitUntil(
    self.registration.showNotification("Dear Hoomin", {
      body: "Push notifications are wired up.",
      icon: "/icon.svg",
      badge: "/icon.svg",
      tag: "dear-hoomin-login-test",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow("/"));
});

