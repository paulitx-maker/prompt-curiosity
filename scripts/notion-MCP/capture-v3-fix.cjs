const { Client } = require("@notionhq/client");
require('dotenv').config();
const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function main(){
  const res = await notion.search({ filter:{ property:"object", value:"data_source"}, page_size:100 });
  console.log(`Encontrados ${res.results.length} data_sources\n`);

  const map = {};
  for(const ds of res.results){
    // tenta pegar título de várias formas
    let title = "";
    try{
      if(ds.title) title = JSON.stringify(ds.title);
      if(ds.properties?.title?.title?.[0]?.plain_text) title = ds.properties.title.title[0].plain_text;
      if(ds.properties?.Name?.title?.[0]?.plain_text) title = ds.properties.Name.title[0].plain_text;
    }catch{}
    const dump = JSON.stringify({id:ds.id, title, parent:ds.parent}).toLowerCase();
    
    if(dump.includes("estado") && dump.includes("atual")) map.ESTADO = ds.id;
    else if(dump.includes("pipeline")) map.PIPELINE = ds.id;
    else if(dump.includes("parking") || dump.includes("ideias futuras")) map.PARKING = ds.id;
    else if(dump.includes("lessons")) map.LESSONS = ds.id;
    else if(dump.includes("ecosystem") || dump.includes("partner")) map.ECOSYSTEM = ds.id;
    else if(dump.includes("solu") && dump.includes("playbook")) map.SOLUCOES = ds.id;
    else if(dump.includes("modulos")) map.MODULOS = ds.id;

    console.log(`- ${title || ds.id} => ${ds.id}`);
  }

  console.log("\n=== .env (copiar) ===");
  if(map.ESTADO) console.log(`NOTION_ANTIJEGUE_DATABASE_ID=${map.ESTADO}`);
  if(map.PIPELINE) console.log(`NOTION_PIPELINE_DATABASE_ID=${map.PIPELINE}`);
  if(map.PARKING) console.log(`NOTION_PARKING_LOT_DATABASE_ID=${map.PARKING}`);
  if(map.LESSONS) console.log(`NOTION_LESSONS_DATABASE_ID=${map.LESSONS}`);
  if(map.ECOSYSTEM) console.log(`NOTION_ECOSYSTEM_DATABASE_ID=${map.ECOSYSTEM}`);

  console.log("\n=== Formato Claude Desktop - senhas (copiar) ===");
  console.log(JSON.stringify({
    NOTION_API_KEY: process.env.NOTION_API_KEY ? "***" : "FALTA",
    NOTION_ANTIJEGUE_DATABASE_ID: map.ESTADO || "",
    NOTION_PIPELINE_DATABASE_ID: map.PIPELINE || "",
    NOTION_PARKING_LOT_DATABASE_ID: map.PARKING || "",
    NOTION_LESSONS_DATABASE_ID: map.LESSONS || "",
    NOTION_ECOSYSTEM_DATABASE_ID: map.ECOSYSTEM || ""
  }, null, 2));

  // detecção de duplicatas
  const ids = Object.values(map);
  const dup = ids.filter((v,i,a)=> a.indexOf(v)!==i);
  if(dup.length>0){
    console.log("\n!!! ALERTA: IDs duplicados detectados:", [...new Set(dup)]);
    console.log("Isso explica seu bug anterior - Parking e Lessons estavam com mesmo ID");
  } else {
    console.log("\n✓ Nenhum duplicado - IDs únicos OK");
  }
}
main().catch(e=>console.error(e));