import { createHash } from 'node:crypto';
import { json, post, user, db, stripe, ready, origin } from './lib/services.mjs';
export default async (req) => {
  try {
    post(req);
    if (!ready())
      return json(
        { error: 'Paid viewing is coming soon / El servicio de pago llegará pronto' },
        503,
      );
    const u = await user(req);
    const { filmId } = await req.json();
    if (filmId !== 'invisibles') return json({ error: 'Film unavailable' }, 400);
    if (!u.email || !u.email_verified)
      return json(
        { error: 'Verify your email before purchasing / Verifica tu correo antes de comprar' },
        403,
      );
    const store = db();
    const purchases = await store.collection(`users/${u.uid}/purchases`).get();
    if (
      purchases.docs.some((d) => {
        const p = d.data();
        return (
          p.filmId === filmId && p.status === 'paid' && (!p.expiresAt || p.expiresAt > Date.now())
        );
      })
    )
      return json({ error: 'Already in Purchased / Ya está en Compradas' }, 409);
    const s = stripe();
    const hash = createHash('sha256').update(u.email.toLowerCase()).digest('hex');
    const lead = await store.doc('discountLeads/' + hash).get();
    const lock = store.doc(`users/${u.uid}/checkout/current`);
    // A single transaction serializes session creation for this account; Stripe's key also protects retries.
    const bucket = Math.floor(Date.now() / 1800000);
    const result = await store.runTransaction(async (tx) => {
      const previous = await tx.get(lock);
      const old = previous.data();
      if (old?.expiresAt > Date.now()) return { url: old.url };
      const session = await s.checkout.sessions.create(
        {
          mode: 'payment',
          payment_method_types: ['card'],
          ...(lead.data()?.customerId
            ? { customer: lead.data().customerId }
            : { customer_email: u.email }),
          allow_promotion_codes: true,
          line_items: [
            {
              price_data: {
                currency: 'usd',
                unit_amount: 900,
                product_data: { name: 'Invisible’s · 48-hour rental' },
              },
              quantity: 1,
            },
          ],
          metadata: { uid: u.uid, filmId },
          payment_intent_data: { receipt_email: u.email, metadata: { uid: u.uid, filmId } },
          custom_text: {
            submit: {
              message:
                'One-time payment. Your 48 hours start only when you choose Start rental in Purchased.',
            },
          },
          success_url:
            origin() + '/list?tab=purchased&checkout=success&session_id={CHECKOUT_SESSION_ID}',
          cancel_url: origin() + '/title/' + filmId + '?checkout=cancelled',
          expires_at: (bucket + 2) * 1800,
        },
        { idempotencyKey: `checkout-${u.uid}-${filmId}-${bucket}` },
      );
      tx.set(lock, { url: session.url, expiresAt: session.expires_at * 1000 });
      return { url: session.url };
    });
    return json(result);
  } catch (e) {
    return json(
      {
        error:
          e.message === 'Unauthorized'
            ? 'Please sign in / Inicia sesión'
            : 'Could not start checkout. Please try again / No pudimos abrir el pago. Inténtalo de nuevo.',
      },
      400,
    );
  }
};
