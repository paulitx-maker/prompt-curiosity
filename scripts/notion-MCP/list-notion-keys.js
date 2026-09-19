import { Client } from "@notionhq/client";
import * as dotenv from "dotenv";
dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function list() {
  console.log("Buscando databases/data_sources compartilhados com orquestrador-mvp-local-v3...");
  // search por databases
  const res = await notion.search({
    filter: { property: "object", value: "data_source" },
    page_size: 100
  });
  console.log(`Encontradas ${res.results.length} data_sources:`);
  res.results.forEach(ds => {
    console.log(`- ${ds.title?.[0]?.plain_text || ds.id} -> ${ds.id} | parent database_id: ${ds.parent?.database_id}`);
  });

  // Também lista databases para referência
  const res2 = await notion.search({
    filter: { property: "object", value: "database" },
    page_size: 100
  });
  console.log(`\nEncontradas ${res2.results.length} databases:`);
  res2.results.forEach(db => {
    console.log(`- ${db.title?.[0]?.plain_text || db.id} -> database_id: ${db.id}`);
  });
}

list().catch(e => console.error(e.body || e.message));