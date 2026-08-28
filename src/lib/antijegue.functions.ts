import { createServerFn } from "@tanstack/react-start";

// Caso A: Imagem -> Post, com pre-flight de qualidade + prompt dinâmico.
// Regra de ouro: NUNCA chama o OpenRouter sem as respostas do pre-flight,
// e revalida a qualidade da imagem no servidor (o client pode ser burlado).

export interface PostImagemInput {
  imageBase64: string;
  mimeType: string;
  answers: {
    plataforma: "instagram" | "linkedin" | "whatsapp";
    tom: "vendas" | "informativo" | "engracado";
    manterTexto: "manter" | "reescrever";
  };
}

export interface AudioResumoInput {
  audioBase64: string;
  mimeType: string;
  durationSeconds: number;
  answers: {
    numeroPessoas: "1" | "2" | "3_ou_mais";
    ruido: "limpo" | "moderado" | "muito_ruido";
    resultado: "transcricao_literal" | "resumo_curto" | "resumo_detalhado";
  };
}

export const postImagem = createServerFn({ method: "POST" })
  .inputValidator((input: PostImagemInput) => input)
  .handler(async ({ data }) => {
    const { runPostImagem } = await import("./antijegue.server");
    return runPostImagem(data);
  });

export const audioResumo = createServerFn({ method: "POST" })
  .inputValidator((input: AudioResumoInput) => input)
  .handler(async ({ data }) => {
    const { runAudioResumo } = await import("./antijegue.server");
    return runAudioResumo(data);
  });
