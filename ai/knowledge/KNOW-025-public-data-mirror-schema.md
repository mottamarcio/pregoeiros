---
id: KNOW-025
type: knowledge
status: active
sources:
  - path: ai/raw/05-DATA_MODEL_SPECS.md
    fingerprint: sha256:721ba22842c1abc71b7203e4985d087b77d43e1682d047a20a30572dfd9803d0
  - path: ai/raw/06-DECISOES.md
    fingerprint: sha256:c41ad04667805c05ff559cb82fc6fe2a5cbd64a3c1af1ae120dcfc17ff28792d
---

# KNOW-025 — Public Data Mirror Schema

## Summary

Tables that mirror Compras.gov.br data locally: procurements, their items,
awarded results, suppliers, contracts, contract items and catalog items. They
are logically read-only (only the collector writes them) and keyed by official
identifiers.

## Known Facts

- **`procurements`** (mirrors `modulo-contratacoes/1_*`): `id` uuid PK; `id_compra` text UNIQUE; `numero_controle_pncp` text UNIQUE; `uasg`; `codigo_orgao`; `orgao_cnpj`; `orgao_nome` NOT NULL; `processo`; `objeto` NOT NULL; `objeto_normalizado` NOT NULL; `uf` char(2); `municipio`; `modalidade`; `segmento` (TI | Saude | Climatizacao | …); `situacao` `procurement_situation` NOT NULL default `outro`; `situacao_raw`; `valor_estimado` numeric(18,2); `prazo_proposta_em`, `publicado_em`, `atualizado_pncp_em` timestamptz; `local_entrega`; `prazo_entrega_texto`; `condicoes_pagamento`; `url_oficial`; `content_hash` (amendment detection); `raw` jsonb; `first_seen_at`, `last_seen_at` timestamptz default now(); plus `itens_texto_normalizado` text (maintained by trigger or service upsert).
  - Indexes: `procurements_prazo_idx (prazo_proposta_em)`, `procurements_uf_sit_idx (uf, situacao)`, `procurements_trgm_obj_idx` GIN trigram on `objeto_normalizado`.
- **`procurement_items`** (mirrors `modulo-contratacoes/2_*`): `id`; `procurement_id` NOT NULL FK → procurements ON DELETE CASCADE; `id_compra_item`; `numero_item` int; `catmat`; `catser`; `descricao` NOT NULL; `descricao_normalizada` NOT NULL; `quantidade` numeric(18,4); `unidade`; `valor_unit_estimado`, `valor_total_estimado` numeric(18,2); `material_ou_servico` `catalog_kind`; `raw` jsonb; UNIQUE `(procurement_id, numero_item)` (natural key, D-36); `id_compra_item` UNIQUE when present (D-36).
  - Indexes: `procurement_items_catmat_idx (catmat)`, trigram GIN on `descricao_normalizada`.
- **`award_items`** (mirrors `modulo-contratacoes/3_*`; basis of stats and ranking): `id`; `procurement_id` FK `ON DELETE SET NULL`; `procurement_item_id` FK `ON DELETE SET NULL` (D-35); `id_resultado` UNIQUE; `catmat`; `descricao`; `quantidade` numeric(18,4); `valor_unitario` numeric(18,2) NOT NULL; `valor_total`; `homologado_em` date; `supplier_cnpj`; `supplier_nome`; `orgao_nome`; **`codigo_orgao`**; **`uasg`** (both added by D-13); `uf` char(2); `contexto` (warranty, on-site, etc. if extracted); `raw` jsonb.
  - Indexes: `award_items_catmat_date_idx (catmat, homologado_em)`, `award_items_supplier_idx (supplier_cnpj)`.
- **`suppliers`**: `id`; `cnpj` char(14) UNIQUE; `razao_social` NOT NULL; `razao_social_normalizada` NOT NULL (name per D-09; the Data Model text says `razao_normalizada`); `porte`; `natureza_juridica`; `ativo` boolean; `raw` jsonb; `updated_at`. Trigram GIN on `razao_social_normalizada`. Aggregates are not mandatory columns (optional `supplier_stats` materialized view — see [[KNOW-009]]).
- **`contracts`** (mirrors `modulo-contratos/1_*` and `1.2_*`): `id`; `id_compra`; `numero_controle_pncp`; `numero_contrato`; `orgao_nome` NOT NULL; `codigo_orgao`; `uasg`; `supplier_cnpj`; `supplier_nome`; `objeto`; `valor_total`; `vigencia_inicio` date; `vigencia_fim` date NOT NULL; `modalidade`; `raw` jsonb; UNIQUE `(numero_contrato, codigo_orgao, vigencia_inicio)`. Index `contracts_fim_idx (vigencia_fim)`.
- **`contract_items`**: `id`; `contract_id` NOT NULL FK ON DELETE CASCADE; `catmat`; `descricao`; `quantidade` numeric(18,4); `valor_unitario` numeric(18,2).
- **`catalog_items`** (CATMAT/CATSER): `id`; `kind` `catalog_kind` NOT NULL default `material`; `codigo` NOT NULL (CATMAT/CATSER); `grupo_codigo`; `classe_codigo`; `pdm_codigo`; `nome` NOT NULL; `tipo_ui` (e.g. "Material de TI"); `ativo` boolean default true; `raw` jsonb; UNIQUE `(kind, codigo)`.
- **Decision D-37 — logical diagram corrections:** `award_items` references the catalog only through the free-text `catmat` column (no FK, because the catalog is materialized selectively); the supplier lives at the `contracts` level (`supplier_cnpj`), not on `contract_items`.

## Constraints

- These tables are written only by the collector; product state must never be stored here (e.g. item fit is derived, not persisted).

## Unknowns

- How `award_items` rows link to `suppliers` — the diagram shows `award_items → suppliers`, but the table stores `supplier_cnpj` text with no FK.
- `supplier_cnpj` in `award_items`/`contracts` is `text` while `suppliers.cnpj` is `char(14)`; normalization of CNPJ formatting (punctuation) is unspecified.
- How `segmento` is populated (no upstream source defined).

## Conflicts

- None remaining. Diagram links (`award_items → catalog_items`, `contract_items → suppliers`) corrected by D-37.

## Provenance

- All table definitions and indexes: `ai/raw/05-DATA_MODEL_SPECS.md` §2, §5.1–§5.6.
- Decisions D-09, D-13, D-35, D-36, D-37: `ai/raw/06-DECISOES.md`.

## Related Topics

- [[KNOW-024]] conventions and integrity
- [[KNOW-019]] upstream endpoints
- [[KNOW-026]] product data schema
