import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, ImageIcon, Loader2, Sparkles } from "lucide-react";
import { DropZone } from "./DropZone";
import { FeedbackBar } from "./FeedbackBar";
import { Segmented } from "./Segmented";
import { Steps } from "./Steps";
import { ResultCard } from "./ResultCard";
import { checkImageQuality, fileToBase64 } from "@/lib/quality";
import { getDeviceId } from "@/lib/device";
import { postImagem } from "@/lib/antijegue.functions";

type Plataforma = "instagram" | "linkedin" | "whatsapp";
type Tom = "vendas" | "informativo" | "engracado";
type ManterTexto = "manter" | "reescrever";

export function FotoPost() {
  const run = useServerFn(postImagem);
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [plataforma, setPlataforma] = useState<Plataforma | null>(null);
  const [tom, setTom] = useState<Tom | null>(null);
  const [manterTexto, setManterTexto] = useState<ManterTexto | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [post, setPost] = useState<string | null>(null);
  const [custo, setCusto] = useState<number | null>(null);

  const reset = () => {
    setStage(1);
    setFile(null);
    setBlocked(null);
    setPlataforma(null);
    setTom(null);
    setManterTexto(null);
    setErro(null);
    setPost(null);
    setCusto(null);
  };

  const handleFile = async (picked: File) => {
    setBlocked(null);
    const result = await checkImageQuality(picked);
    if (result.status === "block") {
      setBlocked(result.message);
      setFile(null);
      return;
    }
    setFile(picked);
    setStage(2);
  };

  const submit = async () => {
    if (!file || !plataforma || !tom || !manterTexto) return;
    setLoading(true);
    setErro(null);
    setStage(3);
    try {
      const imageBase64 = await fileToBase64(file);
      const res = await run({
        data: { imageBase64, mimeType: file.type, answers: { plataforma, tom, manterTexto } },
      });
      if (!res.ok) {
        setErro(res.message);
      } else {
        setPost(res.post);
        setCusto(res.custo_estimado);
      }
    } catch {
      setErro("Algo quebrou no caminho. Tenta de novo em instantes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Steps current={stage} />

      {stage === 1 && (
        <div className="space-y-4">
          <DropZone
            accept="image/*"
            icon={<ImageIcon className="h-6 w-6" />}
            title="Arraste uma foto ou toque para escolher"
            hint="JPG ou PNG, mínimo 500x500px e 40KB"
            onFile={handleFile}
          />
          {blocked && (
            <div className="space-y-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4">
              <p className="flex gap-2 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {blocked}
              </p>
              <button
                type="button"
                onClick={() => setBlocked(null)}
                className="rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-medium text-destructive"
              >
                Tentar outra imagem
              </button>
            </div>
          )}
        </div>
      )}

      {stage === 2 && (
        <div className="space-y-6 rounded-2xl border border-border bg-surface p-5">
          <p className="text-xs text-muted-foreground">
            Você não escreve o prompt. Responde 3 perguntas — é isso que separa um resultado bom de
            um prompt de jegue.
          </p>
          <Segmented<Plataforma>
            label="Qual a plataforma?"
            value={plataforma}
            onChange={setPlataforma}
            options={[
              { value: "instagram", label: "Instagram" },
              { value: "linkedin", label: "LinkedIn" },
              { value: "whatsapp", label: "WhatsApp" },
            ]}
          />
          <Segmented<Tom>
            label="Qual o tom?"
            value={tom}
            onChange={setTom}
            options={[
              { value: "vendas", label: "Vendas" },
              { value: "informativo", label: "Informativo" },
              { value: "engracado", label: "Engraçado" },
            ]}
          />
          <Segmented<ManterTexto>
            label="O texto da imagem deve ser mantido ou reescrito?"
            value={manterTexto}
            onChange={setManterTexto}
            options={[
              { value: "manter", label: "Manter" },
              { value: "reescrever", label: "Reescrever" },
            ]}
          />
          <button
            type="button"
            disabled={!plataforma || !tom || !manterTexto}
            onClick={submit}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-neon px-4 py-3.5 text-sm font-semibold text-primary-foreground glow-neon transition-opacity disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            <Sparkles className="h-4 w-4" />
            Gerar post
          </button>
        </div>
      )}

      {stage === 3 && (
        <div className="space-y-4">
          {loading && (
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Gerando seu post...
            </div>
          )}
          {erro && (
            <div className="space-y-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{erro}</p>
              <button
                type="button"
                onClick={reset}
                className="rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-medium text-destructive"
              >
                Tentar de novo
              </button>
            </div>
          )}
          {post && (
            <>
              <ResultCard title="Post gerado" content={post} />
              {custo !== null && (
                <p className="text-xs text-muted-foreground">
                  Custo estimado: ${custo.toFixed(6)} — modelo Gemini 3.1 Flash Lite
                </p>
              )}
              <button
                type="button"
                onClick={reset}
                className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm font-medium text-foreground"
              >
                Começar de novo
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
