import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  rentalWindow,
  RENTAL_MS,
  validPurchaseSession,
} from '../netlify/functions/lib/rental-policy.mjs';
import checkout from '../netlify/functions/checkout.mjs';
import playback from '../netlify/functions/playback.mjs';
import webhook from '../netlify/functions/stripe-webhook.mjs';
import status from '../netlify/functions/commerce-status.mjs';
import { handler as lead } from '../netlify/functions/submission-created.mjs';
const paid = { filmId: 'invisibles', status: 'paid' },
  now = 1800000000000;
test('rental requires explicit start; replay never extends the 48-hour clock', () => {
  assert.throws(() => rentalWindow(paid, false, now));
  const started = rentalWindow(paid, true, now);
  assert.equal(started.expiresAt - now, RENTAL_MS);
  assert.deepEqual(rentalWindow({ ...paid, ...started }, true, now + 3600000), started);
  assert.throws(() => rentalWindow({ ...paid, ...started }, true, now + RENTAL_MS));
  for (const p of [
    undefined,
    { ...paid, status: 'revoked' },
    { ...paid, filmId: 'dune' },
    { ...paid, startedAt: now },
  ])
    assert.throws(() => rentalWindow(p, true, now));
});
test('only a verified $9 USD paid film session can create access', () => {
  const session = {
    mode: 'payment',
    metadata: { uid: 'abc123', filmId: 'invisibles' },
    payment_status: 'paid',
    currency: 'usd',
    amount_subtotal: 900,
  };
  assert.equal(validPurchaseSession(session), true);
  for (const patch of [
    { mode: 'subscription' },
    { payment_status: 'unpaid' },
    { currency: 'eur' },
    { amount_subtotal: 9 },
    { metadata: { uid: '../other', filmId: 'invisibles' } },
    { metadata: { uid: 'abc', filmId: 'dune' } },
  ])
    assert.equal(validPurchaseSession({ ...session, ...patch }), false);
});
test('unconfigured commerce stays closed and never sends a launch email', async () => {
  delete process.env.COMMERCE_ENABLED;
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.RESEND_API_KEY;
  assert.deepEqual(await (await status()).json(), { checkout: false });
  for (const handler of [checkout, playback])
    assert.equal(
      (
        await handler(
          new Request('https://moviesdiamond.netlify.app/api', { method: 'POST', body: '{}' }),
        )
      ).status,
      503,
    );
  assert.equal(
    (await webhook(new Request('https://moviesdiamond.netlify.app/api', { method: 'POST' })))
      .status,
    503,
  );
  assert.match((await lead({ body: '{}' })).body, /not configured/);
});
test('cross-origin checkout is rejected before any API request', async () => {
  const response = await checkout(
    new Request('https://moviesdiamond.netlify.app/api', {
      method: 'POST',
      headers: { origin: 'https://untrusted.example' },
      body: '{}',
    }),
  );
  assert.equal(response.status, 400);
});
test('forged Stripe callbacks cannot create purchased access', async () => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_placeholder';
  const r = await webhook(
    new Request('https://moviesdiamond.netlify.app/api', {
      method: 'POST',
      headers: { 'stripe-signature': 'forged' },
      body: '{"type":"checkout.session.completed"}',
    }),
  );
  assert.equal(r.status, 400);
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
});
