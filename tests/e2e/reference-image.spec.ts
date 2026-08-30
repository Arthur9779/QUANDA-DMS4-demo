import { expect, test } from "@playwright/test";

test("reference findings remain optional until the user approves them", async ({ page }) => {
  await page.route("**/api/reference-image", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        source: "ai",
        findings: [
          {
            id: "reference-1234abcd",
            label: "High contrast",
            category: "visual_quality",
            evidence: "Bright flowers sit against a nearly black background.",
            confidence: 0.94,
            ontology: {
              id: "visual-characteristics.contrast.high-contrast",
              label: "high contrast",
              family: "Visual Characteristics",
              category: "Contrast",
            },
          },
          {
            id: "reference-5678abcd",
            label: "Dreamlike petal drift",
            category: "motion_interaction",
            evidence: "Petal-like forms appear suspended across the frame.",
            confidence: 0.76,
          },
        ],
      }),
    });
  });

  await page.goto("/");
  await page.getByLabel("Project brief").fill(
    "Design a high-contrast surreal flower poster for a gallery exhibition using Photoshop, with a print-ready A2 deliverable.",
  );
  await page.getByRole("button", { name: "Choose my workflow" }).click();

  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByText("Choose a reference image", { exact: true }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    name: "reference.png",
    mimeType: "image/png",
    buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  });

  await expect(page.getByRole("button", { name: "Analyze reference" })).toBeVisible();
  await expect(page.getByText("Added to Creative DNA", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Analyze reference" }).click();
  await expect(page.getByText("high contrast", { exact: true })).toBeVisible();
  await expect(page.getByText("Matched to QUANDA knowledge", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Use selected findings" })).toBeEnabled();

  await page.getByRole("button", { name: "Use selected findings" }).click();
  await expect(page.getByRole("button", { name: "Added to Creative DNA" })).toBeDisabled();
  const layout = await page.evaluate(() => ({
    width: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(layout.scrollWidth).toBe(layout.width);
});

