# Architecture

ResuMind AI is an npm-workspaces monorepo. `apps/web` is a React/Vite client, `apps/api` is an Express/Mongoose service, and `packages/shared` owns cross-runtime Zod contracts. `packages/ui` contains design-system primitives.

API requests flow through routes, middleware, controllers, services, repositories, and models. Controllers remain transport-focused; business rules belong in services. Every owned resource query must scope by both `_id` and `ownerId`.

Authentication uses short-lived bearer access tokens and rotating refresh tokens in HTTP-only cookies. Only hashes of refresh, verification, and reset tokens are stored.

Later phases add resume, AI, ATS, import/export, payment, and administration modules without changing these boundaries.
