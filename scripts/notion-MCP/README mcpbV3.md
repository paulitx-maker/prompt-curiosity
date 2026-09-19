# anti-jegue-notion-readonly — V3.0.0

MCP read-only para Notion com 5 databases no hall Anti-Jegue.

## O que tem em V3

Todas agora são **database (data_source)**, não mais page:

| Base | ID (exemplo) | Colunas | Sort |
|------|--------------|---------|------|
| Estado Atual | `f8fc87b2-4214-45a8-a400-56465d89398b` | Data, Evento, Status, Impacto, Créditos, Notas | Data DESC |
| Pipeline | `1e6e4f3b-2573-8213-ae8a-87721941432b` | Item, Origem, Possíveis especialistas, Status, Próxima ação, Executor, Prioridade... | Prioridade filter |
| Parking Lot — Ideias Futuras NEW | `7c3caade-8c5e-4d5d-8d77-714bd5df98fb` | **Item \| Notas \| Data \| Atualizado em** | Atualizado em DESC |
| Lessons Learned NEW | `fd2eebb4-c355-4020-b72d-b9a65a0234` | **Item \| Notas \| Data \| Atualizado em** | Atualizado em DESC |
| AI Partner Ecosystem | `3dbe4f3b-2573-807d-be6c-000b22d49bdf` | 14 colunas | - |

Simples = só 4 colunas para Parking e Lessons, migradas de 54/40 blocos de page.

## Como gerar o .mcpb (correto)

```powershell
cd C:\dev\orquestrador-mvp\scripts\notion-MCP

npm ci
# valida keys
node get-only-parking-lessons-v2.cjs
node check-last-row-v2.cjs

# gera V3 - comando certo (não é npx @modelcontextprotocol/mcpb)
mcpb pack
Move-Item -Force .\notion-MCP.mcpb .\anti-jegue-notion-readonly-3.0.0.mcpb