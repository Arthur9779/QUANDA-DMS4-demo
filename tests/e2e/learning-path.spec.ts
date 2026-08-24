import { expect, test } from "@playwright/test";

test("corrects and persists the focused learning path", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Project brief").fill(
    "I am new to Blender and need to make a toon-shaded product animation with a simple camera move.",
  );
  await page.getByLabel("Current experience").fill("Blender: complete beginner");
  await page.getByLabel("Search applications").fill("Blender");
  await page.getByRole("button", { name: "Add application: Blender" }).click();
  await page.getByRole("button", { name: "Understand my project" }).click();
  await page.getByRole("button", { name: "Looks right — continue" }).click();

  const learning = page.locator("#learning-path-review");
  await expect(learning).toBeVisible();
  await expect(learning.getByText("Toon shading", { exact: true })).toBeVisible();
  await expect(learning.getByRole("heading", { name: "Blender", exact: true }))
    .toHaveCount(0);
  for (const label of [
    "Lighting the product",
    "Camera basics",
    "Render settings",
    "Final render and export",
    "Camera animation",
  ]) {
    const card = learning.locator(".learning-need-card").filter({
      has: page.getByRole("heading", { name: label, exact: true }),
    });
    await expect(card).toHaveCount(1);
    await expect(card.locator(".matched-tutorial-card")).toBeVisible();
    await expect(card.getByText("No suitable verified tutorial found"))
      .toHaveCount(0);
  }
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

test("carries every selected Figma tutorial into the roadmap and clears it after the brief changes", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Project brief").fill(
    "Design a mobile museum guide in Figma with a reusable component system, responsive auto layout, and an interactive prototype for usability testing.",
  );
  await page.getByLabel("Current experience").fill(
    "I understand basic frames but need help with components, auto layout, and prototyping.",
  );
  await page.getByLabel("Search applications").fill("Figma");
  await page.getByRole("button", { name: "Add application: Figma" }).click();
  await page.getByRole("button", { name: "Understand my project" }).click();
  await page.getByRole("button", { name: "Looks right — continue" }).click();

  const learning = page.locator("#learning-path-review");
  await expect(learning).toBeVisible();
  const selectedTitles = await learning
    .locator(".matched-tutorial-card h5")
    .allTextContents();
  expect(selectedTitles.length).toBeGreaterThan(1);

  await learning
    .getByRole("button", { name: "Continue to my roadmap" })
    .click();
  const roadmap = page.locator("#roadmap-results");
  await expect(roadmap).toBeVisible();
  for (const title of [...new Set(selectedTitles)]) {
    await expect(
      roadmap.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
  }

  await roadmap.getByRole("button", { name: "Edit input" }).click();
  await page.getByLabel("Project brief").fill(
    "Create a projection-mapped TouchDesigner installation controlled by body movement.",
  );
  await expect(roadmap).toHaveCount(0);
  await page.reload();
  await expect(page.locator("#roadmap-results")).toHaveCount(0);
});
