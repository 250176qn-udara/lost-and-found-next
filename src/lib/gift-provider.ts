import 'server-only';
import { randomBytes } from 'node:crypto';
import { ActionError } from './auth';
import { payjpTestMode } from './payjp';

/** Whether gifts can be sent at all: checked BEFORE the card is charged. Until a gift API is connected, test mode only. */
export const giftProviderReady = () => payjpTestMode();

/**
 * Issues the e-gift code after the owner has paid.
 *
 * In test mode this returns a clearly marked TEST code, so the whole flow can be tried without buying anything.
 * For real use, connect a gift API here (e.g. giftee for Business or the Amazon Incentives API): those services
 * sell the codes to your organization by contract, and this function asks them for one code per gift.
 * Using a provider's cards (instead of a card of your own) also keeps you outside Japan's rules for issuing
 * prepaid payment instruments (資金決済法).
 */
export async function issueGiftCode(brand: string, amountYen: number): Promise<string> {
  if (payjpTestMode()) {
    const part = () => randomBytes(2).toString('hex').toUpperCase();
    return `TEST-${brand.toUpperCase()}-${amountYen}-${part()}-${part()}`;
  }
  throw new ActionError('Gift cards are not connected yet. Your card was not charged.');
}
