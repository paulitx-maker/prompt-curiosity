import type { AudioResumoInput, PostImagemInput } from "./antijegue.functions";

const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_TRANSCRIPTION_URL = "https://openrouter.ai/api/v1/audio/transcriptions";

const MIN_WIDTH = 500;
const MIN_HEIGHT = 500;
const MIN_FILE_SIZE_KB = 40;
const MAX_IMAGE_SIZE_MB = 8;
const MAX_AUDIO_SIZE_MB = 25;
const MAX_DURATION_SECONDS = 60 * 60;
const MIN_DURATION_SECONDS = 2;

const WHISPER_COST_PER_SECOND = 0.000003;
const GEMINI_INPUT_PER_TOKEN = 0.25 / 1_000_000;
const GEMINI_OUTPUT_PER_TOKEN = 1.5 / 1_000_000;

type Fail = { ok: false; error: string; message: string };
function fail(error: string, message: string): Fail { return { ok: false, error, message }; }
function apiKey(): string | null { return process.env["OPENROUTER_API_KEY"]?? null; }
function decode(base64: string): Uint8Array {
  const raw = base64.includes(",")? base64.split(",")[1]! : base64;
  return Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
}
function getImageDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    const width = (bytes[16]! << 24) | (bytes[17]! << 16) | (bytes[18]! << 8) | bytes[19]!;
    const height = (bytes[20]! << 24) | (bytes[21]! << 16) | (bytes[22]! << 8) | bytes[23]!;
    return { width, height };
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2;
    while (i < bytes.length - 9) {
      if (bytes[i]!== 0xff) { i++; continue; }
      const marker = bytes[i + 1]!;
      const isSOF = marker >= 0xc0 && marker <= 0xcf && marker!== 0xc4 && marker!== 0xc8 && marker!== 0xcc;
      if (isSOF) {
        const height = (bytes[i + 5]! << 8) | bytes[i + 6]!;
        const width = (bytes[i + 7]! << 8) | bytes[i + 8]!;
        return { width, height };
      }
      const segmentLength = (bytes[i + 2]! << 8) | bytes[i + 3]!;
      i += 2 + segmentLength;
    }
  }
  return null;
}
function buildPrompt(answers: PostImagemInput["answers"]): string {
  const plataformaMap = {
    instagram: "Instagram (post de feed: linguagem visual, pode usar emojis e hashtags relevantes no final)",
    linkedin: "LinkedIn (tom profissional, sem hashtags em excesso, foco em contexto e valor)",
    whatsapp: "WhatsApp (mensagem curta e direta, sem hashtags, tom pessoal)",
  } as const;
  const tomMap = {
    vendas: "persuasivo, com chamada para ação clara no final",
    informativo: "direto e educativo, sem tom de venda",
    engracado: "leve e bem-humorado, sem forçar a piada",
  } as const;
  const textoInstrucao = answers.manterTexto === "manter"
     ? "Se houver texto visível na imagem, preserve o conteúdo original e só ajuste o formato para caber no post."
      : "Se houver texto visível na imagem, use-o apenas como referência de contexto e reescreva livremente para o post.";
  return [
    "Você é um redator de conteúdo para redes sociais.",
    `Analise a imagem e escreva um post para ${plataformaMap[answers.plataforma]}.`,
    `Tom: ${tomMap[answers.tom]}.`,
    textoInstrucao,
    'Regras: máximo 400 caracteres. Não invente informações que não estão visíveis na imagem. Não use placeholders como "[nome da empresa]" — se faltar informação, seja genérico mas natural, nunca deixe colchetes no texto.',
  ].join("\n");
}
function buildSummaryPrompt(transcript: string, answers: AudioResumoInput["answers"]): string {
  const pessoasMap = { "1": "uma única pessoa falando.", "2": "duas pessoas conversando — trate como um diálogo, mesmo sem marcação de quem fala o quê.", "3_ou_mais": "três ou mais pessoas falando — pode haver sobreposição de falas ou trechos confusos." } as const;
  const ruidoMap = { limpo: "O áudio é limpo, a transcrição tende a ser confiável.", moderado: "Há ruído de fundo moderado — pode haver pequenos erros ou lacunas na transcrição, sinalize isso se notar trechos incoerentes.", muito_ruido: "Há muito ruído de fundo — a transcrição pode ter erros significativos. Se algum trecho não fizer sentido, não invente o que a pessoa quis dizer, apenas resuma o que está claro." } as const;
  const resultadoMap = { transcricao_literal: "Apenas limpe a transcrição (remova hesitações tipo 'é... né...' e corrija pontuação), sem resumir nada.", resumo_curto: "Escreva um resumo curto, 3-5 frases, só os pontos principais.", resumo_detalhado: "Escreva um resumo detalhado organizado por tópicos, cobrindo todos os assuntos relevantes discutidos." } as const;
  return [`Você vai processar a transcrição de um áudio com ${pessoasMap[answers.numeroPessoas]}`, ruidoMap[answers.ruido], `Tarefa: ${resultadoMap[answers.resultado]}`, `Não invente informação que não está na transcrição. Não use placeholders.`, ``, `Transcrição:`, `"""${transcript}"""`].join("\n");
}

export async function runPostImagem(body: PostImagemInput) {
  const { imageBase64, mimeType, answers } = body;
  if (!imageBase64 ||!answers?.plataforma ||!answers?.tom ||!answers?.manterTexto) {
    return fail("missing_preflight", "Faltam respostas do pre-flight (plataforma, tom ou instrução de texto) ou a imagem.");
  }
  console.log("deviceId received:", body.deviceId?? null);
  const deviceId = body.deviceId && body.deviceId.trim()? body.deviceId : `server-${crypto.randomUUID()}`;
  const { ensureUser, logExecution, chargeCredit } = await import("./credits.server");
  const user = await ensureUser(deviceId);
  if (user.credits < 1) {
    return fail("no_credits", "Seus 3 créditos acabaram. Essa é a aula 1 — as próximas aulas destravam em breve.");
  }
  const key = apiKey();
  if (!key) return fail("missing_api_key", "A chave OPENROUTER_API_KEY ainda não está configurada no backend.");
  const bytes = decode(imageBase64);
  const sizeKB = bytes.length / 1024;
  if (sizeKB > MAX_IMAGE_SIZE_MB * 1024) return fail("file_too_large", `Imagem acima de ${MAX_IMAGE_SIZE_MB}MB.`);
  if (sizeKB < MIN_FILE_SIZE_KB) return fail("low_quality", "Essa imagem parece muito comprimida ou de baixa qualidade. Manda outra foto em resolução maior.");
  const dimensions = getImageDimensions(bytes);
  if (dimensions && (dimensions.width < MIN_WIDTH || dimensions.height < MIN_HEIGHT)) {
    return fail("low_resolution", `Resolução muito baixa (${dimensions.width}x${dimensions.height}px). Mínimo recomendado: ${MIN_WIDTH}x${MIN_HEIGHT}px.`);
  }
  const raw = imageBase64.includes(",")? imageBase64.split(",")[1]! : imageBase64;
  const res = await fetch(OPENROUTER_CHAT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      max_tokens: 400,
      messages: [{ role: "user", content: [{ type: "text", text: buildPrompt(answers) }, { type: "image_url", image_url: { url: `data:${mimeType};base64,${raw}` } }] }],
    }),
  });
  if (!res.ok) return fail("openrouter_failed", await res.text());
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }>; usage?: { prompt_tokens?: number; completion_tokens?: number } };
  const post = data.choices?.[0]?.message?.content?? "";
  const custoEstimado = Number(((data.usage?.prompt_tokens?? 0) * GEMINI_INPUT_PER_TOKEN + (data.usage?.completion_tokens?? 0) * GEMINI_OUTPUT_PER_TOKEN).toFixed(6));
  const promptFinal = buildPrompt(answers);
  const temaExtraido = post.split("\n").find((l) => l.trim())?.slice(0, 120)?? "";
  // FIX - Agora passa deviceId e fileName - acaba com null
  const executionId = await logExecution({
    userId: user.id,
    deviceId,
    fileName: body.fileName?? null as any,
    tipo: "foto_post",
    promptFinal,
    modeloUsado: "google/gemini-2.5-flash-lite",
    custoUsd: custoEstimado,
    temaExtraido,
  });
  const creditosRestantes = await chargeCredit(deviceId, custoEstimado);
  return { ok: true as const, post, custo_estimado: custoEstimado, executionId, creditosRestantes };
}

export async function runEnviarFeedback(body: { executionId: string; deviceId: string; nota: number; oQueFaltou?: string | undefined }) {
  if (!body.executionId || typeof body.nota!== "number" || body.nota < 1 || body.nota > 5 ||!body.deviceId) {
    return fail("invalid_feedback", "Feedback inválido.");
  }
  const { saveFeedback } = await import("./credits.server");
  const saved = await saveFeedback(body.executionId, body.deviceId, body.nota, body.oQueFaltou);
  if (!saved) return fail("feedback_failed", "Não consegui salvar seu feedback. Tenta de novo.");
  return { ok: true as const };
}

export async function runAudioResumo(body: AudioResumoInput) {
  const { audioBase64, mimeType, durationSeconds, answers } = body;
  if (!audioBase64 ||!answers?.numeroPessoas ||!answers?.ruido ||!answers?.resultado) {
    return fail("missing_preflight", "Faltam respostas do pre-flight (número de pessoas, ruído ou resultado desejado) ou o áudio.");
  }
  const key = apiKey();
  if (!key) return fail("missing_api_key", "A chave OPENROUTER_API_KEY ainda não está configurada no backend.");
  const bytes = decode(audioBase64);
  const sizeMB = bytes.length / (1024 * 1024);
  if (sizeMB > MAX_AUDIO_SIZE_MB) return fail("file_too_large", `Arquivo acima de ${MAX_AUDIO_SIZE_MB}MB.`);
  if (!durationSeconds || durationSeconds < MIN_DURATION_SECONDS) return fail("invalid_duration", "Áudio vazio, corrompido ou duração inválida.");
  if (durationSeconds > MAX_DURATION_SECONDS) return fail("duration_too_long", "Áudio acima de 1h não é suportado nessa versão.");
  const form = new FormData();
  form.append("file", new Blob([bytes as BlobPart], { type: mimeType }), "audio.input");
  form.append("model", "openai/whisper-large-v3-turbo");
  const transcriptionRes = await fetch(OPENROUTER_TRANSCRIPTION_URL, { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: form });
  if (!transcriptionRes.ok) return fail("transcription_failed", await transcriptionRes.text());
  const transcriptionData = (await transcriptionRes.json()) as { text?: string };
  const transcript = transcriptionData.text?? "";
  if (!transcript.trim()) return fail("empty_transcription", "Não foi possível transcrever nada com sentido desse áudio. Verifique a qualidade e tente de novo.");
  const summaryRes = await fetch(OPENROUTER_CHAT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: "google/gemini-2.5-flash-lite", max_tokens: 400, messages: [{ role: "user", content: buildSummaryPrompt(transcript, answers) }] }),
  });
  if (!summaryRes.ok) return fail("summary_failed", await summaryRes.text());
  const summaryData = (await summaryRes.json()) as { choices?: Array<{ message?: { content?: string } }>; usage?: { prompt_tokens?: number; completion_tokens?: number } };
  const resumo = summaryData.choices?.[0]?.message?.content?? "";
  const whisperCost = durationSeconds * WHISPER_COST_PER_SECOND;
  const summaryCost = (summaryData.usage?.prompt_tokens?? 0) * GEMINI_INPUT_PER_TOKEN + (summaryData.usage?.completion_tokens?? 0) * GEMINI_OUTPUT_PER_TOKEN;
  return { ok: true as const, transcricao: transcript, resumo, custo_estimado: Number((whisperCost + summaryCost).toFixed(6)) };
}