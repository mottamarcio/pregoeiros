# PRD — Pregoeiros

**Produto:** Pregoeiros — Triagem e Inteligência em Licitações Públicas  
**Versão do documento:** 1.0  
**Status:** Draft para implementação  
**Idioma:** Português (Brasil)  
**Referências:** PoC HTML anexada, Lei nº 14.133/2021, API Dados Abertos Compras.gov.br

---

## 1. Visão do produto

O Pregoeiros é um aplicativo web para **empresas fornecedoras** que disputam compras públicas. Ele transforma o volume de editais, itens, homologações e contratos publicados no Compras.gov.br em uma **fila de trabalho comercial**: o time decide, em minutos, se vale a pena elaborar proposta (GO), aprofundar análise (Em Análise) ou descartar (NO-GO).

A PoC demonstra o produto como um **sistema de triagem + radar + inteligência de preços**. A versão de produção replica essa experiência com dados reais da API de Dados Abertos do Compras.gov.br, persistidos em PostgreSQL e atualizados por jobs agendados.

### 1.1 Problema

Fornecedores perdem prazo e margem porque:

- editais e retificações estão espalhados em portais;
- o objeto textual raramente está ligado ao CATMAT/CATSER do nicho da empresa;
- preço de referência é estimado “no feeling”, sem mediana observada;
- contratos prestes a vencer (sinal de novo edital) não entram no funil comercial;
- a decisão GO/NO-GO não fica registrada nem auditável.

### 1.2 Solução

Uma aplicação SvelteKit que:

1. **Coleta** contratações, itens, resultados homologados, contratos e catálogo CATMAT/CATSER.
2. **Normaliza** e indexa esses dados no PostgreSQL.
3. **Cruza** com alertas de nicho da empresa (produto + UF + órgão).
4. **Apresenta** uma fila priorizada por prazo de proposta, adequação de item e valor.
5. **Registra** a decisão comercial e alimenta favoritos, radar e histórico.

### 1.3 Não-objetivos (YAGNI — v1)

- Não é um portal de publicação de editais.
- Não substitui o Comprasnet / PNCP para envio de proposta.
- Não calcula “score de vitória” preditivo com ML na v1.
- Não cobre estados/municípios que não estejam refletidos na base consultada.
- Não promete faturamento total da empresa concorrente — apenas resultados **homologados observáveis** na base.
- Não implementa multi-tenant enterprise (SSO corporativo, billing) na v1. Um único tenant “empresa fornecedora” com usuários internos é suficiente.

---

## 2. Personas

| Persona | Necessidade principal | Critério de sucesso |
|---|---|---|
| Analista comercial de licitações | Triar 20–80 editais/semana sem abrir PDF de cada um | Fila priorizada; GO/NO-GO em ≤ 2 minutos por edital |
| Precificador / orçamentista | Saber mediana, mínimo e máximo homologados do item | Ficha do CATMAT com estatísticas calculadas e amostras |
| Diretor comercial | Ver o que está em disputa e o que vence em 30/60/90 dias | Dashboard + contratos a vencer |
| Operador de dados (interno) | Saber se a coleta de hoje rodou | Modal de fontes + logs do job |

---

## 3. Princípios de produto (espelhados na PoC)

1. **Terminologia rigorosa.** Distinguir dado bruto (homologação observada) de métrica derivada (mediana calculada na base consultada).
2. **Fila antes de exploração.** A home é a Fila de Triagem, não um dashboard vanity.
3. **Decisão explícita.** Todo edital relevante tem estado: `pendente | analisando | go | nogo`.
4. **Prazo é o eixo.** Cards e tabelas destacam dias restantes e urgência (≤ 48h / ≤ 3 dias).
5. **Frescor visível.** Header mostra última coleta e status das fontes.
6. **Exclusão na busca.** Token `-serviço` remove ruído (manutenção, serviço contínuo etc.).
7. **Não bloquear o trabalho.** Se a API do governo cair, a última base coletada continua consultável.

---

## 4. Escopo funcional da v1

Mapeamento 1:1 com as views da PoC.

### 4.1 Fila de Triagem Comercial (`/`)

- Contadores: pendentes de decisão, propostas até 48h, GO em elaboração, alertas com novidades.
- Lista priorizada de oportunidades abertas (prazo, UF, UASG, processo, valor, badge de decisão).
- Filtros: Todas / Apenas Pendentes / Decididas (GO).
- Atalhos: criar alerta, atualizar fontes (dispara sync incremental ou consulta status).
- Painel “Alertas Ativos de Nicho” e feed de retificações observadas.
- Cards de pesquisa direta por cenário (“notebooks no RJ”, “preço de monitores 27''”, “contratos de TI vencendo”).

### 4.2 Oportunidades / Editais (`/oportunidades`)

- Tabela de contratações (Lei 14.133/21 e modalidades equivalentes na base).
- Filtros: texto com exclusão `-termo`, UF de entrega, decisão de triagem, segmento/família, modalidade, situação.
- Exportação CSV.
- Abertura da **Ficha de Triagem** (modal/rota de detalhe).

### 4.3 Ficha de Triagem do Edital

Tela crítica da PoC. Deve exibir:

- objeto, órgão, UASG, processo, UF, segmento, situação;
- prazo de propostas + countdown;
- local e prazo de entrega;
- condições de pagamento;
- valor total estimado e modalidade;
- tabela de itens/lotes **daquele edital** (CATMAT, qtd, unitário, total, adequação);
- checklist de habilitação extraído/normalizado quando disponível;
- links oficiais (Compras.gov.br / PNCP) e download do PDF quando houver URL;
- botões GO / Em Análise / NO-GO persistidos no banco.

### 4.4 Produtos & Preços Praticados (`/produtos`, também `/precos`)

- Catálogo operacional (itens monitorados pela empresa, ligados a CATMAT/CATSER).
- Ao selecionar um item: mediana, média ponderada, desvio, mín/máx observados, N de observações, N de fornecedores.
- Série histórica simples (gráfico) e tabela das últimas homologações.
- Ações: salvar produto, criar alerta para o item.

### 4.5 Concorrentes & Vencedores (`/fornecedores`)

- Empresas com resultados homologados observáveis.
- Métricas: itens homologados, valor total homologado na base, família principal, órgãos distintos.
- Disclaimer obrigatório da PoC (não é faturamento total).
- Favoritar concorrente.

### 4.6 Contratos a Vencer (`/contratos`)

- Janelas 30 / 60 / 90 dias.
- Tabela: número, órgão, fornecedor atual, fim de vigência, valor, prazo restante.
- Objetivo: antecipar novo edital, não gerir contrato da própria empresa.

### 4.7 Radar de Eventos (`/radar`)

- Inbox de eventos: nova contratação compatível, retificação, resultado homologado.
- Abas com estado persistente: Todos / Não vistos / Oportunidades / Retificações / Resultados.
- Marcar um ou todos como vistos.
- Badge no header e na sidebar.

### 4.8 Alertas salvos (`/alertas`)

- Regras: nome + item/CATMAT + UF + órgão/esfera.
- Contagem de matches novos.
- Atalho “Triar oportunidades” aplica filtros sem herdar estado sujo.

### 4.9 Favoritos / Em disputa (`/salvos`)

- Editais, itens de catálogo e fornecedores marcados.
- Filtro por tipo + remoção.

### 4.10 Histórico observado (`/historico`)

- Volume de adjudicações na base (KPIs agregados).
- Ranking de fornecedores por itens e valor homologado.
- Export JSON do recorte.

### 4.11 Busca global (⌘K / `/`)

- Paleta agrupada: Editais, Produtos (CATMAT), Fornecedores.
- Normalização de acentos.

### 4.12 Integridade das fontes

- Modal com última checagem por módulo (contratações, resultados, preços, catálogo).
- Semáforo Operando / Degradado / Indisponível.
- Texto de continuidade: base da última coleta permanece servindo a UI.

### 4.13 Coleta agendada (cron)

- Duas execuções diárias (sugestão operacional: **03:15** e **15:15** America/Sao_Paulo), alinhadas ao “Última Coleta” da PoC.
- Incremental por `dataAtualizacaoPncp` / janela de vigência / data de publicação.
- Full refresh controlado do catálogo (menor frequência: semanal).

---

## 5. Requisitos não funcionais

| Área | Meta v1 |
|---|---|
| Idioma da UI | pt-BR |
| Tempo de abertura da fila | < 1,5 s SSR + hidratação em conexão típica |
| Busca de oportunidades (base local) | p95 < 300 ms para recortes indexados |
| Disponibilidade da app | independe da API governo no momento da consulta |
| Segurança | secrets só no servidor; RLS/isolamento por tenant simples |
| Acessibilidade | teclado (⌘K, Escape, `/`), contraste slate, labels nos ícones |
| Observabilidade | log estruturado por job + contadores de páginas coletadas |
| Export | CSV e JSON gerados no servidor |

---

## 6. Regras de negócio

1. **Fonte da verdade externa:** Compras.gov.br Dados Abertos. IDs oficiais (`idCompra`, `numeroControlePNCP`, UASG, processo) nunca são inventados.
2. **Fonte da verdade interna:** decisões de triagem, alertas, favoritos, eventos lidos — pertencem ao Pregoeiros.
3. **Match de alerta:** um edital “casa” com um alerta se item/CATMAT (ou texto normalizado do objeto) **e** UF (se não for “Todos”) **e** órgão (se não for “Todos”) coincidirem.
4. **Urgência:** `critico` se prazo ≤ 2 dias; `urgente` se ≤ 3; `normal` se > 3; `encerrado` se homologado/expirado.
5. **Adequação de item:** `compativel` se o CATMAT/CATSER do item está no conjunto monitorado da empresa; senão `verificar`.
6. **Estatísticas de preço:** calculadas só sobre homologações da base local, com janela explícita (ex.: 24 meses) e N mínimo para exibir mediana.
7. **Exclusão lexical:** tokens prefixados com `-` são AND-NOT após normalização NFD + lowercase.
8. **Retificação:** mudança de objeto, prazo, anexo ou item em edital já persistido gera evento de radar do tipo `retificacao`.

---

## 7. Métricas de produto

- % de editais pendentes com prazo < 3 dias sem decisão.
- Tempo mediano pendente → GO/NO-GO.
- Alertas ativos com pelo menos 1 match nos últimos 7 dias.
- Taxa de jobs de coleta com sucesso nas últimas 14 execuções.
- Itens de catálogo com ≥ 30 observações de preço.

---

## 8. Restrições legais e de comunicação

- Dados públicos sob LAI e política de dados abertos do MGI.
- UI deve citar a fonte: “Dados Abertos Compras.gov.br (Lei 14.133/21)”.
- Evitar linguagem de “garantia de vitória”, “preço oficial do governo” ou “cobertura nacional completa”.
- Contratos a vencer são **sinais**, não certeza de novo pregão.

---

## 9. Roadmap sugerido

| Fase | Entrega |
|---|---|
| F0 | Esqueleto SvelteKit, Docker Postgres, layout da PoC, seeds |
| F1 | Coletor de contratações + itens + ficha + fila + decisão |
| F2 | Alertas, radar, busca global, favoritos |
| F3 | Preços praticados, fornecedores, histórico |
| F4 | Contratos a vencer + cron 2×/dia + modal de fontes |
| F5 | Exportações, testes BDD das jornadas, hardening |

---

## 10. Critérios de aceite da PoC → produto

A v1 é aceita quando um analista consegue, sem dados mockados:

1. Ver na fila ao menos as contratações abertas do nicho configurado.
2. Abrir a ficha e ver **os itens daquele edital**, não um catálogo genérico.
3. Marcar GO e encontrar o edital em “Em Disputa / Salvos”.
4. Criar alerta “Notebooks no RJ” e receber evento no Radar após a próxima coleta.
5. Consultar mediana de um CATMAT com N e janela visíveis.
6. Listar contratos com vigência encerrando em 30/60/90 dias.
7. Confirmar no modal que a coleta das 03:15 (ou 15:15) rodou.
