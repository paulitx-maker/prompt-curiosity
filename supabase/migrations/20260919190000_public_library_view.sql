-- D19.4: contrato público mínimo da Biblioteca.
-- A tabela public.executions continua protegida por RLS; esta view não usa SELECT *.
create or replace view public.public_library_view as
select
  e.id,
  e.tipo,
  e.tema_extraido,
  e.created_at,
  e.post_gerado
from public.executions as e
where e.pode_usar_publico = true;

revoke all on public.public_library_view from public, anon, authenticated;
grant select on public.public_library_view to anon;

comment on view public.public_library_view is
  'D19.4 public library contract: consented execution content only; no private identifiers or operational metadata.';
