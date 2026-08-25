import { expect, test } from "@playwright/test";

const lastNightBrief =
  "Build a 2D top-down survival game called Last Night. The player moves around a small map, attacks enemies, and collects healing items. Enemies automatically find and approach the player, with increasingly difficult waves. The game needs Start, Gameplay, Game Over, HP, score, survival time, at least three enemy types, and a Windows playable build using Godot 4 and GDScript.";

test("keeps the design route status above the project form", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Project brief").fill(
    "Create a 20-second product animation in Blender for a university assignment. Deliver a 1080p MP4 with simple sound and a polished presentation.",
  );
  await page.getByRole("button", { name: "Choose my workflow" }).click();

  const clarification = page.getByRole("button", { name: /A creative or visual artifact/ });
  if (await clarification.count()) await clarification.click();

  const status = page.locator(".path-status");
  const form = page.locator("section.form-section#project-form");
  await expect(status).toBeVisible();
  await expect(form).toBeVisible();

  const statusBox = await status.boundingBox();
  const formBox = await form.boundingBox();
  expect(statusBox).not.toBeNull();
  expect(formBox).not.toBeNull();
  expect(statusBox!.y + statusBox!.height).toBeLessThanOrEqual(formBox!.y);
});

test("routes the Last Night brief into the software workflow", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Project brief").fill(lastNightBrief);
  await page.getByRole("button", { name: "Choose my workflow" }).click();

  const softwareChoice = page.getByRole("button", { name: /Working software or a technical system/ });
  if (await softwareChoice.count()) await softwareChoice.click();

  await expect(page.getByRole("heading", { name: "Describe the build QUANDA should help you execute" })).toBeVisible();
  await expect(page.locator("#creative-dna-review")).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "Target platform" })).toHaveValue("game");
});
