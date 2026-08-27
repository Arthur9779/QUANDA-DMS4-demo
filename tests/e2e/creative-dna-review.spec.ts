import { expect, test } from "@playwright/test";

async function fillY2kProject(page: import("@playwright/test").Page) {
  await page.getByLabel("Project brief").fill(
    "I need a glossy Y2K product animation with chrome materials and a fisheye camera. The assignment requires Blender.",
  );
  await page.getByLabel("Current experience").fill("Blender beginner");
  await page.getByLabel("Search applications").fill("Blender");
  await page.getByRole("button", { name: "Add application: Blender" }).click();
  await page.getByRole("button", { name: "Understand my project" }).click();
  await expect(page.locator("#learning-path-review")).toBeVisible();
  await expect(page.locator("#creative-dna-review")).toHaveCount(0);
}

test("skips the Creative DNA review and continues to the learning path", async ({ page }) => {
  await page.goto("/");
  await fillY2kProject(page);
  await page.getByRole("button", { name: "Continue to my roadmap" }).click();
  await expect(page.locator("#roadmap-results")).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.localStorage.getItem("quanda:v1:creative-dna-analysis")))
    .toContain('"confirmed":true');
});

test("skips the review in Vietnamese without horizontal overflow", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "VI", exact: true }).click();
  await page.getByLabel("Đề bài dự án").fill(
    "Tôi cần làm animation sản phẩm phong cách Y2K bằng Blender, với bề mặt chrome và góc máy fisheye cho bài tập đại học.",
  );
  await page.getByLabel("Kinh nghiệm hiện tại").fill("Mới bắt đầu dùng Blender");
  await page.getByLabel("Tìm ứng dụng").fill("Blender");
  await page.getByRole("button", { name: "Thêm ứng dụng: Blender" }).click();
  await page.getByRole("button", { name: "Phân tích dự án của tôi" }).click();
  await expect(page.locator("#learning-path-review")).toBeVisible();
  await expect(page.locator("#creative-dna-review")).toHaveCount(0);
  await page.getByRole("button", { name: "Tiếp tục đến lộ trình" }).click();
  await expect(page.locator("#roadmap-results")).toBeVisible();
  const layout = await page.evaluate(() => ({ width: window.innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(layout.scrollWidth).toBe(layout.width);
});
