import { expect, test, type Page } from "@playwright/test";

async function openEngineeringReview(page: Page) {
  await page.goto("/");
  await page.getByLabel("Project brief").fill("Build a Next.js portfolio website with a searchable project gallery and a Vercel preview.");
  await page.getByRole("button", { name: "Choose my workflow" }).click();
  await page.getByLabel("Definition of done").fill("The gallery works on mobile and desktop, is keyboard accessible, and the production build passes.");
  await page.getByLabel("Current technical experience").fill("I can review React code and run project scripts.");
  await page.getByRole("button", { name: "Review my build plan" }).click();
}

test("renders only the selected preparation method", async ({ page }) => {
  await openEngineeringReview(page);
  await expect(page.getByRole("heading", { name: "Choose how you want to prepare" })).toBeVisible();
  await page.getByRole("button", { name: /Guided tutorials/ }).click();
  await expect(page.locator("#engineering-guided-plan")).toBeVisible();
  await expect(page.locator("#engineering-roadmap-results")).toHaveCount(0);
  await expect(page.getByText("This is not a general programming course.")).toBeVisible();
});

test("agentic preparation produces concrete verifiable tasks", async ({ page }) => {
  await openEngineeringReview(page);
  await page.getByRole("button", { name: /Agentic project plan/ }).click();
  await expect(page.locator("#engineering-roadmap-results")).toBeVisible();
  await expect(page.locator(".engineering-task-card")).toHaveCount(9);
  await expect(page.getByText("Acceptance criteria").first()).toBeVisible();
  await expect(page.getByText("Verification checks").first()).toBeVisible();
  await expect(page.getByText("Agent-ready implementation prompt").first()).toBeVisible();
  await expect(page.locator("#engineering-guided-plan")).toHaveCount(0);
});
