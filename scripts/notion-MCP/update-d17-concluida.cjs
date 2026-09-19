const { Client } = require("@notionhq/client");
require('dotenv').config();
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATA_SOURCE_ID = process.env.NOTION_ANTIJEGUE_DATABASE_ID;

async function main(){
  const res = await notion.dataSources.query({
    data_source_id: DATA_SOURCE_ID,
    filter: { and: [
      { property: "Task", title: { contains: "D17 - MCP Claude Desktop" } },
      { property: "Status", status: { equals: "Em teste" } }
    ]},
    page_size: 3
  });
  const pageId = res.results[0].id;
  console.log("D17 pageId", pageId);
  const notas = `VALIDAÇÃO PONTA A PONTA CONCLUÍDA 15/09/2026 16:32

Fato: MCP Read-Only V1 operacional no Claude Desktop
- @notionhq/client 5.1.0 dataSources.query funcional
- @modelcontextprotocol/sdk ^1.12.0
- mcpb 3.25MB 2202 arq shasum 6efe9c5a8f9a83906 shasum 6efe9c5a8f9a839062e70b8fe61e7bdc0c72ae0d
- manifest_version 0.3 com server.mcp_config corrigido
- Fix BOM via fix.cjs (type: module)

Evidências: get_current_state limit 5 retornou D17, D16, D17 calibração, D16 fix
Operação: pronto para expandir para 5 bases read-only
Lessons Learned já registrado, não alterado.`.slice(0,2000);

  await notion.pages.update({
    page_id: pageId,
    properties: {
      "Status": { status: { name: "Concluída" } },
      "Data": { date: { start: "2026-09-15" } },
      "Créditos gastos": { rich_text: [{ text: { content: "~21" } }] },
      "Créditos Manus": { rich_text: [{ text: { content: "2072->2071" } }] },
      "Notas": { rich_text: [{ text: { content: notas } }] }
    }
  });
  console.log("D17 -> Concluída");
}
main();