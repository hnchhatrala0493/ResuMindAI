# ResuMind AI all-phases QA report

Audit date: 2026-09-11 (Asia/Calcutta)

## Executive Summary

ResuMind AI implements Phase 1, Phase 2, and an initial Phase 3. Phase 1 includes the landing experience, local/email authentication, protected routes, session restoration, legal pages, and dashboard. Phase 2 includes owned resume CRUD, normalized section forms, serialized patch-based autosave, dnd-kit item and section sorting, completion scoring, previews, and twelve entitlement-aware templates. Phase 3 includes a provider abstraction, mock/OpenAI/Gemini adapters, reviewable suggestions, deterministic ATS scoring, job matching, usage records, credit limits, and idempotency keys.

Import, export, public sharing, payments, admin, production analytics, and production notifications are not implemented and were not reported as passing.

The audit found six remediated issues (three P1, three P2) and three open non-blocking advisories. No open P0 or P1 issue remains in the implemented scope. Production dependencies report zero known vulnerabilities. The application is ready to continue development, but is not declared production-ready because visual/accessibility breadth, multi-tab conflict UX, deployment verification, and production observability remain incomplete.

## Phase Status

| Phase   | Scope                                                       | Tested | Passed | Remaining Issues | Status                |
| ------- | ----------------------------------------------------------- | -----: | -----: | ---------------: | --------------------- |
| Phase 1 | Foundation, landing, auth, protected routes, dashboard      |     22 |     20 |                2 | Ready with advisories |
| Phase 2 | Resume CRUD, builder, autosave, sorting, preview, templates |     31 |     30 |                1 | Ready with advisory   |
| Phase 3 | Mock AI, deterministic ATS, suggestions, matching, credits  |     14 |     12 |                2 | Ready with advisories |
| Future  | Import/export/sharing/payments/admin                        |      0 |      0 |                0 | Not implemented       |

Counts represent audited scenarios grouped in this report, not statement/branch coverage.

## Issue Register

| ID     | Priority | Phase      | Area                 | Issue                                                                                             | Root Cause                                                            | Fix                                                                                                 | Verification                                                                                   | Status |
| ------ | -------- | ---------- | -------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------ |
| QA-001 | P1       | 1          | Authentication       | Logged-out bearer token remained usable                                                           | JWT middleware verified signature but not session state               | Middleware now requires an active, unexpired, matching session                                      | Failing integration test reproduced 200 after logout; targeted and full suites now receive 401 | Closed |
| QA-002 | P1       | 2          | Sorting/preview      | Top-level sections could not be reordered and preview ignored `sectionOrder`                      | dnd-kit existed only for repeatable entries; renderer was fixed-order | Added keyboard/pointer section sorter, Move Up/Down alternatives, persistence, and preview ordering | TypeScript, component ordering test, build, and E2E regression                                 | Closed |
| QA-003 | P1       | 2          | Autosave             | Full-document autosaves could overwrite unrelated concurrent changes                              | Editor sent the complete local snapshot                               | Autosave now accumulates and serializes field-level patches; failed patches are restored for Retry  | TypeScript, unit/integration suites, and persisted-content E2E                                 | Closed |
| QA-004 | P2       | 2          | API contract         | OpenAPI advertised six legacy templates and incomplete style fields                               | Schema was not updated with the template expansion                    | Added all current/legacy IDs and complete styling properties                                        | TypeScript/build and static contract review                                                    | Closed |
| QA-005 | P2       | All        | Formatting           | Prettier check failed on 55 files                                                                 | Formatting had not been enforced after implementation                 | Added artifact exclusions and normalized repository formatting                                      | `npm run format:check` exit 0                                                                  | Closed |
| QA-006 | P2       | Foundation | Dependencies         | Invalid AJV dependency tree and production security advisories                                    | Incompatible hoisting plus vulnerable AJV/Nodemailer versions         | Added AJV v8 explicitly and upgraded Nodemailer to v10                                              | Dependency tree resolves; `npm audit --omit=dev` reports 0 vulnerabilities                     | Closed |
| QA-007 | P3       | All        | Performance          | Shared entry chunk is 607.88 kB minified                                                          | Framework/vendor dependencies remain in the common entry              | Route components are lazy-loaded; further vendor splitting deferred                                 | Vite bundle report                                                                             | Open   |
| QA-008 | P2       | 1–3        | Accessibility/visual | No automated axe suite; screenshot matrix covers landing/login rather than every implemented page | Current Playwright scope prioritizes the critical resume journey      | Manual focus/label/overflow checks and critical dialog assertions exist                             | Playwright passed at seven viewports                                                           | Open   |
| QA-009 | P2       | 2          | Concurrency UX       | Same-field edits in multiple tabs remain last-write-wins without a visible conflict prompt        | Resume API has no client revision precondition                        | Unrelated fields now use patches; add ETag/revision conflicts in a future hardening pass            | Code review                                                                                    | Open   |

## Command Results

| Command                           | Purpose                                          |      Exit Code | Result                                       |
| --------------------------------- | ------------------------------------------------ | -------------: | -------------------------------------------- |
| `node --version`                  | Runtime requirement                              |              0 | v22.21.0, satisfies Node >=22                |
| `npm --version`                   | Package manager                                  |              0 | 10.9.4                                       |
| `npm install`                     | Lockfile/install verification                    |              0 | Up to date                                   |
| `npm ls --all --omit=optional`    | Dependency tree                                  | 0 after repair | Valid tree                                   |
| `npm audit --omit=dev`            | Production advisory scan                         |              0 | 0 vulnerabilities                            |
| `npm run format:check`            | Formatting                                       |              0 | Passed                                       |
| `npm run lint`                    | All workspace lint                               |              0 | Passed, zero warnings                        |
| `npm run typecheck`               | Shared/UI builds and API/web checks              |              0 | Passed                                       |
| `npm run test`                    | Unit, integration, component tests               |              0 | 15 passed                                    |
| `npm run test:e2e`                | Critical browser flow and responsive screenshots |              0 | 8 passed                                     |
| `npm run build`                   | Production builds                                |              0 | Passed                                       |
| Production API smoke on port 5050 | Startup, DB readiness, health, error contract    |              0 | `/health` 200, `/ready` 200, unknown API 404 |

The first revoked-session targeted run intentionally failed (expected 401, actual 200), proving QA-001 before its fix. A first formatting check also intentionally recorded the baseline failures.

## Functional Test Matrix

| Phase | Module             | Test Case                                                | Expected                            | Actual                                   | Status  |
| ----- | ------------------ | -------------------------------------------------------- | ----------------------------------- | ---------------------------------------- | ------- |
| 1     | Runtime            | Health/readiness/unknown route                           | 200/200/safe 404                    | Matched                                  | Pass    |
| 1     | Auth               | Register, duplicate, valid/invalid login                 | Controlled success/errors           | Matched                                  | Pass    |
| 1     | Auth               | Logout revokes bearer session                            | Subsequent request 401              | 401 after fix                            | Pass    |
| 1     | Auth               | Refresh with trusted origin                              | Rotated session response            | 200                                      | Pass    |
| 1     | Routing            | Protected and nested routes                              | Auth gate/direct route support      | Passed in browser/Nginx config review    | Pass    |
| 1     | Dashboard          | Real API-backed summary                                  | No hard-coded statistics            | Controller/model aggregation found       | Pass    |
| 2     | Resume CRUD        | Create/read/list/update/duplicate/archive/restore/delete | Owned lifecycle persists            | Matched                                  | Pass    |
| 2     | Ownership          | Second user accesses resume/actions                      | 404 denial                          | Matched for all actions                  | Pass    |
| 2     | Mass assignment    | Client supplies `userId`                                 | Server ownership preserved          | Matched                                  | Pass    |
| 2     | Autosave           | Debounced multi-section workflow and refresh             | Saved content survives              | Matched in E2E                           | Pass    |
| 2     | Autosave           | Unrelated concurrent field changes                       | Patch does not erase other sections | Field-level patches after fix            | Pass    |
| 2     | Sorting            | Repeatable entry and top-level ordering                  | Mouse/keyboard/fallback/persistence | Controls and dnd-kit present; tests pass | Pass    |
| 2     | Templates          | Free/premium listing, preview, application               | Correct entitlement                 | Matched                                  | Pass    |
| 2     | Templates          | Forged premium flag                                      | Server denies                       | 403 `PREMIUM_REQUIRED`                   | Pass    |
| 2     | Templates          | Switch template                                          | Content retained                    | E2E/integration matched                  | Pass    |
| 2     | Preview            | Mobile focus, Escape, boundaries                         | Managed full-screen dialog          | Matched                                  | Pass    |
| 3     | ATS                | Deterministic and bounded score                          | Stable 0–100; category max 100      | Matched                                  | Pass    |
| 3     | ATS                | Disclaimer                                               | Internal-estimate warning           | Present                                  | Pass    |
| 3     | AI                 | Mock provider structured response                        | Schema-valid, no paid call          | Matched                                  | Pass    |
| 3     | AI                 | Ownership                                                | Foreign resume denied               | 404                                      | Pass    |
| 3     | Credits            | Repeated idempotency key                                 | One usage record                    | Matched                                  | Pass    |
| 3     | Suggestions        | Allowlisted path/stale-content checks                    | Reject arbitrary/stale targets      | Static implementation review             | Pass    |
| 3     | Provider failures  | External timeout/malformed/retry                         | Normalized errors/refund            | Implemented; no injected adapter tests   | Partial |
| 3     | Credit concurrency | Simultaneous distinct reservations at boundary           | Never overspend                     | Not stress-tested                        | Partial |

## Visual QA Matrix

| Page                                           | Viewport          | Browser  | Issue                                        | Status  |
| ---------------------------------------------- | ----------------- | -------- | -------------------------------------------- | ------- |
| Landing/login                                  | 375×667           | Chromium | No horizontal overflow                       | Pass    |
| Landing/login                                  | 390×844           | Chromium | No horizontal overflow                       | Pass    |
| Landing/login                                  | 768×1024          | Chromium | No horizontal overflow                       | Pass    |
| Landing/login                                  | 1024×768          | Chromium | No horizontal overflow                       | Pass    |
| Landing/login                                  | 1280×800          | Chromium | No horizontal overflow                       | Pass    |
| Landing/login                                  | 1440×900          | Chromium | No horizontal overflow                       | Pass    |
| Landing/login                                  | 1920×1080         | Chromium | No horizontal overflow                       | Pass    |
| Builder/mobile preview                         | 390×844           | Chromium | Focus-managed dialog and content persistence | Pass    |
| Gallery/template previews                      | 1280×800          | Chromium | Free apply and premium paywall               | Pass    |
| All other implemented pages at all seven sizes | Matrix incomplete | —        | Broader screenshot coverage required         | Open P2 |

## Security Results

Passed checks include password hashing, generic login/reset responses, HTTP-only refresh cookies, trusted-origin refresh, hashed refresh/action tokens, rotation/reuse family revocation, session-aware bearer authentication, ownership scoping, mass-assignment stripping, Mongo operator rejection, request limits, CORS allowlisting, Helmet headers, API rate limits, safe production errors, AI prompt delimiting/redaction, server-side credits, template entitlement, and zero known production dependency advisories.

No destructive or external penetration testing was performed. Paid AI, OAuth, SMTP, payment, and cloud services were not called. Payments/uploads/sharing do not exist. Remaining security hardening is low risk: add explicit CSRF coverage for any future cookie-authenticated mutations, load-test distributed rate limiting before horizontal scaling, and add concurrent credit-boundary tests.

## Accessibility Results

Form controls and icon buttons have accessible names; autosave uses a status region; mobile/template dialogs manage initial focus, trap Tab, restore/close with Escape; dnd-kit uses keyboard sensors and Move Up/Down alternatives; reduced motion is honored. Automated axe/color-contrast testing and full screen-reader traversal remain open P2 coverage work.

## Performance Results

Route-based lazy loading emits separate dashboard, editor, gallery, ATS, matching, and manager chunks. The main vendor entry is 607.88 kB minified (192.85 kB gzip), which is a P3 optimization advisory. Resume/editor routes are materially smaller. MongoDB ownership/status fields and analysis/history access paths have relevant indexes; production explain plans and load tests were not available. Autosave is debounced, serialized, and patch-based.

## File Changes

Material audit changes:

- `.prettierignore`: excludes generated artifacts from formatting checks.
- `package.json` and `package-lock.json`: explicit AJV and remediated dependency versions.
- `apps/api/package.json`: Nodemailer 10 and current typings.
- `apps/api/src/middleware/auth.ts`: active-session enforcement for bearer tokens.
- `apps/api/src/config/openapi.ts`: current template identifiers and styling schema.
- `apps/api/src/resume.integration.test.ts`: revoked-session and mock-AI/ATS/idempotency regressions.
- `apps/web/src/features/resume/section-order.tsx`: accessible top-level dnd-kit sorting.
- `apps/web/src/features/resume/templates.tsx`: applies persisted section order.
- `apps/web/src/features/resume/templates.test.tsx`: section-order regression coverage.
- `apps/web/src/pages/resume-editor.tsx`: section sorting and accumulated patch autosave.
- Source/config files listed by the formatting command were mechanically formatted without behavior changes.
- `docs/all-phases-qa-report.md`: this report.

## Test Data Cleanup

API integration tests used `mongodb-memory-server`; disconnect and server shutdown delete the temporary database containing test users, sessions, resumes, versions, analyses, suggestions, and usage records. Playwright uses the configured local test account/database and performs lifecycle deletion of created resumes, but the preconfigured browser user is retained. No production database was accessed or modified.

## Remaining Issues

### QA-007 — P3 bundle size

Impact: slower first load on constrained networks. Reproduce with `npm run build`; inspect the 607.88 kB main entry. Recommended fix: vendor chunking and dependency-level analysis. Does not block the next phase or current staging use.

### QA-008 — P2 visual/accessibility coverage breadth

Impact: regressions on less-traveled pages may escape automation. Reproduce by reviewing Playwright coverage: the full seven-size screenshot matrix currently targets landing/login. Recommended fix: add authenticated screenshot fixtures plus axe scans for dashboard, manager, builder, gallery, ATS, and job matching. Does not block the next phase; blocks a production-ready declaration.

### QA-009 — P2 same-field multi-tab conflict UX

Impact: simultaneous edits to the same field remain last-write-wins. Reproduce by editing one field in two browser tabs and allowing both to autosave. Recommended fix: add a resume revision/ETag precondition and a user-facing merge/reload prompt. Unrelated section erasure is fixed by patch autosave. Does not block the next phase; should be resolved before high-scale collaborative use.

## Final Decision

READY WITH NON-BLOCKING ISSUES
