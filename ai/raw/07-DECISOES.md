# Registro de Decisões (2) — Pregoeiros

**Versão:** 1.0  
**Data:** 2026-09-25  
**Status:** Aprovado  
**Escopo:** Decisões tomadas durante o planejamento da SPEC-001 (FEAT-001).

**Precedência:** complementa `06-DECISOES.md`. Quando diverge dos documentos 01–05, da PoC ou de decisões anteriores, **este documento prevalece**.

---

## D-42 — Versão do Node.js

O runtime do projeto passa a ser **Node 24 LTS** (em vez do Node 22 LTS citado em `03-TECHNICAL_SPECS.md`), em desenvolvimento, CI e imagem de produção.

- `engines.node` = `>=24 <25`; `.nvmrc` = `24`.
- **Motivo:** o Node 22 entra em fim de suporte em 30/04/2027, poucos meses após a entrega prevista da v1. O Node 24 é a LTS ativa (suporte até abril de 2028) e já é a versão instalada no ambiente de desenvolvimento.
- Afeta: `03-TECHNICAL_SPECS.md` §1 (Runtime), KNOW-016, PRG-001 (Constraints), SPEC-001 R2.

## D-43 — Navegadores dos testes E2E

Os testes E2E (Playwright) rodam **apenas no Chromium**, localmente e no CI.

- **Motivo:** o app é interno a uma única empresa; um navegador mantém o CI rápido. Outros engines podem ser adicionados depois sem retrabalho.
- Afeta: KNOW-028, SPEC-001 (plano de testes).
