const { Client } = require("@notionhq/client");
require('dotenv').config();
const notion = new Client({ auth: process.env.NOTION_API_KEY });
(async()=>{
  const s = await notion.search({ query: "Lessons Learned", filter:{property:"object", value:"page"}, page_size:5 });
  const p = await notion.search({ query: "Parking Lot", filter:{property:"object", value:"page"}, page_size:5 });
  console.log("Lessons:", s.results.map(r=>({id:r.id, parent:r.parent, title:r.properties?.title?.title?.[0]?.plain_text||"page"})));
  console.log("Parking:", p.results.map(r=>({id:r.id, parent:r.parent})));
  const ds = await notion.search({ filter:{property:"object", value:"data_source"}, page_size:100 });
  console.log(`Data sources já visíveis: ${ds.results.length}`, ds.results.map(d=>d.id.slice(0,8)));
})();