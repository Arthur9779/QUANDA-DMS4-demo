import { expect, test } from "@playwright/test";

test("creates and restores a bilingual demo roadmap", async ({ page }, testInfo) => {
  await page.goto("/");

  await expect(
    page.getByText("No API key is configured, so QUANDA will use a dependable sample roadmap."),
  ).toHaveCount(0);

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

  await page.getByRole("button", { name: "Understand my project" }).click();
  await expect(page.getByRole("heading", { name: "QUANDA understood your project" })).toBeVisible();
  await page.getByRole("button", { name: "Looks right — continue" }).click();

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

test("preserves a custom coding environment and supplies guides without unrelated videos", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto("/");
  await expect(page.getByText(
    "Can’t find your tool? Choose ‘Other’ and enter any application, platform, coding environment, or software you need.",
  )).toBeVisible();

  await page.getByLabel("Project brief").fill(
    "Build a small TypeScript sign-in page with validation, tests, and a verified production build for a class project.",
  );
  await page.getByLabel("Current experience").fill(
    "Complete beginner with TypeScript and Visual Studio Code",
  );
  const applicationsFieldset = page.getByRole("group", {
    name: /Required application\(s\)/,
  });
  await applicationsFieldset.getByLabel("Other", { exact: true }).check();
  await page.getByLabel("Other application, tool, or platform").fill(
    "Visual Studio Code",
  );
  await page.getByLabel("Desired output type").selectOption("other");
  await page.getByRole("button", { name: "Understand my project" }).click();
  await expect(page.getByRole("heading", { name: "QUANDA understood your project" })).toBeVisible();
  await page.getByRole("button", { name: "Looks right — continue" }).click();

  await expect(page.locator("#roadmap-results")).toBeVisible();
  await expect(page.getByTestId("quanda-guide").first()).toBeVisible();
  await expect(page.locator('[data-guide-kind="coding"]').first()).toBeVisible();
  await expect(page.getByText("Visual Studio Code", { exact: true }).first())
    .toBeVisible();
  await expect(page.locator(".tutorial-card")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Watch on YouTube" })).toHaveCount(0);

  const proceduralGuide = page.locator('[data-guide-kind="procedural"]').first();
  await expect(proceduralGuide).toBeVisible();
  await expect(proceduralGuide.getByTestId("tutorial-status")).toContainText(
    "no video is required",
  );

  await page.getByRole("button", { name: "VI", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Hướng dẫn QUANDA" }).first())
    .toBeVisible();
  await expect(page.getByText("Visual Studio Code", { exact: true }).first())
    .toBeVisible();
  await expect(page.locator(".tutorial-card")).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole("heading", { name: "Hướng dẫn QUANDA" }).first())
    .toBeVisible();
  await expect(page.getByText("Visual Studio Code", { exact: true }).first())
    .toBeVisible();

  const layout = await page.evaluate(() => ({
    width: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(layout.scrollWidth).toBe(layout.width);
  expect(consoleErrors).toEqual([]);
});
