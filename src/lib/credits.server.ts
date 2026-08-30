// Acesso privilegiado a users/executions/feedbacks. As três tabelas têm RLS
// sem policies para o navegador — TODO acesso passa por aqui, no servidor.
import type { supabaseAdmin as SupabaseAdmin } from "@/integrations/supabase/client.server";

async function admin(): Promise<typeof SupabaseAdmin> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export interface CreditsUser {
  id: string;
  device_id: string;
  credits: number;
  total_gasto_usd: number;
}

const SELECT_USER = "id, device_id, credits, total_gasto_usd";

/** Busca ou cria o usuário pelo device_id (insert idempotente, sem RLS). */
export async function ensureUser(deviceId: string): Promise<CreditsUser> {
  const db = await admin();

  const { error: upsertError } = await db
    .from("users")
    .upsert(
      { device_id: deviceId, credits: 3 },
      { onConflict: "device_id", ignoreDuplicates: true },
    );
  if (upsertError) console.error("ensureUser upsert:", upsertError.message);

  const { data, error } = await db
    .from("users")
    .select(SELECT_USER)
    .eq("device_id", deviceId)
    .maybeSingle();
  if (data) return data as CreditsUser;
  if (error) console.error("ensureUser select:", error.message);

  // Fallback: cria explicitamente caso o upsert idempotente não tenha pegado.
  const { data: created, error: insertError } = await db
    .from("users")
    .insert({ device_id: deviceId, credits: 3 })
    .select(SELECT_USER)
    .maybeSingle();
  if (created) return created as CreditsUser;

  throw new Error(`ensureUser: não foi possível criar o usuário (${insertError?.message ?? "sem detalhes"})`);
}


export interface LogExecutionInput {
  userId: string;
  tipo: "foto_post" | "audio_resumo";
  promptFinal: string;
  modeloUsado: string;
  custoUsd: number;
  temaExtraido: string;
}

export async function logExecution(input: LogExecutionInput): Promise<string | null> {
  const db = await admin();
  const { data, error } = await db
    .from("executions")
    .insert({
      user_id: input.userId,
      tipo: input.tipo,
      prompt_final: input.promptFinal,
      modelo_usado: input.modeloUsado,
      custo_usd: input.custoUsd,
      tema_extraido: input.temaExtraido,
    })
    .select("id")
    .single();
  if (error) {
    console.error("logExecution:", error.message);
    return null;
  }
  return data.id;
}

/** Desconta 1 crédito e soma o gasto de forma atômica. Retorna o novo saldo. */
export async function chargeCredit(deviceId: string, custoUsd: number): Promise<number | null> {
  const db = await admin();
  const { data, error } = await db.rpc("charge_credit", {
    _device_id: deviceId,
    _custo: custoUsd,
  });
  if (error) {
    console.error("chargeCredit:", error.message);
    return null;
  }
  return data as number | null;
}

export async function saveFeedback(
  executionId: string,
  nota: number,
  oQueFaltou?: string,
): Promise<boolean> {
  const db = await admin();
  const { error } = await db.from("feedbacks").insert({
    execution_id: executionId,
    nota,
    o_que_faltou: oQueFaltou ?? null,
  });
  if (error) {
    console.error("saveFeedback:", error.message);
    return false;
  }
  return true;
}
