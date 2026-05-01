import { createPrivateKey, createSign } from "node:crypto";
import { deletePushSubscriptionByEndpoint, type StoredPushSubscription } from "./store";

// Platform note: update harness/platform-dependencies.md when Web Push changes.

type VapidConfig = {
  subject: string;
  publicKey: string;
  privateKey: string;
};

function toBase64Url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function fromBase64Url(input: string) {
  const normalized = input.replaceAll("-", "+").replaceAll("_", "/");
  return Buffer.from(normalized, "base64");
}

function readVapidConfig(): VapidConfig | null {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!subject || !publicKey || !privateKey) {
    return null;
  }

  return { subject, publicKey, privateKey };
}

function getAudience(endpoint: string) {
  const url = new URL(endpoint);
  return `${url.protocol}//${url.host}`;
}

function derToJose(signature: Buffer) {
  let offset = 3;
  let rLength = signature[offset - 1];

  if (signature[offset] === 0) {
    offset += 1;
    rLength -= 1;
  }

  const r = signature.subarray(offset, offset + rLength);
  offset += rLength + 2;

  let sLength = signature[offset - 1];

  if (signature[offset] === 0) {
    offset += 1;
    sLength -= 1;
  }

  const s = signature.subarray(offset, offset + sLength);

  return Buffer.concat([
    Buffer.concat([Buffer.alloc(Math.max(0, 32 - r.length)), r]).subarray(-32),
    Buffer.concat([Buffer.alloc(Math.max(0, 32 - s.length)), s]).subarray(-32),
  ]);
}

function createVapidJwt(config: VapidConfig, audience: string) {
  const publicKeyBytes = fromBase64Url(config.publicKey);
  const privateKeyBytes = fromBase64Url(config.privateKey);

  if (publicKeyBytes.length !== 65 || publicKeyBytes[0] !== 4) {
    throw new Error("VAPID public key must be an uncompressed P-256 key");
  }

  const keyObject = createPrivateKey({
    format: "jwk",
    key: {
      kty: "EC",
      crv: "P-256",
      x: toBase64Url(publicKeyBytes.subarray(1, 33)),
      y: toBase64Url(publicKeyBytes.subarray(33, 65)),
      d: toBase64Url(privateKeyBytes),
    },
  });
  const header = toBase64Url(JSON.stringify({ typ: "JWT", alg: "ES256" }));
  const payload = toBase64Url(
    JSON.stringify({
      aud: audience,
      exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
      sub: config.subject,
    }),
  );
  const signer = createSign("SHA256");
  signer.update(`${header}.${payload}`);
  signer.end();

  return `${header}.${payload}.${toBase64Url(derToJose(signer.sign(keyObject)))}`;
}

export async function sendTemporaryLoginTestNotification(
  subscription: StoredPushSubscription,
) {
  const config = readVapidConfig();

  if (!config) {
    return { status: "missing_vapid_config" as const };
  }

  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      authorization: `vapid t=${createVapidJwt(
        config,
        getAudience(subscription.endpoint),
      )}, k=${config.publicKey}`,
      "crypto-key": `p256ecdsa=${config.publicKey}`,
      ttl: "60",
      urgency: "normal",
    },
  });

  if (response.status === 404 || response.status === 410) {
    await deletePushSubscriptionByEndpoint(subscription.endpoint);
    return { status: "expired_subscription" as const };
  }

  if (!response.ok) {
    return { status: "send_failed" as const, code: response.status };
  }

  return { status: "sent" as const };
}
