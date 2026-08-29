import { expect, test } from "@playwright/test";

const lastNightBrief =
  "Build a 2D top-down survival game called Last Night. The player controls a character on a small map and must survive enemy waves. The character can move, attack, and collect healing items. Enemies automatically find and approach the player. Each wave increases the number and difficulty of enemies. The game needs Start, Gameplay, Game Over, Restart, HP, score, survival time, at least three enemy types, and a playable Windows build.";

test("renders and persists the isolated engineering calendar for Last Night", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Project brief").fill(lastNightBrief);
  await page.getByRole("button", { name: "Choose my workflow" }).click();
  await page.getByLabel("Definition of done").fill(
    "The game supports Start, Gameplay, Game Over, Restart, movement, attacks, enemy waves, three enemy types, HP, damage, healing items, score, survival time, and a stable playable Windows build.",
  );
  await page.getByLabel("Preferred tools and technologies").fill("Godot 4, GDScript");
  await page.getByLabel("Deployment target").fill("Playable Windows build");
  await page.getByLabel("Current technical experience").fill("Basic programming knowledge; new to Godot and GDScript.");
  await page.getByLabel("Deadline").fill("2026-09-01");
  await page.getByRole("button", { name: "Review my build plan" }).click();

  await expect(page.getByRole("heading", { name: "Let’s shape your build plan" })).toBeVisible();
  await expect(page.locator("#creative-dna-review")).toHaveCount(0);
  await page.getByRole("button", { name: "Generate the engineering roadmap" }).click();
  await page.getByRole("button", { name: /Agentic project plan/ }).click();

  await expect(page.locator("#engineering-roadmap-results")).toBeVisible();
  await expect(page.locator("#engineering-guided-plan")).toHaveCount(0);
  await expect(page.getByTestId("project-calendar")).toBeVisible();
  await expect(page.locator(".engineering-task-card")).toHaveCount(9);

  const geometry = await page.evaluate(() => {
    const roadmap = document.querySelector("#engineering-roadmap-results")?.getBoundingClientRect();
    const calendar = document.querySelector("#calendar")?.getBoundingClientRect();
    return {
      calendarBelowRoadmap: Boolean(roadmap && calendar && calendar.top + window.scrollY > roadmap.bottom + window.scrollY),
      width: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    };
  });
  expect(geometry.calendarBelowRoadmap).toBe(true);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.width);

  const dayWithTask = page.locator('[data-testid="calendar-day"]').filter({ hasText: "Initialize the project workspace" }).first();
  await dayWithTask.click();
  const taskCheckbox = page.getByTestId("calendar-task").first().getByRole("checkbox");
  await taskCheckbox.check();
  await page.reload();
  await page.locator('[data-testid="calendar-day"]').filter({ hasText: "Initialize the project workspace" }).first().click();
  await expect(page.getByTestId("calendar-task").first().getByRole("checkbox")).toBeChecked();
  await expect(page.locator("#creative-dna-review")).toHaveCount(0);
});
