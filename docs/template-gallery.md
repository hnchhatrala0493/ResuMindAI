# Resume template gallery

The template system uses a server-owned metadata registry and a client renderer registry. Metadata contains access level, status, layout, ATS suitability, professions, palettes, fonts, defaults, popularity, and ordering. React components are never stored in MongoDB. This keeps future database-backed administration compatible with a safe code registry.

The initial collection contains four free templates—Modern Classic, Professional, Minimal, and Technical—and eight Pro templates—Executive Pro, Modern Sidebar, Creative Studio, Elegant Serif, Product Leader, Developer Pro, International, and Compact Pro. Creative Studio and Modern Sidebar are intentionally not marked ATS friendly.

Applying a template is handled by `PATCH /api/v1/resumes/:resumeId/template`. The server loads the owned resume, validates the active registry entry, derives entitlement from the stored plan/status/expiry, constrains fonts and layout, and updates only `templateId`, controlled styling, and `lastSavedAt`. Resume content is never accepted from this endpoint. Free users may preview Pro templates but receive `403 PREMIUM_REQUIRED` when attempting to apply one.

Until the payment phase exists, entitlements are derived from `plan`, `subscriptionStatus`, and `subscriptionExpiresAt`. Tests may seed these database fields; the browser must never submit or alter them. No payment success is simulated.

Customization is limited to predefined fonts, palettes, page sizes, layout modes, colors, type sizes, spacing, margins, image/icon visibility, date formats, and section-title styles. Arbitrary CSS and scripts are not accepted.
