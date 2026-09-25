---
id: KNOW-023
type: knowledge
status: active
sources:
  - path: ai/raw/01-PRD.md
    fingerprint: sha256:e89421dcc3365f7825eaf8f50cc5d45ae4bcde53be9a796b9c3563994ab30930
  - path: ai/raw/02-ARCHITECTURAL_SPECS.md
    fingerprint: sha256:6e7674dbbc7cc493eb3ab19f7df694f82a5ff42b7c6d7c5b3c88a453d09250f7
  - path: ai/raw/03-TECHNICAL_SPECS.md
    fingerprint: sha256:741fbe58fe00125ff33a345b7ac2926ed232b3b2157040b3458d9c0c28d62c19
  - path: ai/raw/05-DATA_MODEL_SPECS.md
    fingerprint: sha256:721ba22842c1abc71b7203e4985d087b77d43e1682d047a20a30572dfd9803d0
  - path: ai/raw/06-DECISOES.md
    fingerprint: sha256:c41ad04667805c05ff559cb82fc6fe2a5cbd64a3c1af1ae120dcfc17ff28792d
---

# KNOW-023 — Authentication, Authorization and Security Baseline

## Summary

v1 is an internal app for one supplier company: simple cookie-session
authentication with two roles (`analista`, `admin`), server-only secrets,
prepared statements everywhere, rate limiting on the sync trigger, and
defensive timeouts toward the government API.

## Known Facts

- Internal app of the supplier company; simple authentication (company credential).
- **Decision D-25 — authentication:** minimal session implementation in `hooks.server.ts` following the Lucia guide (what `sv add lucia` scaffolds): **httpOnly cookie**, sessions table in Postgres, passwords hashed with **Argon2id**. No dependency on the (discontinued) Lucia library nor on Auth.js.
- Roles: `analista`, `admin`. `admin` triggers manual sync and sees logs.
- No mandatory OAuth.
- `AUTH_DISABLED=true` allowed **only in development** to skip login in a local MVP.
- `users` table: `tenant_id`, `email` (**`text`**, lowercased via Zod, unique index on `(tenant_id, lower(email))` — D-24), `name`, `role` CHECK (`analista` | `admin`), `password_hash` (nullable), `created_at`.
- Security NFR: secrets only on the server; simple tenant isolation. **D-21:** in v1 isolation is done by mandatory `tenant_id` filtering in repositories (from `event.locals`), without RLS.
- Rate limit on `/api/sync` to avoid loop-triggering collection.
- Prepared statements in **100%** of SQL.
- Timeout and page ceiling in the HTTP client (protection against government API hangs).
- Client code must never see `DATABASE_URL`; nothing prefixed `PUBLIC_` may contain a DB URL.
- Importing `$lib/server` from the client must fail the build.
- The Compras.gov.br API requires no token; if it ever does, the secret goes in `env.ts`.
- Production seed creates only `tenant` + `admin` + initial `watched_products`.

## Constraints

- No enterprise SSO/billing in v1.
- `AUTH_DISABLED` must be false outside development.

## Unknowns

- User management UI (creating users, resetting passwords) — not described.
- CSRF protections beyond SvelteKit defaults — not mentioned.
- Rate-limit thresholds for `/api/sync`.
- Password policy (length, complexity, rotation) — hashing algorithm is decided (Argon2id), the policy is not.

## Conflicts

- None remaining. Auth library choice resolved by D-25.

## Provenance

- Security NFR, single-tenant non-goal: `ai/raw/01-PRD.md` §1.3, §5.
- Security minimum, library options, trust boundaries: `ai/raw/02-ARCHITECTURAL_SPECS.md` §6, §10.
- Session, roles, AUTH_DISABLED, env rules: `ai/raw/03-TECHNICAL_SPECS.md` §3.3, §4, §8, §13.
- `users` table, production seed: `ai/raw/05-DATA_MODEL_SPECS.md` §4, §10.
- Decisions D-21, D-24, D-25: `ai/raw/06-DECISOES.md`.

## Related Topics

- [[KNOW-014]] trust boundaries
- [[KNOW-018]] configuration
- [[KNOW-024]] tenancy conventions
