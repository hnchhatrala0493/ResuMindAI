# ResuMind AI

Production-oriented AI resume builder monorepo.

## Quick start

1. Copy `apps/api/.env.example` to `apps/api/.env` and `apps/web/.env.example` to `apps/web/.env`.
2. Start MongoDB with `docker compose up -d mongodb`.
3. Install packages with `npm install`.
4. Run both applications with `npm run dev`.

The web app runs at `http://localhost:5173` and the API at `http://localhost:5000`.

## Workspace commands

- `npm run dev` — run web and API concurrently
- `npm run lint` — lint every workspace
- `npm run typecheck` — strict TypeScript validation
- `npm test` — unit and integration tests
- `npm run build` — production builds

See [docs/architecture.md](docs/architecture.md) and [docs/security.md](docs/security.md) for implementation details.

## Resume builder (Phase 2)

Authenticated users can create, search, edit, duplicate, archive, restore, and soft-delete resumes at `/dashboard/resumes`. The section editor uses local state and serializes debounced autosaves through RTK Query. Resume content is normalized once and rendered by six ATS-friendly template variants: Modern, Professional, Minimal, Executive, Creative, and Technical. Meaningful manual and lifecycle operations create `ResumeVersion` snapshots; keystroke autosaves do not.

The API always derives `userId` from the authenticated access token and scopes every resume lookup by both resume and user ID.

## Documents, history, and sharing (Phase 4)

Authenticated users can import selectable-text PDF and DOCX resumes at `/dashboard/resumes/import`. Files are held in memory, checked by extension, MIME type, and binary signature, parsed with a timeout, and discarded after extraction. Scanned PDFs, encrypted documents, and OCR are not supported. Parsed fields and confidence labels must be reviewed before idempotent confirmation creates a new resume.

PDF exports use a sandboxed local Chromium process and selectable HTML text; DOCX exports use a deliberately simpler editable document layout. Export records expire after 24 hours. Premium-template export is enforced by the same backend entitlement service as template application.

Version history records manual saves, template changes, AI changes, imports, and lifecycle events, but not keystroke autosaves. Restoring a historical version first creates a safety snapshot. Public links use random 256-bit tokens stored only as SHA-256 hashes, optional bcrypt-hashed passwords, expiry, revocation, download controls, and `noindex` by default.
