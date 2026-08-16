import { expect, test } from "@playwright/test";

async function fillY2kProject(page: import("@playwright/test").Page) {
  await page.getByLabel("Project brief").fill(
    "I need a glossy Y2K product animation with chrome materials and a fisheye camera. The assignment requires Blender.",
  );
  await page.getByLabel("Current experience").fill("Blender beginner");
  await page.getByLabel("Blender", { exact: true }).check();
  await page.getByRole("button", { name: "Understand my project" }).click();
  await expect(
    page.getByRole("heading", { name: "QUANDA understood your project" }),
  ).toBeVisible();
}

test("reviews, corrects, adds, confirms, and restores Creative DNA", async ({
  page,
}) => {
  await page.goto("/");
  await fillY2kProject(page);
  const review = page.locator("#creative-dna-review");

  await expect(review.getByText("Blender", { exact: true })).toBeVisible();
  await expect(review.getByText("Required by brief", { exact: true }).first()).toBeVisible();

  page.once("dialog", (dialog) => dialog.dismiss());
  await review.getByRole("button", { name: "Edit requirement: Blender" }).click();
  await expect(review.getByText("Blender", { exact: true })).toBeVisible();

  const removeY2k = review.getByRole("button", { name: "Remove Y2K" });
  if (await removeY2k.count()) {
    await removeY2k.first().click();
    await expect(review.getByText("Removed suggestions")).toBeVisible();
  }

  await review.getByRole("button", { name: "Add concept" }).first().click();
  await page.getByLabel("Search concepts").fill("fisheye");
  await page.getByRole("button", { name: "Add fisheye" }).first().click();
  await expect(review.getByText("Added by you", { exact: true })).toBeVisible();

  await review.getByRole("button", { name: "Add concept" }).first().click();
  const customWording = page.getByLabel("Your wording");
  await customWording.fill("neo-y2k eco rave");
  await customWording.press("Enter");
  await expect(review.getByText("neo-y2k eco rave", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Looks right — continue" }).click();
  await expect(page.locator("#learning-path-review")).toBeVisible();
  await page.getByRole("button", { name: "Continue to my roadmap" }).click();
  await expect(page.locator("#roadmap-results")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.localStorage.getItem("quanda:v1:creative-dna-analysis"),
      ),
    )
    .toContain("neo-y2k eco rave");
  const saved = await page.evaluate(() =>
    window.localStorage.getItem("quanda:v1:creative-dna-analysis"),
  );
  expect(saved).toContain('"confirmed":true');
  expect(saved).toContain('"source":"user_added"');

  await page.reload();
  await expect(page.getByText("neo-y2k eco rave", { exact: true })).toBeVisible();
  await expect(page.locator("#roadmap-results")).toBeVisible();
});

test("marks the analysis stale when project details change", async ({ page }) => {
  await page.goto("/");
  await fillY2kProject(page);
  await page.getByRole("button", { name: "Edit project details" }).click();
  await page.getByLabel("Project brief").fill(
    "I need a glossy Y2K product animation with chrome materials, a fisheye camera, and a completely new watercolor direction. The assignment requires Blender.",
  );
  await expect(page.getByText("Your project details changed")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Looks right — continue" }),
  ).toBeDisabled();
  await expect(page.getByRole("button", { name: "Analyze again" })).toBeEnabled();
});

test("supports the full review flow in Vietnamese without overflow", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "VI", exact: true }).click();
  await page.getByLabel("Đề bài dự án").fill(
    "Tôi cần làm animation sản phẩm phong cách Y2K bằng Blender, với bề mặt chrome và góc máy fisheye cho bài tập đại học.",
  );
  await page.getByLabel("Kinh nghiệm hiện tại").fill("Mới bắt đầu dùng Blender");
  await page.getByLabel("Blender", { exact: true }).check();
  await page.getByRole("button", { name: "Phân tích dự án của tôi" }).click();
  await expect(
    page.getByRole("heading", { name: "QUANDA đã hiểu dự án của bạn" }),
  ).toBeVisible();
  await expect(page.getByText("Bắt buộc theo đề bài", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Đúng hướng — tiếp tục" }).click();
  await expect(page.locator("#learning-path-review")).toBeVisible();
  await page.getByRole("button", { name: "Tiếp tục đến lộ trình" }).click();
  await expect(page.locator("#roadmap-results")).toBeVisible();

  const layout = await page.evaluate(() => ({
    width: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(layout.scrollWidth).toBe(layout.width);
});
