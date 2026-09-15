import { Client } from "@notionhq/client";
import dotenv from "dotenv";
dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const estadoId = process.env.NOTION_ANTIJEGUE_DATABASE_ID;

if (!estadoId) {
  console.error("NOTION_ANTIJEGUE_DATABASE_ID vazio no .env");
  process.exit(1);
}

console.log("Token len=" + (process.env.NOTION_API_KEY?.length || 0));
console.log("ESTADO_ATUAL_ID=" + estadoId);

const ds = await notion.dataSources.retrieve({ data_source_id: estadoId });
console.log("\nProps do Estado Atual:");
for (const [name, prop] of Object.entries(ds.properties)) {
  console.log(`- ${name}: ${prop.type}`);
}

// Descobre nomes exatos das colunas pelo tipo
const findProp = (keywords) => {
  const lower = Object.keys(ds.properties).map(k => [k, k.toLowerCase()]);
  for (const kw of keywords) {
    const found = lower.find(([orig, low]) => low.includes(kw.toLowerCase()));
    if (found) return found[0];
  }
  return null;
};

const taskProp = Object.entries(ds.properties).find(([k,v])=> v.type==="title")?.[0] || "Task";
const statusProp = findProp(["status"]) || "Status";
const creditosProp = findProp(["crédito", "credito"]) || null;
const dataProp = findProp(["data"]) || "Data";
const notasProp = findProp(["notas", "nota", "observ"]) || "Notas";

console.log(`\nUsando: task=${taskProp}, status=${statusProp}, creditos=${creditosProp}, data=${dataProp}, notas=${notasProp}`);

const today = new Date().toISOString().slice(0,10);

async function createRow(taskTitle, notasText, creditosValue) {
  const properties = {};

  // Task - title
  properties[taskProp] = { title: [{ text: { content: taskTitle } }] };

  // Status - select Concluída
  if (ds.properties[statusProp]?.type === "select") {
    properties[statusProp] = { select: { name: "Concluída" } };
  }

  // Data - date today
  if (dataProp && ds.properties[dataProp]?.type === "date") {
    properties[dataProp] = { date: { start: today } };
  }

  // Créditos - tenta number ou rich_text
  if (creditosProp) {
    const type = ds.properties[creditosProp]?.type;
    if (type === "number") {
      properties[creditosProp] = { number: creditosValue };
    } else if (type === "rich_text") {
      properties[creditosProp] = { rich_text: [{ text: { content: String(creditosValue) } }] };
    } else if (type === "select") {
      // ignora
    }
  }

  // Notas - rich_text
  if (notasProp && ds.properties[notasProp]?.type === "rich_text") {
    properties[notasProp] = { rich_text: [{ text: { content: notasText.slice(0,2000) } }] };
  }

  const created = await notion.pages.create({
    parent: { data_source_id: estadoId },
    properties
  });
  console.log(`✅ Criado: ${taskTitle} -> ${created.id} https://notion.so/${created.id.replace(/-/g,"")}`);
  return created;
}

// 1 - Criação com Manus
const notaManus = `D16 - Fix Notion PAT - Criação com Manus
Token antigo len=38 (image_91f8eb.png) dava unauthorized API token is invalid. Criado novo PAT ntn_ len=50 (image_d22c75.png). 
Script find-id.js corrigido: filter.value de "database" para "data_source" + in_trash definido (validation_error). 
Listou 13 data_sources. 
Manus consumo: inicio 2188 créditos, fim 2073 créditos = -115 usados nessa sessão (2188-2073).
PIPELINE testado com bun scripts/notion/test-write.js - criou TESTE CONEXAO - 2026-09-15T00:34:30.971Z validado na image_6793ba.png.
Token funciona com notion.dataSources.retrieve + query + pages.create.`;

await createRow("D16 - Fix Notion PAT com Manus (len=38->50 + data_source)", notaManus, -115);

// 2 - Manual
const notaManual = `D16 - Fix Notion PAT manual - Teste de escrita
Manual: bun scripts/notion/test-write.js + Set-Content PowerShell (image_85b8c5.png, image_5863a1.png) quebrou syntax Expected "}" but found ")" - corrigido com arquivo limpo.
Validado escrita no PIPELINE (image_6793ba.png) e limpeza do teste.
Créditos Manus: 2188 inicio -> 2073 fim = 115 gastos. Trabalho manual não consome Manus.
Próximo: registrar no Anti-Jegue — Estado Atual (image_dc410c.png) as 2 linhas D16.`;

await createRow("D16 - Fix Notion PAT manual (bun test-write.js + validação escrita)", notaManual, 0);

console.log("\nFim - 2 linhas criadas no Estado Atual");