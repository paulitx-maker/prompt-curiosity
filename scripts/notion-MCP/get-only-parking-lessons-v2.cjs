// get-only-parking-lessons-v2.cjs - simples, você cola no ENV manual
const { Client } = require("@notionhq/client");
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function main() {
  console.log("Buscando apenas Parking Lot e Lessons Learned...\n");

  const search = await notion.search({
    filter: { property: "object", value: "data_source" },
    page_size: 100
  });

  const targets = [];

  for (const ds of search.results) {
    try {
      // Pega título real via dataSources.retrieve (mais confiável que search)
      const full = await notion.dataSources.retrieve({ data_source_id: ds.id });
      const titleStr = full.title?.[0]?.plain_text || "";
      const propsStr = Object.keys(full.properties || {}).join(", ");

      const lowerTitle = titleStr.toLowerCase();
      const lowerAll = (titleStr + " " + JSON.stringify(full.properties || {})).toLowerCase();

      // Filtra só parking ou lessons e que tenha colunas Item | Notas | Data | Atualizado em (suas NEW)
      if (lowerTitle.includes("parking") || lowerTitle.includes("lessons")) {
        // Prioriza as NEW que você criou em 17/09 (têm Atualizado em)
        if (propsStr.includes("Atualizado em") || lowerTitle.includes("new")) {
          targets.push({
            id: ds.id,
            title: titleStr,
            parent: full.parent?.database_id,
            props: propsStr,
            created: full.created_time
          });
        } else if (!targets.some(t => t.title.toLowerCase().includes(lowerTitle.includes("parking")? "parking" : "lessons"))) {
          // fallback se não achar NEW ainda
          targets.push({
            id: ds.id,
            title: titleStr,
            parent: full.parent?.database_id,
            props: propsStr,
            created: full.created_time
          });
        }
      }
    } catch(e) {
      // ignora data_sources sem acesso
    }
  }

  if (targets.length === 0) {
    console.log("Nenhum data_source com 'parking' ou 'lessons' encontrado.");
    console.log("Provável causa: databases NEW ainda não compartilhadas com a integração orquestrador-mvp-local");
    console.log("\nVá em Notion > Lessons Learned NEW >... > Conexões > orquestrador-mvp-local > Conectar");
    console.log("Vá em Notion > Parking Lot — Ideias Futuras NEW >... > Conexões > orquestrador-mvp-local > Conectar\n");

    // Lista tudo que a integração enxerga para debug
    console.log("Todas as data_sources visíveis para sua integração:");
    for (const ds of search.results.slice(0,20)) {
      try {
        const full = await notion.dataSources.retrieve({ data_source_id: ds.id });
        console.log(`- ${full.title?.[0]?.plain_text} | ${ds.id} | props: ${Object.keys(full.properties||{}).join(",")}`);
      } catch {}
    }
    return;
  }

  for (const ds of targets) {
    console.log("ENCONTRADO:", ds.title);
    console.log("ID:", ds.id);
    console.log("Parent Database ID:", ds.parent || "n/a");
    console.log("Props:", ds.props);
    console.log("---");
  }

  console.log("\n=== PARA COPIAR NO.env (sem alterar nomes) ===");
  for (const ds of targets) {
    if (ds.title.toLowerCase().includes("parking")) {
      console.log(`NOTION_PARKING_LOT_DATABASE_ID=${ds.id}`);
    }
    if (ds.title.toLowerCase().includes("lessons")) {
      console.log(`NOTION_LESSONS_DATABASE_ID=${ds.id}`);
    }
  }

  console.log("\n=== PARA COLAR NO CLAUDE DESKTOP CONFIG ===");
  for (const ds of targets) {
    console.log(`${ds.title}: ${ds.id}`);
  }
}

main().catch(e=>{ console.error(e); process.exit(1); });