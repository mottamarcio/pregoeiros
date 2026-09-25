---
type: constitution
schema_version: 1
---

# Pregoeiros — Constitution

Non-negotiable invariants for the life of the project. Ordinary, mutable facts
live in the Knowledge base (`ai/knowledge/`); each invariant below names the
Knowledge it is distilled from. Where Knowledge sources disagree, the approved
decision record (`ai/raw/06-DECISOES.md`) prevails over the original specs and
the PoC.

## Product Invariants

- Pregoeiros serves **supplier companies** deciding whether to bid. It MUST NOT become a notice-publishing portal or a proposal-submission channel. (KNOW-001)
- The triage queue is the product's center: every relevant notice MUST carry an explicit, persisted and auditable decision state (`pendente | analisando | go | nogo`), and the home page MUST be the queue. (KNOW-001, KNOW-004)
- Communication MUST NOT claim guaranteed wins, official government prices, or complete/national coverage. Competitor figures MUST be framed as observed awarded results, never revenue, and expiring contracts MUST be framed as signals, never certainty. The public-data source MUST be cited. (KNOW-003, KNOW-009, KNOW-010)
- Derived metrics MUST be visibly distinguished from raw observations. A computed price statistic MUST always show its time window and sample size, and MUST NOT be shown as a median below the minimum sample. (KNOW-003, KNOW-008)
- The PoC is a **UX reference only**. Business rules come from the specs and the decision record; PoC numbers, mock data and simulated behaviors MUST NOT be shipped. Acceptance requires real, non-mocked data. (KNOW-002, KNOW-030)
- The user interface is in Brazilian Portuguese (pt-BR). (KNOW-017, KNOW-029)

## Architecture Invariants

- The browser MUST NEVER talk to Compras.gov.br. All upstream access, SQL and secrets live in server-only modules, and importing a server-only module from client code MUST fail the build. (KNOW-014, KNOW-015, KNOW-020)
- Responsibilities are strictly layered:
  - routes validate input and call services;
  - services own business rules and depend on interfaces, never on raw HTTP or raw SQL;
  - repositories only persist and query, never hold business rules;
  - integrations only fetch and map upstream data, never write product state;
  - jobs only orchestrate collection, never serve user requests.
  (KNOW-011, KNOW-014)
- Data collection MUST run outside the request path, with a single scheduler instance and no overlapping runs. (KNOW-018, KNOW-021, KNOW-029)
- The application MUST remain fully usable from the last collected base when the government API is unavailable; the app's health MUST NOT depend on upstream availability. (KNOW-001, KNOW-014, KNOW-029)
- UI mutations go through server-side form actions with schema validation; server data reaches the UI through `load`, never duplicated into global client stores. (KNOW-015, KNOW-022)

## Security Invariants

- Secrets and database credentials MUST exist only on the server; nothing exposed as public configuration may contain them. (KNOW-018, KNOW-023)
- 100% of SQL MUST use prepared/parameterized statements. (KNOW-023)
- Access requires authentication; any authentication bypass MUST be restricted to development environments. Passwords MUST never be stored in plaintext. (KNOW-018, KNOW-023)
- Every read and write of product data MUST be scoped to the session's tenant. (KNOW-023, KNOW-024)
- Manually triggering collection is admin-only and rate-limited. Every outbound call to the government API MUST have a timeout and a page ceiling. (KNOW-020, KNOW-022, KNOW-023)

## Data Invariants

- Official identifiers (purchase ID, PNCP control number, UASG, process, CATMAT/CATSER, CNPJ) MUST NEVER be invented or constructed. They are stored in their own columns and never mixed with internal identifiers. (KNOW-003, KNOW-005, KNOW-024)
- Data lives in two separate domains:
  - the **public mirror** is written only by the collector and keyed by official natural keys;
  - **product data** (decisions, alerts, favorites, seen flags) belongs to the tenant.
  Re-collection MUST NEVER erase or overwrite product data, and product state MUST NEVER be stored in the mirror; values that depend on the tenant are derived, not persisted. (KNOW-024, KNOW-025, KNOW-026)
- Incremental collection MUST NEVER truncate public tables. Historical awarded results MUST survive the removal of their parent notice. (KNOW-021, KNOW-024)
- Radar events are immutable; only their "seen" flag may change. (KNOW-012)
- Price statistics MUST be computed only from awarded results in the local base, and results from different upstream sources MUST NOT be mixed without being labeled. (KNOW-008)
- Monetary values MUST use exact decimal types (never floating point), and timestamps MUST be timezone-aware. (KNOW-015, KNOW-024)

## Integration Invariants

- Compras.gov.br Dados Abertos is the external source of truth and is consumed read-only (GET), within its published limits (page size, date-window and órgão requirements). (KNOW-019, KNOW-020)
- Upstream data MUST pass through mappers that isolate irregular naming and tolerate missing fields. Upstream parameter names follow the upstream OpenAPI exactly. (KNOW-019, KNOW-020)
- A failure in one collection module MUST NOT block the others. Source health and data freshness MUST always be visible to the user. (KNOW-001, KNOW-021)

## Quality Requirements

- Code MUST follow SOLID, DRY, KISS, and YAGNI: no speculative
  abstraction, no duplicated logic, no unnecessary complexity ahead of
  a demonstrated need.
- Every change to behavior MUST be covered by tests. Prefer writing
  the test first (TDD) and specifying behavior through concrete
  scenarios before implementation (BDD).
- Pure domain rules (urgency, alert matching, lexical exclusion, search normalization, price statistics, upstream-to-domain mapping) MUST be born with unit tests. User journeys are specified as end-to-end scenarios in business language. (KNOW-007, KNOW-028)
- Search normalization has exactly one definition, shared by persistence and querying. (KNOW-007)
- Core interactions MUST be keyboard-operable, and icon-only controls MUST carry accessible labels. (KNOW-017, KNOW-029)
- **No inference under doubt.** When anything is ambiguous, unspecified or contradictory — in Knowledge, specs, code or a request — nothing may be inferred or silently decided. Stop and ask the project owner which alternative is preferred, presenting the options with the best one explicitly marked as **"recomendada"**. (Project owner directive, 2026-09-25)

## Compatibility Requirements

- Database migrations MUST stay backward-compatible within the same major version. (KNOW-024)
- Breaking changes to the internal API require a deliberate version bump and a changelog note. (KNOW-022)
- CSV exports MUST be UTF-8 with BOM so they open correctly in pt-BR spreadsheet tools. Dates and currency are displayed in pt-BR format (BRL). (KNOW-015, KNOW-017, KNOW-022)
