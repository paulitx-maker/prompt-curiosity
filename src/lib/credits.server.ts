import { createClient } from "@supabase/supabase-js";

function supabaseAdmin() {
  const env: any = process.env as any;
  const url = env['SUPABASE_URL'] || env['VITE_SUPABASE_URL'] || env['VITE_PACK_SUPABASE_URL'];
  const key = env['SUPABASE_SERVICE_ROLE_KEY'] || env['SUPABASE_SERVICE_KEY'] || env['SUPABASE_ANON_KEY'] || env['VITE_SUPABASE_ANON_KEY'];
  if (!url || !key) throw new Error("SUPABASE keys missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function saveFeedback(executionId: string, deviceId: string, nota: number, oQueFaltou?: string) {
  const supa = supabaseAdmin();
  const { error } = await supa.from("feedbacks").insert({
    execution_id: executionId,
    device_id: deviceId,
    nota,
    o_que_faltou: oQueFaltou ?? null,
    created_at: new Date().toISOString(),
  });
  if (error) { console.error("saveFeedback", error); return false; }
  return true;
}

export async function updateConsent(executionId: string, podeUsar: boolean) {
  const supa = supabaseAdmin();
  const { error } = await supa.from("executions").update({ pode_usar_publico: podeUsar }).eq("id", executionId);
  if (error) { console.error("updateConsent", error); return false; }
  return true;
}

export async function logExecution(data: any) {
  const supa = supabaseAdmin();
  const { data: row, error } = await supa.from("executions").insert({
    user_id: data.userId,
    device_id: data.deviceId,
    file_name: data.fileName ?? null,
    tipo: data.tipo,
    prompt_final: data.promptFinal,
    modelo_usado: data.modeloUsado,
    custo_estimado: data.custoUsd,
    tema_extraido: data.temaExtraido,
    post_gerado: data.postGerado ?? null,
    transcricao: data.transcricao ?? null,
    resumo: data.resumo ?? null,
    pode_usar_publico: data.podeUsarPublico ?? false,
    status: "completed",
    created_at: new Date().toISOString(),
  }).select("id").single();
  if (error) { console.error("logExecution", error); throw error; }
  return row.id;
}