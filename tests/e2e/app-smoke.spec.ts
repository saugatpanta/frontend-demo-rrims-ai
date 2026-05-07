import { expect, test } from "@playwright/test";

test("public portal and login are reachable", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /public portal/i }).or(page.getByText(/RRIMS/i).first())).toBeVisible();

  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  await expect(page.getByText(/demo access/i)).toBeVisible();
});

test("authenticated workflow smoke with demo credentials", async ({ page }) => {
  const username = process.env.E2E_USERNAME ?? "serial.engineer";
  const password = process.env.E2E_PASSWORD ?? "Test@12345";

  await page.goto("/login");
  await page.getByLabel(/username|email|phone/i).fill(username);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page).toHaveURL(/\/app/);
  await expect(page.getByText(/national incident response console/i)).toBeVisible();
  await page.getByRole("button", { name: /alerts/i }).click();
  await expect(page).toHaveURL(/\/app\/notifications/);
});
