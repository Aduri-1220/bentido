import { expect, type Page } from "@playwright/test";

/**
 * Unique-per-call email so re-running specs in --ui mode doesn't trip the
 * email-uniqueness check on the User table. Combined with the DB reset in
 * globalSetup, this keeps each test fully isolated.
 */
export function uniqueEmail() {
  return `qa+${Date.now()}-${Math.floor(Math.random() * 1e6)}@bentido.test`;
}

export const TEST_PASSWORD = "CorrectHorseBatteryStaple1";

/**
 * Drives the sign-up form. After this resolves we're on /onboarding with a
 * NextAuth session cookie set, so subsequent calls to authed APIs and pages
 * work without any further setup.
 */
export async function signUp(
  page: Page,
  email: string = uniqueEmail(),
  name: string = "QA User",
) {
  await page.goto("/sign-up");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mobile number").fill("9876543210");
  await page.getByLabel("Password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForURL(/\/onboarding$/, { timeout: 15_000 });
  return { email, name };
}

/**
 * Picks a role + state on /onboarding and submits. Lands on /dashboard. Assumes
 * the page is already on /onboarding (typically called right after `signUp`).
 */
export async function completeOnboarding(
  page: Page,
  role: "OWNER" | "TENANT" | "BROKER" = "OWNER",
  // State value matches lib/constants INDIAN_STATES slug.
  stateValue: string = "karnataka",
  stateLabel: string = "Karnataka",
) {
  await expect(
    page.getByRole("heading", { name: /tell us about you/i }),
  ).toBeVisible();

  // Role cards are <button type="button"> with the headline as text.
  const roleLabel =
    role === "OWNER"
      ? /i'?m the owner/i
      : role === "TENANT"
        ? /i'?m the tenant/i
        : /i'?m a broker/i;
  await page.getByRole("button", { name: roleLabel }).click();

  // Radix Select: click trigger, then pick the option.
  await page.locator("#state").click();
  await page
    .getByRole("option", { name: new RegExp(`^${stateLabel}$`, "i") })
    .click();

  await page.getByRole("button", { name: /continue/i }).click();
  await page.waitForURL(/\/dashboard$/, { timeout: 15_000 });

  return { role, state: stateValue };
}
