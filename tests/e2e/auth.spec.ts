import { test, expect } from "@playwright/test";

/**
 * Generates a unique email per test invocation so re-runs don't collide with
 * existing rows. The DB is wiped in globalSetup before every full run, but
 * partial re-runs in --ui mode benefit from uniqueness anyway.
 */
function uniqueEmail() {
  return `qa+${Date.now()}-${Math.floor(Math.random() * 1e6)}@bentido.test`;
}

test.describe("auth & onboarding", () => {
  test("user can sign up and land on onboarding", async ({ page }) => {
    const email = uniqueEmail();

    await page.goto("/sign-up");

    await expect(
      page.getByRole("heading", { name: /create your account/i }),
    ).toBeVisible();

    await page.getByLabel("Full name").fill("QA User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Mobile number").fill("9876543210");
    await page.getByLabel("Password").fill("CorrectHorseBatteryStaple1");

    await page.getByRole("button", { name: /create account/i }).click();

    await page.waitForURL(/\/onboarding$/, { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: /tell us about you/i }),
    ).toBeVisible();
  });

  test("signed-out user is redirected away from /dashboard", async ({
    page,
  }) => {
    // No cookies set → app layout server-side redirects to /sign-in.
    await page.goto("/dashboard");
    await page.waitForURL(/\/sign-in$/, { timeout: 10_000 });
    await expect(
      page.getByRole("heading", { name: /welcome back|sign in/i }),
    ).toBeVisible();
  });

  test("sign-up rejects a too-short password", async ({ page }) => {
    // We test password length (not email format) because the email input has
    // type="email" so HTML5 validation would block the form before Zod runs.
    // The Zod schema requires password.min(8) — HTML doesn't enforce that.
    await page.goto("/sign-up");

    await page.getByLabel("Full name").fill("QA User");
    await page.getByLabel("Email").fill(uniqueEmail());
    await page.getByLabel("Mobile number").fill("9876543210");
    await page.getByLabel("Password").fill("abc");
    await page.getByRole("button", { name: /create account/i }).click();

    await expect(
      page.getByText(/password must be at least 8 characters/i),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/sign-up$/);
  });
});
