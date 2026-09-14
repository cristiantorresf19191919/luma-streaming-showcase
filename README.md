# Luma

A mobile-first cinematic streaming showcase built with Angular 22.1.6. All catalog data, episode descriptions, recommendations, and companion replies are mocked. No backend, authentication, payment, or AI service is connected.

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
- **Core** contains the typed, immutable catalog and a local-storage-backed library store. Malformed or unavailable storage is handled without breaking the UI.
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

`netlify.toml` builds the static app into `dist/luma/browser`, adds SPA fallback routing and security headers. The initial production deployment is performed with the Netlify CLI. GitHub holds the source; automatic Git-triggered Netlify deployments are not configured.

```sh
npm run build
npx netlify-cli deploy --prod --dir dist/luma/browser --no-build
```

## Asset credits

Movie and series artwork is demonstration material served from The Movie Database image CDN and belongs to the respective rights holders. This showcase is not endorsed by TMDB or the studios. Replace or license catalog artwork before a commercial product launch.

- TMDB: https://www.themoviedb.org/
- Sample video: MDN interactive examples, CC0 flower clip: https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4
- DM Sans and Manrope: Google Fonts, SIL Open Font License (licenses included in `public/fonts`).

No credentials are committed. `.netlify`, generated builds, browser traces and screenshot artifacts are ignored.
