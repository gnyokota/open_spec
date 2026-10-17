import { expect, test } from "@playwright/test";

test("home page shows the Todo heading", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Todo" }),
  ).toBeVisible();
});
