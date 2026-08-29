CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text UNIQUE NOT NULL,
  credits int NOT NULL DEFAULT 3,
  total_gasto_usd numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.users TO service_role;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id),
  tipo text CHECK (tipo IN ('foto_post','audio_resumo')),
  prompt_final text,
  modelo_usado text,
  custo_usd numeric,
  tema_extraido text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.executions TO service_role;
ALTER TABLE public.executions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_executions_user_id ON public.executions(user_id);

CREATE TABLE public.feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id uuid REFERENCES public.executions(id),
  nota int CHECK (nota BETWEEN 1 AND 5),
  o_que_faltou text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.feedbacks TO service_role;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_feedbacks_execution_id ON public.feedbacks(execution_id);

CREATE OR REPLACE FUNCTION public.charge_credit(_device_id text, _custo numeric)
RETURNS int
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.users
  SET credits = credits - 1,
      total_gasto_usd = total_gasto_usd + _custo
  WHERE device_id = _device_id AND credits > 0
  RETURNING credits
$$;
REVOKE ALL ON FUNCTION public.charge_credit(text, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.charge_credit(text, numeric) TO service_role;