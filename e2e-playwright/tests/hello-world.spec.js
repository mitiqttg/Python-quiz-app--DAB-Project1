const { test, expect } = require("@playwright/test");

test("Server responds with a page with the title 'Programming Python'", async ({ page }) => {
  await page.goto("/");
  expect(await page.title()).toBe("Programming Python");
});
