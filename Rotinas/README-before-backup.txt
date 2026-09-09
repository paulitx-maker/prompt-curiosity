BACKUP ORQUESTRADOR-MVP - LEIA ANTES

O que tem aqui:
-.bundle = backup COMPLETO do git [todo historico, branches, tags]. Restaura com: git clone arquivo.bundle pasta-restaurada
-.zip = snapshot do codigo no momento [HEAD]. So para consulta rapida
- backup-log.txt = historico de quando foi feito e qual commit

Quando fazer [obrigatorio]:
1. Antes de qualquer ALTER TABLE / RLS / policy / RPC no Supabase
2. Depois de fechar bug que levou >1h
3. Antes de refatorar credits / device_id / limites
4. Depois de todo deploy Ready que muda regra de negocio
5. Semanal - sexta 18h

Quando APAGAR [recomendacao manual]:
- NUNCA apague automaticamente. Se ficar 30 dias sem backup, auto-delete apagaria tudo.
- Apague manualmente apenas para liberar storage, mantendo sempre:
  -> Ultimo backup de cada mes
  -> Ultimo backup antes de cada deploy critico
  -> Pelo menos 3 backups recentes
- Se a pasta passar de 2GB, revise manualmente e apague os intermediarios, nao os marcos.

Restaurar: git clone "C:\dev\orquestrador-mvp\Backups\orquestrador-mvp-AAAA-MM-DD_HH-mm.bundle" orquestrador-mvp-restaurado


--- SUPABASE ---
Dump completo via supabase db dump captura tudo que o CSV nao captura: schema, RLS, policies, functions, triggers.
Restaurar: supabase db reset --linked ou psql $DATABASE_URL < arquivo.sql
Critico para pagamentos_pix: sem dump, DELETE sem WHERE = perda irreversivel no Free.
Rotina: Rotinas\backupSupabase.bat