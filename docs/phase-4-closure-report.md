# Phase 4 Closure Report

Date: 2026-09-13

## Executive summary

Baseline decision was **NOT READY FOR PHASE 5** with 12 stated closure blockers. This pass fixed the share-unlock invalidation defect, added privacy-preserving view deduplication, added a configurable malware-scanning adapter, expanded Import Review to all supported sections, added a protected canonical React print route, added export idempotency metadata/uniqueness, and documented the Phase 4 API surface. Phase 1–3 regression remains green.

Phase 4 is still not complete. Durable background processing and database-backed concurrency are not active, the production React-to-PDF path has not received the required all-template image comparison, and the requested Phase 4-specific Playwright matrix/screenshots have not been implemented. These are P1 release blockers.

## Root causes and work completed

| Area               | Root cause                                                                              | Change                                                                                                                                                                                                                        | Verification                                                                                       | Status                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Share unlock       | Credential version was tied to `updatedAt`; recording a view immediately invalidated it | Added an independent `credentialVersion`, signed permission-scoped HttpOnly cookie, and rotation on link update/revoke                                                                                                        | Integration: wrong password 401, unlock 200, repeated view 200, protected download 200, revoke 410 | Fixed                                                                                  |
| View analytics     | Every GET incremented the link document                                                 | Added anonymous server cookie, one-way visitor hash, time bucket, unique index, and TTL cleanup                                                                                                                               | Integration: unlock plus two refreshes results in one view                                         | Fixed                                                                                  |
| Malware scanning   | Upload validation ended at signature/MIME checks                                        | Added disabled-development, deterministic mock, and ClamAV INSTREAM adapters with timeout and fail-mode handling; scan occurs before parsing                                                                                  | Type/lint/build and clean DOCX integration pass                                                    | Implemented; dedicated fault-injection tests still required                            |
| Import review      | Only four personal fields and summary were editable                                     | Reused builder repeatable-section editor for work, education, skills, projects, certifications, languages, achievements, volunteer work, and custom sections; added remaining personal fields                                 | Type/lint/build pass                                                                               | Fixed functionally; Phase 4 E2E remains                                                |
| PDF renderer       | API generated a separate HTML document                                                  | Added `/internal/resumes/:resumeId/print` using the actual `ResumeDocument`, and a server endpoint accepting a two-minute signed credential bound to export, owner, resume, and permission; Chromium blocks untrusted origins | Type/lint/build pass                                                                               | Implemented; visual parity unverified                                                  |
| Export idempotency | No request identity or uniqueness constraint                                            | Added scoped idempotency key, settings hash, mismatch conflict, and unique compound index                                                                                                                                     | Type/lint/integration pass                                                                         | Partial: concurrent duplicate race response needs explicit test/duplicate-key handling |
| OpenAPI            | No Phase 4 paths/schemas                                                                | Documented import, confirmation, export/status, version/restore, share CRUD, public view/unlock/download, multipart, idempotency, entitlement, password, and rate-limit outcomes                                              | Type/build pass and `/openapi.json` remains served                                                 | Implemented; response-contract automation remains                                      |

## Shared rendering architecture

Builder preview, template preview, public view, and the internal print page import `ResumeDocument` from the same template registry. Production PDF rendering opens only the configured web origin and local API origin. The render credential is carried in the URL fragment (not sent in HTTP request logs), removed from browser history before the API exchange, expires in two minutes, and cannot authorize ordinary API calls. The backend test environment retains isolated legacy markup because API tests do not start the frontend; that fallback is not used by production rendering.

No visual-parity claim is made: the production route has compiled but has not been exercised across the complete 12-template matrix.

## Security implementation

- Public unlock cookies are HttpOnly, SameSite=Lax, secure when configured, scoped to public-resume APIs, permission-bound, link-bound, short-lived, and invalidated by password/link updates or revocation.
- Unlock attempts use the existing dedicated limiter (5 attempts/minute) and generic credentials error.
- View deduplication stores no raw IP; the default window is 30 minutes.
- Upload bytes remain in memory and are scanned before parsing. Production refuses disabled scanning; enabled scanner failures default closed.
- Render credentials are owner/resume/export/scope-bound. Internal render responses are `no-store`; arbitrary client HTML/render URLs are not accepted.

## Job architecture, concurrency, and idempotency

Export records now contain operation type, progress, current step, attempts, idempotency key, payload hash, lease timestamps, and completion timestamps. Idempotency is scoped by owner, resume, format, and relevant persisted rendering settings.

The current request still performs rendering synchronously. `EXPORT_MAX_CONCURRENT` is therefore not enforced through a live database lease worker, queued work is not recovered after restart, and imports do not have a retryable durable payload workflow. An export-slot schema exists but is intentionally not represented as active enforcement. This area blocks Phase 5.

## PDF comparison results

| Template set        | A4      | Letter  | Long/multipage | Hidden/reordered | Pixel comparison |
| ------------------- | ------- | ------- | -------------- | ---------------- | ---------------- |
| 12 active templates | Not run | Not run | Not run        | Not run          | Not run          |

Required PNG rendering, selectable-text/link assertions, page-count recording, and perceptual thresholds remain absent. This blocks Phase 5.

## Swagger coverage

Phase 4 routes and principal requests/responses/errors are present in `openapi.ts`. A schema-vs-live-response contract test has not been added, so “complete and verified” cannot yet be claimed.

## E2E and responsive results

Existing Chromium suite passed 9/9: full Resume Builder lifecycle, template gallery/full preview, and screenshots at 375×667, 390×844, 768×1024, 1024×768, 1280×800, 1440×900, and 1920×1080.

Those screenshots cover the existing builder/gallery flow, not every requested Phase 4 state (processing, complete import review, export dialog, version preview, share settings, public password, expired/revoked). The 28-step Phase 4 Playwright flow is not present and blocks Phase 5.

## Regression results

| Command                    |     Exit | Result                                                                                        |
| -------------------------- | -------: | --------------------------------------------------------------------------------------------- |
| `npm.cmd run format`       |        0 | Completed                                                                                     |
| `npm.cmd run format:check` |        0 | All files match Prettier                                                                      |
| `npm.cmd run lint`         |        0 | API, web, shared, UI pass after unused-parameter fix                                          |
| `npm.cmd run typecheck`    |        0 | Shared/UI build plus API/web TypeScript pass                                                  |
| `npm.cmd test`             |        0 | API 11, web 3, shared 2 tests pass                                                            |
| `npm.cmd run build`        |        0 | API and frontend production builds pass; Rollup reports a non-failing large-chunk warning     |
| `npm.cmd run test:e2e`     |        0 | Chromium 9/9 pass in 1.2 minutes                                                              |
| `npm.cmd audit --omit=dev` | non-zero | Registry audit endpoint unavailable in the restricted environment; no security result claimed |

## Material file changes

- `apps/api/src/controllers/phase4.controller.ts`: scanner hook, unlock credentials, view dedupe, internal renderer authorization, canonical production PDF handoff, export idempotency metadata.
- `apps/api/src/models/resume-share-link.model.ts`: credential version.
- `apps/api/src/models/resume-share-view.model.ts`: deduplicated anonymous visits and TTL.
- `apps/api/src/models/resume-export.model.ts`: job/idempotency fields and unique index.
- `apps/api/src/models/export-slot.model.ts`: schema foundation for future database semaphore.
- `apps/api/src/services/malware-scanner.service.ts`: ClamAV/mock/disabled adapters.
- `apps/api/src/config/env.ts`, `apps/api/.env.example`: scanner, view, unlock, and idempotency configuration.
- `apps/api/src/config/openapi.ts`: Phase 4 schemas and paths.
- `apps/api/src/routes/v1/index.ts`: internal render credential exchange route.
- `apps/api/src/resume.integration.test.ts`: unlock/download/dedup regression.
- `apps/web/src/pages/internal-resume-print.tsx`: canonical React print document.
- `apps/web/src/pages/resume-import.tsx`: complete supported-section review controls.
- `apps/web/src/app/router.tsx`: lazy internal print route.

## Remaining blockers

1. **P1 — durable jobs:** move import/export work to recoverable MongoDB-leased workers, add retry/cancel/stalled recovery, persist safe job errors and import artifacts, and poll terminal states.
2. **P1 — concurrency:** activate atomic database-backed slots for exactly `EXPORT_MAX_CONCURRENT`, including abandoned-lease recovery and multi-instance tests.
3. **P1 — visual parity:** run every active template/settings/content/page-size case, rasterize every PDF page, compare with documented tolerance, and retain ignored artifacts.
4. **P1 — Phase 4 E2E/responsive coverage:** implement and pass the complete requested workflow and every requested Phase 4 page/state at all seven viewports.
5. **P2 — hardening tests:** add malware infection/timeout/fail-closed, render-token misuse/expiry, idempotent concurrent duplicate, credential rotation, and OpenAPI contract tests.
6. **P2 — dependency audit:** rerun production audit where npm registry audit access is available.

## Environment changes

`MALWARE_SCAN_ENABLED`, `MALWARE_SCANNER_PROVIDER`, `CLAMAV_HOST`, `CLAMAV_PORT`, `MALWARE_SCAN_TIMEOUT_MS`, `MALWARE_SCAN_FAIL_MODE`, `PUBLIC_VIEW_DEDUPE_MINUTES`, `SHARE_UNLOCK_TTL_MINUTES`, and `EXPORT_IDEMPOTENCY_TTL_HOURS` are documented. Local ClamAV can use the existing Docker documentation/configuration; production scanning is fail-closed.

## Final decision

NOT READY FOR PHASE 5
