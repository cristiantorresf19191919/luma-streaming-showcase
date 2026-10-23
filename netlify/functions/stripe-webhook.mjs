import { validPurchaseSession } from './lib/rental-policy.mjs';
import { json, db, stripe } from './lib/services.mjs';
export default async (req) => {
  if (req.method !== 'POST') return json({}, 405);
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET)
    return json({ error: 'Not configured' }, 503);
  let event;
  const s = stripe();
  try {
    event = s.webhooks.constructEvent(
      await req.text(),
      req.headers.get('stripe-signature'),
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return json({ error: 'Invalid signature' }, 400);
  }
  try {
    const store = db();
    if (
      ['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(
        event.type,
      )
    ) {
      const session = await s.checkout.sessions.retrieve(event.data.object.id, {
        expand: ['payment_intent.latest_charge'],
      });
      const { uid, filmId } = session.metadata || {};
      if (!validPurchaseSession(session)) return json({ ignored: true });
      const pi = session.payment_intent;
      const charge = pi?.latest_charge;
      if (!charge || typeof charge === 'string') throw new Error('Charge not ready');
      const ref = store.doc(`users/${uid}/purchases/${session.id}`);
      await store.runTransaction(async (tx) => {
        const current = await tx.get(ref);
        if (current.exists) return;
        tx.set(ref, {
          filmId,
          status: charge.refunded || charge.disputed ? 'revoked' : 'paid',
          purchasedAt: session.created * 1000,
          paymentIntent: pi.id,
          receiptUrl: charge.receipt_url || null,
          amount: session.amount_total,
          currency: 'usd',
        });
        tx.set(store.doc(`purchaseEvents/${event.id}`), {
          type: 'purchase_completed',
          filmId,
          amount: session.amount_total,
          createdAt: Date.now(),
        });
        tx.delete(store.doc(`users/${uid}/checkout/current`));
      });
    }
    if (['charge.refunded', 'charge.dispute.created'].includes(event.type)) {
      const obj = event.data.object;
      const pi = obj.payment_intent;
      const intent = await s.paymentIntents.retrieve(pi);
      const uid = intent.metadata?.uid;
      if (uid) {
        const rows = await store
          .collection(`users/${uid}/purchases`)
          .where('paymentIntent', '==', pi)
          .get();
        const batch = store.batch();
        rows.docs.forEach((d) => batch.update(d.ref, { status: 'revoked' }));
        await batch.commit();
      }
    }
    return json({ received: true });
  } catch {
    return json({ error: 'Please retry webhook' }, 500);
  }
};
