import { Client } from "@notionhq/client";
import * as dotenv from "dotenv";
dotenv.config();

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const DATA_SOURCE_ID = process.env.NOTION_ANTIJEGUE_DATABASE_ID;

console.log("[test-direct] boot check", {
  hasKey:!!NOTION_API_KEY,
  hasDs:!!DATA_SOURCE_ID,
  node: process.version,
  clientKeys: Object.keys(new Client({auth: NOTION_API_KEY}))
});

const notion = new Client({ auth: NOTION_API_KEY });

console.log("[test-direct] has dataSources?",!!notion.dataSources);
console.log("[test-direct] has databases?",!!notion.databases);

async function run() {
  try {
    // Teste 1 - método que o MCP atual usa (dataSources.query) - deve falhar em 3.1.3
    if (notion.dataSources) {
      console.log("[test-direct] tentando dataSources.query...");
      const r1 = await notion.dataSources.query({
        data_source_id: DATA_SOURCE_ID,
        page_size: 5,
        sorts: [{ property: "Data", direction: "descending" }]
      });
      console.log("[test-direct] dataSources.query OK", JSON.stringify(r1.results.slice(0,2), null, 2));
    } else {
      console.log("[test-direct] SKIP dataSources.query - dataSources é undefined (confirmado bug 3.1.3)");
    }

    // Teste 2 - método compatível que prova conexão Notion funciona localmente
    console.log("[test-direct] tentando databases.query com mesmo ID...");
    const r2 = await notion.databases.query({
      database_id: DATA_SOURCE_ID,
      page_size: 5,
      sorts: [{ property: "Data", direction: "descending" }]
    });
    console.log(`[test-direct] databases.query OK - ${r2.results.length} registros`);
    console.log(JSON.stringify(r2.results.map(p => ({
      id: p.id,
      Data: p.properties?.Data?.date?.start || "",
      Evento: p.properties?.Evento?.title?.[0]?.plain_text || p.properties?.Evento?.rich_text?.[0]?.plain_text || "",
      Status: p.properties?.Status?.select?.name || p.properties?.Status?.status?.name || ""
    })).slice(0,5), null, 2));

  } catch (e) {
    console.error("[test-direct] ERRO", e.message, e.code, e.body || "");
  }
}

run();