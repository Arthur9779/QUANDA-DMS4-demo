import { expect, test, type Page } from "@playwright/test";

async function openEngineeringReview(page: Page) {
  await page.goto("/");
  await page.getByLabel("Project brief").fill("Build a Next.js portfolio website with a searchable project gallery and a Vercel preview.");
  await page.getByRole("button", { name: "Choose my workflow" }).click();
  await page.getByLabel("Definition of done").fill("The gallery works on mobile and desktop, is keyboard accessible, and the production build passes.");
  await page.getByLabel("Current technical experience").fill("I can review React code and run project scripts.");
  await page.getByRole("button", { name: "Review my build plan" }).click();
}

async function openExampleGuidedPreparation(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Load example" }).click();
  await expect(page.getByRole("heading", { name: "Describe the build QUANDA should help you execute" })).toBeVisible();
  await page.getByRole("button", { name: "Review my build plan" }).click();
  await page.getByRole("button", { name: /Guided tutorials/ }).click();
}

test("renders only the selected preparation method", async ({ page }) => {
  await openExampleGuidedPreparation(page);
  await expect(page.locator("#engineering-guided-plan")).toBeVisible();
  await expect(page.locator("#engineering-roadmap-results")).toHaveCount(0);
  await expect(page.getByText("This is not a general programming course.")).toBeVisible();
  await expect(page.getByTestId("project-calendar")).toBeVisible();
  const routeEvaluation = page.locator(".route-evaluation");
  await expect(routeEvaluation).toBeVisible();
  await expect(page.locator(".route-evaluation .route-score-item")).toHaveCount(6);
  await expect.poll(() => page.evaluate(() => document.querySelector(".route-evaluation")?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY)).toBeLessThan(200);
  expect(await routeEvaluation.evaluate((element) => {
    const guidedPlan = document.querySelector("#engineering-guided-plan");
    return Boolean(guidedPlan && (element.compareDocumentPosition(guidedPlan) & Node.DOCUMENT_POSITION_FOLLOWING));
  })).toBe(true);
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
