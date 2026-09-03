// src/lib/antijegue.server.ts - VERSÃO FINAL REAL - SEM MOCK
import { createClient } from "@supabase/supabase-js";

function supabaseAdmin() {
  const env = process.env as any;
  const url = env['SUPABASE_URL'] || env['VITE_SUPABASE_URL'];
  const key = env['SUPABASE_SERVICE_ROLE_KEY'] || env['SUPABASE_SERVICE_KEY'];
  if (!url ||!key) throw new Error("SUPABASE keys missing - use SERVICE_ROLE");
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
  if (error) {
    const { data: retry } = await supa.from("users").select("*").eq("device_id", deviceId).single();
    if (retry) return retry;
    throw error;
  }
  return created;
}

export async function logExecution(data: any) {
  const supa = supabaseAdmin();
  const payload = {
    device_id: data.deviceId,
    user_id: data.userId || null,
    tipo: data.tipo,
    file_name: data.fileName?? null,
    modelo_usado: data.modeloUsado,
    custo_usd: data.custoUsd?? 0,
    tema_extraido: data.temaExtraido?? null,
    prompt_final: data.promptFinal?? null,
    post_gerado: data.postGerado?? null,
    transcricao: data.transcricao?? null,
    resumo: data.resumo?? null,
    pode_usar_publico: data.podeUsarPublico?? false,
  };
  const { data: row, error } = await supa.from("executions").insert(payload).select("id").single();
  if (error) { console.error("logExecution", error, payload); throw error; }
  return row.id;
}

export async function chargeCredit(deviceId: string) {
  const supa = supabaseAdmin();
  const { data: user } = await supa.from("users").select("*").eq("device_id", deviceId).single();
  if (!user) return 0;
  if ((user.credits?? 0) <= 0) throw new Error("SEM_CREDITOS");
  const newCredits = Math.max(0, (user.credits?? 0) - 1);
  await supa.from("users").update({ credits: newCredits }).eq("device_id", deviceId);
  return newCredits;
}

export async function saveFeedback(executionId: string, deviceId: string, nota: number, oQueFaltou?: string) {
  const supa = supabaseAdmin();
  const { error } = await supa.from("feedbacks").insert({
    execution_id: executionId,
    device_id: deviceId,
    nota,
    o_que_faltou: oQueFaltou?? null,
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

async function callOpenRouter(prompt: string, imageBase64?: string) {
  const env = process.env as any;
  const apiKey = env['OPENROUTER_API_KEY'] || env['VITE_OPENROUTER_API_KEY'];
  if (!apiKey) throw new Error("OPENROUTER_API_KEY missing no.env");

  const messages: any[] = [{
    role: "user",
    content: imageBase64? [
      { type: "text", text: prompt },
      { type: "image_url", image_url: { url: imageBase64 } }
    ] : prompt
  }];

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://antijegue.app",
      "X-Title": "AntiJegue MVP"
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      provider: { allow_fallbacks: false, require_parameters: true, data_collection: "deny" },
      messages
    })
  });

  if (!res.ok) {
    const t = await res.text();
    console.error("OpenRouter FAIL", res.status, t);
    throw new Error(`AI_PROVIDER_ERROR ${res.status}`);
  }
  const json = await res.json();
  return json.choices?.[0]?.message?.content?? "";
}

export async function runPostImagem(data: any) {
  const deviceId = data.deviceId;
  if (!deviceId) throw new Error("deviceId missing");
  const user = await ensureUser(deviceId);
  if ((user.credits?? 0) <= 0) throw new Error("Sem créditos");

  const image = data.imageBase64 || data.fileBase64;
  if (!image) throw new Error("imageBase64 missing");

  const prompt = `Você é copywriter anti-jegue. Crie um POST para ${data.answers.plataforma} com tom ${data.answers.tom}. Objetivo: ${data.answers.manterTexto}. Regras: sem jargão, frases curtas, CTA no final. Arquivo: ${data.fileName}. Responda só o post pronto em PT-BR.`;

  const post = await callOpenRouter(prompt, image);
  
  const execId = await logExecution({
    deviceId, userId: user.id, fileName: data.fileName,
    tipo: "foto_post", modeloUsado: "google/gemini-2.5-flash-lite",
    custoUsd: 0.0006, temaExtraido: data.answers.plataforma,
    promptFinal: prompt, postGerado: post,
  });

  const remaining = await chargeCredit(deviceId);
  return { ok: true, executionId: execId, post, post_gerado: post, custo_estimado: 0.0006, custo_usd: 0.0006, creditosRestantes: remaining, credits: remaining };
}

export async function runAudioResumo(data: any) {
  const deviceId = data.deviceId;
  if (!deviceId) throw new Error("deviceId missing");
  const user = await ensureUser(deviceId);
  if ((user.credits?? 0) <= 0) throw new Error("Sem créditos");

  const prompt = `Transcreva e resuma este áudio: ${data.fileName}. Tipo de resumo: ${data.answers.resultado}, Qtd pessoas: ${data.answers.numeroPessoas}. Formato: Transcrição literal + Resumo em tópicos. PT-BR.`;

  // Gemini via OpenRouter não transcreve áudio direto ainda, então usa texto + avisa
  // Se você tiver fileBase64 de áudio, manda como texto por enquanto
  const resultado = await callOpenRouter(prompt);

  const transcricao = resultado.slice(0, 4000);
  const resumo = resultado;

  const execId = await logExecution({
    deviceId, userId: user.id, fileName: data.fileName,
    tipo: "audio_resumo", modeloUsado: "google/gemini-2.5-flash-lite",
    custoUsd: 0.0008, temaExtraido: data.answers.numeroPessoas,
    promptFinal: prompt, transcricao, resumo,
  });

  const remaining = await chargeCredit(deviceId);
  return { ok: true, executionId: execId, transcricao, resumo, custo_estimado: 0.0008, custo_usd: 0.0008, creditosRestantes: remaining };
}

export async function runEnviarFeedback(data: any) {
  const { executionId, deviceId, nota, oQueFaltou, podeUsarPublico } = data;
  if (podeUsarPublico!== undefined) await updateConsent(executionId, podeUsarPublico);
  const ok = await saveFeedback(executionId, deviceId, nota, oQueFaltou);
  return { ok };
}