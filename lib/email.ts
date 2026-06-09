type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

/**
 * Sends email via Resend when RESEND_API_KEY is set; otherwise logs and skips delivery.
 */
export async function sendEmail({ to, subject, html, text }: SendEmailInput) {
  const from = process.env.EMAIL_FROM ?? "bentido <noreply@bentido.com>";

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[email] RESEND_API_KEY is not set — message was not delivered. Body:",
      { to, subject, html: html.slice(0, 200), text },
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[email] Resend error:", res.status, err);
    throw new Error("Failed to send email");
  }
}
