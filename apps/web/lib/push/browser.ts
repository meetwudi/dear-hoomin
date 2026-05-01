export function isPushSupported() {
  return (
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replaceAll("-", "+").replaceAll("_", "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    output[index] = rawData.charCodeAt(index);
  }

  return output;
}

export async function getPushSubscription({
  registration,
  publicKey,
  forceNew = false,
}: {
  registration: ServiceWorkerRegistration;
  publicKey: string;
  forceNew?: boolean;
}) {
  const existingSubscription = await registration.pushManager.getSubscription();

  if (existingSubscription && forceNew) {
    await existingSubscription.unsubscribe();
  }

  if (existingSubscription && !forceNew) {
    return existingSubscription;
  }

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
}
