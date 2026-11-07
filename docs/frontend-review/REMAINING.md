# Remaining Items, Decisions, & Recommended Next Steps

This document outlines known non-blocking items, design decisions requiring product stakeholder input, and recommended next steps for the Code Circle web platform.

---

## 1. Decisions Needed From User / Product Owner

### Decision 1: Progressive Web App (PWA) & Service Worker Offline Caching
- **Context**: The app currently detects offline status via `navigator.onLine` and `window.addEventListener('online')` / `window.addEventListener('offline')`, caching API queries in TanStack React Query memory and drafts in `sessionStorage`.
- **Decision**: Should we install `vite-plugin-pwa` (Workbox) to cache static assets, font files, and route JS bundles in the CacheStorage API for complete offline page loading?
  - *Option A*: Retain current lightweight browser HTTP cache + React Query (zero service worker cache invalidation complexity).
  - *Option B*: Introduce Workbox PWA with stale-while-revalidate for static assets and offline shell support.

### Decision 2: Automated End-to-End (E2E) Browser Suite
- **Context**: Currently all TypeScript compilation, ESLint static analysis, and Vite production builds pass with 0 errors, and simulated states are verified via the Interactive States Gallery (`/states-gallery`).
- **Decision**: Should we integrate a Playwright or Cypress E2E test harness in CI to run headless browser simulations of offline mode, 401 token expiry mid-form, and slow 3G throttling automatically on pull requests?

### Decision 3: Production Error Monitoring (Sentry / Datadog)
- **Context**: `<ErrorBoundary>` and `ErrorState` sanitize all logged errors to strip emails, tokens, and PII, outputting support reference codes (e.g., `CC-XXXX`).
- **Decision**: Which telemetry provider should be connected to capture these sanitized reports in production? (e.g. Sentry, Datadog, or Google Cloud Error Reporting).

---

## 2. Known Gaps & Future Enhancements

1. **Physical Screen Reader Certification**:
   - While ARIA attributes (`role="status"`, `role="alert"`, `aria-live`, `aria-invalid`, `aria-describedby`) were added and verified structurally, testing with native screen reader software (NVDA on Windows, VoiceOver on macOS, JAWS) on real hardware should be scheduled before major public launch. Marked as **UNVERIFIED**.
2. **Dead-Code Cleanup (`AdminAnalytics.jsx`)**:
   - `AdminAnalytics.jsx` imports `recharts` but is never rendered in production (`AnalyticsPage.tsx` uses `OnboardingStatsWidget.tsx`). While we prevented bundle bloat by code-splitting it into `vendor-recharts`, the unreferenced component can safely be deleted in a future cleanup PR.
3. **Piston RCE Sandbox Polling**:
   - Live code assessment execution currently polls Piston RCE for compilation results. Migrating to WebSocket or Server-Sent Events (SSE) will further optimize network efficiency for simultaneous exam sessions.

---

## 3. Recommended Next Steps

1. **Merge Review Branch**:
   - Create a Pull Request from `review/frontend-performance-ux` into `main`. All checks (`tsc`, `eslint`, `vite build`) are green.
2. **Explore States Gallery**:
   - Navigate to `http://localhost:5173/states-gallery` (or `/dev/states`) in your local browser to visually inspect all 10 states in both light and dark modes across mobile and desktop viewports.
3. **CI Pipeline Integration**:
   - Add `npm run lint` and `npx tsc --noEmit` as blocking status checks in GitHub Actions workflows to prevent TypeScript strict regressions.
