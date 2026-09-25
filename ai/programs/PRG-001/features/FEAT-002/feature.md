---
id: FEAT-002
type: feature
status: draft
parent: PRG-001
---

# FEAT-002 — Authentication and Access Control

## Capability

Signing users in and out with a session cookie, enforcing the `analista` and
`admin` roles, and making the current tenant available to every server
request so all product data is tenant-scoped.

## User Value

Only the supplier company's own staff can see and change its triage
decisions, alerts and favorites. Operational actions (manual sync, logs) are
limited to administrators.

## Scope

- `tenants`, `users` (email `text` lowercased, unique on `(tenant_id, lower(email))`), and a sessions table.
- Minimal session implementation in `hooks.server.ts` following the Lucia guide:
  - httpOnly cookie;
  - session creation, validation, renewal and invalidation;
  - Argon2id password hashing.
- Login and logout pages/actions with Zod validation and pt-BR messages.
- `event.locals` exposes the user, role and `tenant_id`. The repository contract requires `tenant_id` for all product-data access (D-21).
- Route guards: every app route requires a session; admin-only routes and endpoints (e.g. `POST /api/sync`) are enforced by role.
- `AUTH_DISABLED=true` bypass allowed only in development.
- Production seed of the single tenant and its admin user (with FEAT-001).

## Non-Goals

- OAuth, corporate SSO, billing, real multi-client support, RLS (v1 non-goals).
- Using the Lucia library itself or Auth.js (D-25).

## Constraints

- Constitution: secrets server-only; authentication required, with the bypass limited to development; passwords never stored in plaintext; tenant-scoped product data; prepared statements.
- Decisions D-21, D-24, D-25.

## Relevant Knowledge

- [[KNOW-023]] authentication and security
- [[KNOW-024]] tenancy conventions
- [[KNOW-014]] trust boundaries
- [[KNOW-018]] `AUTH_DISABLED`, environment

## Open Questions

- User management: how users are created, invited and deactivated, and how passwords are reset (UI vs. admin command). ([[KNOW-023]])
- Password policy (length, complexity, rotation). ([[KNOW-023]])
- CSRF protections beyond SvelteKit defaults. ([[KNOW-023]])
- Whether `/api/health` requires authentication. ([[KNOW-022]])
- Session lifetime and idle timeout — not specified in Knowledge.
