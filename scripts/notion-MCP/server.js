import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Client } from "@notionhq/client";
import { z } from "zod";

// Diagnóstico V3
console.error("[anti-jegue] boot check V3", {
  hasKey:!!process.env.NOTION_API_KEY,
  hasDs:!!process.env.NOTION_ANTIJEGUE_DATABASE_ID,
  hasPipeline:!!process.env.NOTION_PIPELINE_DATABASE_ID,
  hasParking:!!process.env.NOTION_PARKING_LOT_DATABASE_ID,
  hasLessons:!!process.env.NOTION_LESSONS_DATABASE_ID,
  hasEcosystem:!!process.env.NOTION_ECOSYSTEM_DATABASE_ID,
  node: process.version
});

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const DATA_SOURCE_ID = process.env.NOTION_ANTIJEGUE_DATABASE_ID || process.env.NOTION_ESTADOATUAL_DATA_SOURCE_ID || process.env.NOTION_ANTIJEGUE_DATA_SOURCE_ID || process.env.NOTION_ESTADO_ATUAL_DATABASE_ID;

const PIPELINE_ID = process.env.NOTION_PIPELINE_DATABASE_ID || process.env.NOTION_PIPELINE_DATA_SOURCE_ID;
const PARKING_LOT_ID = process.env.NOTION_PARKING_LOT_DATABASE_ID || process.env.NOTION_PARKING_LOT_DATA_SOURCE_ID;
const LESSONS_ID = process.env.NOTION_LESSONS_DATABASE_ID || process.env.NOTION_LESSONS_DATA_SOURCE_ID;
const ECOSYSTEM_ID = process.env.NOTION_ECOSYSTEM_DATABASE_ID || process.env.NOTION_ECOSYSTEM_DATA_SOURCE_ID;

if (!NOTION_API_KEY ||!DATA_SOURCE_ID) {
  console.error("[anti-jegue] ERRO: NOTION_API_KEY ou NOTION_ANTIJEGUE_DATABASE_ID ausente");
  process.exit(1);
}

const notion = new Client({ auth: NOTION_API_KEY });

function getPropValue(prop) {
  if (!prop) return "";
  try {
    switch (prop.type) {
      case "title": return prop.title?.map(t => t.plain_text).join("")?? "";
      case "rich_text": return prop.rich_text?.map(t => t.plain_text).join("")?? "";
      case "select": return prop.select?.name?? "";
      case "status": return prop.status?.name?? "";
      case "date": return prop.date?.start?? "";
      case "number": return prop.number?? "";
      case "checkbox": return prop.checkbox? "true" : "false";
      case "people": return prop.people?.map(p => p.name || p.id).join(", ")?? "";
      default: return "";
    }
  } catch { return ""; }
}

function normalizePage(page) {
  const props = page.properties?? {};
  const get = (names) => {
    for (const n of names) {
      if (props[n]) return getPropValue(props[n]);
      const key = Object.keys(props).find(k => k.toLowerCase() === n.toLowerCase());
      if (key) return getPropValue(props[key]);
    }
    return "";
  };
  return {
    Data: get(["Data", "data", "Date"]),
    Evento: get(["Evento", "evento", "Task", "Task title", "Name", "Nome", "Title"]),
    Status: get(["Status", "status"]),
    Impacto: get(["Impacto", "impacto", "Impact"]),
    Créditos: get(["Créditos", "Creditos", "Créditos gastos", "Creditos gastos", "Créditos Manus", "Creditos Manus", "Credits"]),
    Notas: get(["Notas", "notas", "Notes", "Observações"]),
    _id: page.id,
    _url: `https://notion.so/${page.id.replace(/-/g, "")}`
  };
}

async function getCurrentState(limit = 10) {
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  console.error("[anti-jegue] query data_source", DATA_SOURCE_ID, "limit", safeLimit);
  const response = await notion.dataSources.query({
    data_source_id: DATA_SOURCE_ID,
    page_size: safeLimit,
    sorts: [{ property: "Data", direction: "descending" }]
  });
  return response.results.map(normalizePage);
}

function normalizeGeneric(page) {
  const props = page.properties?? {};
  const out = { _id: page.id, _url: `https://notion.so/${page.id.replace(/-/g, "")}` };
  for (const k of Object.keys(props)) out[k] = getPropValue(props[k]);
  return out;
}

async function queryDataSource(dataSourceId, opts = {}) {
  if (!dataSourceId) throw new Error("DATA_SOURCE_ID ausente - compartilhe a database com a integração e defina env");
  const safeLimit = Math.min(Math.max(Number(opts.limit) || 20, 1), 100);
  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    page_size: safeLimit,
   ...opts.query
  });
  return response.results.map(normalizeGeneric);
}

function createServer() {
  const server = new McpServer({ name: "anti-jegue-notion-readonly", version: "3.0.0" });

  server.registerTool("get_current_state", {
    title: "Consultar Estado Atual",
    description: "Consulta os registros mais recentes do Notion na Data Source Estado Atual (6 campos: Data, Evento, Status, Impacto, Créditos, Notas). Ordenado por Data DESC. Somente leitura.",
    inputSchema: { limit: z.number().int().min(1).max(100).default(10).describe("Quantidade de registros, default 10") }
  }, async ({ limit }) => {
    try {
      const rows = await getCurrentState(limit);
      const text = rows.length === 0? "Nenhum registro encontrado no Estado Atual." : JSON.stringify(rows, null, 2);
      return { content: [{ type: "text", text }] };
    } catch (e) {
      console.error("[anti-jegue] erro get_current_state", e);
      return { isError: true, content: [{ type: "text", text: `Erro ao consultar Estado Atual: ${e.message || String(e)}` }] };
    }
  });

  server.registerTool("get_pipeline", {
    title: "Consultar Pipeline - Rastreador de Prioridades",
    description: "Pipeline = rastreador de prioridades. Colunas: Item, Origem, Possíveis especialistas, Status, Próxima ação, Executor, Prioridade, Descrição (+ demais). Somente leitura.",
    inputSchema: {
      limit: z.number().int().min(1).max(100).default(20),
      priority: z.enum(["P0","P1","P2","Todas"]).default("Todas").optional(),
      status: z.string().optional()
    }
  }, async ({ limit, priority, status }) => {
    try {
      const query = {};
      if (priority && priority!== "Todas") query.filter = { property: "Prioridade", select: { equals: priority } };
      if (status) query.filter = { and: [query.filter, { property: "Status", status: { equals: status } }].filter(Boolean) };
      const rows = await queryDataSource(PIPELINE_ID, { limit, query });
      return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
    } catch (e) {
      return { isError: true, content: [{ type: "text", text: `Erro get_pipeline: ${e.message}` }] };
    }
  });

  // V3 simples Item|Notas|Data|Atualizado em
  server.registerTool("get_parking_lot", {
    title: "Consultar Parking Lot - Ideias Futuras",
    description: "Parking Lot / Ideias Futuras read-only - simples Item|Notas|Data|Atualizado em, 7 itens migrados de page. Ordenado por Atualizado em DESC.",
    inputSchema: { limit: z.number().int().min(1).max(100).default(20) }
  }, async ({ limit }) => {
    try {
      const rows = await queryDataSource(PARKING_LOT_ID, { limit, query: { sorts: [{ property: "Atualizado em", direction: "descending" }, { property: "Data", direction: "descending" }] } });
      return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
    } catch (e) {
      return { isError: true, content: [{ type: "text", text: `Erro get_parking_lot: ${e.message}` }] };
    }
  });

  server.registerTool("get_lessons_learned", {
    title: "Consultar Lessons Learned",
    description: "Lessons Learned read-only - simples Item|Notas|Data|Atualizado em, 8 itens migrados de 54 blocos page. Ordenado por Atualizado em DESC.",
    inputSchema: { limit: z.number().int().min(1).max(100).default(20) }
  }, async ({ limit }) => {
    try {
      const rows = await queryDataSource(LESSONS_ID, { limit, query: { sorts: [{ property: "Atualizado em", direction: "descending" }, { property: "Data", direction: "descending" }] } });
      return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
    } catch (e) {
      return { isError: true, content: [{ type: "text", text: `Erro get_lessons_learned: ${e.message}` }] };
    }
  });

  server.registerTool("get_partner_ecosystem", {
    title: "Consultar AI Partner Ecosystem",
    description: "AI Partner Ecosystem 14 colunas read-only",
    inputSchema: { limit: z.number().int().min(1).max(100).default(20) }
  }, async ({ limit }) => {
    try {
      const rows = await queryDataSource(ECOSYSTEM_ID, { limit });
      return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
    } catch (e) {
      return { isError: true, content: [{ type: "text", text: `Erro get_partner_ecosystem: ${e.message}` }] };
    }
  });

  return server;
}

async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[anti-jegue] connected V3.0.0 - 5 tools read-only - Item|Notas|Data|Atualizado em");
}

main().catch((e) => { console.error("[anti-jegue] fatal", e); process.exit(1); });