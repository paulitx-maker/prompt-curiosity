import { Client } from "@notionhq/client";
import * as dotenv from "dotenv";
dotenv.config();

const token = process.env.NOTION_API_KEY || "";
console.log(`Token carregado? ${token? "sim" : "não"}, len=${token.length}, começa com ${token.slice(0,4)}_`);

const notion = new Client({ auth: token });

const res = await notion.search({
  filter: { property: "object", value: "data_source" },
  page_size: 100
});

console.log(`\nEncontrados ${res.results.length} data_sources:`);
for (const r of res.results) {
  const title = (r.title?.[0]?.plain_text) || r.id;
  console.log(`- ${title} => ${r.id}`);
}