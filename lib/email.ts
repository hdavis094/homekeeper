import type { ReactElement } from "react";
import { Resend } from "resend";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  react?: ReactElement;
  html?: string;
  text?: string;
};

export type SendEmailResult = { id: string | null; skipped: boolean };

let client: Resend | undefined;

/**
 * Sends through Resend from `EMAIL_FROM`. Without `RESEND_API_KEY` (local dev) the email is logged
 * and skipped instead of failing. Throws if Resend rejects the send.
 */
export async function sendEmail({ to, subject, react, html, text }: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "HomeKeeper <onboarding@resend.dev>";
  if (!apiKey) {
    console.info(`[email] RESEND_API_KEY not set; skipped "${subject}" to ${[to].flat().join(", ")}`);
    if (text) console.info(text);
    return { id: null, skipped: true };
  }
  client ??= new Resend(apiKey);
  const content = react ? { react } : html ? { html, ...(text ? { text } : {}) } : { text: text ?? "" };
  const { data, error } = await client.emails.send({ from, to, subject, ...content });
  if (error) throw new Error(`Resend: ${error.message}`);
  return { id: data?.id ?? null, skipped: false };
}
