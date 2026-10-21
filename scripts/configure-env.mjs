import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
if (existsSync('.env.local')) process.loadEnvFile('.env.local');
const fields = { apiKey: 'FIREBASE_API_KEY', authDomain: 'FIREBASE_AUTH_DOMAIN', projectId: 'FIREBASE_PROJECT_ID', appId: 'FIREBASE_APP_ID' };
const firebase = Object.fromEntries(Object.entries(fields).map(([key, name]) => [key, process.env[name] || '']));
if (process.env.NETLIFY && Object.values(firebase).some(value => !value)) throw new Error('Missing Firebase build environment variables');
mkdirSync('src/environments', { recursive: true });
writeFileSync('src/environments/firebase.generated.ts', `// Generated from local or Netlify build environment.\nexport const firebaseConfig = ${JSON.stringify(firebase, null, 2)};\n`);
