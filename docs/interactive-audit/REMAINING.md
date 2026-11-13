# Interactive Elements Audit: Remaining Items & Architectural Roadmap

This document catalogs intentionally retained native elements, remaining non-HeroUI elements, and the recommended roadmap for future migration waves.

---

## 1. Intentionally Retained Native Exceptions

In strict accordance with the audit guidelines, the following native elements are intentionally retained and justified:

| File | Line | Element | Justification |
|---|---|---|---|
| `components/shared/HeroFileInput.tsx` | 180 | `<input type="file" ref={inputRef} className="hidden" tabIndex={-1} />` | **Standard OS File Trigger**: HeroUI does not ship a native `<input type="file">`. The design pattern mandates a single shared component (`HeroFileInput`) wrapping a visually hidden native input accessed via ref by accessible HeroUI triggers. Zero raw file inputs exist outside this file. |
| `components/shared/ResponsiveModal.tsx` | 111 | `<div className="fixed inset-0 bg-black/60 ... " onClick={() => onClose()} />` | **Backdrop Scrim Overlay**: A non-focusable backdrop dismiss mask. Marking this as a semantic `<button>` would disrupt screen-reader modal focus traps (`role="dialog"`). |
| `pages/UserManagement.tsx` | 72 | `<div className="fixed inset-0 bg-black/60 ... " onClick={() => setIsRoleModalOpen(false)} />` | **Modal Scrim Overlay**: Same rationale as above. |

---

## 2. Summary of Completed Elements vs Remaining Elements

| Category | Initial Count | Converted to HeroUI / Semantic | Remaining | Status |
|---|---|---|---|---|
| **File Inputs (`<input type="file">`)** | 17 | 17 (100%) | 0 in feature code | **COMPLETE** |
| **External Links & Anchors (`<a>`)** | 30 | 30 (100%) | 0 | **COMPLETE** |
| **Non-Semantic Clickables (`div`/`span` with `onClick`)** | 82 | 82 (100%) | 0 in feature code | **COMPLETE** |
| **Native Buttons (`<button>`)** | 1,155 | 27 | 1,128 | **Phase 2 Batch Roadmap** |
| **Native Textareas (`<textarea>`)** | 55 | 0 | 55 | **Phase 2 Batch Roadmap** |
| **Native Selects (`<select>`)** | 18 | 0 | 18 | **Phase 2 Batch Roadmap** |
| **Native Inputs (`<input type="text|number...">`)** | 219 | 0 | 219 | **Phase 2 Batch Roadmap** |

---

## 3. Recommended Phased Plan for Remaining `<button>` Migration

Converting 1,128 native buttons without visual regression requires careful coordination with HeroUI's styling layers. The recommended batch sequence is:

### Phase A: Core Shared Controls & Header Actions (Low Risk, High Reuse)
- Target: Navbar buttons, theme toggles, modal close buttons, notification popover triggers.
- Replacement: HeroUI `<Button isIconOnly variant="light" size="sm" onPress={...}>` and `<HeroChip>`.

### Phase B: Form Submit & Action Footers (Medium Risk)
- Target: Modal confirmation footers (`Cancel` / `Save` / `Submit`), search filter submission buttons.
- Replacement: HeroUI `<Button color="primary" variant="solid" isLoading={...} onPress={...}>`.

### Phase C: Assessment & Arena Control Toolbars (High Impact)
- Target: Run code button, Submit Assessment button, Question navigation pagination chips, Workspace layout switches.
- Replacement: Standardized HeroUI Button groups with keyboard shortcuts and loading state spinners.

---

## 4. Verification Check Before Each Wave
1. Run `npx tsc --noEmit --project frontend/tsconfig.json` to verify prop types (`onPress` vs `onClick`, `isDisabled` vs `disabled`).
2. Run `node --experimental-strip-types --test frontend/src/**/*.test.ts` to verify test suite.
3. Run `npm --prefix frontend run build` to verify production bundling.
