import { createClient } from "@supabase/supabase-js";

function supabaseAdmin() {
  const env: any = process.env as any;
  const url = env['SUPABASE_URL'] || env['VITE_SUPABASE_URL'] || env['VITE_PACK_SUPABASE_URL'];
  const key = env['SUPABASE_SERVICE_ROLE_KEY'] || env['SUPABASE_SERVICE_KEY'] || env['SUPABASE_ANON_KEY'] || env['VITE_SUPABASE_ANON_KEY'];
  if (!url || !key) throw new Error("SUPABASE keys missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function ensureUser(deviceId: string) {
  const supa = supabaseAdmin();
  const { data: existing } = await supa.from("users").select("*").eq("device_id", deviceId).maybeSingle();
  if (existing) return existing;
  const { data: created, error } = await supa.from("users").insert({
    device_id: deviceId,
    credits: 10,
    total_gasto_usd: 0,
    total_gasto_brl: 0,
  }).select("*").single();
  if (error) throw error;
  return created;
}

export async function logExecution(data: any) {
  const supa = supabaseAdmin();
  const payload = {
    device_id: data.deviceId,
    user_id: data.userId || null,
    tipo: data.tipo,
    file_name: data.fileName ?? null,
    modelo_usado: data.modeloUsado,
    custo_usd: data.custoUsd ?? 0,
    tema_extraido: data.temaExtraido ?? null,
    prompt_final: data.promptFinal ?? null,
    post_gerado: data.postGerado ?? null,
    transcricao: data.transcricao ?? null,
    resumo: data.resumo ?? null,
    pode_usar_publico: data.podeUsarPublico ?? false,
  };
  const { data: row, error } = await supa.from("executions").insert(payload).select("id").single();
  if (error) { console.error("logExecution", error, payload); throw error; }
  return row.id;
}

export async function chargeCredit(deviceId: string) {
  const supa = supabaseAdmin();
  const { data: user } = await supa.from("users").select("*").eq("device_id", deviceId).single();
  if (!user) return 0;
  const newCredits = Math.max(0, (user.credits ?? 0) - 1);
  await supa.from("users").update({ credits: newCredits }).eq("device_id", deviceId);
  return newCredits;
}

export async function saveFeedback(executionId: string, deviceId: string, nota: number, oQueFaltou?: string) {
  const supa = supabaseAdmin();
  const { error } = await supa.from("feedbacks").insert({
    execution_id: executionId,
    device_id: deviceId,
    nota,
    o_que_faltou: oQueFaltou ?? null,
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

export async function runPostImagem(data: any) {
  const deviceId = data.deviceId;
  if (!deviceId) throw new Error("deviceId missing");
  const user = await ensureUser(deviceId);
  if ((user.credits ?? 0) <= 0) throw new Error("Sem créditos");

  const modelo = "google/gemini-2.5-flash-lite";
  const post = `Post ${data.answers.plataforma} tom ${data.answers.tom} - tema extraído da ${data.fileName}`;
  const custo = 0.0006;

  const execId = await logExecution({
    deviceId,
    userId: user.id,
    fileName: data.fileName,
    tipo: "foto_post",
    modeloUsado: modelo,
    custoUsd: custo,
    temaExtraido: data.answers.plataforma,
    promptFinal: JSON.stringify(data.answers),
    postGerado: post,
  });

  const remaining = await chargeCredit(deviceId);
  // compatível com seu FotoPost.tsx original
  return { ok: true, executionId: execId, post, post_gerado: post, custo_estimado: custo, custo_usd: custo, creditosRestantes: remaining, credits: remaining };
}

export async function runAudioResumo(data: any) {
  const deviceId = data.deviceId;
  if (!deviceId) throw new Error("deviceId missing");
  const user = await ensureUser(deviceId);
  if ((user.credits ?? 0) <= 0) throw new Error("Sem créditos");

  let mime = data.mimeType || "audio/mp4";
  if (mime.includes("m4a") || mime.includes("x-m4a")) mime = "audio/mp4";

  const modelo = "google/gemini-2.5-flash-lite";
  const transcricao = `Transcrição simulada de ${data.fileName} (${mime})`;
  const resumo = data.answers.resultado === "transcricao_literal" ? transcricao : `Resumo ${data.answers.resultado} de ${data.fileName}`;
  const custo = 0.0008;

  const execId = await logExecution({
    deviceId,
    userId: user.id,
    fileName: data.fileName,
    tipo: "audio_resumo",
    modeloUsado: modelo,
    custoUsd: custo,
    temaExtraido: data.answers.numeroPessoas,
    promptFinal: JSON.stringify(data.answers),
    transcricao,
    resumo,
  });

  const remaining = await chargeCredit(deviceId);
  return { ok: true, executionId: execId, transcricao, resumo, custo_estimado: custo, custo_usd: custo, creditosRestantes: remaining };
}

export async function runEnviarFeedback(data: any) {
  const { executionId, deviceId, nota, oQueFaltou, podeUsarPublico } = data;
  if (podeUsarPublico !== undefined) {
    await updateConsent(executionId, podeUsarPublico);
  }
  const ok = await saveFeedback(executionId, deviceId, nota, oQueFaltou);
  return { ok };
}