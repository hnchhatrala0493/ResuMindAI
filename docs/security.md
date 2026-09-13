# Security baseline

- Validate all untrusted input with shared Zod schemas.
- Keep authorization and ownership enforcement in the API.
- Store only token hashes and rotate refresh tokens after each use.
- Use secure cookies, an explicit CORS allowlist, Helmet, request limits, and rate limits.
- Redact authorization, cookies, passwords, and tokens from structured logs.
- Keep production secrets outside Git and rotate exposed credentials immediately.
- Run MongoDB and the API on private networks where possible.
- Complete legal, threat-model, dependency, penetration, and privacy reviews before production launch.
