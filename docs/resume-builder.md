# Resume builder

Resume input is validated by shared Zod schemas before controlled service updates. Nested entries use UUIDs rather than Mongo subdocument IDs. Autosave waits 1.4 seconds, queues writes to prevent overlap, reports its state through an ARIA status, and warns before leaving with unsaved changes.

All templates consume the same normalized resume contract. Styling is restricted to allowlisted fonts, layouts, page sizes, numeric bounds, and six-digit colors; arbitrary CSS and HTML are not accepted. The profile-image field is currently URL-only. A storage provider adapter will replace this field workflow when upload infrastructure is introduced.
