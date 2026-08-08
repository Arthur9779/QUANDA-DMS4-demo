import { expect, test } from "@playwright/test";

test("creates and restores a bilingual demo roadmap", async ({ page }, testInfo) => {
  await page.goto("/");

  await expect(page.locator(".hero")).toHaveCSS(
    "background-image",
    /hero-vector-garden\.svg/,
  );

  const loadExample = page.getByRole("button", { name: "Load example" });
  await expect(loadExample).toBeEnabled();
  if (testInfo.project.name === "chromium") {
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "QUANDA home" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "How it works" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "EN", exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "VI", exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(loadExample).toBeFocused();
    await page.keyboard.press("Enter");
  } else {
    await loadExample.click();
  }

  await page.getByRole("button", { name: "Generate my roadmap" }).click();

  await expect(page.locator("#roadmap-results")).toBeVisible();
  await expect(page.locator(".stage-card")).toHaveCount(8);

  await page.getByRole("button", { name: "VI", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Lộ trình làm hoạt hình sản phẩm 20 giây" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Tạo lại" })).toBeVisible();

  const firstStage = page.getByTestId("stage-completion").first();
  await firstStage.check();
  await expect(firstStage).toBeChecked();
  await expect(page.locator(".stage-card").first()).toHaveClass(/stage-card-collapsed/);
  await expect(page.locator(".stage-card").first().locator(".stage-content")).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.localStorage.getItem("quanda:v1:completion"),
      ),
    )
    .toContain("brief");

  await page.reload();
  await expect(page.getByTestId("stage-completion").first()).toBeChecked();
  await expect(page.getByRole("button", { name: "Tạo lại" })).toBeVisible();
  await expect(page.getByTestId("project-calendar")).toBeVisible();
});
