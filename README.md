# pregoeiros

Pregoeiros é uma aplicação web para pesquisar, acompanhar e analisar compras públicas brasileiras.

## Desenvolvimento

Pré-requisito: Node 24 LTS (`nvm use`, lendo o `.nvmrc`).

```sh
npm ci
```

Scripts disponíveis (`npm run <script>`):

| Script             | Descrição                                                                |
| ------------------ | ------------------------------------------------------------------------ |
| `dev`              | Inicia o servidor de desenvolvimento (Vite).                             |
| `build`            | Gera o build de produção.                                                |
| `preview`          | Serve localmente o build de produção já gerado.                          |
| `check`            | Roda a checagem de tipos do TypeScript/Svelte (`svelte-check`).          |
| `check:watch`      | Como `check`, mas observando alterações continuamente.                   |
| `check:privacy`    | Confirma que código do servidor (`$lib/server`) não vaza para o cliente. |
| `lint`             | Confere formatação (Prettier) e regras de lint (ESLint).                 |
| `format`           | Reformata o código com o Prettier.                                       |
| `test`             | Roda os testes unitários e de integração (Vitest).                       |
| `test:unit`        | Roda somente os testes unitários.                                        |
| `test:integration` | Roda somente os testes de integração.                                    |
| `test:e2e`         | Roda os testes de ponta a ponta (Playwright, Chromium).                  |
