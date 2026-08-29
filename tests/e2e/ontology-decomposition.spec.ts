import { expect, test } from "@playwright/test";

test("uses quanda.skills to build a tutorial-backed Figma workflow", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Project brief").fill(
    "I know basic Figma. I need to design and prototype a responsive mobile banking app with reusable components and a tested user flow for a university assignment.",
  );
  await page.getByRole("button", { name: "Choose my workflow" }).click();
  await page.getByLabel("Current experience").fill(
    "I know Figma basics but not Auto Layout, components, user flows, or prototyping.",
  );
  await page.getByLabel("Desired output type").selectOption("uiux");
  await page.getByLabel("Search applications").fill("Figma");
  await page.getByRole("button", { name: "Add application: Figma", exact: true }).click();
  await page.getByRole("button", { name: "Understand my project" }).click();

  await expect(page.locator("#creative-dna-review")).toHaveCount(0);
  const learning = page.locator("#learning-path-review");
  await expect(learning).toBeVisible();
  for (const skill of [
    "Figma workspace basics",
    "Interface layout",
    "Responsive Auto Layout",
    "Components and design systems",
    "User-flow planning",
    "Interactive prototyping",
    "Asset and prototype export",
  ]) {
    await expect(learning.getByRole("heading", { name: skill })).toBeVisible();
  }
  await expect(learning.locator(".matched-tutorial-card")).toHaveCount(6);

  await page.getByRole("button", { name: "Continue to my roadmap" }).click();
  const roadmap = page.locator("#roadmap-results");
  await expect(roadmap).toBeVisible();
  await expect(roadmap.locator(".stage-card")).toHaveCount(8);
  await expect(roadmap.locator(".tutorial-card").first()).toBeVisible();
  await expect(
    roadmap.locator(".tutorial-card").filter({ hasText: /Blender|DaVinci|Photoshop/i }),
  ).toHaveCount(0);
});
