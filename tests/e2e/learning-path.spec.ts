import { expect, test } from "@playwright/test";

test("corrects and persists the focused learning path", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Project brief").fill(
    "I am new to Blender and need to make a toon-shaded product animation with a simple camera move.",
  );
  await page.getByLabel("Current experience").fill("Blender: complete beginner");
  await page.getByLabel("Blender", { exact: true }).check();
  await page.getByRole("button", { name: "Understand my project" }).click();
  await page.getByRole("button", { name: "Looks right — continue" }).click();

  const learning = page.locator("#learning-path-review");
  await expect(learning).toBeVisible();
  await expect(learning.getByText("Toon shading", { exact: true })).toBeVisible();
  await expect(learning.getByText("Complete Blender Beginner Course — 6 Hours"))
    .toHaveCount(0);

  const firstCard = learning.locator(".learning-need-card").first();
  const firstLabel = await firstCard.getByRole("heading", { level: 4 }).textContent();
  await firstCard.getByRole("button", { name: "I already know this" }).click();
  await expect(learning.getByText(firstLabel ?? "", { exact: true })).toBeVisible();
  await expect.poll(() =>
    page.evaluate(() => window.localStorage.getItem("quanda:v1:learning-plan")),
  ).toContain('"status":"known"');

  const replace = learning.getByRole("button", { name: "Replace" }).first();
  if (await replace.count()) {
    const titleBefore = await learning.locator(".matched-tutorial-card h5").first().textContent();
    await replace.click();
    await expect(learning.locator(".matched-tutorial-card h5").first())
      .not.toHaveText(titleBefore ?? "");
  }

  await page.reload();
  await expect(page.locator("#learning-path-review")).toBeVisible();
  await expect(page.getByText(firstLabel ?? "", { exact: true })).toBeVisible();
});
