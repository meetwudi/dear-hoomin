import { devices, expect, test } from "@playwright/test";
import { signInAsHoomin } from "./support/auth";
import {
  cleanupTestHoomin,
  closeDb,
  createTestFamily,
  createTestHoomin,
  listPushSubscriptionsForHoomin,
} from "./support/db";

declare global {
  interface Window {
    __e2ePushState: () => {
      permission: NotificationPermission;
      subscribeCount: number;
      unsubscribeCount: number;
    };
  }
}

test.afterAll(async () => {
  await closeDb();
});

test("iOS family notification enablement registers one reusable browser push subscription", async ({
  browser,
}) => {
  const hoomin = await createTestHoomin("iOS Push Hoomin");
  const family = await createTestFamily(hoomin.id, "iOS push household");
  const context = await browser.newContext({
    ...devices["iPhone 14"],
  });

  await context.addInitScript(() => {
    let permission: NotificationPermission = "default";
    let subscription: PushSubscription | null = null;
    let subscribeCount = 0;
    let unsubscribeCount = 0;

    class MockNotification {
      static get permission() {
        return permission;
      }

      static async requestPermission() {
        permission = "granted";
        return permission;
      }
    }

    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: MockNotification,
    });
    Object.defineProperty(window, "PushManager", {
      configurable: true,
      value: class MockPushManager {},
    });
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        ready: Promise.resolve({
          pushManager: {
            async getSubscription() {
              return subscription;
            },
            async subscribe(options: PushSubscriptionOptionsInit) {
              subscribeCount += 1;
              subscription = {
                endpoint: "https://ios.push.example.test/subscription-1",
                expirationTime: null,
                options,
                async unsubscribe() {
                  unsubscribeCount += 1;
                  subscription = null;
                  return true;
                },
                getKey(name: PushEncryptionKeyName) {
                  if (name === "p256dh") {
                    return new TextEncoder().encode("ios-test-p256dh").buffer;
                  }

                  return new TextEncoder().encode("ios-test-auth").buffer;
                },
                toJSON() {
                  return {
                    endpoint: "https://ios.push.example.test/subscription-1",
                    keys: {
                      auth: "ios-test-auth",
                      p256dh: "ios-test-p256dh",
                    },
                  };
                },
              } as PushSubscription;

              return subscription;
            },
          },
        }),
        async register(scriptUrl: string) {
          window.localStorage.setItem("e2e:last-service-worker-script", scriptUrl);

          return this.ready;
        },
      },
    });
    Object.defineProperty(window, "__e2ePushState", {
      configurable: true,
      value: () => ({
        permission,
        subscribeCount,
        unsubscribeCount,
      }),
    });
  });

  const page = await context.newPage();

  try {
    await signInAsHoomin(context, {
      hoominId: hoomin.id,
      email: hoomin.email,
      name: hoomin.name,
      picture: null,
    });

    await page.goto(`/families/${family.id}`);
    await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();
    await page
      .getByRole("dialog", { name: "Add Dear Hoomin to Home Screen" })
      .getByRole("button", { name: "Got it" })
      .click();

    await page.getByRole("button", { name: "Enable browser nudges" }).click();
    await expect(page.getByText("Tiny nudges are ready for this browser.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Refresh browser nudges" })).toBeVisible();

    const firstClientId = await page.evaluate(() =>
      window.localStorage.getItem("dear-hoomin:push-client-id"),
    );
    expect(firstClientId).toMatch(/[a-z0-9-]{8,}/i);
    await expect(
      page.evaluate(() => window.localStorage.getItem("e2e:last-service-worker-script")),
    ).resolves.toBe("/sw.js");
    await expect(page.evaluate(() => window.__e2ePushState())).resolves.toEqual({
      permission: "granted",
      subscribeCount: 1,
      unsubscribeCount: 0,
    });

    await expect
      .poll(async () => listPushSubscriptionsForHoomin(hoomin.id))
      .toEqual([
        expect.objectContaining({
          auth: "ios-test-auth",
          client_id: firstClientId,
          endpoint: "https://ios.push.example.test/subscription-1",
          p256dh: "ios-test-p256dh",
        }),
      ]);

    await page.getByRole("button", { name: "Refresh browser nudges" }).click();
    await expect(page.getByText("Tiny nudges are ready for this browser.")).toBeVisible();

    await expect(page.evaluate(() => window.__e2ePushState())).resolves.toEqual({
      permission: "granted",
      subscribeCount: 1,
      unsubscribeCount: 0,
    });
    await expect(
      page.evaluate(() => window.localStorage.getItem("dear-hoomin:push-client-id")),
    ).resolves.toBe(firstClientId);
    await expect
      .poll(async () => listPushSubscriptionsForHoomin(hoomin.id))
      .toEqual([
        expect.objectContaining({
          client_id: firstClientId,
          endpoint: "https://ios.push.example.test/subscription-1",
        }),
      ]);
  } finally {
    await context.close();
    await cleanupTestHoomin(hoomin.id);
  }
});

test("service worker displays pushed notification payloads and opens their URL", async ({
  page,
}) => {
  await page.goto("/login");

  const serviceWorkerResult = await page.evaluate(async () => {
    const source = await fetch("/sw.js").then((response) => response.text());
    const listeners: Record<string, (event: never) => void> = {};
    const shownNotifications: Array<{
      title: string;
      options: NotificationOptions;
    }> = [];
    const openedUrls: string[] = [];
    const fakeSelf = {
      addEventListener(type: string, handler: (event: never) => void) {
        listeners[type] = handler;
      },
      clients: {
        async openWindow(url: string) {
          openedUrls.push(url);
        },
      },
      registration: {
        async showNotification(title: string, options: NotificationOptions) {
          shownNotifications.push({ title, options });
        },
      },
    };
    const runner = new Function("self", source);

    runner(fakeSelf);
    await new Promise<void>((resolve) => {
      listeners.push({
        data: {
          json: () => ({
            body: "Mochi has a tiny thought.",
            tag: "dear-hoomin-thought-family-1",
            title: "Mochi has a tiny thought",
            url: "/?tab=thoughts",
          }),
        },
        waitUntil(promise: Promise<unknown>) {
          promise.then(() => resolve());
        },
      } as never);
    });
    await new Promise<void>((resolve) => {
      listeners.notificationclick({
        notification: {
          close() {
            return undefined;
          },
          data: {
            url: "/?tab=thoughts",
          },
        },
        waitUntil(promise: Promise<unknown>) {
          promise.then(() => resolve());
        },
      } as never);
    });

    return {
      openedUrls,
      shownNotifications,
    };
  });

  expect(serviceWorkerResult).toEqual({
    openedUrls: ["/?tab=thoughts"],
    shownNotifications: [
      {
        options: expect.objectContaining({
          badge: "/icon.svg",
          body: "Mochi has a tiny thought.",
          data: {
            url: "/?tab=thoughts",
          },
          icon: "/icon.svg",
          tag: "dear-hoomin-thought-family-1",
        }),
        title: "Mochi has a tiny thought",
      },
    ],
  });
});
