import { Client } from "@notionhq/client";
import dotenv from "dotenv";
dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const pipelineId = process.env.NOTION_PIPELINE_DATABASE_ID;

console.log("Token len=" + (process.env.NOTION_API_KEY?.length || 0));
console.log("PIPELINE=" + pipelineId);

const ds = await notion.dataSources.retrieve({ data_source_id: pipelineId });
console.log("PIPELINE OK:", ds.id);
console.log("props:", Object.keys(ds.properties));

const q = await notion.dataSources.query({ data_source_id: pipelineId, page_size: 1 });
console.log("Leitura OK: " + q.results.length);

const titleProp = Object.keys(ds.properties).find(k => ds.properties[k].type === "title") || "Name";
console.log("titleProp=" + titleProp);

const created = await notion.pages.create({
  parent: { data_source_id: pipelineId },
  properties: {
    [titleProp]: {
      title: [{ text: { content: "TESTE CONEXAO - " + new Date().toISOString() } }]
    }
  }
});

console.log("✅ ESCRITA OK! " + created.id);
console.log("Link: https://notion.so/" + created.id.replace(/-/g,""));