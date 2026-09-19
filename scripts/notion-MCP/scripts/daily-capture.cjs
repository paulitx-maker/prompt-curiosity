/**
 * daily-capture.cjs — V4 FINAL DINÂMICA — READ-ONLY + catálogo automático
 * Corrige: pasta YYYY-MM-DD literal (placeholder) + execucoes vazio + atualização manual do CSV
 * Local: C:\dev\orquestrador-mvp\scripts\notion-MCP\scripts\daily-capture.cjs
 * - Salva sempre em _kit-ux-meta/execucoes/2026/exec-YYYY-MM-DD-daily-snapshot/evidencia (real date, não placeholder)
 * - Atualiza automaticamente _kit-ux-meta/catalogo/execucoes.csv com DAILY-YYYY-MM-DD
 * - Usa dataSources.query sem sort primeiro (SDK 5.26)
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

const notion = new Client({ auth: process.env.NOTION_API_KEY });

function envAny(...keys) {
  for (const k of keys) if (process.env[k]) return process.env[k];
  return undefined;
}

const DATABASES = {
  estado_atual: envAny('NOTION_ANTIJEGUE_DATABASE_ID', 'NOTION_ESTADO_ATUAL_ID', 'NOTION_ESTADO_ATUAL_DATABASE_ID'),
  pipeline: envAny('NOTION_PIPELINE_DATABASE_ID', 'NOTION_PIPELINE_ID'),
  parking_lot: envAny('NOTION_PARKING_LOT_DATABASE_ID', 'NOTION_PARKING_LOT_ID', 'NOTION_PARKING_DATABASE_ID'),
  lessons_learned: envAny('NOTION_LESSONS_LEARNED_DATABASE_ID', 'NOTION_LESSONS_DATABASE_ID', 'NOTION_LESSONS_LEARNED_ID'),
  ai_partner: envAny('NOTION_AI_PARTNER_ECOSYSTEM_ID', 'NOTION_ECOSYSTEM_DATABASE_ID', 'NOTION_ECOSYSTEM_ID', 'NOTION_AI_PARTNER_ID'),
};

function parseArgs() {
  const args = process.argv.slice(2);
  const getVal = (name) => {
    const i = args.indexOf(name);
    if (i !== -1 && args[i + 1] && !args[i + 1].startsWith('--')) return args[i + 1];
    const eq = args.find(a => a.startsWith(name + '='));
    if (eq) return eq.split('=')[1];
    return null;
  };
  return {
    dryRun: args.includes('--dry-run'),
    limit: parseInt(getVal('--limit') || '50', 10),
    date: getVal('--date') || new Date().toISOString().slice(0, 10),
  };
}

function normalizeRow(page) {
  const props = page.properties || {};
  const get = (k) => {
    const p = props[k];
    if (!p) return null;
    if (p.title) return p.title.map(t => t.plain_text).join('');
    if (p.rich_text) return p.rich_text.map(t => t.plain_text).join('');
    if (p.select) return p.select.name;
    if (p.status) return p.status.name;
    if (p.date) return p.date.start;
    return null;
  };
  return {
    Item: get('Item') || get('Nome') || get('Título') || get('Task') || get('Title') || '—',
    Notas: (get('Notas') || '').slice(0, 300),
    Data: get('Data'),
    Atualizado_em: get('Atualizado em') || page.last_edited_time,
  };
}

async function queryDataSource(dataSourceId, limit) {
  if (!dataSourceId) return { error: 'NOT_CONFIGURED', count: 0, rows: [] };
  const attempts = [
    { desc: 'sem sort', payload: { data_source_id: dataSourceId, page_size: limit } },
    { desc: 'sort Data', payload: { data_source_id: dataSourceId, page_size: limit, sorts: [{ property: 'Data', direction: 'descending' }] } },
    { desc: 'sort Atualizado em', payload: { data_source_id: dataSourceId, page_size: limit, sorts: [{ property: 'Atualizado em', direction: 'descending' }] } },
  ];
  let lastError = null;
  for (const att of attempts) {
    try {
      const res = await notion.dataSources.query(att.payload);
      return { count: res.results.length, rows: res.results.map(normalizeRow), used: att.desc };
    } catch (e) {
      lastError = e;
      if (e.message && e.message.includes('sort property')) continue;
      continue;
    }
  }
  return { error: lastError?.code || lastError?.message || 'unknown', count: 0, rows: [] };
}

function updateExecucoesCsv({ date, results, evidenciaPath }) {
  // Caminho do catálogo: _kit-ux-meta/catalogo/execucoes.csv (na raiz, 3 níveis acima)
  const catalogoPath = path.join(__dirname, '..', '..', '..', '_kit-ux-meta', 'catalogo', 'execucoes.csv');
  const execId = `DAILY-${date}`;
  const demanda = `Snapshot diario 5 bases`;
  const prompt = `daily-capture.cjs`;
  const agente = `Manus`;
  const leu = `Estado Atual ${results.estado_atual?.count||0}, Pipeline ${results.pipeline?.count||0}, Parking ${results.parking_lot?.count||0}, Lessons ${results.lessons_learned?.count||0}, AI Partner ${results.ai_partner?.count||0}`;
  const alterou = `evidencia/${path.basename(evidenciaPath)}/daily-snapshot-${date}.json + md`;
  const validacao = Object.values(results).filter(r=>!r.error).length === 5 ? 'PASS' : 'PARTIAL';
  const link = `execucoes/2026/exec-${date}-daily-snapshot/evidencia/daily-snapshot-${date}.md`;
  const decisao = `V4 dinamica dataSources.query sem sort - 5/5 bases - READ-ONLY`;
  const proximo = `Validar snapshot e agendar 00:00`;

  const header = `exec_id,data,demanda_original,prompt_usado,agente,o_que_leu,o_que_alterou,validacao,link_evidencia,decisao_tomada,proximo_passo,creditos`;
  let content = '';
  if (fs.existsSync(catalogoPath)) {
    content = fs.readFileSync(catalogoPath, 'utf8');
  } else {
    content = header + '\n';
  }

  if (content.includes(execId)) {
    console.log(`[CATALOGO] ${execId} já existe em execucoes.csv — pulando`);
    return;
  }

  // Garante header
  if (!content.trim().startsWith('exec_id')) {
    content = header + '\n' + content;
  }

  const linha = `${execId},${date},${demanda},${prompt},${agente},"${leu}",${alterou},${validacao},${link},"${decisao}",${proximo},`;
  fs.writeFileSync(catalogoPath, content.trimEnd() + '\n' + linha + '\n', 'utf8');
  console.log(`[CATALOGO] Adicionado ${execId} em ${catalogoPath}`);
}

async function main() {
  const { dryRun, limit, date } = parseArgs();
  console.log(`[daily-capture V4 DINAMICA] ${date} limit=${limit} dryRun=${dryRun}`);

  const missing = Object.entries(DATABASES).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) console.warn('[WARN] Bases não configuradas:', missing.join(', '));

  const results = {};
  for (const [key, id] of Object.entries(DATABASES)) {
    results[key] = await queryDataSource(id, limit);
    console.log(`→ ${key}: ${results[key].count} (${results[key].used || results[key].error})`);
  }

  // FIX PATH: 3 níveis acima = C:\dev\orquestrador-mvp
  const baseDir = path.join(__dirname, '..', '..', '..', '_kit-ux-meta', 'execucoes', '2026', `exec-${date}-daily-snapshot`, 'evidencia');

  if (dryRun) {
    console.log(`\n[DRY-RUN] Salvaria em: ${baseDir}`);
    console.log(`[DRY-RUN] E atualizaria catalogo/execucoes.csv com ${`DAILY-${date}`}`);
    return;
  }

  fs.mkdirSync(baseDir, { recursive: true });

  const md = `# Daily Snapshot — ${date}
Data: ${new Date().toISOString()}
Limit: ${limit}

## Contagem
${Object.entries(results).map(([k, v]) => `- ${k}: ${v.count} ${v.error ? `(ERRO ${v.error})` : `(${v.used})`}`).join('\n')}

## Últimos 3 por base
${Object.entries(results).map(([k, v]) => {
  const rows = (v.rows || []).slice(0, 3).map(r => `${r.Data || r.Atualizado_em || ''} | ${r.Item}`).join('\n  - ');
  return `### ${k}\n  - ${rows || '(vazio)'}`;
}).join('\n\n')}

## Validação
- Leitura: ${Object.values(results).filter(r=>!r.error).length}/5
- READ-ONLY: confirmado
`;

  fs.writeFileSync(path.join(baseDir, `daily-snapshot-${date}.json`), JSON.stringify({ date, limit, results }, null, 2), 'utf8');
  fs.writeFileSync(path.join(baseDir, `daily-snapshot-${date}.md`), md, 'utf8');
  console.log(`\n[OK] JSON/MD salvos em ${baseDir}`);

  // Atualização dinâmica do catálogo
  updateExecucoesCsv({ date, results, evidenciaPath: baseDir });

  console.log(`\n[OK] DAILY-${date} concluído — snapshot + catálogo automático`);
}

main().catch(e => { console.error('[FATAL]', e); process.exit(1); });
