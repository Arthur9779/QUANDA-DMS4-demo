import { expect, test } from "@playwright/test";

test("keeps manual tasks and synchronises roadmap milestones", async ({ page }) => {
  await page.goto("/");

  const header = page.locator(".site-header");
  await page.evaluate(() => window.scrollTo(0, 1400));
  await expect.poll(() => header.evaluate((element) => element.getBoundingClientRect().top))
    .toBe(0);

  const calendar = page.getByTestId("project-calendar");
  await expect(calendar).toBeVisible();
  const taskPanel = calendar.locator(".task-panel");
  await taskPanel.getByPlaceholder("What needs to get done?").fill("Ask for feedback");
  await taskPanel.getByTestId("calendar-add-task").click();
  const manualTask = taskPanel.getByTestId("calendar-task").filter({
    hasText: "Ask for feedback",
  });
  await expect(manualTask).toBeVisible();

  await page.getByRole("button", { name: "Load example" }).click();
  await page.getByRole("button", { name: "Generate my roadmap" }).click();
  await expect(page.locator("#roadmap-results")).toBeVisible();

  const roadmapTask = await page.evaluate(() => {
    const tasks = JSON.parse(
      window.localStorage.getItem("quanda:v1:calendar-tasks") || "[]",
    );
    return tasks.find((task: { source: string }) => task.source === "roadmap");
  });
  expect(roadmapTask).toBeTruthy();

  const firstStage = page.locator(".stage-card").first();
  await firstStage.getByTestId("stage-completion").check();
  await expect(firstStage).toHaveClass(/stage-card-collapsed/);
  await expect.poll(() =>
    page.evaluate((taskId) => {
      const tasks = JSON.parse(
        window.localStorage.getItem("quanda:v1:calendar-tasks") || "[]",
      );
      return tasks.find((task: { id: string }) => task.id === taskId)?.done;
    }, roadmapTask.id),
  ).toBe(true);

  await calendar.locator(`[data-date="${roadmapTask.deadline}"]`).click();
  const syncedTask = calendar
    .locator('[data-source="roadmap"]')
    .filter({ hasText: roadmapTask.title });
  await expect(syncedTask.locator('input[type="checkbox"]')).toBeChecked();
  await syncedTask.locator('input[type="checkbox"]').uncheck();
  await expect(firstStage.getByTestId("stage-completion")).not.toBeChecked();
  await expect(firstStage).not.toHaveClass(/stage-card-collapsed/);

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Start over" }).click();
  await expect(page.locator("#roadmap-results")).toHaveCount(0);
  await expect.poll(() =>
    page.evaluate(() => {
      const tasks = JSON.parse(
        window.localStorage.getItem("quanda:v1:calendar-tasks") || "[]",
      );
      return {
        manual: tasks.filter((task: { source: string }) => task.source === "manual").length,
        roadmap: tasks.filter((task: { source: string }) => task.source === "roadmap").length,
      };
    }),
  ).toEqual({ manual: 1, roadmap: 0 });

  await page.reload();
  const restoredManualTask = page
    .locator('.task-item[data-source="manual"]')
    .filter({ hasText: "Ask for feedback" });
  await expect(restoredManualTask).toBeVisible();
  await restoredManualTask.getByRole("button", { name: /Delete task/ }).click();
  await expect(restoredManualTask).toHaveCount(0);

  const layout = await page.evaluate(() => ({
    width: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(layout.scrollWidth).toBe(layout.width);
});

test("returns fallback tutorials only for the selected application", async ({
  request,
}) => {
  const response = await request.post("/api/roadmap", {
    data: {
      interfaceLanguage: "en",
      projectBrief:
        "Create a clean vector logo and icon set in Adobe Illustrator for a student brand project.",
      deadline: "2026-08-20",
      currentExperience: "Complete beginner in Adobe Illustrator",
      hoursPerDay: 2,
      daysPerWeek: 5,
      tutorialLanguage: "either",
      requiredApplications: ["illustrator"],
      outputType: "graphic",
      targetQuality: "basic",
    },
  });
  expect(response.ok()).toBe(true);
  const roadmap = await response.json();
  const applicationIds = roadmap.stages
    .map((stage: { applicationId: string | null }) => stage.applicationId)
    .filter(Boolean);
  const tutorialIds = roadmap.stages.flatMap(
    (stage: { tutorialIds: string[] }) => stage.tutorialIds,
  );

  expect(new Set(applicationIds)).toEqual(new Set(["illustrator"]));
  expect(tutorialIds.length).toBeGreaterThan(0);
  expect(tutorialIds.every((id: string) => id.startsWith("illustrator-"))).toBe(true);
});
