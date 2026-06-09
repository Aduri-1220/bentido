import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";

/**
 * Customer-facing notification events fired as an agreement moves through
 * the workflow. Auth-flow emails (signup verification, password reset) live
 * in their respective route files since they pre-date this module.
 *
 * Channels: email today, WhatsApp via MSG91 BSP later (see sendWhatsApp stub).
 */
export type AgreementNotificationEvent =
  | "payment.succeeded"
  | "stamp.procured"
  | "esign.completed"
  | "delivery.tracking_set"
  | "agreement.completed"
  | "counterparty.approved"
  | "counterparty.changes_requested";

/**
 * Fire-and-forget: dispatches an event to all enabled channels for the
 * agreement owner. Never throws — notification failures must not block the
 * underlying transition. Logs and moves on.
 */
export async function notifyAgreementEvent(
  event: AgreementNotificationEvent,
  agreementId: string,
): Promise<void> {
  try {
    const agreement = await prisma.agreement.findUnique({
      where: { id: agreementId },
      select: {
        id: true,
        status: true,
        counterpartyChangesComment: true,
        user: { select: { email: true, name: true, phone: true } },
        delivery: { select: { trackingId: true } },
      },
    });
    if (!agreement) return;

    const ctx: NotificationCtx = {
      agreementId,
      shortId: agreementId.slice(0, 8),
      name: agreement.user.name ?? "there",
      trackingId: agreement.delivery?.trackingId ?? null,
      appUrl: appOrigin(),
      changesComment: agreement.counterpartyChangesComment,
    };

    await Promise.allSettled([
      agreement.user.email
        ? dispatchEmail(event, agreement.user.email, ctx)
        : Promise.resolve(),
      agreement.user.phone
        ? dispatchWhatsApp(event, agreement.user.phone, ctx)
        : Promise.resolve(),
    ]);
  } catch (err) {
    console.error("[notifications] dispatch failed", {
      event,
      agreementId,
      err,
    });
  }
}

type NotificationCtx = {
  agreementId: string;
  shortId: string;
  name: string;
  trackingId: string | null;
  appUrl: string;
  changesComment: string | null;
};

function appOrigin(): string {
  return (
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "http://localhost:3000"
  );
}

async function dispatchEmail(
  event: AgreementNotificationEvent,
  to: string,
  ctx: NotificationCtx,
): Promise<void> {
  const tpl = emailTemplate(event, ctx);
  await sendEmail({ to, subject: tpl.subject, html: tpl.html, text: tpl.text });
}

/**
 * WhatsApp adapter stub. Plug MSG91 BSP here: register approved templates
 * for each event, then call MSG91's send API with the template name + vars.
 * Returns early when MSG91 env is unset so dev/staging stay silent.
 */
async function dispatchWhatsApp(
  _event: AgreementNotificationEvent,
  _phoneE164OrLocal: string,
  _ctx: NotificationCtx,
): Promise<void> {
  if (!process.env.MSG91_AUTH_KEY) return;
  // TODO(bentido): wire MSG91 BSP — POST template message with vars built from ctx.
}

function emailTemplate(
  event: AgreementNotificationEvent,
  ctx: NotificationCtx,
): { subject: string; html: string; text: string } {
  const agreementLink = `${ctx.appUrl}/agreement/${ctx.agreementId}`;
  const button = `<p><a href="${agreementLink}" style="display:inline-block;padding:10px 18px;background:#0f172a;color:#fff;border-radius:6px;text-decoration:none">View agreement</a></p>`;
  const wrap = (heading: string, body: string) => ({
    html: `<div style="font-family:system-ui,sans-serif;color:#0f172a;line-height:1.5"><h2 style="margin:0 0 12px">${heading}</h2><p>Hi ${escape(ctx.name)},</p>${body}${button}<p style="color:#64748b;font-size:12px;margin-top:24px">Agreement ID: ${ctx.shortId}…</p></div>`,
    text: `${heading}\n\nHi ${ctx.name},\n${stripTags(body)}\n\n${agreementLink}\n\nAgreement ID: ${ctx.shortId}…`,
  });

  switch (event) {
    case "payment.succeeded": {
      const t = wrap(
        "Payment received",
        `<p>Your payment has been received and we've started preparing your rental agreement. Next step: e-stamp paper procurement.</p>`,
      );
      return { subject: "Payment received — agreement started", ...t };
    }
    case "stamp.procured": {
      const t = wrap(
        "E-stamp paper procured",
        `<p>We've bought the stamp paper for your agreement. We'll send the Aadhaar e-sign link to all parties shortly.</p>`,
      );
      return { subject: "Stamp paper procured — e-sign next", ...t };
    }
    case "esign.completed": {
      const t = wrap(
        "Agreement signed",
        `<p>All parties have signed. We're preparing your final copy for delivery.</p>`,
      );
      return { subject: "Agreement signed — preparing delivery", ...t };
    }
    case "delivery.tracking_set": {
      const tracking = ctx.trackingId
        ? `<p>Courier tracking ID: <strong>${escape(ctx.trackingId)}</strong></p>`
        : "";
      const t = wrap(
        "Your agreement is out for delivery",
        `<p>The signed agreement is on its way to your delivery address.</p>${tracking}`,
      );
      return { subject: "Out for delivery", ...t };
    }
    case "agreement.completed": {
      const t = wrap(
        "Agreement completed",
        `<p>Your rental agreement is complete. Keep the executed copy and tracking details for your records — you can always download the PDF from your agreement page.</p>`,
      );
      return { subject: "Your agreement is complete", ...t };
    }
    case "counterparty.approved": {
      const t = wrap(
        "Tenant approved the draft",
        `<p>Your tenant has reviewed and approved the agreement. You can now proceed to payment.</p>`,
      );
      return { subject: "Tenant approved — ready for payment", ...t };
    }
    case "counterparty.changes_requested": {
      const comment = ctx.changesComment
        ? `<blockquote style="margin:12px 0;padding:8px 12px;border-left:3px solid #e2e8f0;color:#334155">${escape(ctx.changesComment)}</blockquote>`
        : "";
      const t = wrap(
        "Tenant requested changes",
        `<p>Your tenant reviewed the draft and asked for changes:</p>${comment}<p>Edit the draft, then send a fresh invite from your agreement page.</p>`,
      );
      return { subject: "Tenant requested changes to the draft", ...t };
    }
  }
}

/**
 * Sent to the counterparty (not the agreement owner) with a one-time magic
 * link that opens the public review page. Plaintext token is consumed once
 * — only the hash is persisted on the agreement row.
 */
export async function notifyCounterpartyInvited(
  agreementId: string,
  plaintextToken: string,
): Promise<void> {
  try {
    const agreement = await prisma.agreement.findUnique({
      where: { id: agreementId },
      select: {
        tenantJson: true,
        user: { select: { name: true } },
      },
    });
    if (!agreement?.tenantJson) return;

    const tenant = safeParseTenant(agreement.tenantJson);
    if (!tenant) return;

    const reviewUrl = `${appOrigin()}/counterparty/${plaintextToken}`;
    const ownerName = agreement.user.name ?? "the landlord";
    const subject = "Review your rental agreement";
    const html = `<div style="font-family:system-ui,sans-serif;color:#0f172a;line-height:1.5"><h2>Review your rental agreement</h2><p>Hi ${escape(tenant.name)},</p><p>${escape(ownerName)} has shared a draft rental agreement for your review. Please read it through and either approve it or request changes.</p><p><a href="${reviewUrl}" style="display:inline-block;padding:10px 18px;background:#0f172a;color:#fff;border-radius:6px;text-decoration:none">Review agreement</a></p><p style="color:#64748b;font-size:12px;margin-top:24px">This link is valid for 7 days. If you weren't expecting this, you can ignore it safely.</p></div>`;
    const text = `Hi ${tenant.name},\n\n${ownerName} has shared a draft rental agreement for your review.\n\nReview it here: ${reviewUrl}\n\nThis link is valid for 7 days.`;

    await Promise.allSettled([
      tenant.email
        ? sendEmail({ to: tenant.email, subject, html, text })
        : Promise.resolve(),
      tenant.phone
        ? dispatchCounterpartyInviteWhatsApp(tenant.phone, reviewUrl)
        : Promise.resolve(),
    ]);
  } catch (err) {
    console.error("[notifications] counterparty invite failed", {
      agreementId,
      err,
    });
  }
}

async function dispatchCounterpartyInviteWhatsApp(
  _phone: string,
  _reviewUrl: string,
): Promise<void> {
  if (!process.env.MSG91_AUTH_KEY) return;
  // TODO(bentido): wire MSG91 BSP template for counterparty invite.
}

function safeParseTenant(
  json: string,
): { name: string; email: string | null; phone: string | null } | null {
  try {
    const obj = JSON.parse(json) as {
      name?: string;
      email?: string;
      phone?: string;
    };
    return {
      name: obj.name ?? "there",
      email: obj.email ?? null,
      phone: obj.phone ?? null,
    };
  } catch {
    return null;
  }
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "");
}
