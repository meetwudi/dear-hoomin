export function isPushSupported() {
  return (
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

const pushClientIdStorageKey = "dear-hoomin:push-client-id";

export function getPushClientId() {
  const existingClientId = window.localStorage.getItem(pushClientIdStorageKey);

  if (existingClientId) {
    return existingClientId;
  }

  const clientId =
    "randomUUID" in window.crypto
      ? window.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  window.localStorage.setItem(pushClientIdStorageKey, clientId);

  return clientId;
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

function bufferSourceToUint8Array(value: BufferSource | null) {
  if (!value) {
    return null;
  }

  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }

  return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
}

function equalBytes(left: Uint8Array, right: Uint8Array | null) {
  if (!right || left.byteLength !== right.byteLength) {
    return false;
  }

  for (let index = 0; index < left.byteLength; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }

  return true;
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
  const applicationServerKey = urlBase64ToUint8Array(publicKey);
  const existingSubscription = await registration.pushManager.getSubscription();
  const hasCurrentApplicationServerKey =
    existingSubscription &&
    equalBytes(
      applicationServerKey,
      bufferSourceToUint8Array(existingSubscription.options.applicationServerKey),
    );

  if (existingSubscription && (forceNew || !hasCurrentApplicationServerKey)) {
    await existingSubscription.unsubscribe();
  }

  if (existingSubscription && !forceNew && hasCurrentApplicationServerKey) {
    return existingSubscription;
  }

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });
}
