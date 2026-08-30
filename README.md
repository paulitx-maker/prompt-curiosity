# Prompt Mestre

Build a mobile-first web app called "Anti-Jegue" — The first lesson of an AI Prompt School. The core method is: never let the user write a free-form prompt. Force a 3-question pre-flight that teaches them what a good prompt needs, then execute with the cheapest capable model and show the token cost. . All UI copy must be in Brazilian Portuguese (pt-BR). Dark mode only, with a neon blue accent (electric blue, e.g. #00E5FF to #3B82F6 gradient) on a near-black background (#0A0A0F). Clean, modern, generous spacing, rounded cards, subtle glow on primary buttons and active states.



STACK
- React + Vite + TypeScript + Tailwind, using the native Lovable/Supabase integration.
- Supabase Edge Functions (Deno) for the backend calls — do not call OpenRouter directly from the client.
- Do not hardcode any API key anywhere in the frontend or edge function code. Edge functions must read the key via `Deno.env.get("OPENROUTER_API_KEY")`.

LAYOUT
Two tabs at the top of the screen: "Foto → Post" and "Áudio → Resumo". Each tab is a self-contained flow with three stages shown as a simple step indicator: 1) Upload, 2) Perguntas, 3) Resultado.

═══════════════════════════════
TAB 1 — Foto → Post
═══════════════════════════════

Stage 1 (Upload):
- Drag-and-drop zone (also tappable to open file picker on mobile) accepting image files.
- On file selection, run a client-side function `checkImageQuality(file)`:
  - Read the image to get width/height (e.g. via `createImageBitmap` or an `Image` element).
  - If `file.size < 40 * 1024` (40KB) → BLOCK. Show: "Essa imagem parece muito comprimida ou de baixa qualidade. Manda outra foto em resolução maior."
  - If `width < 500 || height < 500` → BLOCK. Show: "Resolução muito baixa ({width}x{height}px). Mínimo recomendado: 500x500px."
  - If `file.size > 8 * 1024 * 1024` (8MB) → BLOCK. Show: "Imagem acima de 8MB. Comprima ou escolha outra foto."
  - If none of the above triggers, PASS and advance to Stage 2.
  - Blocked state must show a red/warning inline message under the dropzone and a "Tentar outra imagem" button. Do not advance to Stage 2 when blocked.

Stage 2 (Perguntas — only shown after PASS):
Three required questions, each as a segmented control / radio group (not free text):
1. "Qual a plataforma?" → Instagram / LinkedIn / WhatsApp
2. "Qual o tom?" → Vendas / Informativo / Engraçado
3. "O texto da imagem deve ser mantido ou reescrito?" → Manter / Reescrever
The "Gerar post" button stays disabled until all 3 are answered.

Stage 3 (Execução):
- On submit, show a loading state ("Gerando seu post...") and call:
  `supabase.functions.invoke('post-imagem', { body: { imageBase64, mimeType, answers: { plataforma, tom, manterTexto } } })`
  where `imageBase64` is the file encoded as base64 (no data URL prefix needed, or strip it — the function accepts either).
- On success, display the returned `post` text in a card with a "Copiar" button.
- On error, show the `message` field from the error response in a friendly inline banner, with a "Tentar de novo" button that returns to Stage 1.

═══════════════════════════════
TAB 2 — Áudio → Resumo
═══════════════════════════════

Stage 1 (Upload):
- Upload zone for audio files (drag-and-drop + tap to pick, accept common audio mime types).
- On file selection, run a client-side function `checkAudioQuality(file)`:
  - Get duration via an `<audio>` element's `loadedmetadata` event.
  - If duration is missing or `< 2` seconds → BLOCK. Show: "Áudio vazio, corrompido ou tempo real não detectado."
  - If duration `> 60 * 60` seconds (1h) → BLOCK. Show: "Áudio acima de 1h não é suportado nessa versão. Envie um trecho menor."
  - If duration `> 20 * 60` seconds (20min) → show a non-blocking WARNING banner: "Áudio longo (+20min) — vai demorar mais e custar mais caro. Confirma?" with a "Continuar mesmo assim" button.
  - Estimate bitrate: `(file.size * 8) / duration / 1000` (kbps). If `< 32` → BLOCK. Show: "Qualidade de áudio muito baixa pra essa duração. Grave/exporte de novo com qualidade maior."
  - If `file.size > 25 * 1024 * 1024` (25MB) → BLOCK. Show: "Arquivo acima de 25MB. Comprima ou envie um trecho menor."
  - Do NOT attempt to detect number of speakers or background noise on the client — those are asked, not inferred.
  - If no blocking condition, PASS and advance to Stage 2.

Stage 2 (Perguntas — only shown after PASS):
Three required questions, each as a segmented control / radio group:
1. "Quantas pessoas falam?" → 1 pessoa / 2 pessoas / 3 ou mais
2. "Tem ruído de fundo?" → Limpo / Moderado / Muito ruído
3. "Resultado final?" → Transcrição literal / Resumo curto / Resumo detalhado
The "Gerar resumo" button stays disabled until all 3 are answered.

Stage 3 (Execução):
- On submit, show a loading state ("Transcrevendo e resumindo...") and call:
  `supabase.functions.invoke('audio-resumo', { body: { audioBase64, mimeType, durationSeconds, answers: { numeroPessoas, ruido, resultado } } })`
  where `numeroPessoas` is one of `"1" | "2" | "3_ou_mais"`, `ruido` is one of `"limpo" | "moderado" | "muito_ruido"`, `resultado` is one of `"transcricao_literal" | "resumo_curto" | "resumo_detalhado"`.
- On success, display two cards: "Transcrição" (collapsed/expandable, since it can be long) and "Resumo" (open by default), each with its own "Copiar" button. Also show the `custo_estimado` value in small muted text at the bottom (e.g. "Custo estimado: $0.000123").
- On error, show the `message` field in a friendly inline banner with a "Tentar de novo" button.

═══════════════════════════════
EDGE FUNCTIONS (SCAFFOLD ONLY)
═══════════════════════════════
Create two Supabase Edge Functions with minimal placeholder bodies — I already have the real implementation written locally and will paste it in myself. Just scaffold:

// supabase/functions/post-imagem/index.ts
//
// Caso A: Imagem -> Post, com pre-flight de qualidade + prompt dinâmico.
// Regra de ouro: NUNCA chama o OpenRouter sem as respostas do pre-flight,
// e revalida a qualidade da imagem no servidor (o client pode ser burlado).

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY")!;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const MIN_WIDTH = 500;
const MIN_HEIGHT = 500;
const MIN_FILE_SIZE_KB = 40; // abaixo disso, quase sempre é compressão excessiva (ex: print de WhatsApp)
const MAX_FILE_SIZE_MB = 8;

interface PreflightAnswers {
  plataforma: "instagram" | "linkedin" | "whatsapp";
  tom: "vendas" | "informativo" | "engracado";
  manterTexto: "manter" | "reescrever";
}

interface RequestBody {
  imageBase64: string; // data URL ou base64 puro
  mimeType: string;
  answers: PreflightAnswers;
}

/**
 * Lê as dimensões reais da imagem direto dos bytes (sem libs externas).
 * Suporta PNG e JPEG, que cobre ~99% dos uploads de app mobile/web.
 */
function getImageDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  // PNG: largura/altura ficam nos bytes 16-23 (big-endian, 4 bytes cada)
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
    const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
    return { width, height };
  }
  // JPEG: precisa varrer os markers até achar um SOF (Start Of Frame)
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2;
    while (i < bytes.length - 9) {
      if (bytes[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = bytes[i + 1];
      const isSOF = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isSOF) {
        const height = (bytes[i + 5] << 8) | bytes[i + 6];
        const width = (bytes[i + 7] << 8) | bytes[i + 8];
        return { width, height };
      }
      const segmentLength = (bytes[i + 2] << 8) | bytes[i + 3];
      i += 2 + segmentLength;
    }
  }
  return null; // formato não reconhecido -> deixa passar pra validação de tamanho decidir
}

/**
 * Monta o prompt final a partir das respostas do pre-flight.
 * Isso é o que substitui o "prompt de jegue" — o usuário nunca escreve
 * o prompt, ele só responde 3 perguntas guiadas.
 */
function buildPrompt(answers: PreflightAnswers): string {
  const plataformaMap: Record<PreflightAnswers["plataforma"], string> = {
    instagram: "Instagram (post de feed: linguagem visual, pode usar emojis e hashtags relevantes no final)",
    linkedin: "LinkedIn (tom profissional, sem hashtags em excesso, foco em contexto e valor)",
    whatsapp: "WhatsApp (mensagem curta e direta, sem hashtags, tom pessoal)",
  };
  const tomMap: Record<PreflightAnswers["tom"], string> = {
    vendas: "persuasivo, com chamada para ação clara no final",
    informativo: "direto e educativo, sem tom de venda",
    engracado: "leve e bem-humorado, sem forçar a piada",
  };
  const textoInstrucao =
    answers.manterTexto === "manter"
      ? "Se houver texto visível na imagem, preserve o conteúdo original e só ajuste o formato para caber no post."
      : "Se houver texto visível na imagem, use-o apenas como referência de contexto e reescreva livremente para o post.";

  return [
    Você é um redator de conteúdo para redes sociais.,
    Analise a imagem e escreva um post para ${plataformaMap[answers.plataforma]}.,
    Tom: ${tomMap[answers.tom]}.,
    textoInstrucao,
    Regras: máximo 400 caracteres. Não invente informações que não estão visíveis na imagem. Não use placeholders como "[nome da empresa]" — se faltar informação, seja genérico mas natural, nunca deixe colchetes no texto.,
  ].join("\n");
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400 });
  }

  const { imageBase64, mimeType, answers } = body;

  // --- 1. Validação de payload: sem as 3 respostas do pre-flight, nem tenta ---
  if (!imageBase64 || !answers?.plataforma || !answers?.tom || !answers?.manterTexto) {
    return new Response(
      JSON.stringify({
        error: "missing_preflight",
        message: "Faltam respostas do pre-flight (plataforma, tom ou instrução de texto) ou a imagem.",
      }),
      { status: 400 },
    );
  }

  const raw = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
  const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
  const sizeKB = bytes.length / 1024;

  // --- 2. Revalidação de qualidade no servidor (o client pode mentir/ser burlado) ---
  if (sizeKB > MAX_FILE_SIZE_MB * 1024) {
    return new Response(
      JSON.stringify({ error: "file_too_large", message: Imagem acima de ${MAX_FILE_SIZE_MB}MB. }),
      { status: 422 },
    );
  }

  if (sizeKB < MIN_FILE_SIZE_KB) {
    return new Response(
      JSON.stringify({
        error: "low_quality",
        message: "Essa imagem parece muito comprimida ou de baixa qualidade. Manda outra foto em resolução maior.",
      }),
      { status: 422 },
    );
  }

  const dimensions = getImageDimensions(bytes);
  if (dimensions && (dimensions.width < MIN_WIDTH || dimensions.height < MIN_HEIGHT)) {
    return new Response(
      JSON.stringify({
        error: "low_resolution",
        message: Resolução muito baixa (${dimensions.width}x${dimensions.height}px). Mínimo recomendado: ${MIN_WIDTH}x${MIN_HEIGHT}px.,
      }),
      { status: 422 },
    );
  }

  // --- 3. Monta o prompt final com base nas respostas do pre-flight ---
  const systemPrompt = buildPrompt(answers);

  // --- 4. Chama o OpenRouter só depois de tudo validado ---
  const openRouterRes = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: Bearer ${OPENROUTER_API_KEY},
    },
    body: JSON.stringify({
      model: "google/gemini-3.1-flash-lite",
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: systemPrompt },
            { type: "image_url", image_url: { url: data:${mimeType};base64,${raw} } },
          ],
        },
      ],
    }),
  });

  if (!openRouterRes.ok) {
    const errText = await openRouterRes.text();
    return new Response(JSON.stringify({ error: "openrouter_failed", message: errText }), { status: 502 });
  }

  const data = await openRouterRes.json();
  const post = data.choices?.[0]?.message?.content ?? "";

  return new Response(JSON.stringify({ post }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});


// supabase/functions/audio-resumo/index.ts
//
// Caso B: Áudio -> Resumo/Legenda, em duas etapas:
//   1) openai/whisper-large-v3-turbo (transcrição)
//   2) google/gemini-3.1-flash-lite (resumo, usando as respostas do pre-flight)
//
// Regra de ouro: sem as 3 respostas do pre-flight, não roda. Sem duração/tamanho
// válidos, não roda. O client já bloqueou o óbvio (checkAudioQuality), mas o
// servidor revalida — nunca confia só no client.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY")!;
const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_TRANSCRIPTION_URL = "https://openrouter.ai/api/v1/audio/transcriptions";

const MAX_FILE_SIZE_MB = 25;
const MAX_DURATION_SECONDS = 60 * 60; // 1h
const MIN_DURATION_SECONDS = 2;

// Preços de referência (OpenRouter, ago/2026) — usados só pra estimar custo na resposta.
const WHISPER_COST_PER_SECOND = 0.000003;
const GEMINI_FLASH_LITE_INPUT_PER_TOKEN = 0.25 / 1_000_000;
const GEMINI_FLASH_LITE_OUTPUT_PER_TOKEN = 1.5 / 1_000_000;

type NumeroPessoas = "1" | "2" | "3_ou_mais";
type Ruido = "limpo" | "moderado" | "muito_ruido";
type Resultado = "transcricao_literal" | "resumo_curto" | "resumo_detalhado";

interface PreflightAnswers {
  numeroPessoas: NumeroPessoas;
  ruido: Ruido;
  resultado: Resultado;
}

interface RequestBody {
  audioBase64: string; // data URL ou base64 puro
  mimeType: string; // ex: "audio/mpeg", "audio/wav", "audio/webm"
  durationSeconds: number; // vem do client (checkAudioQuality já mediu)
  answers: PreflightAnswers;
}

function buildSummaryPrompt(transcript: string, answers: PreflightAnswers): string {
  const pessoasMap: Record<NumeroPessoas, string> = {
    "1": "uma única pessoa falando.",
    "2": "duas pessoas conversando — trate como um diálogo, mesmo sem marcação de quem fala o quê.",
    "3_ou_mais": "três ou mais pessoas falando — pode haver sobreposição de falas ou trechos confusos.",
  };
  const ruidoMap: Record<Ruido, string> = {
    limpo: "O áudio é limpo, a transcrição tende a ser confiável.",
    moderado: "Há ruído de fundo moderado — pode haver pequenos erros ou lacunas na transcrição, sinalize isso se notar trechos incoerentes.",
    muito_ruido: "Há muito ruído de fundo — a transcrição pode ter erros significativos. Se algum trecho não fizer sentido, não invente o que a pessoa quis dizer, apenas resuma o que está claro.",
  };
  const resultadoMap: Record<Resultado, string> = {
    transcricao_literal: "Apenas limpe a transcrição (remova hesitações tipo 'é... né...' e corrija pontuação), sem resumir nada.",
    resumo_curto: "Escreva um resumo curto, 3-5 frases, só os pontos principais.",
    resumo_detalhado: "Escreva um resumo detalhado organizado por tópicos, cobrindo todos os assuntos relevantes discutidos.",
  };

  return [
    `Você vai processar a transcrição de um áudio com ${pessoasMap[answers.numeroPessoas]}`,
    ruidoMap[answers.ruido],
    `Tarefa: ${resultadoMap[answers.resultado]}`,
    `Não invente informação que não está na transcrição. Não use placeholders.`,
    ``,
    `Transcrição:`,
    `"""${transcript}"""`,
  ].join("\n");
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400 });
  }

  const { audioBase64, mimeType, durationSeconds, answers } = body;

  // --- 1. Validação do pre-flight: sem as 3 respostas, nem tenta ---
  if (!audioBase64 || !answers?.numeroPessoas || !answers?.ruido || !answers?.resultado) {
    return new Response(
      JSON.stringify({
        error: "missing_preflight",
        message: "Faltam respostas do pre-flight (número de pessoas, ruído ou resultado desejado) ou o áudio.",
      }),
      { status: 400 },
    );
  }

  const raw = audioBase64.includes(",") ? audioBase64.split(",")[1] : audioBase64;
  const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
  const sizeMB = bytes.length / (1024 * 1024);

  // --- 2. Revalidação de tamanho/duração no servidor ---
  if (sizeMB > MAX_FILE_SIZE_MB) {
    return new Response(
      JSON.stringify({ error: "file_too_large", message: `Arquivo acima de ${MAX_FILE_SIZE_MB}MB.` }),
      { status: 422 },
    );
  }

  if (!durationSeconds || durationSeconds < MIN_DURATION_SECONDS) {
    return new Response(
      JSON.stringify({ error: "invalid_duration", message: "Áudio vazio, corrompido ou duração inválida." }),
      { status: 422 },
    );
  }

  if (durationSeconds > MAX_DURATION_SECONDS) {
    return new Response(
      JSON.stringify({ error: "duration_too_long", message: "Áudio acima de 1h não é suportado nessa versão." }),
      { status: 422 },
    );
  }

  // --- 3. Etapa 1: transcrição via Whisper Large V3 Turbo ---
  const audioBlob = new Blob([bytes], { type: mimeType });
  const transcriptionForm = new FormData();
  transcriptionForm.append("file", audioBlob, "audio.input");
  transcriptionForm.append("model", "openai/whisper-large-v3-turbo");

  const transcriptionRes = await fetch(OPENROUTER_TRANSCRIPTION_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    },
    body: transcriptionForm,
  });

  if (!transcriptionRes.ok) {
    const errText = await transcriptionRes.text();
    return new Response(
      JSON.stringify({ error: "transcription_failed", message: errText }),
      { status: 502 },
    );
  }

  const transcriptionData = await transcriptionRes.json();
  const transcript: string = transcriptionData.text ?? "";

  if (!transcript.trim()) {
    return new Response(
      JSON.stringify({
        error: "empty_transcription",
        message: "Não foi possível transcrever nada com sentido desse áudio. Verifique a qualidade e tente de novo.",
      }),
      { status: 422 },
    );
  }

  // --- 4. Etapa 2: resumo/legenda via Gemini 3.1 Flash Lite, usando as respostas do pre-flight ---
  const summaryPrompt = buildSummaryPrompt(transcript, answers);

  const summaryRes = await fetch(OPENROUTER_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: "google/gemini-3.1-flash-lite",
      max_tokens: 400,
      messages: [{ role: "user", content: summaryPrompt }],
    }),
  });

  if (!summaryRes.ok) {
    const errText = await summaryRes.text();
    return new Response(
      JSON.stringify({ error: "summary_failed", message: errText }),
      { status: 502 },
    );
  }

  const summaryData = await summaryRes.json();
  const resumo: string = summaryData.choices?.[0]?.message?.content ?? "";

  // --- 5. Custo estimado (transcrição por segundo + tokens do resumo) ---
  const whisperCost = durationSeconds * WHISPER_COST_PER_SECOND;
  const promptTokens = summaryData.usage?.prompt_tokens ?? 0;
  const completionTokens = summaryData.usage?.completion_tokens ?? 0;
  const summaryCost =
    promptTokens * GEMINI_FLASH_LITE_INPUT_PER_TOKEN + completionTokens * GEMINI_FLASH_LITE_OUTPUT_PER_TOKEN;
  const custoEstimado = Number((whisperCost + summaryCost).toFixed(6));

  return new Response(
    JSON.stringify({
      transcricao: transcript,
      resumo,
      custo_estimado: custoEstimado,
    }),
    {
      headers: { "Content-Type": "application/json" },
      status: 200,
    },
  );
});

═══════════════════════════════
ENV
═══════════════════════════════
Create a `.env.example` file at the project root with:
```
OPENROUTER_API_KEY=your_openrouter_api_key_here
```
Do not commit or reference an actual key anywhere. The real `OPENROUTER_API_KEY` is already set as a Supabase Edge Function secret and must be read only inside the edge functions via `Deno.env.get("OPENROUTER_API_KEY")`.

═══════════════════════════════
GITHUB
═══════════════════════════════
This project should be connected to GitHub for version control. (Note: enable this via the Lovable project settings — GitHub sync is a UI action, not something this prompt can trigger automatically.)

═══════════════════════════════
FUTURE LESSONS  
═══════════════════════════════
FUTURE LESSONS (just leave UI placeholders, disabled):
Lesson 3: Texto -> Imagem (show cost comparison SDXL vs Flux)
Lesson 4: Ideia -> Vídeo curto
All lessons follow the same pattern: Upload -> 3 perguntas didáticas -> Execução com modelo barato + custo.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://prompt-curiosity.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/82546c09-26c0-4014-805c-18bee6fe3f55).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
