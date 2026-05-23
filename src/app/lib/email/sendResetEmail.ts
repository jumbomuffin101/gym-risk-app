import { Resend } from "resend";

export async function sendResetEmail(opts: { to: string; resetUrl: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (!apiKey) {
    console.error("[sendResetEmail] Missing RESEND_API_KEY");
    return { ok: false as const, reason: "Missing RESEND_API_KEY" };
  }

  if (!from) {
    console.error("[sendResetEmail] Missing RESEND_FROM");
    return { ok: false as const, reason: "Missing RESEND_FROM" };
  }

  const resend = new Resend(apiKey);

  try {
    const result = await resend.emails.send({
      from,
      to: opts.to,
      subject: "Reset your Gym-Risk password",
      text:
        `Use this link to reset your Gym-Risk password:\n\n${opts.resetUrl}\n\n` +
        `This link expires in 30 minutes. If you did not request this, you can ignore this email.`,
      html:
        `<p>Use this link to reset your Gym-Risk password:</p>` +
        `<p><a href="${opts.resetUrl}">Reset your password</a></p>` +
        `<p>This link expires in 30 minutes. If you did not request this, you can ignore this email.</p>`,
    });

    if (result.error) {
      console.error("[sendResetEmail] Failed to send password reset email:", result.error.message);
      return { ok: false as const, reason: "Email send failed" };
    }

    return { ok: true as const, id: result.data.id };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";
    console.error("[sendResetEmail] Failed to send password reset email:", message);
    return { ok: false as const, reason: "Email send failed" };
  }
}
