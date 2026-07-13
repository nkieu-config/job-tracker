import "server-only";

import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "Job Tracker <onboarding@resend.dev>";

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
};

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export const emailIsDeliverable =
  Boolean(RESEND_API_KEY) || process.env.NODE_ENV !== "production";

export async function sendEmail({
  to,
  subject,
  text,
}: SendEmailInput): Promise<void> {
  if (!resend) {
    console.info(`[email:dev] to=${to} subject=${subject}\n${text}`);
    return;
  }

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject,
    text,
  });

  if (error) {
    console.error(`[email] send failed to=${to} subject=${subject}`, error);
  }
}
