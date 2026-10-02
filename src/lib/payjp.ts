import 'server-only';
import { ActionError } from './auth';

// PAY.JP (https://docs.pay.jp/v1/api/). The card is turned into a token in the browser by payjp.js
// (with 3-D Secure), so card numbers never reach this server. Test keys (sk_test_…) move no real money.

const SECRET = process.env.PAYJP_SECRET_KEY ?? '';

export const payjpConfigured = () => SECRET.startsWith('sk_') && !!process.env.NEXT_PUBLIC_PAYJP_PUBLIC_KEY;
export const payjpTestMode = () => SECRET.startsWith('sk_test_');

async function call<T>(path: string, params: Record<string, string>): Promise<T> {
  const res = await fetch(`https://api.pay.jp/v1${path}`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(SECRET + ':').toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params),
    cache: 'no-store',
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('PAY.JP error', res.status, body?.error);
    // Card problems (declined, expired …) are safe to show; anything else stays generic.
    if (body?.error?.type === 'card_error') throw new ActionError('Your card was declined. Please try another card.');
    throw new ActionError('The payment could not be completed. Please try again.');
  }
  return body as T;
}

/** Charges a card token (yen, captured at once). Returns the charge id. */
export async function charge(amountYen: number, token: string, description: string): Promise<string> {
  if (!payjpConfigured()) throw new ActionError('Card payments are not set up yet.');
  const c = await call<{ id: string; paid: boolean }>('/charges', {
    amount: String(amountYen), currency: 'jpy', card: token, capture: 'true', description: description.slice(0, 255),
  });
  if (!c.paid) throw new ActionError('The payment could not be completed. Please try again.');
  return c.id;
}

/** Full refund (used when something fails after the card was charged). */
export async function refund(chargeId: string): Promise<void> {
  await call(`/charges/${encodeURIComponent(chargeId)}/refund`, {});
}
