# Phase 3: AI, ATS scoring, and job matching

## Architecture

Deterministic ATS scoring (`ats-v1`) is independent of external AI and always remains available. Controllers use a provider-neutral `AIProvider` interface. The current adapters support OpenAI Chat Completions, Gemini `generateContent`, and a deterministic mock used for development and CI. Provider output is parsed as JSON and validated with Zod before persistence.

The 100 points are: contact 5, summary 10, experience 20, measurable achievements 10, skills 10, job keywords 20, education/certifications 5, formatting 10, writing 5, and section completeness 5. Without a job description, keyword matching receives a documented neutral 14/20 fallback. Scores are internal estimates, never official employer ATS results.

Job matching normalizes case and punctuation, removes stop words, canonicalizes aliases (JS/JavaScript, TS/TypeScript, React.js/React, Node.js/Node), compares whole concepts rather than substrings, and separates explicitly required/preferred language. Users are reminded not to claim missing skills they do not possess.

## Security and privacy

Resume and analysis queries are scoped by authenticated user ownership. Inputs have strict Zod limits. External prompts delimit resume content as untrusted data, tell the provider to ignore embedded instructions, and remove email addresses, phone numbers, and private links. Outputs have strict schemas and maximum lengths. Logs never include prompts or resume bodies. Provider keys remain server-only. External use requires explicit consent; deterministic checks do not.

AI suggestions never update a resume automatically. Application uses a server allowlist, verifies the original text and target still exist, creates a version snapshot, and expires stale suggestions. AI calls have timeouts, normalized errors, per-route limits, idempotency keys, reserved credits, and refunds on failed output. Daily credits and feature prices live server-side.

## Configuration and testing

Set `AI_PROVIDER=mock` for local development and CI. For external providers set `AI_PROVIDER=openai` or `gemini`, `AI_MODEL`, and the matching key (`AI_API_KEY`, `OPENAI_API_KEY`, or `GEMINI_API_KEY`). See `.env.example` for timeouts, retry limits, feature flags, and credit limits. Never run automated tests against paid providers.

To add a provider, implement `AIProvider.generateStructuredResponse`, normalize request ID/token usage/errors, validate every output, and select it in the provider factory. Troubleshoot failures by checking feature flags, model/key compatibility, provider quota, timeout settings, and the safe error code returned by the API.
