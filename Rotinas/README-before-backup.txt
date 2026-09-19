# BACKUP ORQUESTRADOR-MVP - LEIA ANTES

Pasta `Rotinas/` = VAI pro GitHub (receitas de sobrevivência)
Pasta `Backups/` = NÃO vai pro GitHub (está no .gitignore) - contém .bundle, .zip, .sql

---

### O QUE TEM EM Backups/
- `.bundle` = backup COMPLETO do git [todo histórico, branches, tags]. Restaura com: `git clone arquivo.bundle`
- `.zip` = snapshot do código no momento [HEAD]. Só para consulta rápida
- `backup-log.txt` = histórico de quando foi feito e qual commit
- `supabase-dump-*.sql` = dump completo do Supabase

### QUANDO FAZER [obrigatório]
1. Antes de qualquer ALTER TABLE / RLS / policy / RPC no Supabase
2. Depois de fechar bug que levou >1h
3. Antes de refatorar credits / device_id / limites
4. Depois de todo deploy Ready que muda regra de negócio
5. Semanal - sexta 18h

### QUANDO APAGAR [recomendação manual]
- NUNCA apague automaticamente.
- Apague manualmente apenas para liberar storage, mantendo sempre:
  -> Último backup de cada mês
  -> Último backup antes de cada deploy crítico
  -> Pelo menos 3 backups recentes
- Se a pasta passar de 2GB, revise manualmente e apague os intermediários, não os marcos.

---

### TRILHA COMPLETA - 4 AÇÕES

**AÇÃO 1: LOCAL -> BACKUP (Salvar)**
`Rotinas\backupGitHub.bat`
O que faz: cria .bundle + .zip + log em `Backups\`
Quando usar: antes de mexer no Supabase, depois de bug grande

**AÇÃO 2: LOCAL -> GITHUB -> VERCEL (Deploy)**
`git add .` -> `git commit -m "..."` -> `git push`
O que faz: sobe seu código pra `prompt-curiosity` no GitHub, Vercel faz deploy automático
Quando usar: feature pronta

**AÇÃO 3: GITHUB -> LOCAL (Sincronia - CASO DE HOJE)**
`Rotinas\ATUALIZAR-LOCAL.bat` [atualizarLocalFromGitHub.ps1]
O que faz:
    1. Cria backup de emergência do seu estado ATUAL em `Backups\emergency-antes-restore-*.bundle`
    2. `git fetch origin` (busca o que tem no GitHub)
    3. Lista os últimos 10 commits do GitHub e deixa você ESCOLHER qual usar
    4. `git reset --hard` + `git clean -fd` na SUA RAIZ `C:\dev\orquestrador-mvp`
Quando usar: quando o GitHub/Vercel está mais atualizado que seu local (dessincronia)

**AÇÃO 4: BACKUP -> LOCAL (Disaster Recovery / Investigação)**
`Rotinas\RESTAURAR-SEGURO\RESTAURAR.bat` [restoreFromBundle.ps1]
O que faz:
    1. Lista todos os .bundle de `Backups\` do mais novo pro mais antigo
    2. Você escolhe pelo NÚMERO
    3. Pede confirmação S/N
    4. Clona para `C:\dev\orquestrador-mvp-RESTAURADO-NOME-DO-BUNDLE`
    5. NÃO altera sua raiz `C:\dev\orquestrador-mvp`
Quando usar: HD queimou, deletou tudo, ou quer inspecionar backup antigo com segurança

---

### SUPABASE
- Dump completo via `Rotinas\backupSupabase.bat` captura tudo que CSV não captura: schema, RLS, policies, functions, triggers
- Restaurar: `supabase db reset --linked` ou `psql $DATABASE_URL < arquivo.sql`
- Crítico para `pagamentos_pix`: sem dump, DELETE sem WHERE = perda irreversível no plano Free

### BUG RESOLVIDO EM 09/09/2026
Problema: `.output/` estava trackeado, `.gitignore` com `$node_modules/` e `Rotinas/` dentro de `Backups/` (não ia pro GitHub).
Solução: `git rm -r --cached .output/`, corrigir `.gitignore` para `node_modules/` e `supabase/.temp/`, mover `Rotinas/` para `C:\dev\orquestrador-mvp\Rotinas\` na raiz.
Estado final: `git status` clean.

Rotinas / rotina_diaria.bat
O que faz:
rotina_diaria.bat é a rotina de consolidação diária do Orquestrador MVP. Ele mora em C:\dev\orquestrador-mvp\Rotinas\ junto com backupSupabase.ps1 e backupGitHub.bat, mas o ROOT dele é C:\dev\orquestrador-mvp (pai de Rotinas).

Fluxo em ordem, sempre com conferência ANTES de operar:

Calcula ROOT automaticamente: BAT_DIR=%~dp0 = Rotinas\, ROOT=.. = orquestrador-mvp. Isso permite deixar o .bat em Rotinas\ sem quebrar paths.
Cartão de ponto .last_sync: arquivo txt simples com 1 linha 2026-09-19 em \_kit-ux-meta\execucoes\custo\evidencia\data\.last_sync. Não é CSV. Se TODAY == LAST, faz SKIP e não executa nada (idempotência local).
Conferência no banco ANTES: roda SELECT count FROM custo_ia WHERE date >= TODAY via SERVICE_ROLE pra saber quantas linhas já estão salvas pro dia. Só log, não bloqueia.
Executa daily-capture.cjs: caminho real scripts\notion-MCP\scripts\daily-capture.cjs (V4 DINAMICA, limit 50). Salva JSON/MD em exec-2026-09-19-daily-snapshot\evidencia\ + cataloga em catalogo\execucoes.csv. Se já existe DAILY-2026-09-19, faz já existe — pulando (idempotência do catalogo).
Executa openrouter_cost_sync.py: usa miniconda3\python.exe + OPENROUTER_MANAGEMENT_KEY + VITE_SUPABASE_URL + SERVICE_ROLE. Gera historico_completo.csv (20 grupos) e custo_por_evento.csv (57 eventos, 12828 bytes) + upsert em public.custo_ia com UNIQUE INDEX (date,model,provider_name) pra não duplicar.
Bate ponto: se ambos passos deram errorlevel 0, grava TODAY em .last_sync + log em rotina.log.