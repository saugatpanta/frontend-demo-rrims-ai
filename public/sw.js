self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "RRIMS notification";
  const options = {
    body: payload.body || payload.message || "New update available.",
    tag: payload.notificationId || payload.topic || "rrims-notification",
    data: {
      url: "/app/notifications",
      notificationId: payload.notificationId,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/app/notifications";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const target = clients.find((client) => "focus" in client);
      if (target) return target.focus();
      return self.clients.openWindow(url);
    }),
  );
});
