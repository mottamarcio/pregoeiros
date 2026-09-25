---
id: KNOW-001
type: knowledge
status: active
sources:
  - path: ai/raw/01-PRD.md
    fingerprint: sha256:e89421dcc3365f7825eaf8f50cc5d45ae4bcde53be9a796b9c3563994ab30930
  - path: ai/raw/pregoeiros.html
    fingerprint: sha256:30c5fcee2830437c6a754257a19b7e64fdb3233915f49836d4c6deb02a079c7e
  - path: ai/raw/06-DECISOES.md
    fingerprint: sha256:c41ad04667805c05ff559cb82fc6fe2a5cbd64a3c1af1ae120dcfc17ff28792d
---

# KNOW-001 — Product Vision, Scope and Principles

## Summary

Pregoeiros ("Triagem e Inteligência em Licitações Públicas") is a web app for
**supplier companies** that bid in Brazilian public procurement. It turns the
volume of procurement notices (editais), items, awards (homologações) and
contracts published on Compras.gov.br into a **commercial work queue** where the
team decides quickly whether to bid (GO), analyze further (Em Análise) or
discard (NO-GO). The production version replicates the PoC experience using real
data from the Compras.gov.br Open Data API, persisted in PostgreSQL and refreshed
by scheduled jobs.

## Known Facts

- Product name: **Pregoeiros — Triagem e Inteligência em Licitações Públicas**; PRD version 1.0, status "Draft para implementação"; language pt-BR.
- PRD references: the attached HTML PoC, Lei nº 14.133/2021, and the Compras.gov.br Dados Abertos API.
- Target users are supplier companies competing in public purchases (not government buyers).
- The PoC frames the product as **triage + radar + price intelligence**.
- **Problem** statement — suppliers lose deadlines and margin because:
  - notices and amendments (retificações) are scattered across portals;
  - the textual object rarely maps to the company's niche CATMAT/CATSER codes;
  - reference prices are estimated by gut feeling, without an observed median;
  - contracts about to expire (a signal of a new notice) don't enter the sales funnel;
  - the GO/NO-GO decision is neither recorded nor auditable.
- **Solution** — a SvelteKit application that:
  1. Collects procurements (contratações), items, awarded results, contracts and the CATMAT/CATSER catalog.
  2. Normalizes and indexes them in PostgreSQL.
  3. Cross-references them with the company's niche alerts (product + UF + buyer/órgão).
  4. Presents a queue prioritized by proposal deadline, item fit and value.
  5. Records the commercial decision and feeds favorites, radar and history.
- **Product principles** (mirrored from the PoC):
  1. Rigorous terminology — distinguish raw data (observed award) from derived metric (median computed on the consulted base).
  2. Queue before exploration — the home page is the Triage Queue, not a vanity dashboard.
  3. Explicit decision — every relevant notice has a state: `pendente | analisando | go | nogo`.
  4. Deadline is the axis — cards and tables highlight days remaining and urgency (≤ 48h / ≤ 3 days).
  5. Visible freshness — header shows last collection and source status.
  6. Exclusion in search — a `-serviço` token removes noise.
  7. Don't block work — if the government API is down, the last collected base remains queryable.
- v1 functional scope maps 1:1 to the PoC views: Triage Queue, Opportunities, Triage Sheet, Products & Prices, Competitors, Expiring Contracts, Radar, Saved Alerts, Favorites, Observed History, Global Search, Source Integrity modal, and Scheduled Collection.
- The PoC header subtitle reads "Triagem de Editais"; the triage screen is labeled "Empresa Fornecedora".

## Constraints

- **Non-goals for v1 (YAGNI):**
  - Not a portal for publishing notices.
  - Does not replace Comprasnet / PNCP for submitting proposals.
  - No predictive "win score" with ML in v1.
  - Does not cover states/municipalities not reflected in the consulted base.
  - Does not claim a competitor's total revenue — only **observable awarded results** in the base.
  - No enterprise multi-tenancy (corporate SSO, billing) in v1 — a single "supplier company" tenant with internal users suffices.
- The app must remain useful when the government API is unavailable.

## Unknowns

- How the company's "niche" (monitored CATMAT/CATSER set, UFs, buyers) is initially configured in production beyond seeding `watched_products` — no onboarding flow is described.
- Whether the "Em Análise" state has any SLA or expiry — not specified.

## Conflicts

- None remaining. The coverage-wording conflict was resolved by D-01 (recorded in [[KNOW-003]]).

## Provenance

- Vision, problem, solution, non-goals, principles, v1 scope list: `ai/raw/01-PRD.md` §1, §3, §4.
- PoC framing, header labels and coverage wording: `ai/raw/pregoeiros.html` (header, sidebar, `handleSaveInterest`, history view).
- Decisions D-01: `ai/raw/06-DECISOES.md`.

## Related Topics

- [[KNOW-002]] personas, metrics, roadmap and acceptance criteria
- [[KNOW-003]] legal and communication constraints
- [[KNOW-004]] triage queue and decisions
- [[KNOW-030]] PoC reference prototype
