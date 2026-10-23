export const RENTAL_MS = 48 * 60 * 60 * 1000;
export function rentalWindow(purchase, start, now) {
  if (!purchase || purchase.status !== 'paid' || purchase.filmId !== 'invisibles')
    throw new Error('No access');
  if (!purchase.startedAt) {
    if (start !== true) throw new Error('Start rental first');
    return { startedAt: now, expiresAt: now + RENTAL_MS };
  }
  if (!Number.isFinite(purchase.expiresAt) || purchase.expiresAt <= now)
    throw new Error('Rental expired');
  return { startedAt: purchase.startedAt, expiresAt: purchase.expiresAt };
}
export function validPurchaseSession(session) {
  return (
    session.mode === 'payment' &&
    /^[A-Za-z0-9_-]+$/.test(session.metadata?.uid || '') &&
    session.metadata?.filmId === 'invisibles' &&
    session.payment_status === 'paid' &&
    session.currency === 'usd' &&
    session.amount_subtotal === 900
  );
}
