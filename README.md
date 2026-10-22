# movie

A single-movie, mobile-first cinematic streaming showcase built with Angular 22.1.6. All catalog data, episode descriptions, recommendations, and companion replies are mocked. No backend, authentication, payment, or AI service is connected.

## Run locally

Requires Node.js 24 LTS and npm.

```sh
npm ci
npm start
```

Open http://localhost:4200.

```sh
npm run build
npm run format:check
npx playwright install chromium
npm test
```

## Architecture

- **Standalone Angular components**, strict TypeScript, zoneless change detection and `OnPush` rendering.
- **Feature routes** lazy-load browsing, title details, player, and profile screens.
- **Signals** manage saved titles and companion state; `computed` derives search results and related titles. Router query parameters preserve search and genre selections.
- **Core** contains the typed, immutable catalog and a Firestore-backed account library with local guest lists. Malformed or unavailable local storage is handled without breaking the UI.
- **Shared** contains typed poster cards and the SVG icon component.
- **Styling** uses mobile-first CSS, semantic design tokens, safe-area insets, scroll-snap rails, touch controls, visible focus and reduced-motion alternatives.
- **Static assets** (images, fonts, and sample video) are hosted with the app. There are no runtime API calls or third-party font requests.
- **Testing** covers search/filtering, persisted watchlists, details and episodes, actual sample-video playback, companion interactions, mobile overflow, and automated WCAG A/AA checks on home and player.

```
src/app/core/       Typed mock data and shared state
src/app/shared/     Reusable film card and icon
src/app/features/   Browse, detail, player, profile
public/            Locally served artwork, fonts, preview media
```

## Showcase flows

Discover → title details → watch preview → explore curated story notes.

Search by title, genre, actor, or director; filter movies and series; add/remove titles in My List; refresh to verify persistence. Use Cmd/Ctrl+K to open search. Series detail pages offer three deliberately fictional sample episodes. Continue-watching progress, match percentages and editorial badges are presentation fixtures. All titles play the same clearly labeled sample clip. The profile is the demo persona Jamie.

## Deployment

Pushes to `main` in [the GitHub repository](https://github.com/cristiantorresf19191919/luma-streaming-showcase) automatically build and publish [the production site](https://luma-cinema-showcase.netlify.app).

Netlify uses Node.js 24, runs `npm run build`, and publishes `dist/luma/browser` as configured in `netlify.toml`. Repository access uses a read-only deploy key; a GitHub webhook triggers deployments.

```sh
git switch main
git add <changed-files>
git commit -m "Describe your change"
git push origin main
```

Check build progress and errors in [Netlify deployments](https://app.netlify.com/projects/luma-cinema-showcase/deploys). A failed build does not replace the last successful production deployment.

## Asset credits

Movie and series artwork is demonstration material served from The Movie Database image CDN and belongs to the respective rights holders. This showcase is not endorsed by TMDB or the studios. Replace or license catalog artwork before a commercial product launch.

- TMDB: https://www.themoviedb.org/
- Sample video: MDN interactive examples, CC0 flower clip: https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4
- DM Sans and Manrope: Google Fonts, SIL Open Font License (licenses included in `public/fonts`).

No credentials are committed. `.netlify`, generated builds, browser traces and screenshot artifacts are ignored.

Current catalog: Dune: Part Two only. The home disclaimer explains the look-and-feel skeleton; more content will be added later. Footer credit links to Optimus.

## Firebase authentication and Netlify

The MVP uses Firebase Authentication (Google and email/password) and the default Cloud Firestore Standard database on the no-cost Spark plan. Billing remains disabled. No Cloud Functions, Firebase Hosting, Analytics, or paid backend is required. Account lists sync live across devices; guest lists stay on the device. Signing out restores the guest list.

Project: `movies-diamond-1988d`, owned by `scriptcristian@gmail.com`.
Netlify site: `moviesdiamond` (same account), serving `dist/luma/browser`.

Copy `.env.example` to `.env.local` and fill in the four values from Firebase's web app settings. `npm start` and `npm run build` generate the ignored `src/environments/firebase.generated.ts`. Put those same four variable names in Netlify's build environment. These are public Firebase client identifiers, not admin secrets; never put a service-account key or password in the frontend environment. Netlify builds fail if configuration is missing.

In Firebase Authentication enable email/password and Google. Set the Google support email to the project owner's address. Authorize `moviesdiamond.netlify.app` and the local development host (`localhost` and `127.0.0.1` when used). Preview deployments need their specific domain authorized before Google sign-in will work there.

Validation: `npm ci`, `npm run build`, `npm test`, and `npm audit`. Install the test browser once with `npx playwright install chromium`. Tests cover responsive layouts, accessibility, both languages, form modes, catalog filtering, list persistence, and video playback. Real Google OAuth still requires a manual sign-in on an authorized domain.

For an opt-in real backend check, run `E2E_LIVE_AUTH=1 npm test -- tests/auth-live.spec.ts --project=desktop --workers=1`. It creates a disposable `example.test` user, checks sign-up, session restoration, sign-out, sign-in, and per-user lists, then deletes that test user. It also verifies that Google's OAuth authorization URL is issued for the production domain. The ordinary suite mocks authentication errors and reset responses without sending email.


### Cloud movie lists

Project: `movies-diamond-1988d`, database: `(default)`, region: `us-east1` (Standard, free tier).
Each saved movie is a small `{ saved: true }` document at `users/{uid}/watchlist/{filmId}`.
A single collection listener per signed-in session keeps devices current. Independent document writes avoid overwriting unrelated additions from another device. `firestore.rules` allows only the authenticated owner to read, add or remove records, and rejects extra fields and malformed IDs.

Deploy rules with `npx firebase-tools deploy --only firestore:rules --project movies-diamond-1988d --account scriptcristian@gmail.com`.
Existing `luma:list:{uid}` entries migrate once on that device, and the old key is removed only after Firebase acknowledges the write. Shared guest lists are not imported into accounts. Firestore uses memory caching, not persistent browser storage. Pending offline edits require keeping the page open until acknowledged; the interface displays connection/save status. Reload after a sync error to reconnect. The app never reports an unacknowledged write as synced.

Spark includes one free database and daily operation quotas. Keep billing disabled; quotas can temporarily stop sync instead of incurring charges. See https://firebase.google.com/docs/firestore/quotas.

### Front Row marketing preview

The bilingual, mobile sheet proposes a **Night Pass: US$9.00 / film (48-hour rental)** or **Movie Club: US$9.99 / month**. These are explicitly demo prices and proposed future benefits. Current trailers remain free. The card is a static illustration: no card input, charge, subscription, entitlement, or payment provider is created.

The launch list offers 20% off the first rental or first month when paid viewing launches. `front-row` captures email, plan preference, and explicit consent through Netlify Forms (with a honeypot), backed by the static definition in `public/__forms.html`. Form detection is enabled on the existing `moviesdiamond` project. View/export leads in Netlify → Forms → front-row. No marketing email is automatically sent. Fulfil the launch invitation and discount before enabling paid purchases; final catalogue rights, terms and checkout remain future work. The form includes a deletion contact. Never put payment details in form submissions.

### Installable app

The production build uses Angular's service worker, a standalone manifest, maskable PNG icons, and an Apple touch icon. On iPhone: Safari → Share → Add to Home Screen → Open as Web App. Browser installation instructions are available in the footer. The app shell/fonts are cached; posters are cached on demand. Video files, auth requests, Firestore responses, and lead submissions are not cached by the service worker. Sign-in, fresh sync, form submission and streaming require a connection. New app versions activate on a subsequent reload after download. `scripts/configure-sw.mjs` excludes only the edge-transformed HTML shell from content-hash validation, while retaining it in the versioned prefetch cache. Netlify injects markup after builds, so its served HTML differs from Angular’s source hash; all scripts, styles and other asset hashes remain validated.

`E2E_LIVE_AUTH=1 npm test -- --workers=2` exercises real disposable accounts, cross-device additions/removals, one-time migration and denied cross-account reads/writes, with cleanup. Normal `npm test` also covers mobile/desktop offers, bilingual content, accessibility, form failure/retry and existing browsing flows. Do not run multiple Playwright processes against the same output folder/server concurrently.
