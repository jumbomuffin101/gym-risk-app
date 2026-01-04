import { Resend } from "resend";

export async function sendResetEmail(opts: { to: string; resetUrl: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (!apiKey || !from) {
    console.warn("[sendResetEmail] RESEND not configured");
    return { ok: false as const, reason: "RESEND not configured" };
  }

  const resend = new Resend(apiKey);

  try {
    const result = await resend.emails.send({
      from,
      to: opts.to,
      subject: "Reset your Gym Risk password",
      text:
        `Use this link to reset your password:\n\n${opts.resetUrl}\n\n` +
        `This link expires soon. If you did not request this, you can ignore this email.`,
    });

    // Helpful for debugging in dev logs
    return { ok: true as const, id: (result as { id?: string }).id };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";
    console.error("[sendResetEmail] failed:", message, err);
    return { ok: false as const, reason: "Email send failed", message };
  }
}
