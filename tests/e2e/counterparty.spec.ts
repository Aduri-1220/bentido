import { test, expect, type Page } from "@playwright/test";
import { signUp, completeOnboarding } from "./helpers";

/**
 * Counterparty invite → review → approve/request-changes flow.
 *
 * The owner creates an agreement, fills tenant details, sends an invite,
 * then the counterparty (unauthenticated, token-only) approves or requests
 * changes. Approve unblocks payment; changes-requested surfaces the comment.
 */

async function createAgreementWithTenant(page: Page): Promise<string> {
  await signUp(page);
  await completeOnboarding(page);

  return page.evaluate(async () => {
    const create = await fetch("/api/agreements", {
      method: "POST",
      credentials: "include",
    });
    const { id } = (await create.json()) as { id: string };

    await fetch(`/api/agreements/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        step: "tenant",
        data: {
          fullName: "Ravi Tenant",
          fatherName: "",
          age: 30,
          gender: "Male",
          occupation: "",
          aadhaarLast4: "1234",
          pan: "",
          phone: "9123456789",
          email: "ravi@bentido.test",
          addressLine1: "12 MG Road",
          city: "Bengaluru",
          state: "karnataka",
          pincode: "560001",
          employer: "",
          familyMembers: [],
        },
      }),
    });

    return id;
  });
}

test.describe("counterparty invite flow", () => {
  test("owner can send invite", async ({ page }) => {
    const id = await createAgreementWithTenant(page);

    const res = await page.request.post(`/api/agreements/${id}/invite`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.expiresAt).toBeTruthy();
  });

  test("invite rejected when tenant details missing", async ({ page }) => {
    await signUp(page);
    await completeOnboarding(page);

    const id = await page.evaluate(async () => {
      const r = await fetch("/api/agreements", {
        method: "POST",
        credentials: "include",
      });
      const { id } = (await r.json()) as { id: string };
      return id;
    });

    const res = await page.request.post(`/api/agreements/${id}/invite`);
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/tenant/i);
  });

  test("invalid counterparty token returns 404 on approve", async ({
    request,
  }) => {
    const res = await request.post(
      "/api/counterparty/deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef/approve",
    );
    expect(res.status()).toBe(404);
  });

  test("invalid counterparty token returns 404 on request-changes", async ({
    request,
  }) => {
    const res = await request.post(
      "/api/counterparty/deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef/request-changes",
      { data: { comment: "Please fix the rent amount it is wrong." } },
    );
    expect(res.status()).toBe(404);
  });

  test("counterparty request-changes rejects comment shorter than 5 chars", async ({
    request,
  }) => {
    const res = await request.post(
      "/api/counterparty/sometoken/request-changes",
      { data: { comment: "no" } },
    );
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/describe/i);
  });

  test("invite blocked once agreement is PAID", async ({ page }) => {
    await signUp(page);
    await completeOnboarding(page);

    const id = await page.evaluate(async () => {
      const create = await fetch("/api/agreements", {
        method: "POST",
        credentials: "include",
      });
      const { id } = (await create.json()) as { id: string };

      await fetch(`/api/agreements/${id}/draft`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skip: true }),
      });

      await fetch(`/api/agreements/${id}/addons`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          esignSignatories: 0,
          notary: false,
          extraCopies: 0,
          delivery: "DIGITAL",
          stampValue: 500,
        }),
      });

      await fetch(`/api/agreements/${id}/payment`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simulate: "success" }),
      });

      return id;
    });

    const res = await page.request.post(`/api/agreements/${id}/invite`);
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/before payment/i);
  });

  test("unauthenticated invite request returns 401", async ({ request }) => {
    const res = await request.post("/api/agreements/fake-id/invite");
    expect(res.status()).toBe(401);
  });
});
