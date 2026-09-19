const { Client } = require("@notionhq/client");
require('dotenv').config();
const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function findDsIdByTitleExact(title){
  // search sem filter (evita erro database/data_source)
  const res = await notion.search({ query: title, page_size: 10 });
  for(const r of res.results){
    if(r.object === 'database' && r.title?.[0]?.plain_text === title){
      const full = await notion.databases.retrieve({ database_id: r.id });
      const ds = full.data_sources?.[0];
      return { database_id: r.id, data_source_id: ds?.id, title, props: Object.keys(ds?.properties||{}).join(", ") };
    }
  }
  // fallback contains
  for(const r of res.results){
    if(r.object === 'database' && r.title?.[0]?.plain_text?.includes(title)){
      const full = await notion.databases.retrieve({ database_id: r.id });
      const ds = full.data_sources?.[0];
      return { database_id: r.id, data_source_id: ds?.id, title: r.title?.[0]?.plain_text, props: Object.keys(ds?.properties||{}).join(", ") };
    }
  }
  throw new Error(`Não achou database com título ${title}`);
}

async function getLastRow(dataSourceId){
  // última linha = ordena por Atualizado em desc
  const res = await notion.dataSources.query({
    data_source_id: dataSourceId,
    page_size: 1,
    sorts: [{ property: "Atualizado em", direction: "descending" }]
  });
  if(res.results.length===0) return null;
  const p = res.results[0];
  const props = p.properties;
  const get = (name) => {
    const pr = props[name];
    if(!pr) return "";
    if(pr.type==="title") return pr.title?.[0]?.plain_text || "";
    if(pr.type==="rich_text") return pr.rich_text?.[0]?.plain_text?.slice(0,200) || "";
    if(pr.type==="date") return pr.date?.start || "";
    return JSON.stringify(pr).slice(0,100);
  };
  return {
    id: p.id,
    Item: get("Item"),
    Notas: get("Notas"),
    Data: get("Data"),
    "Atualizado em": get("Atualizado em")
  };
}

(async()=>{
  const targets = [
    "Lessons Learned NEW",
    "Parking Lot — Ideias Futuras NEW",
    "Anti-Jegue — Estado Atual",
    "PIPELINE",
    "AI Partner Ecosystem"
  ];

  console.log("=== CHECK ÚLTIMA LINHA DE CADA TABELA NEW + EXISTENTES ===\n");

  for(const title of targets){
    try{
      const info = await findDsIdByTitleExact(title);
      console.log(`\n--- ${info.title} ---`);
      console.log(` database_id: ${info.database_id}`);
      console.log(` data_source_id: ${info.data_source_id}`);
      console.log(` props: ${info.props}`);

      const last = await getLastRow(info.data_source_id);
      if(!last){
        console.log(" -> vazia");
      } else {
        console.log(` -> última linha:`);
        console.log(` Item: ${last.Item}`);
        console.log(` Data: ${last.Data}`);
        console.log(` Atualizado em: ${last["Atualizado em"]}`);
        console.log(` Notas: ${last.Notas.slice(0,120)}...`);
      }
    } catch(e){
      console.log(`\n--- ${title} --- ERRO: ${e.message}`);
    }
  }

  console.log("\n=== SE PASSAR, ESTÃO OK PARA V3 INCREMENTAL ===");
  console.log("Basta adicionar no.env as 2 novas keys e incrementar server.js sem mudar metodologia:");
  console.log(" NOTION_LESSONS_DATABASE_ID=<data_source_id Lessons NEW>");
  console.log(" NOTION_PARKING_LOT_DATABASE_ID=<data_source_id Parking NEW>");
})();