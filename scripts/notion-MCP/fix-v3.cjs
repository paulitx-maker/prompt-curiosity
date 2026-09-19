const fs = require('fs');
require('dotenv').config();

// Lê do .env que já está correto
const cfg = {
  NOTION_API_KEY: process.env.NOTION_API_KEY,
  NOTION_ANTIJEGUE_DATABASE_ID: process.env.NOTION_ANTIJEGUE_DATABASE_ID,
  NOTION_PIPELINE_DATABASE_ID: process.env.NOTION_PIPELINE_DATABASE_ID,
  NOTION_PARKING_LOT_DATABASE_ID: process.env.NOTION_PARKING_LOT_DATABASE_ID,
  NOTION_LESSONS_DATABASE_ID: process.env.NOTION_LESSONS_DATABASE_ID,
  NOTION_ECOSYSTEM_DATABASE_ID: process.env.NOTION_ECOSYSTEM_DATABASE_ID
};

console.log("=== ENV atual ===");
console.log(cfg);

// Manifest V3 sem duplicatas
const manifest = {
  manifest_version: "0.3",
  name: "anti-jegue-notion-readonly",
  version: "3.0.0",
  description: "Read-only V3 - 5 databases fixed - no duplicate IDs",
  author: { name: "Paulo Raposo" },
  server: {
    type: "node",
    entry_point: "server.js",
    mcp_config: {
      command: "node",
      args: ["${__dirname}/server.js"],
      env: {
        NOTION_API_KEY: "${user_config.NOTION_API_KEY}",
        NOTION_ANTIJEGUE_DATABASE_ID: "${user_config.NOTION_ANTIJEGUE_DATABASE_ID}",
        NOTION_PIPELINE_DATABASE_ID: "${user_config.NOTION_PIPELINE_DATABASE_ID}",
        NOTION_PARKING_LOT_DATABASE_ID: "${user_config.NOTION_PARKING_LOT_DATABASE_ID}",
        NOTION_LESSONS_DATABASE_ID: "${user_config.NOTION_LESSONS_DATABASE_ID}",
        NOTION_ECOSYSTEM_DATABASE_ID: "${user_config.NOTION_ECOSYSTEM_DATABASE_ID}"
      }
    }
  },
  user_config: {
    NOTION_API_KEY: { type: "string", title: "Notion API Key", description: "Internal integration token ntn_xxx - read only", required: true, sensitive: true },
    NOTION_ANTIJEGUE_DATABASE_ID: { type: "string", title: "Estado Atual Data Source ID", description: "Data Source ID for Estado Atual - 6 colunas", required: true },
    NOTION_PIPELINE_DATABASE_ID: { type: "string", title: "Pipeline Data Source ID", description: "Data Source ID for Pipeline - rastreador de prioridades", required: false },
    NOTION_PARKING_LOT_DATABASE_ID: { type: "string", title: "Parking Lot Data Source ID", description: "Data Source ID for Parking Lot - ideias futuras", required: false },
    NOTION_LESSONS_DATABASE_ID: { type: "string", title: "Lessons Learned Data Source ID", description: "Data Source ID for Lessons Learned", required: false },
    NOTION_ECOSYSTEM_DATABASE_ID: { type: "string", title: "AI Partner Ecosystem Data Source ID", description: "Data Source ID for AI Partner Ecosystem - 14 colunas", required: false }
  }
};

fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2));
console.log("\nmanifest.json V3 gravado - version 3.0.0 - sem BOM");

console.log("\n=== Para colar no Claude Desktop - senhas ===");
console.log(JSON.stringify(cfg, null, 2));