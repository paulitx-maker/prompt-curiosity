import { Client } from "@notionhq/client";
import dotenv from "dotenv";
dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const pipelineId = process.env.NOTION_PIPELINE_DATABASE_ID;
const antijegueId = process.env.NOTION_ANTIJEGUE_DATABASE_ID;

console.log(`Token len=${process.env.NOTION_API_KEY?.length}`);
console.log(`PIPELINE=${pipelineId}`);
console.log(`ANTIJEGUE=${antijegueId}`);

try {
  const ds = await notion.dataSources.retrieve({ data_source_id: pipelineId });
  console.log("\nPIPELINE data_source:", ds.id, "props:", Object.keys(ds.properties).slice(0,6));

  const q = await notion.dataSources.query({ data_source_id: pipelineId, page_size: 1 });
  console.log(`Leitura OK: ${q.results.length} linha(s)`);

  const titleProp = Object.entries(ds.properties).find(([k,v])=> v.type==="title")?.[0] || "Name";
  console.log(`Usando prop de título: ${titleProp}`);

  const created = await notion.pages.create({
    parent: { data_source_id: pipelineId },
    properties: {
      [titleProp]: { title: [{ text: { content: `TESTE CONEXAO - ${new Date().toISOString()}` } }] }
    }
  });
  console.log(`\n✅ ESCRITA OK! Página criada: ${created.id}`);
  console.log(`Abre no Notion: https://notion.so/${created.id.replace(/-/g,"")}`);
} catch(e){
  console.error("\n❌ Erro:", e.code, e.message);
  console.error(e.body || e);
}