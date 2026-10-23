import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import Stripe from 'stripe';
export const origin = () => process.env.SITE_URL || 'https://moviesdiamond.netlify.app';
export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
export function db() {
  if (!getApps().length)
    initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}')),
    });
  return getFirestore();
}
export const stripe = () => new Stripe(process.env.STRIPE_SECRET_KEY);
export function ready() {
  return (
    process.env.COMMERCE_ENABLED === 'true' &&
    [
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'FIREBASE_SERVICE_ACCOUNT_JSON',
      'MUX_PLAYBACK_ID',
      'MUX_SIGNING_KEY_ID',
      'MUX_SIGNING_PRIVATE_KEY',
    ].every((k) => !!process.env[k])
  );
}
export async function user(req) {
  db();
  const token = req.headers.get('authorization')?.replace(/^Bearer /, '');
  if (!token) throw new Error('Unauthorized');
  return getAuth().verifyIdToken(token, true);
}
export function post(req) {
  if (req.method !== 'POST') throw new Error('Method not allowed');
  if (req.headers.get('origin') && req.headers.get('origin') !== origin())
    throw new Error('Invalid origin');
}
export async function mail(to, subject, html, key) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.RESEND_API_KEY,
      'Content-Type': 'application/json',
      'Idempotency-Key': key,
    },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, html }),
  });
  if (!r.ok) throw new Error('Email delivery unavailable');
  return r.json();
}
export const emailFrame = (title, body) =>
  `<html><body style="background:#091216;padding:32px;font-family:Arial,sans-serif;color:#eee"><div style="max-width:520px;margin:auto;border:1px solid #38504e;border-radius:24px;padding:32px"><p style="color:#b2ffdb;letter-spacing:3px">MOVIE / FRONT ROW</p><h1 style="font-family:Georgia,serif">${title}</h1>${body}<p style="color:#a2b7b3">movie · Your next great movie night / Tu próxima gran noche de cine</p></div></body></html>`;
