# Remaining Work, Architectural Decisions & Wave 3 Roadmap

## 1. Wave 2 Status & Accomplished Milestones
- [x] **`EventArenaPage.tsx` Decomposition**: Split 2,564-line component into `EventArenaHubView` and `EventArenaWorkspaceView` (lazy-loaded with `<Suspense fallback={<ArenaWorkspaceSkeleton />}>`) with URL synchronization (`?view=workspace&round=<assessmentId>` and `?view=hub`). Initial chunk dropped by 74.4% (80.34 kB → 20.60 kB).
- [x] **`HeroUIComponents.tsx` Barrel Elimination**: Migrated internal imports across 42 files to direct atomic primitive paths under `@/components/ui/hero/*` and deleted the 28 kB monolithic barrel.
- [x] **Lightweight CSV Engine (`csvUtils.ts`)**: Built zero-dependency RFC-4180 compliant CSV parser and exporter with UTF-8 BOM, replacing SheetJS client-side template generation and CSV parsing.
- [x] **`examStorage` Verification & Tests**: Verified IndexedDB as primary store, hooked `visibilitychange`, `pagehide`, and `beforeunload` flush listeners, and established automated unit test suite (4/4 tests passing in Node 22).
- [x] **Targeted Store Selectors**: Converted `Header.tsx`, `TakeAssessmentModal.jsx`, `EventArenaPage.tsx`, and `EventArenaWorkspaceView.tsx` to `useShallow` selectors and atomic store subscriptions. Added architectural standard in `PERF_DIAGNOSIS.md`.

---

## 2. Remaining Oversized Files (Wave 3 Priority Roadmap)

| Priority | File Path | Current Lines | Planned Modular Extraction | Target Chunk Gain |
|---|---|---|---|---|
| **P1** | `components/events/EventArenaAdminModal.tsx` | 5,308 | Extract remaining tabs: `ArenaMcqTab.tsx`, `ArenaCodingTab.tsx`, `ArenaDesignTab.tsx`, `ArenaSubmissionsTab.tsx`, `ArenaSettingsTab.tsx`. | Drops mount latency from 650ms to <150ms |
| **P2** | `components/coding/CodingAssessmentWorkspace.tsx` | 2,411 | Extract `CodingHeader`, `CodingProblemNav`, `CodingEditorPanel`, `CodingTerminal`. | Prevents full editor re-renders on problem navigation |
| **P3** | `pages/ContestArenaPage.tsx` | 2,088 | Decompose contest problem tabs, timer panel, and leaderboard drawer. | Isolates Monaco Editor lifecycle |
| **P4** | `pages/UserManagement.tsx` | 1,919 | Extract user table card row, bulk action toolbar, and export modal. | Improves table filtering on low-end devices |
| **P5** | `pages/PointsPage.tsx` | 1,841 | Separate ledger table, allocation modal, and transaction filters. | Eliminates tab toggle lag |

---

## 3. Decisions & Rules Carried Forward
1. **Store Selectors**: Continue migrating stores in batches only where profiler shows high re-renders; maintain the documented rule against bare `useStore()` calls.
2. **Pagination vs. Virtualization**: Server-side pagination remains the first choice. `@tanstack/react-virtual` is reserved solely for non-paginable tables with >500 rows, accompanied by a keyboard and screen-reader accessibility audit.
3. **SheetJS (`xlsx`) Status**: Client-side template creation and CSV parsing are completely replaced by `csvUtils.ts`. Binary `.xlsx` parsing is deferred to backend safe parser or dynamic import when binary Excel files are dropped.
