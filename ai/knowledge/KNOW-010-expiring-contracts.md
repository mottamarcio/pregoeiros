---
id: KNOW-010
type: knowledge
status: active
sources:
  - path: ai/raw/01-PRD.md
    fingerprint: sha256:e89421dcc3365f7825eaf8f50cc5d45ae4bcde53be9a796b9c3563994ab30930
  - path: ai/raw/03-TECHNICAL_SPECS.md
    fingerprint: sha256:741fbe58fe00125ff33a345b7ac2926ed232b3b2157040b3458d9c0c28d62c19
  - path: ai/raw/04-API_SPECS.md
    fingerprint: sha256:1215eac4a5b82a0571a0d54b6110864df5746427db114033250f83f8e8baa7c7
  - path: ai/raw/05-DATA_MODEL_SPECS.md
    fingerprint: sha256:721ba22842c1abc71b7203e4985d087b77d43e1682d047a20a30572dfd9803d0
  - path: ai/raw/pregoeiros.html
    fingerprint: sha256:30c5fcee2830437c6a754257a19b7e64fdb3233915f49836d4c6deb02a079c7e
  - path: ai/raw/06-DECISOES.md
    fingerprint: sha256:c41ad04667805c05ff559cb82fc6fe2a5cbd64a3c1af1ae120dcfc17ff28792d
---

# KNOW-010 — Expiring Contracts (`/contratos`)

## Summary

The Expiring Contracts view surfaces government contracts whose term
(vigência) ends within 30 / 60 / 90 days, as **anticipation signals** of a
possible new tender. It is not a tool for managing the company's own contracts.

## Known Facts

- Windows: 30 / 60 / 90 days.
- Table: contract number, órgão, current supplier, end of term (fim de vigência), value, time remaining.
- Goal: anticipate a new notice — **not** manage the company's own contracts.
- PoC cards: "Contratos a vencer em até 30 dias — Potencial de renovação ou novo edital iminente"; "até 60 dias — Órgãos em período de estudo técnico preliminar"; "até 90 dias — Monitoramento de fim de vigência contratual".
- PoC time-remaining badge colors: red (≤ ~30 days), amber (~31–60), slate (beyond), text "Vence em N dias".
- Upstream endpoint `modulo-contratos/1.2_consultarContratos_FimVigencia` with `dataVigenciaFinalMin/Max`. Either three queries (30d: today→+30; 60d: today→+60, UI may subtract the 30-day bucket; 90d: today→+90) or one 90-day window with local classification.
- Windows 30/60/90 are computed in the query (`vigencia_fim BETWEEN current_date AND current_date + 90`), no view needed. Index `contracts (vigencia_fim)`.
- Contract items (`modulo-contratos/2_consultarContratosItem`) are used to decide whether an expiring contract belongs to the niche (TI, hospitalar, climatização).
- Scenario card: "Quais contratos de TI estão próximos do fim?".
- Acceptance: list contracts whose term ends within 30/60/90 days.
- **Decision D-14 — contract windows:** UI buckets 30 / 60 / 90 days; collection covers `vigencia_fim` from today to today + 120 days (the margin keeps the 90-day bucket stable between runs); retention deletes contracts with `vigencia_fim` < today − 30 days, with **no** upper retention bound.

## Constraints

- Contracts are signals, not certainty of a new pregão (see [[KNOW-003]]).

## Unknowns

- Whether the buckets are cumulative (≤60 includes ≤30) or exclusive — the PoC counters (87 / 143 / 211) look cumulative, and the API spec says the UI "may" subtract the 30-day bucket.
- How contracts are filtered to the company's niche in the view (all contracts vs only niche-matching via contract items).

## Conflicts

- None remaining. Collection/retention/UI windows aligned by D-14.

## Provenance

- View scope: `ai/raw/01-PRD.md` §4.6, §10.6.
- Collection windows: `ai/raw/03-TECHNICAL_SPECS.md` §5.1, §5.3.
- Endpoint, bucket strategy, contract items: `ai/raw/04-API_SPECS.md` §3.2, §3.4.
- Query and index: `ai/raw/05-DATA_MODEL_SPECS.md` §5.5, §8.2, §11.
- PoC cards, badges: `ai/raw/pregoeiros.html` (view-contratos, `renderContracts`).
- Decisions D-14: `ai/raw/06-DECISOES.md`.

## Related Topics

- [[KNOW-019]] `modulo-contratos` endpoints
- [[KNOW-025]] `contracts` / `contract_items` schema
- [[KNOW-021]] contracts collection step
