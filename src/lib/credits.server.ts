// Acesso privilegiado a users/executions/feedbacks. As três tabelas têm RLS
// sem policies para o navegador — TODO acesso passa por aqui, no servidor.

type AdminClient = Awaited<
  ReturnType<typeof import("@/integrations/supabase/client.server")>
>["supabaseAdmin"];

async function admin(): Promise<AdminClient> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export interface CreditsUser {
  id: string;
  device_id: string;
  credits: number;
  total_gasto_usd: number;
}

/** Busca ou cria o usuário pelo device_id (insert idempotente). */
export async function ensureUser(deviceId: string): Promise<CreditsUser> {
  const db = await admin();
  const { error: upsertError } = await db
    .from("users")
    .upsert({ device_id: deviceId, credits: 3 }, { onConflict: "device_id", ignoreDuplicates: true });
  if (upsertError) throw new Error(`ensureUser upsert: ${upsertError.message}`);

  const { data, error } = await db
    .from("users")
    .select("id, device_id, credits, total_gasto_usd")
    .eq("device_id", deviceId)
    .single();
  if (error || !data) throw new Error(`ensureUser select: ${error?.message ?? "user not found"}`);
  return data as CreditsUser;
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
