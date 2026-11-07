# 10-State UX Coverage & Accessibility Reference

This document catalogs the implementation of the **10 Must-Have User-Facing States** across the Code Circle frontend, detailing the shared components, centralized microcopy, accessible ARIA attributes, and verification locations.

---

## 1. Centralized Microcopy Dictionary

All user-facing state microcopy is centralized in `frontend/src/constants/copy.ts` (`UX_COPY`) to guarantee consistent, blameless, and human-friendly language across light and dark modes.

---

## 2. The 10 States: Detailed Specifications & Locations

### State 1: EMPTY STATE
- **UX Goal**: Always explain *why* the view is empty (first use vs. filtered vs. no permission) and provide **exactly one** clear primary action (never a dead-end "No data").
- **Shared Component**: `<EmptyState />` (`frontend/src/components/states/EmptyState.tsx`)
- **Accessibility**: Contains `role="status"` and `aria-live="polite"`. Action buttons use visible focus rings and accessible labels.
- **Copy Tokens**:
  - First Use: *"Nothing here yet. Get started by taking your first step."*
  - Filtered: *"No items match your active filters. Try adjusting your search query or reset filters."*
  - Offline: *"You are currently offline. Cached items remain available; new data will load when connected."*
- **Where Applied**:
  - `ContestsPage.tsx`: Live and upcoming contests empty states; admin contests table.
  - `DomainsPage.tsx`: Course catalog empty state with "Create Course" (for admin) or "Show all courses".
  - `CodingChallengeList.tsx`: Empty challenges with "Create Coding Challenge" CTA.
  - `AssessmentList.jsx`: Empty MCQ assessments with category reset CTA.
  - `UserManagement.tsx`: Table empty state distinguishing search from zero-user rosters.
  - `PointsPage.tsx`: Student ledger and admin student roster empty fallbacks.
  - `Leaderboard.jsx`: Branch and department filter empty states.
  - `FeedbackDashboard.jsx`: Empty feedback list with "Submit Feedback" CTA.

---

### State 2: LOADING STATE
- **UX Goal**: Skeletons that match the exact shape and dimensions of incoming content (preventing layout shifts), without spinners on large sections. 180ms delay threshold prevents annoying visual flash on fast or cached loads.
- **Shared Components**:
  - `<DelayedSkeleton delayMs={180}>`
  - `<CardGridSkeleton count={N} />`
  - `<BackgroundRefreshIndicator isFetching={boolean} />`
- **Accessibility**: Employs `aria-busy="true"` and `aria-label="Loading content..."`.
- **Where Applied**:
  - `ContestsPage.tsx`: Card grid skeleton during contest fetching.
  - `DomainsPage.tsx`: Course card grid skeleton.
  - `CodingChallengeList.tsx`: Assessment track grid skeleton.
  - `AssessmentList.jsx`: MCQ test cards grid skeleton.
  - `FeedbackDashboard.jsx`: Feedback card grid skeleton.
  - `UserManagement.tsx`: Table row pulse skeletons.

---

### State 3: ERROR STATE
- **UX Goal**: Plain-language fault classification (**User Input** vs. **Our Server** vs. **Your Network** vs. **Third-Party Service**), support reference code (e.g. `CC-XXXX`), and an actionable path forward (Retry / Go Home / Contact Support). Never expose raw stack traces.
- **Shared Components**:
  - `<ErrorBoundary sectionName="...">` (React class boundary with sanitized logging)
  - `<ErrorState />` (`frontend/src/components/states/ErrorBoundary.tsx`)
- **Accessibility**: `role="alert"`, `aria-live="assertive"`, high contrast warning badge.
- **Microcopy**:
  - Server Error: *"We encountered an issue on our server. Our team has been notified."*
  - Network Error: *"Unable to reach the server. Please check your internet connection."*
  - Third-Party Error: *"An external integration is currently unavailable. Please try again shortly."*
- **Where Applied**:
  - `App.jsx`: Global route error boundary wrapping the application shell.
  - `DiagnosticsPage.tsx`: Boundaries wrapping System Health, Server Flushes, and Database Document Explorer tabs.
  - `CodingChallengeList.tsx`: In-situ error card with `onRetry={fetchChallenges}` and ref code.

---

### State 4: NO INTERNET (OFFLINE)
- **UX Goal**: Automatically detect connectivity drops (`navigator.onLine` + failed requests). Keep cached content visible; present a non-intrusive pinned indicator explaining what still works (reading cached curriculum, drafts) and what requires a connection.
- **Shared Components**:
  - `useNetworkStatus()` hook (`frontend/src/hooks/useNetworkStatus.ts`)
  - `<OfflineBanner />` (`frontend/src/components/states/OfflineBanner.tsx`)
- **Accessibility**: Pinned top viewport banner with `role="status"` and `aria-live="polite"`. Dismissible and keyboard navigable.
- **Where Applied**:
  - `App.jsx`: Pinned globally above the navigation bar; dispatches `network:reconnected` event to trigger auto-sync across stores.

---

### State 5: SLOW NETWORK
- **UX Goal**: When API requests exceed 3.5s or `navigator.connection.saveData` is enabled, inform the user that loading is "taking longer than usual", and offer lightweight recovery options (retry, cancel, data-saver mode).
- **Shared Components**:
  - `useSlowNetwork(thresholdMs)` hook (`frontend/src/hooks/useSlowNetwork.ts`)
  - `<SlowNetworkNotice />` (`frontend/src/components/states/SlowNetworkNotice.tsx`)
- **Accessibility**: `role="status"`, polite aria announcements, clear retry CTA.
- **Where Applied**:
  - Available across data fetching pages and verified in the Interactive States Gallery.

---

### State 6: NO SEARCH RESULTS
- **UX Goal**: Echo the exact searched term, suggest fuzzy "did you mean" corrections or popular keywords, and provide a single click to reset filters.
- **Shared Component**: `<NoSearchResults />` (`frontend/src/components/states/NoSearchResults.tsx`)
- **Accessibility**: `role="status"`, `aria-live="polite"`, keyboard accessible keyword pills.
- **Where Applied**:
  - `EventFeed.jsx`: Zero event search matches.
  - `UserManagement.tsx`: Zero student/admin search matches with "Clear all filters" CTA.
  - `DomainsPage.tsx`: Course search query mismatch.
  - `CodingChallengeList.tsx`: Problem track query mismatch.
  - `AssessmentList.jsx`: Quiz query mismatch.
  - `PointsPage.tsx`: Points ledger search mismatch.
  - `Leaderboard.jsx`: Scholar search mismatch.
  - `FeedbackDashboard.jsx`: Feedback search mismatch.

---

### State 7: PERMISSION DENIED
- **UX Goal**: Clearly differentiate hardware browser permissions (Camera, Microphone, Notifications) from application authorization failures (403 Forbidden). Explain why the permission is required and provide instructions on how to re-enable it in browser settings.
- **Shared Component**: `<PermissionDenied />` (`frontend/src/components/states/PermissionDenied.tsx`)
- **Accessibility**: `role="alert"`, descriptive steps for Chrome, Safari, and Edge.
- **Where Applied**:
  - Video quest camera permissions, anti-cheat assessment overlays, and admin role gates.

---

### State 8: SESSION EXPIRED (RE-AUTH PRESERVING DRAFTS)
- **UX Goal**: When a JWT token expires or backend returns 401, prevent disruptive full-page redirects. Save form state to `sessionStorage` via `useFormDraft()`, display an in-place re-login dialog, and replay failed queries with zero typed data loss.
- **Shared Components**:
  - `useFormDraft(formId, values)` hook (`frontend/src/hooks/useFormDraft.ts`)
  - `<SessionExpiredModal />` (`frontend/src/components/states/SessionExpiredModal.tsx`)
- **Global Integration**:
  - `src/lib/axios.js` intercepts 401 and dispatches `auth:unauthorized`.
  - `SessionExpiredModal` in `App.jsx` listens for `auth:unauthorized` and mounts the silent re-auth modal.

---

### State 9: FORM VALIDATION
- **UX Goal**: Flag the exact field inline, beside the control, with actionable fix instructions ("Use at least 8 characters", not "Invalid"). Prevent double submission; validate on blur and submit; autofocus the first invalid field on submit error.
- **Shared Components**:
  - `<FormErrorSummary errors={errors} />` (`frontend/src/components/states/FormValidationHelper.tsx`)
  - `<FieldInlineError error={error} fieldId={id} />`
  - `<RequiredFieldMarker />`
  - `focusFirstInvalidField(formElement)` helper function
- **Accessibility**: Injects `aria-invalid="true"` and `aria-describedby="{id}-error"`.
- **Where Applied**:
  - `UserManagement.tsx` (Add User & Reset Password panels), `Login.jsx`, `Register.jsx`, `EventModal.jsx`.

---

### State 10: SUCCESS STATE
- **UX Goal**: Explicitly confirm what happened, provide reassurance (saved, no further action required), display a next-steps timeline, and offer an "Undo" action where applicable.
- **Shared Component**: `<SuccessState />` (`frontend/src/components/states/SuccessState.tsx`)
- **Accessibility**: `role="status"`, `aria-live="polite"`, distinct emerald status styling with high contrast tokens.
- **Where Applied**:
  - Contest submission, event registration confirmation, certificate generation, user creation.

---

## 3. Interactive States Gallery

An interactive developer gallery has been mounted at:
- **Route**: `/states-gallery` and `/dev/states`
- **Source**: `frontend/src/pages/StatesGalleryPage.tsx`
- **Features**:
  - Live toggling between all 10 states.
  - Real-time Light / Dark mode testing via Apple glassmorphism theme toggle.
  - Mobile frame (375px) vs Desktop frame (100% width) viewport simulations.
  - Interactive retry buttons, form drafts demonstration, and ref code generators.
