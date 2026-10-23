import { rentalWindow } from './lib/rental-policy.mjs';
import { createPrivateKey, sign } from 'node:crypto';
import { json, post, user, db, ready } from './lib/services.mjs';
export default async (req) => {
  try {
    post(req);
    if (!ready())
      return json({ error: 'Playback is not available yet / Reproducción no disponible aún' }, 503);
    const u = await user(req);
    const { purchaseId, start } = await req.json();
    if (typeof purchaseId !== 'string' || !/^cs_[a-zA-Z0-9_]+$/.test(purchaseId))
      return json({ error: 'Invalid purchase' }, 400);
    const store = db(),
      ref = store.doc(`users/${u.uid}/purchases/${purchaseId}`);
    const now = Date.now();
    // Validate the signing key before consuming any rental time.
    const key = createPrivateKey(
      Buffer.from(process.env.MUX_SIGNING_PRIVATE_KEY, 'base64').toString(),
    );
    const p = await store.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const p = snap.data();
      const window = rentalWindow(p, start, now);
      if (!p.startedAt) tx.update(ref, window);
      return window;
    });
    const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
    const header = b64({ alg: 'RS256', typ: 'JWT' }),
      payload = b64({
        sub: process.env.MUX_PLAYBACK_ID,
        aud: 'v',
        exp: Math.floor(p.expiresAt / 1000),
        kid: process.env.MUX_SIGNING_KEY_ID,
      });
    const unsigned = header + '.' + payload;
    const token =
      unsigned + '.' + sign('RSA-SHA256', Buffer.from(unsigned), key).toString('base64url');
    return json({
      url: `https://stream.mux.com/${process.env.MUX_PLAYBACK_ID}.m3u8?token=${token}`,
      expiresAt: p.expiresAt,
    });
  } catch {
    return json({ error: 'Rental unavailable or expired / Alquiler no disponible o vencido' }, 403);
  }
};
