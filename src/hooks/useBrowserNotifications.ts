import { useCallback, useEffect, useState } from "react";

import { notificationsApi } from "../api/services";

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

export function useBrowserNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification === "undefined" ? "denied" : Notification.permission,
  );

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  const registerPushSubscription = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    const config = await notificationsApi.pushPublicKey().catch(() => null);
    if (!config?.enabled || !config.publicKey) return;
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.publicKey),
      }));
    await notificationsApi.savePushSubscription(subscription.toJSON());
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return "denied" as NotificationPermission;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      await registerPushSubscription().catch(() => undefined);
    }
    return result;
  }, [registerPushSubscription]);

  const notify = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (typeof Notification === "undefined" || permission !== "granted") return;
      navigator.serviceWorker?.ready
        .then((registration) => registration.showNotification(title, options))
        .catch(() => new Notification(title, options));
    },
    [permission],
  );

  return { permission, requestPermission, notify };
}
