import { expect, test } from "@playwright/test";

async function expectDialogReachable(page: import("@playwright/test").Page, viewport: { width: number; height: number }) {
  const dialog = page.getByRole("dialog");
  const overlay = page.locator(".auth-modal-backdrop");
  await expect(dialog).toBeVisible();
  await overlay.evaluate((element) => { element.scrollTop = 0; });

  const topBox = await dialog.boundingBox();
  expect(topBox).not.toBeNull();
  expect(topBox!.x).toBeGreaterThanOrEqual(0);
  expect(topBox!.y).toBeGreaterThanOrEqual(0);
  expect(topBox!.x + topBox!.width).toBeLessThanOrEqual(viewport.width + 1);
  await expect(dialog.locator("h2")).toBeVisible();

  const guestAction = page.getByRole("button", { name: /Continue without account|Tiếp tục không cần tài khoản/i });
  await guestAction.scrollIntoViewIfNeeded();
  const bottomBox = await guestAction.boundingBox();
  expect(bottomBox).not.toBeNull();
  expect(bottomBox!.y).toBeGreaterThanOrEqual(0);
  expect(bottomBox!.y + bottomBox!.height).toBeLessThanOrEqual(viewport.height + 1);
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
}

test("keeps accounts optional and exposes accessible bilingual account controls", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto("/");
  await expect(page.locator(".landing-entry-form")).toBeVisible();

  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("dialog", { name: "Log in" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();

  await page.getByRole("button", { name: /have an account.*Create one/i }).click();
  await expect(page.getByRole("dialog", { name: "Create account" })).toBeVisible();
  await expect(page.getByLabel("Display name")).toBeVisible();
  await expect(page.getByLabel("Confirm password")).toBeVisible();
  await page.getByRole("button", { name: "Continue without account" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".landing-entry-form")).toBeVisible();

  await page.getByRole("button", { name: "VI", exact: true }).click();
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page.getByRole("dialog", { name: "Đăng nhập" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tiếp tục không cần tài khoản" })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(consoleErrors).toEqual([]);
});

test("keeps login and registration reachable across short viewports and zoom", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Explicit viewport matrix runs once in desktop Chromium.");

  const cases = [
    { width: 1440, height: 900, zoom: 1 },
    { width: 1366, height: 768, zoom: 1 },
    { width: 1280, height: 720, zoom: 1 },
    { width: 1280, height: 600, zoom: 1 },
    { width: 1366, height: 650, zoom: 1 },
    { width: 1024, height: 768, zoom: 1 },
    { width: 768, height: 1024, zoom: 1 },
    { width: 430, height: 932, zoom: 1 },
    { width: 390, height: 844, zoom: 1.25 },
    { width: 375, height: 667, zoom: 1.5 },
  ];

  for (const viewport of cases) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.evaluate((zoom) => { document.body.style.zoom = String(zoom); }, viewport.zoom);

    const initialScroll = await page.evaluate(() => window.scrollY);
    await page.getByRole("button", { name: "Log in" }).click();
    await expectDialogReachable(page, viewport);
    await expect(page.getByLabel("Email")).toBeFocused();

    if (viewport.width === 1440 && viewport.height === 900) {
      const box = await page.getByRole("dialog").boundingBox();
      expect(Math.abs(box!.y - (viewport.height - (box!.y + box!.height)))).toBeLessThanOrEqual(2);
    }

    await page.getByRole("button", { name: /have an account.*Create one/i }).click();
    await expect(page.getByRole("dialog", { name: "Create account" })).toBeVisible();
    await expectDialogReachable(page, viewport);
    await expect(page.getByLabel("Display name")).toBeFocused();
    expect(await page.evaluate(() => window.scrollY)).toBe(initialScroll);

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  }
});
