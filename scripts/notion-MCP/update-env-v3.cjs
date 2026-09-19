// update-env-v3.cjs - captura NEW keys e atualiza.env sem alterar nomes
const { Client } = require("@notionhq/client");
const fs = require('fs');
require('dotenv').config();
const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function findDsByTitleContains(substr){
  // search SEM filter (evita erro database/data_source)
  const res = await notion.search({ query: substr, page_size: 20 });
  for(const r of res.results){
    if(r.object!== 'database') continue;
    const title = r.title?.[0]?.plain_text || "";
    if(title.toLowerCase().includes(substr.toLowerCase())){
      const full = await notion.databases.retrieve({ database_id: r.id });
      const dsId = full.data_sources?.[0]?.id;
      console.log(`Found "${title}" -> db=${r.id} ds=${dsId}`);
      return { title, database_id: r.id, data_source_id: dsId };
    }
  }
  throw new Error(`Não achei database contendo "${substr}"`);
}

(async()=>{
  console.log("Capturando NEW keys...");
  const lessons = await findDsByTitleContains("Lessons Learned NEW");
  const parking = await findDsByTitleContains("Parking Lot — Ideias Futuras NEW");

  const envPath = ".env";
  let envContent = fs.readFileSync(envPath, "utf8");

  // Atualiza ou adiciona as 2 keys sem alterar nomes das variáveis
  const updates = {
    "NOTION_LESSONS_DATABASE_ID": lessons.data_source_id,
    "NOTION_PARKING_LOT_DATABASE_ID": parking.data_source_id
  };

  for(const [key, val] of Object.entries(updates)){
    const regex = new RegExp(`^${key}=.*$`, "m");
    if(regex.test(envContent)){
      envContent = envContent.replace(regex, `${key}=${val}`);
      console.log(`Atualizado ${key}=${val}`);
    } else {
      envContent += `\n${key}=${val}\n`;
      console.log(`Adicionado ${key}=${val}`);
    }
  }

  // NÃO mexe nas PAGE_ID existentes - mantém para compatibilidade
  // NOTION_LESSONS_LEARNED_PAGE_ID e NOTION_PARKING_LOT_PAGE_ID continuam

  fs.writeFileSync(envPath, envContent);
  console.log("\n.env atualizado sem alterar nomes. Mantidas PAGE_ID antigas.");

  // Valida última linha com as novas keys já no.env
  console.log("\n=== CHECK ÚLTIMA LINHA (Item | Notas | Data | Atualizado em) ===");
  for(const {name, ds} of [
    {name:"Lessons Learned NEW", ds: lessons.data_source_id},
    {name:"Parking Lot NEW", ds: parking.data_source_id}
  ]){
    const q = await notion.dataSources.query({ data_source_id: ds, page_size: 1, sorts: [{ property: "Atualizado em", direction: "descending" }] });
    const p = q.results[0];
    if(!p){ console.log(`${name}: vazia`); continue; }
    const item = p.properties.Item?.title?.[0]?.plain_text || "";
    const data = p.properties.Data?.date?.start || "";
    const atual = p.properties["Atualizado em"]?.date?.start || "";
    const notas = p.properties.Notas?.rich_text?.[0]?.plain_text?.slice(0,80) || "";
    console.log(`${name} -> Item: ${item} | Data: ${data} | Atualizado em: ${atual} | Notas: ${notas}...`);
  }
})();