const { Client } = require("@notionhq/client");
require('dotenv').config();
const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function getByTitleContains(substr){
  const search = await notion.search({ filter:{property:"object", value:"data_source"}, page_size:100 });
  for(const ds of search.results){
    const full = await notion.dataSources.retrieve({ data_source_id: ds.id }).catch(()=>null);
    if(!full) continue;
    const title = full.title?.[0]?.plain_text || "";
    if(title.toLowerCase().includes(substr.toLowerCase())){
      return { id: full.id, title, props: Object.keys(full.properties).join(", ") };
    }
  }
  throw new Error(substr);
}

(async()=>{
  const list = [
    "Lessons Learned NEW",
    "Parking Lot — Ideias Futuras NEW",
    "Estado Atual",
    "PIPELINE",
    "AI Partner Ecosystem"
  ];
  console.log("=== CHECK ÚLTIMA LINHA V3 SIMPLES Item|Notas|Data|Atualizado em ===\n");
  for(const t of list){
    try{
      const info = await getByTitleContains(t);
      console.log(`\n--- ${info.title} --- ds=${info.id} props=${info.props}`);
      const q = await notion.dataSources.query({ data_source_id: info.id, page_size:1, sorts:[{property:"Atualizado em", direction:"descending"}] });
      const p = q.results[0];
      if(!p){ console.log(" vazia"); continue; }
      console.log(` Item: ${p.properties.Item?.title?.[0]?.plain_text}`);
      console.log(` Data: ${p.properties.Data?.date?.start}`);
      console.log(` Atualizado em: ${p.properties["Atualizado em"]?.date?.start}`);
      console.log(` Notas: ${p.properties.Notas?.rich_text?.[0]?.plain_text?.slice(0,100)}...`);
    } catch(e){ console.log(`--- ${t} --- ERRO ${e.message}`); }
  }
})();