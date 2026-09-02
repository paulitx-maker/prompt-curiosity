import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface CreditsUser {
  id: string;
  device_id: string;
  credits: number;
  total_gasto_usd: number;
}

const SELECT_USER = "id, device_id, credits, total_gasto_usd";

async function db() {
  return supabaseAdmin;
}

export async function ensureUser(deviceId: string): Promise<CreditsUser> {
  if (!deviceId || deviceId.length < 8) throw new Error("ensureUser: deviceId inválido");
  const client = await db();
  const { data, error } = await client
    .from("users")
    .upsert({ device_id: deviceId } as any, { onConflict: "device_id" })
    .select(SELECT_USER)
    .single();

  if (data) return data as CreditsUser;

  if (error) {
    console.warn("ensureUser upsert fallback:", error.message);
    const { data: created, error: insertError } = await client
      .from("users")
      .insert({ device_id: deviceId, credits: 3, total_gasto_usd: 0 } as any)
      .select(SELECT_USER)
      .single();
    if (created) return created as CreditsUser;
    throw new Error(`ensureUser falhou: ${insertError?.message ?? error.message}`);
  }
  throw new Error("ensureUser: sem dados retornados");
}

export interface LogExecutionInput {
  userId: string;
  deviceId: string;
  fileName?: string;
  tipo: "foto_post" | "audio_resumo" | "blocked_heic";
  promptFinal: string;
  modeloUsado: string;
  custoUsd: number;
  temaExtraido: string;
}

export async function logExecution(input: LogExecutionInput): Promise<string | null> {
  const client = await db();
  const { data, error } = await (client.from as any)("executions")
    .insert({
      user_id: input.userId,
      device_id: input.deviceId,
      file_name: input.fileName ?? null,
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
  const { data, error } = await client.rpc("charge_credit" as any, {
    _device_id: deviceId,
    _custo: custoUsd,
  } as any);
  if (error) {
    console.error("chargeCredit:", error.message);
    return null;
  }
  return data as number;
}

export async function saveFeedback(
  executionId: string,
  deviceId: string,
  nota: number,
  oQueFaltou?: string
): Promise<boolean> {
  const client = await db();
  const { error } = await (client.from as any)("feedbacks").insert({
    execution_id: executionId,
    device_id: deviceId,
    nota,
    o_que_faltou: oQueFaltou?.trim() || null,
  });

  if (error) {
    console.error("saveFeedback erro:", error.message, { executionId, deviceId, nota });
    return false;
  }
  console.log("saveFeedback OK:", nota, "device:", deviceId);
  return true;
}

export async function saveIntencaoCompra(input: {
  deviceId: string;
  produtoId: string;
  etapa: string;
}): Promise<void> {
  const client = await db();
  const { error } = await (client.from as any)("intencoes_compra").insert({
    device_id: input.deviceId,
    produto_id: input.produtoId,
    etapa: input.etapa,
  });
  if (error) {
    console.error("saveIntencaoCompra:", error.message, input);
  }
}

export async function logBlockedUpload(input: {
  deviceId: string;
  fileName: string;
  tipo: "blocked_heic";
}): Promise<void> {
  const client = await db();
  const { error } = await (client.from as any)("executions").insert({
    device_id: input.deviceId,
    file_name: input.fileName,
    tipo: input.tipo,
    user_id: null,
    custo_usd: 0,
    tema_extraido: "blocked",
    prompt_final: "blocked_heic",
    modelo_usado: "none",
  });
  if (error) console.error("logBlockedUpload:", error.message);
}