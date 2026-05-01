import { expect, test, type TestInfo } from "@playwright/test";
import { signInAsHoomin } from "./support/auth";
import { cleanupTestHoomin, closeDb, createTestHoomin } from "./support/db";

async function pauseForVideo(page: { waitForTimeout(timeout: number): Promise<void> }) {
  await page.waitForTimeout(700);
}

function videoOptions(testInfo: TestInfo, name: string) {
  if (process.env.E2E_VIDEO !== "on") {
    return {};
  }

  return {
    recordVideo: {
      dir: testInfo.outputPath(name),
      size: { width: 1280, height: 720 },
    },
  };
}

test.afterAll(async () => {
  await closeDb();
});

test("family invite lets a second hoomin sign in and join", async ({ browser }, testInfo) => {
  const owner = await createTestHoomin("Invite Owner");
  const invitee = await createTestHoomin("Invite Hoomin");
  const ownerContext = await browser.newContext(videoOptions(testInfo, "owner"));
  const inviteeContext = await browser.newContext(videoOptions(testInfo, "invitee"));
  const ownerPage = await ownerContext.newPage();
  const inviteePage = await inviteeContext.newPage();

  try {
    await signInAsHoomin(ownerContext, {
      hoominId: owner.id,
      email: owner.email,
      name: owner.name,
      picture: null,
    });

    await ownerPage.goto("/");
    await expect(ownerPage.getByRole("heading", { name: "ready for tiny thoughts?" })).toBeVisible();
    await pauseForVideo(ownerPage);

    await ownerPage.getByLabel("Family name").fill("Invite E2E household");
    await ownerPage.getByRole("button", { name: "Create family" }).click();
    await expect(ownerPage).toHaveURL(/\/families\/[0-9a-f-]+$/);
    await expect(ownerPage.getByRole("heading", { name: "Invite E2E household" })).toBeVisible();

    await ownerPage.getByRole("button", { name: "Create invite link" }).click();
    const inviteInput = ownerPage.getByLabel("Latest invite link");
    await expect(inviteInput).toBeVisible();
    const inviteUrl = await inviteInput.inputValue();
    await expect(ownerPage.getByText(owner.email)).toBeVisible();
    await pauseForVideo(ownerPage);

    await inviteePage.goto(inviteUrl);
    await expect(inviteePage).toHaveURL(/\/login\?next=\/invite\//);
    await expect(inviteePage.getByRole("heading", { name: "see today's tiny thought." })).toBeVisible();
    await pauseForVideo(inviteePage);

    await signInAsHoomin(inviteeContext, {
      hoominId: invitee.id,
      email: invitee.email,
      name: invitee.name,
      picture: null,
    });

    await inviteePage.goto(inviteUrl);
    await expect(inviteePage.getByRole("heading", { name: "join Invite E2E household?" })).toBeVisible();
    await pauseForVideo(inviteePage);

    await inviteePage.getByRole("button", { name: "Join family" }).click();
    await expect(inviteePage).toHaveURL(/\/families\/[0-9a-f-]+$/);
    await expect(inviteePage.getByRole("heading", { name: "Invite E2E household" })).toBeVisible();
    await expect(inviteePage.getByText(owner.email)).toBeVisible();
    await expect(inviteePage.getByText(invitee.email)).toBeVisible();
    await pauseForVideo(inviteePage);
  } finally {
    await ownerContext.close();
    await inviteeContext.close();
    await cleanupTestHoomin(owner.id);
    await cleanupTestHoomin(invitee.id);
  }
});
