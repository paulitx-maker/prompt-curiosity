import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/antijegue.server-DDC-a3BX.js
function supabaseAdmin() {
	const env = process.env;
	const url = env["SUPABASE_URL"] || env["VITE_SUPABASE_URL"];
	const key = env["SUPABASE_SERVICE_ROLE_KEY"] || env["SUPABASE_SERVICE_KEY"];
	if (!url || !key) throw new Error("SUPABASE keys missing - use SERVICE_ROLE");
	return createClient(url, key, { auth: { persistSession: false } });
}
async function ensureUser(deviceId) {
	const supa = supabaseAdmin();
	const { data: existing } = await supa.from("users").select("*").eq("device_id", deviceId).maybeSingle();
	if (existing) return existing;
	const { data: created, error } = await supa.from("users").insert({
		device_id: deviceId,
		credits: 10,
		total_gasto_usd: 0,
		total_gasto_brl: 0
	}).select("*").single();
	if (error) {
		const { data: retry } = await supa.from("users").select("*").eq("device_id", deviceId).single();
		if (retry) return retry;
		throw error;
	}
	return created;
}
async function logExecution(data) {
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
		pode_usar_publico: data.podeUsarPublico ?? false
	};
	const { data: row, error } = await supa.from("executions").insert(payload).select("id").single();
	if (error) {
		console.error("logExecution", error, payload);
		throw error;
	}
	return row.id;
}
async function chargeCredit(deviceId) {
	const supa = supabaseAdmin();
	const { data: user } = await supa.from("users").select("*").eq("device_id", deviceId).single();
	if (!user) return 0;
	if ((user.credits ?? 0) <= 0) throw new Error("SEM_CREDITOS");
	const newCredits = Math.max(0, (user.credits ?? 0) - 1);
	await supa.from("users").update({ credits: newCredits }).eq("device_id", deviceId);
	return newCredits;
}
async function saveFeedback(executionId, deviceId, nota, oQueFaltou) {
	const { error } = await supabaseAdmin().from("feedbacks").insert({
		execution_id: executionId,
		device_id: deviceId,
		nota,
		o_que_faltou: oQueFaltou ?? null
	});
	if (error) {
		console.error("saveFeedback", error);
		return false;
	}
	return true;
}
async function updateConsent(executionId, podeUsar) {
	const { error } = await supabaseAdmin().from("executions").update({ pode_usar_publico: podeUsar }).eq("id", executionId);
	if (error) {
		console.error("updateConsent", error);
		return false;
	}
	return true;
}
async function callOpenRouter(prompt, imageBase64) {
	const env = process.env;
	const apiKey = env["OPENROUTER_API_KEY"] || env["VITE_OPENROUTER_API_KEY"];
	if (!apiKey) throw new Error("OPENROUTER_API_KEY missing no.env");
	const messages = [{
		role: "user",
		content: imageBase64 ? [{
			type: "text",
			text: prompt
		}, {
			type: "image_url",
			image_url: { url: imageBase64 }
		}] : prompt
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
			provider: {
				allow_fallbacks: false,
				require_parameters: true,
				data_collection: "deny"
			},
			messages
		})
	});
	if (!res.ok) {
		const t = await res.text();
		console.error("OpenRouter FAIL", res.status, t);
		throw new Error(`AI_PROVIDER_ERROR ${res.status}`);
	}
	return (await res.json()).choices?.[0]?.message?.content ?? "";
}
async function runPostImagem(data) {
	const deviceId = data.deviceId;
	if (!deviceId) throw new Error("deviceId missing");
	const user = await ensureUser(deviceId);
	if ((user.credits ?? 0) <= 0) throw new Error("Sem créditos");
	const image = data.imageBase64 || data.fileBase64;
	if (!image) throw new Error("imageBase64 missing");
	const prompt = `Você é copywriter anti-jegue. Crie um POST para ${data.answers.plataforma} com tom ${data.answers.tom}. Objetivo: ${data.answers.manterTexto}. Regras: sem jargão, frases curtas, CTA no final. Arquivo: ${data.fileName}. Responda só o post pronto em PT-BR.`;
	const post = await callOpenRouter(prompt, image);
	const execId = await logExecution({
		deviceId,
		userId: user.id,
		fileName: data.fileName,
		tipo: "foto_post",
		modeloUsado: "google/gemini-2.5-flash-lite",
		custoUsd: 6e-4,
		temaExtraido: data.answers.plataforma,
		promptFinal: prompt,
		postGerado: post
	});
	const remaining = await chargeCredit(deviceId);
	return {
		ok: true,
		executionId: execId,
		post,
		post_gerado: post,
		custo_estimado: 6e-4,
		custo_usd: 6e-4,
		creditosRestantes: remaining,
		credits: remaining
	};
}
async function runAudioResumo(data) {
	const deviceId = data.deviceId;
	if (!deviceId) throw new Error("deviceId missing");
	const user = await ensureUser(deviceId);
	if ((user.credits ?? 0) <= 0) throw new Error("Sem créditos");
	const prompt = `Transcreva e resuma este áudio: ${data.fileName}. Tipo de resumo: ${data.answers.resultado}, Qtd pessoas: ${data.answers.numeroPessoas}. Formato: Transcrição literal + Resumo em tópicos. PT-BR.`;
	const resultado = await callOpenRouter(prompt);
	const transcricao = resultado.slice(0, 4e3);
	const resumo = resultado;
	return {
		ok: true,
		executionId: await logExecution({
			deviceId,
			userId: user.id,
			fileName: data.fileName,
			tipo: "audio_resumo",
			modeloUsado: "google/gemini-2.5-flash-lite",
			custoUsd: 8e-4,
			temaExtraido: data.answers.numeroPessoas,
			promptFinal: prompt,
			transcricao,
			resumo
		}),
		transcricao,
		resumo,
		custo_estimado: 8e-4,
		custo_usd: 8e-4,
		creditosRestantes: await chargeCredit(deviceId)
	};
}
async function runEnviarFeedback(data) {
	const { executionId, deviceId, nota, oQueFaltou, podeUsarPublico } = data;
	if (podeUsarPublico !== void 0) await updateConsent(executionId, podeUsarPublico);
	return { ok: await saveFeedback(executionId, deviceId, nota, oQueFaltou) };
}
//#endregion
export { runAudioResumo, runEnviarFeedback, runPostImagem };
