import { json, ready } from './lib/services.mjs';
export default async () => json({ checkout: ready() });
