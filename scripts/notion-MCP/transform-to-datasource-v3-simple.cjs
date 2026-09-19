// transform-to-datasource-v3-simple.cjs - SIMPLES: Item | Notas | Data | Atualizado em
const { Client } = require("@notionhq/client");
require('dotenv').config();
const notion = new Client({ auth: process.env.NOTION_API_KEY });

const PARENT_PAGE_ID = "5e3d2d89-a67c-43b2-8f5a-d0aa9a5bcab8"; // Anti-Jegue — Estado Atual (do seu check-private)
const LESSONS_PAGE_ID = "3d5e4f3b-2573-8077-ba34-e2ee22d7e5af";
const PARKING_PAGE_ID = "e8061e23-1d00-4406-90b6-68017c745ab2";

function rt(rich){ return (rich||[]).map(r=>r.plain_text).join("").trim(); }
async function getBlocks(id){ const r = await notion.blocks.children.list({ block_id: id, page_size: 100 }); return r.results; }

function parseLessons(blocks){
  const items=[]; let cur=null;
  for(const b of blocks){
    if(b.type==="heading_1"||b.type==="heading_3"){
      if(cur) items.push(cur);
      cur={ Item: rt(b[b.type].rich_text), Notas:"" };
    } else if(b.type==="paragraph"){
      const txt=rt(b.paragraph.rich_text); if(!txt) continue;
      if(/^\d+\.\s/.test(txt)){ if(cur) items.push(cur); cur={ Item: txt.slice(0,100), Notas: txt }; }
      else { if(!cur) cur={ Item:"Sem título", Notas:"" }; cur.Notas+=(cur.Notas?"\n\n":"")+txt; }
    } else if(b.type==="numbered_list_item"||b.type==="bulleted_list_item"){
      const txt=rt(b[b.type].rich_text);
      if(!cur) cur={ Item: txt.slice(0,80), Notas:"" };
      else cur.Notas+=(cur.Notas?"\n- ":"")+txt;
    }
  }
  if(cur) items.push(cur);
  return items;
}

function parseParking(blocks){
  const items=[]; let cur=null;
  for(const b of blocks){
    if(b.type==="heading_1"||b.type==="heading_2"){
      if(cur) items.push(cur);
      cur={ Item: rt(b[b.type].rich_text), Notas:"" };
    } else if(b.type==="paragraph"||b.type==="bulleted_list_item"){
      const txt=rt(b[b.type].rich_text); if(!txt) continue;
      if(!cur) cur={ Item:"Sem título", Notas:"" };
      cur.Notas+=(cur.Notas?"\n\n":"")+txt;
    }
  }
  if(cur) items.push(cur);
  return items;
}

async function createSimple(title){
  const db = await notion.databases.create({
    parent: { type: "page_id", page_id: PARENT_PAGE_ID },
    title: [{ type: "text", text: { content: title } }],
    initial_data_source: {
      properties: {
        Item: { title: {} },
        Notas: { rich_text: {} },
        Data: { date: {} },
        "Atualizado em": { date: {} }
      }
    }
  });
  const full = await notion.databases.retrieve({ database_id: db.id });
  return full.data_sources[0].id;
}

(async()=>{
  const lBlocks = await getBlocks(LESSONS_PAGE_ID);
  const pBlocks = await getBlocks(PARKING_PAGE_ID);
  const lItems = parseLessons(lBlocks);
  const pItems = parseParking(pBlocks);
  console.log(`Lessons ${lItems.length}/54 | Parking ${pItems.length}/40`);

  console.log("Criando bases simples...");
  const lDs = await createSimple("Lessons Learned NEW");
  const pDs = await createSimple("Parking Lot — Ideias Futuras NEW");
  console.log(`L DS=${lDs}\nP DS=${pDs}`);

  const now = new Date().toISOString();
  const today = now.split('T')[0];

  for(const it of lItems){
    await notion.pages.create({ parent:{ data_source_id: lDs }, properties:{
      Item:{ title:[{ text:{ content: it.Item.slice(0,100)} }] },
      Notas:{ rich_text:[{ text:{ content: it.Notas.slice(0,2000)} }] },
      Data:{ date:{ start: today } },
      "Atualizado em":{ date:{ start: now } }
    }});
  }
  for(const it of pItems){
    await notion.pages.create({ parent:{ data_source_id: pDs }, properties:{
      Item:{ title:[{ text:{ content: it.Item.slice(0,100)} }] },
      Notas:{ rich_text:[{ text:{ content: it.Notas.slice(0,2000)} }] },
      Data:{ date:{ start: today } },
      "Atualizado em":{ date:{ start: now } }
    }});
  }
  console.log(`\n=== ENV V3 SIMPLES ===\nNOTION_LESSONS_DATABASE_ID=${lDs}\nNOTION_PARKING_LOT_DATABASE_ID=${pDs}`);
  console.log(`Colunas: Item | Notas | Data | Atualizado em (última à direita) - mesmo input inicial, futuro mapeado`);
})();