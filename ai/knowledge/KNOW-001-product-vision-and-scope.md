---
id: KNOW-001
type: knowledge
status: active
sources:
  - path: ai/raw/product-requirements-specification.md
    fingerprint: sha256:2bc5dcaed50a260356ef011dcdfb68dc3b6ec83b087afe43d4443c892bbdd21d
  - path: ai/raw/architecture-specification.md
    fingerprint: sha256:8d6b92ad3cf755058a37d91bf1ac90e25257298b2f2785e8c389e6d92b42475f
---

# KNOW-001

## Summary

Pregoeiros is a web application for researching, monitoring, and analyzing
Brazilian public procurement data sourced from the Compras.gov.br Open Data
API. It is explicitly not a frontend/wrapper for the Compras.gov.br Swagger
API; it must let users answer real procurement questions through navigation,
search, filters, and visualizations without needing to know API endpoints,
parameters, or internal codes.

## Known Facts

- Product name: **Pregoeiros**. Status of both PRD and Architecture Spec is
  "Draft".
- The product answers a chain of real user questions: what is being bought →
  who is buying → how much is being paid → who is winning/supplying → what
  happened historically → what opportunities are relevant now.
- The application organizes around three pillars: **Explorar** (search/inspect
  procurements, products/services, suppliers, contracts), **Acompanhar**
  (Favoritos, Interesses, Radar — persistent user-selected monitoring), and
  **Analisar** (Histórico, Preços — historical/derived analysis).
- The Compras.gov.br API has modules for contratações (procurements), item
  results, CATMAT/CATSER (materials/services catalog), practiced prices,
  suppliers, contracts, ARPs (price registries), and legacy data — these form
  the functional basis of the product.
- Pregoeiros owns a normalized application/domain model; upstream APIs are
  treated purely as data sources, not as the application's internal
  architecture (see [[KNOW-003]]).
- Example real questions the product must resolve: "Quais órgãos estão
  comprando notebooks no Rio de Janeiro?", "Quanto o governo vem pagando por
  esse produto?", "Quais fornecedores aparecem nos resultados dessas
  contratações?", "Quais contratos estão próximos do fim?", "Como os preços
  desse produto evoluíram nos últimos 24 meses?"

## Constraints

- The system MUST NOT be a thin HTTP proxy or visual wrapper around the
  Compras.gov.br Swagger API (explicit non-goal, stated in both PRD and
  architecture spec).
- Terminology must be rigorous: presence of a supplier in a process does not
  mean it won; rankings must use effectively observable results in the data,
  not assumed wins (see [[KNOW-010]] for terminology rules).

## Unknowns

- No information on target users/personas beyond "usuário" in general, nor on
  business model, authentication provider, or multi-tenancy requirements
  beyond the architectural allowance for a future `user_id` boundary (see
  [[KNOW-003]]).

## Conflicts

None identified between sources on vision/scope.

## Provenance

- Vision, three pillars, and objective: `ai/raw/product-requirements-specification.md` §1–2.
- Architectural framing of the three capabilities (Explore/Monitor/Analyze)
  and non-proxy principle: `ai/raw/architecture-specification.md` §1.

## Related Topics

[[KNOW-003]], [[KNOW-010]], [[KNOW-011]]
