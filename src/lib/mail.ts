import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import nodemailer from 'nodemailer';

// Email. With SMTP_HOST set (e.g. Gmail, SendGrid, your school's mail server) mails are really sent.
// Without it, each mail is saved as an .eml file in ./mail-outbox (open it in Outlook / Mail to see it).

const FROM = process.env.MAIL_FROM || 'Lost & Found <no-reply@lost-and-found.local>';
/** Base URL used for links in emails, e.g. https://lost-and-found.example.com */
export const APP_URL = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');

function transport() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? '' } : undefined,
    });
  }
  return nodemailer.createTransport({ streamTransport: true, buffer: true, newline: 'windows' });
}

/** Sends one plain-text email. Never throws: a mail problem must not undo the action that triggered it. */
export async function sendMail(to: string, subject: string, text: string): Promise<void> {
  try {
    const info = await transport().sendMail({ from: FROM, to, subject, text });
    if (!process.env.SMTP_HOST) {
      const dir = path.join(process.cwd(), 'mail-outbox');
      await fs.mkdir(dir, { recursive: true });
      const file = path.join(dir, `${new Date().toISOString().replace(/[:.]/g, '-')}-${to.replace(/[^a-z0-9@._-]/gi, '_')}.eml`);
      await fs.writeFile(file, (info as unknown as { message: Buffer }).message);
      console.log(`[mail] saved to ${file}`);
    }
  } catch (e) {
    console.error('[mail] could not send to', to, e);
  }
}
