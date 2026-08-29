import { expect, test } from "@playwright/test";

test("scores viable application routes and uses the winner for tutorial planning", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Project brief").fill(
    "Create a 20-second animated Bauhaus social poster with typography moving in time to music and export a final MP4. I have never used Blender.",
  );
  await page.getByRole("button", { name: "Choose my workflow" }).click();
  await page.getByLabel("Current experience").fill(
    "After Effects: intermediate. Blender: complete beginner.",
  );
  await page.getByRole("button", { name: "Understand my project" }).click();

  const paths = page.locator("#application-path-comparison");
  const learning = page.locator("#learning-path-review");
  await expect(paths).toBeVisible();
  await expect(learning).toBeVisible();
  await expect(paths.getByText("Recommended path")).toBeVisible();
  await expect(paths.getByText("Adobe After Effects", { exact: true }).first())
    .toBeVisible();
  await expect(paths.getByText("Other viable routes considered")).toBeVisible();
  await expect(paths.locator(".application-path-alternative").first()).toBeVisible();
  await expect(paths.locator(".application-path-score")).toContainText("/100");

  await paths.locator(".application-path-alternative").first().click();
  await expect(paths.getByText("Why the winner fits better").first()).toBeVisible();
  await expect(paths.getByText(/ranks above/).first()).toBeVisible();

  const positions = await page.locator(
    "#application-path-comparison, #learning-path-review",
  ).evaluateAll((elements) => elements.map((element) => element.id));
  expect(positions).toEqual([
    "application-path-comparison",
    "learning-path-review",
  ]);
  await expect(learning.getByText("Basic viewport navigation", { exact: true }))
    .toHaveCount(0);
});
