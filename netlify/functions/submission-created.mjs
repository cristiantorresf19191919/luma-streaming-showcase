import { createHash } from 'node:crypto';
import { db, stripe, mail, emailFrame, origin } from './lib/services.mjs';
// Validate the submission through Netlify's API: never trust an incoming email address.
export const handler = async (event) => {
  if (
    ![
      'NETLIFY_FORMS_TOKEN',
      'RESEND_API_KEY',
      'EMAIL_FROM',
      'STRIPE_SECRET_KEY',
      'FIREBASE_SERVICE_ACCOUNT_JSON',
    ].every((k) => process.env[k])
  )
    return {
      statusCode: 200,
      body: 'Email delivery not configured; lead remains in Netlify Forms',
    };
  try {
    const id = JSON.parse(event.body || '{}').payload?.id;
    if (!/^[a-f0-9]{24}$/.test(id || '')) return { statusCode: 400, body: 'Invalid submission' };
    const response = await fetch('https://api.netlify.com/api/v1/submissions/' + id, {
      headers: { Authorization: 'Bearer ' + process.env.NETLIFY_FORMS_TOKEN },
    });
    if (!response.ok) throw new Error('Submission verification failed');
    const submission = await response.json();
    if (submission.form_id !== '6ad8fe3c29238aee5a848ed4' || !submission.data?.consent)
      return { statusCode: 400, body: 'Invalid form' };
    const email = String(submission.data.email || '')
      .trim()
      .toLowerCase();
    if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email))
      return { statusCode: 400, body: 'Invalid email' };
    const hash = createHash('sha256').update(email).digest('hex');
    const ref = db().doc('discountLeads/' + hash);
    const existing = await ref.get();
    if (existing.data()?.emailSentAt) return { statusCode: 200, body: 'Already sent' };
    const s = stripe();
    const customer = existing.data()?.customerId
      ? { id: existing.data().customerId }
      : await s.customers.create({ email }, { idempotencyKey: 'lead-' + hash });
    await ref.set(
      { customerId: customer.id, email, createdAt: existing.data()?.createdAt || Date.now() },
      { merge: true },
    );
    const couponId = 'launch20-' + hash.slice(0, 24);
    try {
      await s.coupons.retrieve(couponId);
    } catch (e) {
      if (e.code !== 'resource_missing') throw e;
      await s.coupons.create(
        {
          id: couponId,
          percent_off: 20,
          duration: 'once',
          max_redemptions: 1,
          name: 'Front Row · 20% launch offer',
        },
        { idempotencyKey: couponId },
      );
    }
    const code = 'FRONT-' + hash.slice(0, 10).toUpperCase();
    if (!existing.data()?.code) {
      const codes = await s.promotionCodes.list({ code, limit: 1 });
      if (!codes.data.length)
        await s.promotionCodes.create(
          {
            promotion: { type: 'coupon', coupon: couponId },
            code,
            customer: customer.id,
            max_redemptions: 1,
          },
          { idempotencyKey: 'promo-' + hash },
        );
    }
    await ref.set(
      { customerId: customer.id, code, email, createdAt: existing.data()?.createdAt || Date.now() },
      { merge: true },
    );
    await mail(
      email,
      'Tu invitación / Your invitation · movie',
      emailFrame(
        'Tu estreno. 20% menos.',
        `<p>Estás en la lista. Guarda tu código para el primer alquiler al lanzamiento.</p><p style="font-size:30px;color:#b2ffdb">${code}</p><p>You’re on the list. Use this code for 20% off your first rental when paid viewing launches.</p><p>Un uso, con este mismo correo verificado. Aplica al precio base. Sin suscripción. El pago aún puede no estar disponible.</p><p>One use with this verified email. Base price only. No subscription. Checkout may not be available yet.</p><p><a style="color:#b2ffdb" href="${origin()}">Explorar movie / Explore movie →</a></p><p>Para solicitar eliminación / Request deletion: scriptcristian@gmail.com</p>`,
      ),
      'launch-' + hash,
    );
    await ref.set({ emailSentAt: Date.now() }, { merge: true });
    return { statusCode: 200, body: 'Sent' };
  } catch {
    return { statusCode: 500, body: 'Delivery failed; retry required' };
  }
};
