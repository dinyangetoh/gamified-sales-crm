# AGENT.md

## Global coding standards

- Use explicit return types for public methods in services and repositories.
- Keep services and repositories lean with focused responsibilities.
- Prefer shared contracts over inline ad-hoc shapes for reusable data structures.
- Prefer shared enums for reusable domain value sets over repeated string literals.
- Use descriptive camelCase identifiers for domain variables and avoid ambiguous short names.

## Type and interface rules

- Service-level shared contracts: `I<ServiceName>.ts` (for example `IUsersService.ts`).
- Repository/domain shared contracts: `<Domain>Model.ts` (for example `UsersModel.ts`).
- Do not declare inline `interface` or `type` definitions inside service/processor implementation files.
- Update imports after contract/model refactors and remove superseded files.

## Error handling and logging

- Use one top-level try/catch per public service method.
- Avoid nested try/catch blocks inside the same method unless explicitly justified.
- For cache pass-through behavior, prefer graceful fallback (`.catch` + warn log) instead of dedicated try/catch blocks.
- In catches, log structured context:
  - `service`, `method`, `operation`,
  - relevant non-sensitive identifiers (for example `userId`, `eventId`, `week`),
  - error name/message/stack.
- Map internal failures to safe Nest exceptions with domain-specific human-friendly messages via `handleServiceError`.
- Keep HTTP `2xx` response body structures unchanged unless explicitly requested.

## Documentation sync

- Keep `docs/CLAUDE.md`, `web/CLAUDE.md`, and `.cursorrules` aligned with these standards.
