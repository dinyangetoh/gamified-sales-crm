Read and follow root `AGENT.md`.

Web-specific notes:
- Keep frontend components lean and typed.
- Reuse shared contracts and avoid inline ad-hoc types in complex components.
- Prefer enum-backed shared constants over duplicated string literals for domain states and modes.
- Use descriptive camelCase identifiers for domain variables; avoid ambiguous short names that hide intent.
- Surface user-safe error states in UI while preserving structured logs on server boundaries.
