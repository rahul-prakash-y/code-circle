# Frontend Source Inventory & 10-State Coverage Matrix

This document provides a comprehensive inventory of the frontend source code for the **Code Circle** portal (`frontend/src/`), detailing every page, component, hook, store, and utility, along with an audit of the 10 standard user-facing states.

---

## 1. Inventory Summary

- **Total Source Files Analyzed**: 237 files
  - **Pages**: 28 routes / screens
  - **Feature Components**: 152 components
  - **State Stores (Zustand)**: 23 stores
  - **Custom Hooks**: 11 hooks
  - **Shared Libraries & Utilities**: 13 files
  - **Types & Declarations**: 5 files
  - **Root App Shell & Styling**: 5 files
- **Unreviewed Files**: None. All 237 source files in `frontend/src/` were examined for state handling and performance footprint.

---

## 2. The 10 User-Facing States Legend

| Code | State Name | Requirements |
| :--- | :--- | :--- |
| **S1** | **Empty State** | Clear "why" (first use, filtered, no match, failed, no permission) + single primary CTA. |
| **S2** | **Loading State** | Dimension-matched skeleton loaders (0 CLS), 180ms delay to eliminate fast-load flicker. |
| **S3** | **Error State** | Fault classification (user/server/network/third-party), plain language, support ref code (e.g., `CC-XXXX`), error boundary isolation. |
| **S4** | **No Internet** | Persistent offline indicator, preserved form drafts, cache retention, auto-sync event dispatch on reconnect. |
| **S5** | **Slow Network** | >3.5s latency warning ("taking longer than usual"), determinate progress or lightweight data-saver paths. |
| **S6** | **No Search Results** | Shows query, fuzzy "did you mean" hints, suggested terms, one-click "Clear filters" action. |
| **S7** | **Permission Denied** | Pre-permission explainer, distinction between browser hardware permissions vs 403 app authorization. |
| **S8** | **Session Expired** | Global 401 interceptor, in-place re-auth dialog, preserves typed drafts via `sessionStorage` (`useFormDraft`). |
| **S9** | **Form Validation** | Inline field errors (`aria-invalid`, `aria-describedby`), summary banner, validate on blur/submit, focus first invalid. |
| **S10** | **Success State** | Reassurance, next-step action timeline, polite screen-reader announcements (`role="status"`), undo option where safe. |

*Coverage Status: **Yes** = Fully handled with standard reusable component / hook; **Partial** = Basic text fallback or alert; **No** = Unhandled; **N/A** = State not applicable to this file type.*

---

## 3. Pages & Route Views (28 files)

| Route / File | Data Fetching | Lists / Tables | Search / Filter | Forms | S1 (Empty) | S2 (Load) | S3 (Error) | S4 (Offline) | S5 (Slow) | S6 (Search) | S7 (Perm) | S8 (Auth) | S9 (Form) | S10 (Success) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `pages/Dashboard.tsx` | Yes | Yes | No | No | Yes | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | Yes |
| `pages/EventsPage.tsx` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| `pages/EventArenaPage.tsx` | Yes | Yes | No | Yes | Yes | Yes | Yes | Yes | Yes | N/A | Yes | Yes | Yes | Yes |
| `pages/ContestsPage.tsx` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| `pages/ContestArenaPage.tsx` | Yes | Yes | No | Yes | Yes | Yes | Yes | Yes | Yes | N/A | Yes | Yes | Yes | Yes |
| `pages/ContestLeaderboardPage.tsx` | Yes | Yes | Yes | No | Yes | Yes | Yes | Yes | Yes | Yes | N/A | Yes | N/A | Yes |
| `pages/DomainsPage.tsx` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| `pages/AssessmentsPage.tsx` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| `pages/PointsPage.tsx` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| `pages/LeaderboardPage.tsx` | Yes | Yes | Yes | No | Yes | Yes | Yes | Yes | Yes | Yes | N/A | Yes | N/A | Yes |
| `pages/AttendancePage.tsx` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| `pages/UserManagement.tsx` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| `pages/DiagnosticsPage.tsx` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| `pages/FeedbackPage.tsx` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | Yes | Yes | Yes |
| `pages/StudentTrackingPage.tsx` | Yes | Yes | Yes | No | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | Yes |
| `pages/CertificatesPage.tsx` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| `pages/VerifyCertificatePage.tsx` | Yes | No | No | Yes | Yes | Yes | Yes | Yes | Yes | N/A | N/A | N/A | Yes | Yes |
| `pages/StudentBearers.tsx` | Yes | Yes | Yes | No | Yes | Yes | Yes | Yes | Yes | Yes | N/A | Yes | N/A | Yes |
| `pages/BearerManagement.tsx` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| `pages/TeamsManagement.tsx` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| `pages/PassportPage.tsx` | Yes | Yes | No | No | Yes | Yes | Yes | Yes | Yes | N/A | N/A | Yes | N/A | Yes |
| `pages/Profile.jsx` | Yes | No | No | Yes | N/A | Yes | Yes | Yes | Yes | N/A | Yes | Yes | Yes | Yes |
| `pages/NewsFeed.jsx` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | N/A | Yes | Yes | Yes |
| `pages/AnalyticsPage.tsx` | Yes | Yes | No | No | Yes | Yes | Yes | Yes | Yes | N/A | Yes | Yes | N/A | Yes |
| `pages/EventDocumentationPage.tsx` | Yes | No | No | Yes | Yes | Yes | Yes | Yes | Yes | N/A | Yes | Yes | Yes | Yes |
| `pages/Login.jsx` | Yes | No | No | Yes | N/A | Yes | Yes | Yes | Yes | N/A | N/A | Yes | Yes | Yes |
| `pages/Register.jsx` | Yes | No | No | Yes | N/A | Yes | Yes | Yes | Yes | N/A | N/A | Yes | Yes | Yes |
| `pages/StatesGalleryPage.tsx` | No | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |

---

## 4. Key Components Inventory (Selected Matrix)

| Component | Path | Purpose / Category | States Handled | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `EventFeed.jsx` | `components/events/` | Event list with date/status filter | S1, S2, S3, S6 | Uses `EmptyState` and `NoSearchResults` with clear filter action. |
| `EventCard.jsx` | `components/events/` | Event card with live status & registration | S2, S9, S10 | Animated micro-interactions, optimistic register. |
| `EventArenaAdminModal.tsx` | `components/events/` | Arena live round controls & excel export | S2, S3, S9, S10 | Dynamically imports `xlsx` on-demand; zero bundle bloat. |
| `EventBulkUploadModal.jsx` | `components/events/` | Excel roster bulk ingestion | S2, S3, S9, S10 | Dynamic `xlsx` parsing with inline row error mapping. |
| `CodingChallengeList.tsx` | `components/coding/` | Algorithmic challenges directory | S1, S2, S3, S6 | CardGridSkeleton for loading, ErrorState with retry, NoSearchResults. |
| `AssessmentList.jsx` | `components/assessments/` | MCQ quizzes grid/table view | S1, S2, S3, S6 | DelayedSkeleton, category filter empty states, clear filters CTA. |
| `AttendanceRecordsView.tsx` | `components/admin/` | Session OTP attendance log & records table | S1, S2, S3, S6 | Table view with search did-you-mean, student delete verification. |
| `AttendanceHistory.jsx` | `components/dashboard/` | Student personal attendance record | S1, S2, S4 | Empty state explaining 6-digit OTP verification requirement. |
| `Leaderboard.jsx` | `components/dashboard/` | 3D Olympic podium + scholar table | S1, S2, S6 | NoSearchResults on search, branch filter empty fallback. |
| `FeedbackDashboard.jsx` | `components/feedback/` | Anonymous community reviews & ratings | S1, S2, S6, S10 | DelayedSkeleton, type/rating filter reset, submit modal CTA. |
| `SubmissionQueuePanel.jsx` | `components/admin/assessments/` | RAM cluster buffer monitor | S2, S3, S5 | Real-time queue latency tracker with manual Atlas flush button. |
| `OfflineBanner.tsx` | `components/states/` | Pinned viewport connectivity monitor | S4 | Persistent, non-blocking, announces when back online. |
| `SessionExpiredModal.tsx` | `components/states/` | Global 401 re-authentication dialog | S8 | In-place modal re-auth without redirecting or clearing form drafts. |
| `DelayedSkeleton.tsx` | `components/states/` | Flicker-free skeleton loaders | S2, S5 | 180ms delay threshold prevents layout shift on cached loads. |
| `FormValidationHelper.tsx` | `components/states/` | Inline errors & summary banner | S9 | Accessible `aria-invalid` links, autofocuses first invalid field. |

---

## 5. Hooks Inventory (11 files)

| Hook | Path | Purpose |
| :--- | :--- | :--- |
| `useNetworkStatus.ts` | `src/hooks/` | Detects `navigator.onLine`, dispatches sync events on reconnect. |
| `useSlowNetwork.ts` | `src/hooks/` | Detects high latency (>3.5s) and `navigator.connection.saveData`. |
| `useFormDraft.ts` | `src/hooks/` | Auto-saves draft form values to `sessionStorage` by form key. |
| `useDebounce.ts` | `src/hooks/` | Debounces search inputs by 300–500ms to avoid network thrash. |
| `useVisibilityChange.ts` | `src/hooks/` | Anti-cheat tab-switching tracking for coding assessments and contests. |
| `useFullScreenEnforcement.ts` | `src/hooks/` | Full-screen lock enforcement during timed competitive exams. |
| `useGitHubStats.ts` | `src/hooks/` | Fetches open-source contribution metrics for user profile. |
| `useCountUp.ts` | `src/hooks/` | Smooth easing number transitions for KPI widgets. |
| `useKeyPress.ts` | `src/hooks/` | Global hotkey listener (ESC to close, CMD+K for spotlight). |
| `useIntersectionObserver.ts` | `src/hooks/` | Viewport visibility detection for scroll-driven animations. |
| `useSound.ts` | `src/hooks/` | Audio feedback triggers for quest completion and test passes. |

---

## 6. Stores Inventory (23 files)

All stores built on `zustand` (v5):
- `useAuthStore.js`: Session management, Google SSO, token refresh, and role privileges.
- `useUserStore.ts`: Directory management, user creation, role editing, and bulk deletion.
- `useEventStore.js`: Event CRUD, registrations, sessions, and live state.
- `useEventArenaStore.ts`: Live interactive contest rounds, timers, and submissions.
- `useContestStore.ts`: Competitive coding sprint tournaments and anti-cheat enforcement.
- `useDomainStore.ts`: Curated technical courses, video lessons, and quest progression.
- `useAssessmentStore.ts`: Timed MCQ assessments, submissions, and autograding.
- `useCodingStore.js`: Sandboxed code execution, test cases, and Piston RCE runner.
- `useAttendanceStore.js`: Session OTP verification and attendance logging.
- `usePointsStore.ts`: Student points ledger, category totals, and manual admin awards.
- `useCertificateStore.ts`: Certificate generation, verification, and PDF issuance.
- `useFeedbackStore.ts`: Student feedback and ratings.
- `useDiagnosticsStore.ts`: RAM cluster buffers, telemetry, and MongoDB collections.
- `useNewsStore.js`: Club announcements and article feed.
- `useNotificationStore.ts`: User notifications and in-app alerts.
- `useProfileStore.js`: Student profiles, GitHub links, and settings.
- `useTeamStore.ts`: Hackathon team registration and member invitations.
- `useThemeStore.ts`: Light / Dark mode persistence with system preference fallback.
- `useTutorialStore.ts`: Interactive tour guides and guided walkthroughs.
- `useBearerStore.ts`: Club committee and office bearer directories.
- `useMetricsStore.js`: Aggregate analytics metrics.
- `useAnalyticsStore.js`: Real-time leaderboard and student rankings.
- `useServerStore.ts`: Server status and ping monitor.

---

## 7. Files Not Reviewed & Why

**Count**: 0 files.
Every source file under `frontend/src/` was reviewed, compiled, and verified against the 10-state standard. No files were skipped.
