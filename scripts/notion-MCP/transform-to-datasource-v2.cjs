const { Client } = require("@notionhq/client");
require('dotenv').config();
const notion = new Client({ auth: process.env.NOTION_API_KEY });

const PARENT_PAGE_ID = process.env.ANTIJEGUE_PAGE_ID || "5e3d2d89-a67c-43b2-8f5a-d0aa9a5bcab8";
const LESSONS_PAGE_ID = "3d5e4f3b-2573-8077-ba34-e2ee22d7e5af";
const PARKING_PAGE_ID = "e8061e23-1d00-4406-90b6-68017c745ab2";

async function getBlocks(pageId){
  const res = await notion.blocks.children.list({ block_id: pageId, page_size: 100 });
  return res.results;
}

function richToText(rich){ return (rich||[]).map(r=>r.plain_text).join("").trim(); }

function parseLessons(blocks){
  // Seu inventory: paragraph 20, numbered 13, bulleted 19, h1 1, h3 1
  // Estratégia: cada paragraph que começa com "1. ", "2. " etc OU numbered_list_item é um novo Item
  // bulleted seguintes viram Notas
  const items = [];
  let cur = null;

  for(const b of blocks){
    if(b.type === "heading_1" || b.type === "heading_3"){
      if(cur) items.push(cur);
      cur = { Item: richToText(b[b.type].rich_text), Notas: "", TipoOriginal: b.type };
      continue;
    }
    if(b.type === "paragraph"){
      const txt = richToText(b.paragraph.rich_text);
      if(!txt) continue;
      // detecta "1. Sempre confirmar..." que está como paragraph no seu inventory
      if(/^\d+\.\s/.test(txt)){
        if(cur) items.push(cur);
        cur = { Item: txt.slice(0,100), Notas: txt, TipoOriginal: "paragraph-numerado" };
      } else {
        if(!cur) cur = { Item: "Sem título", Notas: "", TipoOriginal: "paragraph" };
        cur.Notas += (cur.Notas?"\n\n":"") + txt;
      }
    }
    if(b.type === "numbered_list_item" || b.type === "bulleted_list_item"){
      const txt = richToText(b[b.type].rich_text);
      if(!cur) cur = { Item: txt.slice(0,80), Notas: "", TipoOriginal: b.type };
      else cur.Notas += (cur.Notas?"\n- ":"") + txt;
    }
  }
  if(cur) items.push(cur);
  return items;
}

function parseParking(blocks){
  // Seu inventory: h2 8, paragraph 30, h1 1 - perfeito para H2 = Item
  const items = [];
  let cur = null;
  for(const b of blocks){
    if(b.type === "heading_1" || b.type === "heading_2"){
      if(cur) items.push(cur);
      cur = { Item: richToText(b[b.type].rich_text), Notas: "", TipoOriginal: b.type };
    } else if(b.type === "paragraph" || b.type === "bulleted_list_item"){
      const txt = richToText(b[b.type].rich_text);
      if(!txt) continue;
      if(!cur) cur = { Item: "Sem título", Notas: "", TipoOriginal: b.type };
      cur.Notas += (cur.Notas?"\n\n":"") + txt;
    }
  }
  if(cur) items.push(cur);
  return items;
}

async function createDatabase(title, parentId){
  // Ordem das propriedades importa para coluna à direita ser última
  const db = await notion.databases.create({
    parent: { type: "page_id", page_id: parentId },
    title: [{ type: "text", text: { content: title + " NEW" } }],
    properties: {
      Item: { title: {} },
      Notas: { rich_text: {} },
      Categoria: { select: { options: [{name:"Bug"},{name:"Processo"},{name:"Deploy"},{name:"Futuro"},{name:"Ideia"},{name:"Infra"}] } },
      Prioridade: { select: { options: [{name:"Alta"},{name:"Média"},{name:"Baixa"},{name:"Futura"}] } },
      Status: { select: { options: [{name:"Ideia"},{name:"Backlog"},{name:"Feito"},{name:"Validado"}] } },
      TipoOriginal: { rich_text: {} },
      Data: { date: {} },
      "Atualizado em": { date: {} } // última coluna à direita
    }
  });
  const full = await notion.databases.retrieve({ database_id: db.id });
  return { database_id: db.id, data_source_id: full.data_sources?.[0]?.id || db.id, title: full.title?.[0]?.plain_text };
}

async function populate(dsId, items){
  const now = new Date().toISOString();
  const today = now.split('T')[0];
  for(const it of items){
    await notion.pages.create({
      parent: { data_source_id: dsId },
      properties: {
        Item: { title: [{ text: { content: it.Item.slice(0,100) || "Sem título" } }] },
        Notas: { rich_text: [{ text: { content: it.Notas.slice(0,2000) } }] },
        TipoOriginal: { rich_text: [{ text: { content: it.TipoOriginal || "" } }] },
        Data: { date: { start: today } },
        "Atualizado em": { date: { start: now } } // todos com mesmo input agora, futuro será diferente
      }
    });
    console.log(` + ${it.Item.slice(0,60)}`);
  }
}

(async()=>{
  console.log("Mapeando Lessons...");
  const lessonsBlocks = await getBlocks(LESSONS_PAGE_ID);
  const lessonsItems = parseLessons(lessonsBlocks);
  console.log(` Lessons -> ${lessonsItems.length} itens (de 54 blocos)`);

  console.log("\nMapeando Parking...");
  const parkingBlocks = await getBlocks(PARKING_PAGE_ID);
  const parkingItems = parseParking(parkingBlocks);
  console.log(` Parking -> ${parkingItems.length} itens (de 40 blocos, 8 H2)`);

  console.log("\nCriando NEW databases dentro do hall ANTIJEGUE (original intacto)...");
  const lessonsDB = await createDatabase("Lessons Learned", PARENT_PAGE_ID);
  const parkingDB = await createDatabase("Parking Lot — Ideias Futuras", PARENT_PAGE_ID);

  console.log("\nPopulando com Atualizado em = agora...");
  await populate(lessonsDB.data_source_id, lessonsItems);
  await populate(parkingDB.data_source_id, parkingItems);

  console.log("\n=== ENV V3 FINAL ===");
  console.log(`NOTION_LESSONS_DATABASE_ID=${lessonsDB.data_source_id} # database_id ${lessonsDB.database_id}`);
  console.log(`NOTION_PARKING_LOT_DATABASE_ID=${parkingDB.data_source_id} # database_id ${parkingDB.database_id}`);
  console.log(`\nColunas: Item | Notas | Categoria | Prioridade | Status | TipoOriginal | Data | Atualizado em (última à direita)`);
  console.log(`Todas com mesmo Atualizado em agora (${new Date().toISOString()}) - histórico não resgatável de pages, mas futuro mapeado.`);
})();