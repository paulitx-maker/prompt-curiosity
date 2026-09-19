const { Client } = require("@notionhq/client");
require('dotenv').config();
const notion = new Client({ auth: process.env.NOTION_API_KEY });

const LESSONS_PAGE_ID = "3d5e4f3b-2573-8077-ba34-e2ee22d7e5af";
const PARKING_PAGE_ID = "e8061e23-1d00-4406-90b6-68017c745ab2";

async function inventory(pageId, name){
  const blocks = await notion.blocks.children.list({ block_id: pageId, page_size: 100 });
  const counts = {};
  const samples = [];
  
  for(const b of blocks.results){
    counts[b.type] = (counts[b.type]||0)+1;
    if(samples.length<20){
      let txt = "";
      if(b[b.type]?.rich_text) txt = b[b.type].rich_text.map(r=>r.plain_text).join("").slice(0,120);
      else if(b[b.type]?.caption) txt = b[b.type].caption.map(r=>r.plain_text).join("").slice(0,120);
      samples.push({ type: b.type, text: txt });
    }
  }
  console.log(`\n=== ${name} ${pageId} ===`);
  console.log("Contagem por tipo:", counts);
  console.log("Amostras:", samples);
  return { name, pageId, counts, samples, total: blocks.results.length };
}

(async()=>{
  const lessons = await inventory(LESSONS_PAGE_ID, "Lessons Learned");
  const parking = await inventory(PARKING_PAGE_ID, "Parking Lot");
  const fs = require('fs');
  fs.writeFileSync('inventory.json', JSON.stringify({lessons, parking}, null, 2));
  console.log("\n inventory.json salvo. Me manda esse arquivo que eu gero o transform-to-datasource.cjs exato com as regras de H1..H4 + listas.");
})();