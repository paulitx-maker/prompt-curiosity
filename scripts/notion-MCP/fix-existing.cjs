const { Client } = require("@notionhq/client");
require('dotenv').config();
const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function findNewDatabases(){
  const res = await notion.search({ query: "NEW", filter: { property: "object", value: "database" }, page_size: 20 });
  for(const db of res.results){
    const title = db.title?.[0]?.plain_text || "";
    if(title.includes("NEW")){
      const full = await notion.databases.retrieve({ database_id: db.id });
      console.log(`Found: ${title} db_id=${db.id} ds_id=${full.data_sources?.[0]?.id} props=${Object.keys(full.data_sources?.[0]?.properties||full.properties||{}).join(",")}`);
    }
  }
}

async function addPropsToExisting(){
  // Busca os 2 que você criou
  const res = await notion.search({ query: "Lessons Learned NEW", page_size: 5 });
  const lessonsDb = res.results.find(r=>r.object==='database');
  const res2 = await notion.search({ query: "Parking Lot — Ideias Futuras NEW", page_size: 5 });
  const parkingDb = res2.results.find(r=>r.object==='database') || (await notion.search({ query: "Parking Lot", page_size: 10 })).results.find(r=>r.object==='database' && r.title?.[0]?.plain_text.includes("NEW"));

  for(const db of [lessonsDb, parkingDb].filter(Boolean)){
    const full = await notion.databases.retrieve({ database_id: db.id });
    const dsId = full.data_sources?.[0]?.id;
    console.log(`\nAtualizando data_source ${dsId} da base ${full.title?.[0]?.plain_text}...`);

    await notion.dataSources.update({
      data_source_id: dsId,
      properties: {
        Item: { title: {} },
        Notas: { rich_text: {} },
        Categoria: { select: { options: [{name:"Bug"},{name:"Processo"},{name:"Deploy"},{name:"Futuro"},{name:"Ideia"},{name:"Infra"}] } },
        Prioridade: { select: { options: [{name:"Alta"},{name:"Média"},{name:"Baixa"},{name:"Futura"}] } },
        Status: { select: { options: [{name:"Ideia"},{name:"Backlog"},{name:"Feito"},{name:"Validado"}] } },
        TipoOriginal: { rich_text: {} },
        Data: { date: {} },
        "Atualizado em": { date: {} } // última à direita
      }
    });
    console.log(` -> OK props adicionadas`);
  }
}

(async()=>{
  await findNewDatabases();
  await addPropsToExisting();
})();