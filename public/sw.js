self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const target = clients.find((client) => "focus" in client);
      if (target) return target.focus();
      return self.clients.openWindow("/app/notifications");
    }),
  );
});
