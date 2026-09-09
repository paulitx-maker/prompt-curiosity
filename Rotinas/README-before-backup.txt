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