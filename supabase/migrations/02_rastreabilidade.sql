-- COMPLEMENTA sua migration antiga, não substitui
create table if not exists public.credit_transactions (
  id uuid default gen_random_uuid() primary key,
  device_id text not null,
  correlation_id uuid,
  pack_id text,
  prompt_id text,
  tipo text check (tipo in ('compra','consumo_copia','consumo_geracao','bonus','estorno')),
  qtd int not null,
  saldo_antes int,
  saldo_depois int,
  created_at timestamptz default now()
);
create index if not exists idx_credit_tx_device on public.credit_transactions(device_id, created_at desc);
grant all on public.credit_transactions to service_role;

create table if not exists public.user_events (
  id uuid default gen_random_uuid() primary key,
  device_id text,
  evento text not null,
  pack_id text,
  prompt_id text,
  metadata jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_events_device on public.user_events(device_id, evento, created_at desc);
grant all on public.user_events to service_role;    