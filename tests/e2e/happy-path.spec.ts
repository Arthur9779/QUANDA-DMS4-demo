import { expect, test } from "@playwright/test";

test("creates and restores a bilingual demo roadmap", async ({ page }, testInfo) => {
  await page.goto("/");

  await expect(
    page.getByText("No API key is configured, so QUANDA will use a dependable sample roadmap."),
  ).toHaveCount(0);
  await expect(page.locator(".workflow-progress")).toHaveCount(0);
  if (testInfo.project.name === "chromium") {
    await expect(page.getByRole("heading", { name: "Agentic planner find the most optimal path for the deadline" })).toBeVisible();
  }
  await expect(page.locator(".landing-entry-section")).toBeVisible();
  await expect(page.locator(".landing-entry-section .project-form")).toBeVisible();

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

  await expect(page.getByLabel("Project brief")).toHaveValue(/20-second product animation/);
  await page.getByRole("button", { name: "Choose my workflow" }).click();
  await page.getByRole("button", { name: "Understand my project" }).click();
  await expect(page.locator("#learning-path-review")).toBeVisible();
  await expect(page.locator("#creative-dna-review")).toHaveCount(0);
  await page.getByRole("button", { name: "Continue to my roadmap" }).click();

  await expect(page.locator("#roadmap-results")).toBeVisible();
  await expect(page.locator(".stage-card")).toHaveCount(8);
  await expect(page.locator(".tutorial-card").first()).toBeVisible();

  await page.getByRole("button", { name: "VI", exact: true }).click();
  await expect(
    page.getByText("Chưa cấu hình API key, vì vậy QUANDA sẽ dùng lộ trình mẫu đáng tin cậy."),
  ).toHaveCount(0);
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

test("routes software briefs into the separate agentic engineering workflow", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto("/");
  await page.getByLabel("Project brief").fill(
    "Build a small TypeScript sign-in website with validation, tests, and a verified production build for a class project.",
  );
  await page.getByRole("button", { name: "Choose my workflow" }).click();
  await expect(page.getByRole("heading", { name: "Describe the build QUANDA should help you execute" })).toBeVisible();
  await page.getByLabel("Definition of done").fill(
    "The sign-in form validates input, shows useful errors, has focused tests, and the production build passes.",
  );
  await page.getByLabel("Current technical experience").fill(
    "Complete beginner with TypeScript and Visual Studio Code",
  );
  await page.getByLabel("Preferred tools and technologies").fill("TypeScript, Next.js");
  await page.getByRole("button", { name: "Review my build plan" }).click();
  await expect(page.getByRole("heading", { name: "Choose how you want to prepare" })).toBeVisible();
  await expect(page.locator("#creative-dna-review")).toHaveCount(0);
  await expect(page.locator("#engineering-interpretation")).toHaveCount(0);
  await expect(page.locator("#learning-path-review")).toHaveCount(0);
  await page.getByRole("button", { name: /Agentic project plan/ }).click();
  await expect(page.locator("#engineering-roadmap-results")).toBeVisible();
  await expect(page.locator(".engineering-task-card")).toHaveCount(9);
  await expect(page.getByText("Agent-ready implementation prompt")).toBeVisible();
  await expect(page.getByText("Acceptance criteria", { exact: true }).last()).toBeVisible();
  await expect(page.getByText("Verification checks", { exact: true }).last()).toBeVisible();

  await page.getByRole("button", { name: "VI", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Thực thi pipeline sản xuất" })).toBeVisible();
  await expect(page.locator("#creative-dna-review")).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole("heading", { name: "Thực thi pipeline sản xuất" })).toBeVisible();

  const layout = await page.evaluate(() => ({
    width: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(layout.scrollWidth).toBe(layout.width);
  expect(consoleErrors).toEqual([]);
});
