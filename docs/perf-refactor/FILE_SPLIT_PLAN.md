# File Split and Optimization Plan (Phase 2 & 3)

## Prioritization Methodology
Each file is scored on three criteria:
1. **Render Frequency & Interaction Criticality (1-10)**: How frequently it mounts, updates, or directly impacts user interactions (keystrokes, navigation, timers).
2. **Measured Slowdown / Freeze Impact (1-10)**: Measured UI freeze duration during user actions.
3. **Size & Complexity (1-10)**: Line count, cyclomatic complexity, number of inline sub-components and store subscriptions.

**Priority Score Formula**: `(Criticality × 0.4) + (Freeze × 0.4) + (Size × 0.2)` scaled to 100.

---

## Top Priority Oversized Files Table

| Rank | Priority Score | File Path | Lines | Main Component(s) | Primary Issue / Target of Split |
|---|---|---|---|---|---|
| **1** | **98** | `components/events/EventArenaAdminModal.tsx` | 5,403 | `EventArenaAdminModal` | 7 monolithic tabs (Settings, MCQ, Coding, Design, Teams, Submissions, Blocked) in 1 giant file. Freezes browser for ~2.1s. |
| **2** | **94** | `pages/EventArenaPage.tsx` | 2,467 | `EventArenaPage` | Combines Arena Assessment Hub and Fullscreen Live Coding Workspace in one file. Freezes on round change and key events. |
| **3** | **92** | `components/coding/CodingAssessmentWorkspace.tsx` | 2,411 | `CodingAssessmentWorkspace` | Monolithic fullscreen workspace containing editor, test runners, timer, and anti-cheat listeners. |
| **4** | **89** | `pages/ContestArenaPage.tsx` | 2,088 | `ContestArenaPage` | Fullscreen contest workspace with inline problem descriptions, console, anti-cheat, and code execution. |
| **5** | **87** | `pages/PointsPage.tsx` | 1,841 | `PointsPage` | Monolithic student & admin points ledger with inline transactions table and allocation modal. |
| **6** | **85** | `components/ui/HeroUIComponents.tsx` | 1,776 | 9 UI components | Exports `HeroInput`, `HeroTextarea`, `HeroAvatar`, `HeroUser`, `HeroTabs`, `HeroTable`, `HeroChip`, `HeroDatePicker`, `HeroDateTimePicker`. |
| **7** | **84** | `pages/UserManagement.tsx` | 1,919 | `UserManagement` | User directory, role manager, bulk actions, and filtering in one file. Inline XLSX loading. |
| **8** | **82** | `components/events/EventBulkUploadModal.jsx` | 1,547 | `EventBulkUploadModal` | Monolithic CSV/Excel parser modal with multiple nested views. |
| **9** | **80** | `components/admin/EventParticipantsModal.jsx` | 1,227 | `EventParticipantsModal` | Roster table with unmemoized search/filter over large arrays. |
| **10** | **78** | `components/assessments/TakeAssessmentModal.jsx` | 1,053 | `TakeAssessmentModal` | Synchronous localStorage writes on every radio button click causing ~1.2s freeze. |

---

## Modular Extraction Architecture for Wave 1

### 1. `components/events/EventArenaAdminModal.tsx` (5,403 lines -> Split into modular sub-tabs)
To be extracted under `components/events/arena/admin/`:
- `ArenaSettingsTab.tsx`: Assessment timing, rules, negative marking, submission type toggles.
- `ArenaMcqTab.tsx`: Question list, question creator, option editor, image uploaders.
- `ArenaCodingTab.tsx`: Problem statements, starter code, test case builder, language selection.
- `ArenaDesignTab.tsx`: UI/UX design brief editor, reference image URLs, submission specifications.
- `ArenaTeamsTab.tsx`: Team generation, participant allocation, manual team rosters.
- `ArenaSubmissionsTab.tsx`: Student submission table, manual score grading, live review modal.
- `EventArenaAdminModal.tsx`: Lightweight orchestrator shell (<250 lines) holding tab state.

### 2. `pages/EventArenaPage.tsx` (2,467 lines -> Split into Hub and Workspace views)
To be extracted under `components/events/arena/student/`:
- `EventArenaHubView.tsx`: Round selection, assessment card list, instructions, entry gates.
- `EventArenaWorkspaceView.tsx`: Dedicated assessment arena workspace with timer and questions.
- `EventArenaMcqSection.tsx`: MCQ radio questions with instant, debounced persistence.
- `EventArenaCodingSection.tsx`: Monaco Editor integration with language selection and test case runners.
- `EventArenaDesignSection.tsx`: Figma link submission and UI/UX preview pane.

### 3. `components/ui/HeroUIComponents.tsx` (1,776 lines -> Modular UI exports)
Split into atomic files under `components/ui/hero/`:
- `HeroInput.tsx`
- `HeroTextarea.tsx`
- `HeroAvatar.tsx`
- `HeroUser.tsx`
- `HeroTabs.tsx`
- `HeroTable.tsx`
- `HeroChip.tsx`
- `HeroDatePicker.tsx`
- `HeroDateTimePicker.tsx`
- `HeroUIComponents.tsx`: Re-exports all components for 100% backward compatibility.

### 4. `TakeAssessmentModal.jsx` (Auto-save Optimization)
- Debounce synchronous `window.localStorage` mirror writes to eliminate the 1.2s freeze on radio option clicks.
- Wrap question list and answer maps in `useCallback` and `React.memo` components.
