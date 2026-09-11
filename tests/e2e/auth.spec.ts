import { expect, test } from "@playwright/test";

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
