# Anti-Jegue — Notion MCP Read-Only

## Objetivo

Expor ao Claude Desktop, via MCP local, somente dados de consulta do Notion.

Fluxo:

Claude Desktop → MCP local → Notion API → Notion

Esta versão é deliberadamente pequena: começa apenas com **Estado Atual**.

## O que o MCP faz

Expõe uma única ferramenta:

`get_current_state`

Ela consulta os registros do data source **Anti-Jegue — Estado Atual**, ordenados pela Data mais recente, e devolve os campos normalizados.

Não há operações de criação, edição ou exclusão.

## Estrutura

- `server.js` — servidor MCP local read-only.
- `notion-read-contract.json` — contrato da leitura.
- `.env.example` — modelo das variáveis locais.
- `.gitignore` — impede credenciais e arquivos locais de teste de serem versionados.
- `package.json` — dependências e comando de execução.
- `README.md` — documentação resumida.

## Segurança

Nenhum token, ID real de banco ou segredo deve ser colocado nos arquivos versionados.

Crie localmente um `.env` a partir de `.env.example`:

`NOTION_API_KEY=...`

`NOTION_ANTIJEGUE_DATABASE_ID=...`

O `.env` está no `.gitignore`.

O servidor também não grava payloads, tokens, IDs ou respostas em arquivos.

## Instalação

Requer Node.js 20+.

```bash
npm install
```

## Teste local

```bash
npm start
```

O processo ficará aguardando o cliente MCP. Isso é esperado em uma integração por stdio.

Para testar antes do Claude Desktop, pode-se usar o MCP Inspector.

## Próximo passo

Depois de instalar e validar o servidor, registrar este processo no Claude Desktop como um MCP local.

A primeira validação deve ser simples:

> Qual foi o registro mais recente do Estado Atual?

Se a resposta vier do Notion, a primeira camada está funcionando.

## Fora do escopo desta versão

- escrita no Notion;
- atualização de páginas;
- exclusão;
- outras bases;
- automações;
- agentes;
- router;
- memória bidirecional.

Esses itens só entram depois que a leitura do Estado Atual estiver validada.
