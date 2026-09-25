# Data Model Specs — Pregoeiros

**Versão:** 1.0  
**SGBD:** PostgreSQL 16  
**Extensões:** `pgcrypto` (ou `uuid-ossp`), `pg_trgm`

O modelo separa **dados públicos espelhados** (somente leitura lógica) de **dados de produto** (triagem, alertas, favoritos). Isso permite recoleta sem apagar a decisão do analista.

---

## 1. Convenções

| Tema | Regra |
|---|---|
| PK interna | `uuid` default `gen_random_uuid()` |
| Chave oficial | colunas próprias (`id_compra`, `numero_controle_pncp`, `catmat`, `cnpj`) com UNIQUE |
| Timestamps | `timestamptz` |
| Dinheiro | `numeric(18,2)` |
| Texto de busca | coluna `*_normalizado` persistida (NFC/NFD already stripped) |
| Payload cru | `jsonb` opcional `raw` — útil para diff de retificação |
| Soft delete | só em entidades de produto (`alerts.deleted_at`) |
| Tenant | `tenant_id uuid` nas tabelas de produto (v1: um único tenant seed) |
| Nomes | `snake_case` no SQL; camelCase no TypeScript |

Enums em PostgreSQL nativo.

---

## 2. Diagrama lógico

```
tenants
  ├── users
  ├── alerts ─────────────────────────┐
  ├── favorites                       │
  ├── triage_decisions ──► procurements ◄── procurement_items
  ├── radar_events ──────► procurements      │
  └── watched_products ───────────────┘      ▼
                                      catalog_items (CATMAT/CATSER)
                                              │
award_items ──► suppliers                     │
     │                                        │
     └── catalog_items                        │
                                              │
contracts ──► contract_items ──► suppliers    │
                                              │
sync_runs / source_heartbeats / sync_cursors
```

---

## 3. Enums

```sql
CREATE TYPE triage_status AS ENUM ('pendente', 'analisando', 'go', 'nogo');
CREATE TYPE urgency_level AS ENUM ('critico', 'urgente', 'normal', 'encerrado');
CREATE TYPE procurement_situation AS ENUM (
  'recebendo_propostas',
  'em_disputa',
  'homologado',
  'cancelado',
  'excluido',
  'outro'
);
CREATE TYPE radar_event_type AS ENUM ('contratacao', 'retificacao', 'resultado', 'sistema');
CREATE TYPE favorite_type AS ENUM ('contratacao', 'produto', 'fornecedor');
CREATE TYPE catalog_kind AS ENUM ('material', 'servico');
CREATE TYPE sync_status AS ENUM ('running', 'success', 'partial', 'failed');
CREATE TYPE source_status AS ENUM ('ok', 'degraded', 'down');
```

---

## 4. Tabelas de plataforma

```sql
CREATE TABLE tenants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id),
  email         citext NOT NULL,
  name          text NOT NULL,
  role          text NOT NULL CHECK (role IN ('analista', 'admin')),
  password_hash text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);
```

---

## 5. Dados públicos espelhados

### 5.1 Contratações / editais

Espelha `modulo-contratacoes/1_*`.

```sql
CREATE TABLE procurements (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_compra               text UNIQUE,
  numero_controle_pncp    text UNIQUE,
  uasg                    text,
  codigo_orgao            text,
  orgao_cnpj              text,
  orgao_nome              text NOT NULL,
  processo                text,
  objeto                  text NOT NULL,
  objeto_normalizado      text NOT NULL,
  uf                      char(2),
  municipio               text,
  modalidade              text,
  segmento                text,              -- TI | Saude | Climatizacao | ...
  situacao                procurement_situation NOT NULL DEFAULT 'outro',
  situacao_raw            text,
  valor_estimado          numeric(18,2),
  prazo_proposta_em       timestamptz,
  publicado_em            timestamptz,
  atualizado_pncp_em      timestamptz,
  local_entrega           text,
  prazo_entrega_texto     text,
  condicoes_pagamento     text,
  url_oficial             text,
  content_hash            text,              -- detecção de retificação
  raw                     jsonb,
  first_seen_at           timestamptz NOT NULL DEFAULT now(),
  last_seen_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX procurements_prazo_idx ON procurements (prazo_proposta_em);
CREATE INDEX procurements_uf_sit_idx ON procurements (uf, situacao);
CREATE INDEX procurements_trgm_obj_idx ON procurements USING gin (objeto_normalizado gin_trgm_ops);
```

Campos `local_entrega`, `prazo_entrega_texto`, `condicoes_pagamento` podem nascer nulos e ser preenchidos no detalhe (endpoint `1.1`) ou por parser posterior. A PoC os exibe na ficha; se o upstream não trouxer, a UI mostra “Não informado na base”.

### 5.2 Itens da contratação

Espelha `modulo-contratacoes/2_*`.

```sql
CREATE TABLE procurement_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  procurement_id      uuid NOT NULL REFERENCES procurements(id) ON DELETE CASCADE,
  id_compra_item      text,
  numero_item         int,
  catmat              text,
  catser              text,
  descricao           text NOT NULL,
  descricao_normalizada text NOT NULL,
  quantidade          numeric(18,4),
  unidade             text,
  valor_unit_estimado numeric(18,2),
  valor_total_estimado numeric(18,2),
  material_ou_servico catalog_kind,
  raw                 jsonb,
  UNIQUE (procurement_id, numero_item)
);

CREATE INDEX procurement_items_catmat_idx ON procurement_items (catmat);
CREATE INDEX procurement_items_trgm_idx ON procurement_items USING gin (descricao_normalizada gin_trgm_ops);
```

Coluna gerada útil para busca do edital:

```sql
-- atualizada por trigger ou no upsert do service
ALTER TABLE procurements
  ADD COLUMN itens_texto_normalizado text;
```

### 5.3 Resultados homologados

Espelha `modulo-contratacoes/3_*`. Base das estatísticas e do ranking.

```sql
CREATE TABLE award_items (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  procurement_id          uuid REFERENCES procurements(id),
  procurement_item_id     uuid REFERENCES procurement_items(id),
  id_resultado            text UNIQUE,
  catmat                  text,
  descricao               text,
  quantidade              numeric(18,4),
  valor_unitario          numeric(18,2) NOT NULL,
  valor_total             numeric(18,2),
  homologado_em           date,
  supplier_cnpj           text,
  supplier_nome           text,
  orgao_nome              text,
  uf                      char(2),
  contexto                text,          -- garantia, on-site etc. se extraído
  raw                     jsonb
);

CREATE INDEX award_items_catmat_date_idx ON award_items (catmat, homologado_em);
CREATE INDEX award_items_supplier_idx ON award_items (supplier_cnpj);
```

### 5.4 Fornecedores

```sql
CREATE TABLE suppliers (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj                char(14) UNIQUE,
  razao_social        text NOT NULL,
  razao_normalizada   text NOT NULL,
  porte               text,
  natureza_juridica   text,
  ativo               boolean,
  raw                 jsonb,
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX suppliers_trgm_idx ON suppliers USING gin (razao_normalizada gin_trgm_ops);
```

Agregados **não** são colunas obrigatórias. Views materializadas opcionais:

```sql
CREATE MATERIALIZED VIEW supplier_stats AS
SELECT
  supplier_cnpj AS cnpj,
  count(*) AS itens_homologados,
  coalesce(sum(valor_total), 0) AS valor_total_homologado,
  count(DISTINCT orgao_nome) AS orgaos_distintos
FROM award_items
GROUP BY supplier_cnpj;
```

Refresh no fim do job de resultados (YAGNI: pode ser query ao vivo enquanto N for pequeno).

### 5.5 Contratos

Espelha `modulo-contratos/1_*` e `1.2_*`.

```sql
CREATE TABLE contracts (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_compra                 text,
  numero_controle_pncp      text,
  numero_contrato           text,
  orgao_nome                text NOT NULL,
  codigo_orgao              text,
  uasg                      text,
  supplier_cnpj             text,
  supplier_nome             text,
  objeto                    text,
  valor_total               numeric(18,2),
  vigencia_inicio           date,
  vigencia_fim              date NOT NULL,
  modalidade                text,
  raw                       jsonb,
  UNIQUE (numero_contrato, codigo_orgao, vigencia_inicio)
);

CREATE INDEX contracts_fim_idx ON contracts (vigencia_fim);
```

```sql
CREATE TABLE contract_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id     uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  catmat          text,
  descricao       text,
  quantidade      numeric(18,4),
  valor_unitario  numeric(18,2)
);
```

### 5.6 Catálogo operacional + CATMAT

```sql
CREATE TABLE catalog_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind            catalog_kind NOT NULL DEFAULT 'material',
  codigo          text NOT NULL,          -- CATMAT / CATSER
  grupo_codigo    text,
  classe_codigo   text,
  pdm_codigo      text,
  nome            text NOT NULL,
  tipo_ui         text,                   -- "Material de TI"
  ativo           boolean NOT NULL DEFAULT true,
  raw             jsonb,
  UNIQUE (kind, codigo)
);
```

Itens que a empresa escolhe acompanhar na tela Produtos:

```sql
CREATE TABLE watched_products (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES tenants(id),
  catalog_item_id   uuid NOT NULL REFERENCES catalog_items(id),
  sort_order        int NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, catalog_item_id)
);
```

---

## 6. Dados de produto (tenant)

### 6.1 Decisão de triagem

Separada do espelho público para sobreviver a reimport.

```sql
CREATE TABLE triage_decisions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES tenants(id),
  procurement_id    uuid NOT NULL REFERENCES procurements(id) ON DELETE CASCADE,
  status            triage_status NOT NULL DEFAULT 'pendente',
  motivo            text,
  decided_by        uuid REFERENCES users(id),
  decided_at        timestamptz,
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, procurement_id)
);
```

Default implícito: se não há linha, a UI trata como `pendente`.

### 6.2 Alertas de oportunidade

```sql
CREATE TABLE alerts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  name            text NOT NULL,
  product_query   text NOT NULL,         -- nome / CATMAT
  catmat          text,
  uf              text,                  -- NULL = Todos
  buyer           text,                  -- NULL = Todos
  new_matches     int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);
```

Tabela de vínculo (auditoria de match):

```sql
CREATE TABLE alert_matches (
  alert_id          uuid NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  procurement_id    uuid NOT NULL REFERENCES procurements(id) ON DELETE CASCADE,
  matched_at        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (alert_id, procurement_id)
);
```

### 6.3 Radar

```sql
CREATE TABLE radar_events (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL REFERENCES tenants(id),
  type                  radar_event_type NOT NULL,
  procurement_id        uuid REFERENCES procurements(id),
  alert_id              uuid REFERENCES alerts(id),
  title                 text NOT NULL,
  subtitle              text,
  detail                text,
  seen                  boolean NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX radar_unread_idx ON radar_events (tenant_id, seen, created_at DESC);
```

### 6.4 Favoritos

```sql
CREATE TABLE favorites (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  type            favorite_type NOT NULL,
  procurement_id  uuid REFERENCES procurements(id),
  catalog_item_id uuid REFERENCES catalog_items(id),
  supplier_id     uuid REFERENCES suppliers(id),
  title           text NOT NULL,
  code            text,
  note            text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

Check: exatamente um dos FKs preenchido conforme `type`.

### 6.5 Requisitos de habilitação (opcional v1)

A PoC mostra checklist. Se o upstream não estruturar isso, a tabela pode ficar vazia ou receber regras manuais por segmento.

```sql
CREATE TABLE procurement_requirements (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  procurement_id    uuid NOT NULL REFERENCES procurements(id) ON DELETE CASCADE,
  texto             text NOT NULL,
  ok_sugerido       boolean
);
```

---

## 7. Operação de coleta

```sql
CREATE TABLE sync_runs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger         text NOT NULL CHECK (trigger IN ('cron', 'manual')),
  status          sync_status NOT NULL DEFAULT 'running',
  started_at      timestamptz NOT NULL DEFAULT now(),
  finished_at     timestamptz,
  pages_fetched   int NOT NULL DEFAULT 0,
  upserts         int NOT NULL DEFAULT 0,
  error_summary   text
);

CREATE TABLE source_heartbeats (
  module          text PRIMARY KEY,          -- contratacoes | resultados | contratos | catalogo | precos
  status          source_status NOT NULL,
  last_attempt_at timestamptz NOT NULL,
  last_success_at timestamptz,
  records_hint    text                       -- "1.482 oportunidades ativas"
);

CREATE TABLE sync_cursors (
  module          text PRIMARY KEY,
  last_window_start date,
  last_window_end   date,
  last_id           text
);
```

O header “Última Coleta: Hoje, 03:15” lê `sync_runs.finished_at` mais recente com status `success` ou `partial`.

---

## 8. Views de aplicação

### 8.1 Fila de triagem

```sql
CREATE VIEW v_triage_queue AS
SELECT
  p.*,
  coalesce(td.status, 'pendente'::triage_status) AS decisao,
  CASE
    WHEN p.prazo_proposta_em IS NULL THEN 'encerrado'::urgency_level
    WHEN p.prazo_proposta_em <= now() THEN 'encerrado'::urgency_level
    WHEN p.prazo_proposta_em <= now() + interval '2 days' THEN 'critico'::urgency_level
    WHEN p.prazo_proposta_em <= now() + interval '3 days' THEN 'urgente'::urgency_level
    ELSE 'normal'::urgency_level
  END AS urgencia,
  greatest(0, ceil(extract(epoch FROM (p.prazo_proposta_em - now())) / 86400.0))::int AS dias_restantes
FROM procurements p
LEFT JOIN triage_decisions td
  ON td.procurement_id = p.id;  -- AND td.tenant_id = current_setting(...)
```

### 8.2 Contratos por janela

```sql
-- 30 / 60 / 90 calculados na query, não precisa view
SELECT *
FROM contracts
WHERE vigencia_fim BETWEEN current_date AND current_date + 90;
```

### 8.3 Stats de produto

```sql
-- exemplo; preferir função SQL no PriceStatsService
SELECT
  percentile_cont(0.5) WITHIN GROUP (ORDER BY valor_unitario) AS mediana,
  avg(valor_unitario) AS media,
  stddev_samp(valor_unitario) AS desvio,
  min(valor_unitario) AS minimo,
  max(valor_unitario) AS maximo,
  count(*) AS observacoes,
  count(DISTINCT supplier_cnpj) AS fornecedores
FROM award_items
WHERE catmat = $1
  AND homologado_em >= current_date - interval '24 months';
```

---

## 9. Adequação de item (campo derivado)

Não persistir `compativel` no espelho público. Calcular:

```
item.compativel = item.catmat IN (
  SELECT ci.codigo
  FROM watched_products wp
  JOIN catalog_items ci ON ci.id = wp.catalog_item_id
  WHERE wp.tenant_id = :tenant
)
```

A PoC usa `true/false` por item na ficha.

---

## 10. Seeds da PoC (dev)

Para desenvolvimento offline, um seed reproduz os 6 editais, 3 produtos, 4 fornecedores, 3 contratos, 3 alertas e 4 eventos de radar da PoC. Em produção o seed só cria `tenant` + `admin` + `watched_products` iniciais.

Códigos âncora da PoC:

| CATMAT | Nome |
|---|---|
| 482910 | Notebook 14'' Core i7 16GB 512GB SSD |
| 439120 | Monitor 27'' IPS 4K |
| 392102 | Ar-condicionado Split 18.000 BTUs |
| 192834 | Material hospitalar descartável |

CNPJs da PoC são ilustrativos; em produção valem apenas CNPJs vindos da API.

---

## 11. Retenção

| Dado | Política v1 |
|---|---|
| `procurements` abertas | enquanto `situacao` ativa + 180 dias |
| `award_items` | 36 meses (stats 24 meses + folga) |
| `contracts` | vigência_fim ≥ hoje-30d e ≤ hoje+180d no coletor; histórico curto |
| `radar_events` | 90 dias |
| `raw jsonb` | 90 dias, depois null (economia) |
| `sync_runs` | 180 dias |

Job semanal de purge (pode ser o cron de domingo).

---

## 12. Mapeamento PoC → tabelas

| Tela / campo da PoC | Origem |
|---|---|
| Fila — objeto, órgão, UASG, processo, valor, prazo | `procurements` |
| Badge GO/Pendente | `triage_decisions.status` |
| “4 pendentes” / “2 urgentes” | agregados de `v_triage_queue` |
| Itens da ficha | `procurement_items` WHERE procurement_id |
| Checklist habilitação | `procurement_requirements` ou vazio |
| Alertas ativos | `alerts` |
| “7 novos” | `alerts.new_matches` |
| Radar | `radar_events` |
| Produtos / mediana | `watched_products` + query em `award_items` |
| Concorrentes | `suppliers` + `supplier_stats` |
| Contratos 30/60/90 | `contracts.vigencia_fim` |
| Favoritos | `favorites` |
| Última coleta 03:15 | `sync_runs` |
| Fontes operando | `source_heartbeats` |

---

## 13. Integridade e migrações

- Migrations versionadas (Drizzle ou SQL em `src/lib/server/db/migrations`).
- Toda migration é backward-compatible no mesmo major.
- FKs com `ON DELETE CASCADE` só do edital para itens/eventos derivados; **não** apagar `award_items` históricos se o cabeçalho sumir — preferir `ON DELETE SET NULL` em `award_items.procurement_id`.
- Unique de IDs oficiais aceita NULL (dois NULLs no Postgres não colidem); por isso `id_compra` e `numero_controle_pncp` são UNIQUE separados, e o upsert usa `COALESCE` na chave disponível.

---

## 14. Exemplo de upsert (contrato de persistência)

```sql
INSERT INTO procurements (
  id_compra, numero_controle_pncp, orgao_nome, objeto, objeto_normalizado, uf, ...
) VALUES ($1, $2, ...)
ON CONFLICT (id_compra) WHERE id_compra IS NOT NULL
DO UPDATE SET
  objeto = excluded.objeto,
  objeto_normalizado = excluded.objeto_normalizado,
  content_hash = excluded.content_hash,
  last_seen_at = now(),
  raw = excluded.raw;
```

Se `content_hash` mudou no `UPDATE`, o service emite `radar_events` tipo `retificacao`.
