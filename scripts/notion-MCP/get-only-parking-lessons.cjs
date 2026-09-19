const { Client } = require("@notionhq/client");
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function main() {
  console.log("Buscando apenas Parking Lot e Lessons Learned...\n");

  // search retorna todos que a integração enxerga
  const search = await notion.search({
    filter: { property: "object", value: "data_source" },
    page_size: 100
  });

  const targets = [];
  for (const ds of search.results) {
    const title = (ds.title || ds.properties?.title?.title?.[0]?.plain_text || JSON.stringify(ds.title || "").toLowerCase());
    const lower = JSON.stringify(ds).toLowerCase();
    if (lower.includes("parking") || lower.includes("lessons")) {
      targets.push(ds);
    }
  }

  if (targets.length === 0) {
    console.log("Nenhum data_source com 'parking' ou 'lessons' encontrado.");
    console.log("Provável causa: databases ainda não compartilhadas com a integração orquestrador-mvp-local-v3");
    console.log("\nTodas as data_sources visíveis para sua integração:");
    for (const ds of search.results) {
      console.log("-", ds.id, JSON.stringify(ds.title || ds.properties).slice(0,200));
    }
    return;
  }

  for (const ds of targets) {
    const name = ds.title? JSON.stringify(ds.title) : (ds.properties?.title?.title?.[0]?.plain_text || ds.id);
    console.log("ENCONTRADO:", name);
    console.log("ID:", ds.id);
    console.log("Parent Database ID:", ds.parent?.database_id || ds.parent?.data_source_id || "n/a");
    console.log("---");
  }

  console.log("\n=== PARA COPIAR NO.env ===");
  for (const ds of targets) {
    const lower = JSON.stringify(ds).toLowerCase();
    if (lower.includes("parking")) {
      console.log(`NOTION_PARKING_LOT_DATABASE_ID=${ds.id}`);
    }
    if (lower.includes("lessons")) {
      console.log(`NOTION_LESSONS_DATABASE_ID=${ds.id}`);
    }
  }

  console.log("\n=== PARA COLAR NO CLAUDE DESKTOP CONFIG (senhas) ===");
  for (const ds of targets) {
    const lower = JSON.stringify(ds).toLowerCase();
    if (lower.includes("parking")) {
      console.log(`Parking Lot: ${ds.id}`);
    }
    if (lower.includes("lessons")) {
      console.log(`Lessons Learned: ${ds.id}`);
    }
  }
}

main().catch(e=>{ console.error(e); process.exit(1); });