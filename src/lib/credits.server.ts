// Acesso privilegiado via service_role. RLS bloqueado no browser, tudo passa por aqui.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface CreditsUser {
  id: string;
  device_id: string;
  credits: number;
  total_gasto_usd: number;
}

const SELECT_USER = "id, device_id, credits, total_gasto_usd";

// Cache do client admin
async function db() {
  return supabaseAdmin;
}

/** Busca ou cria usuário por device_id - idempotente e sem race */
export async function ensureUser(deviceId: string): Promise<CreditsUser> {
  if (!deviceId || deviceId.length < 8) throw new Error("ensureUser: deviceId inválido");
  
  const client = await db();

  // Upsert atômico: se já existe, não mexe nos créditos
  const { data, error } = await client
    .from("users")
    .upsert({ device_id: deviceId }, { onConflict: "device_id", ignoreDuplicates: false })
    .select(SELECT_USER)
    .single();

  if (data) return data as CreditsUser;
  
  // Fallback se upsert falhou por não ter default de credits
  if (error) {
    console.warn("ensureUser upsert fallback:", error.message);
    const { data: created, error: insertError } = await client
      .from("users")
      .insert({ device_id: deviceId, credits: 3, total_gasto_usd: 0 })
      .select(SELECT_USER)
      .single();
    
    if (created) return created as CreditsUser;
    throw new Error(`ensureUser falhou: ${insertError?.message ?? error.message}`);
  }
  
  throw new Error("ensureUser: sem dados retornados");
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
  const client = await db();
  const { data, error } = await client
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
    console.error("logExecution:", error.message, input);
    return null;
  }
  return data.id;
}

export async function chargeCredit(deviceId: string, custoUsd: number): Promise<number | null> {
  const client = await db();
  const { data, error } = await client.rpc("charge_credit", {
    _device_id: deviceId,
    _custo: custoUsd,
  });
  if (error) {
    console.error("chargeCredit:", error.message);
    return null;
  }
  return data as number;
}

// COMPATÍVEL COM SEU BANCO ATUAL (device_id) E FUTURO (execution_id)
export async function saveFeedback(
  executionId: string,
  nota: number,
  oQueFaltou?: string,
  deviceId?: string
): Promise<boolean> {
  const client = await db();
  
  // Tenta formato novo (com execution_id) primeiro
  let { error } = await client.from("feedbacks").insert({
    execution_id: executionId,
    nota,
    o_que_faltou: oQueFaltou?.trim() || null,
  } as any);

  // Se falhar por coluna execution_id não existir, tenta formato antigo
  if (error && error.message.includes("execution_id")) {
    console.warn("saveFeedback fallback para device_id");
    const fallback = await client.from("feedbacks").insert({
      device_id: deviceId || "unknown",
      nota,
      o_que_faltou: oQueFaltou?.trim() || null,
    } as any);
    error = fallback.error;
  }

  if (error) {
    console.error("saveFeedback erro:", error.message, { executionId, nota, oQueFaltou });
    return false;
  }
  console.log("saveFeedback OK:", nota);
  return true;
}