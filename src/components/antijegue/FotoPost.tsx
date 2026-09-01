import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, ImageIcon, Loader2, Sparkles } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
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

function getSupabase() {
  if (typeof window === "undefined") return null;
  const env: any = (import.meta as any).env || {};
  const url = env.VITE_SUPABASE_URL || env.VITE_PACK_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || env.VITE_PACK_SUPABASE_ANON_KEY;
  if (!url ||!key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export function FotoPost() {
  const run = useServerFn(postImagem);
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [heicFeedback, setHeicFeedback] = useState("");
  const [heicEnviado, setHeicEnviado] = useState(false);
  const [plataforma, setPlataforma] = useState<Plataforma | null>(null);
  const [tom, setTom] = useState<Tom | null>(null);
  const [manterTexto, setManterTexto] = useState<ManterTexto | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [post, setPost] = useState<string | null>(null);
  const [custo, setCusto] = useState<number | null>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [creditos, setCreditos] = useState<number | null>(null);

  const reset = () => {
    setStage(1);
    setFile(null);
    setBlocked(null);
    setHeicFeedback("");
    setHeicEnviado(false);
    setPlataforma(null);
    setTom(null);
    setManterTexto(null);
    setErro(null);
    setPost(null);
    setCusto(null);
    setExecutionId(null);
    setCreditos(null);
  };

  const handleFile = async (picked: File) => {
    setBlocked(null);
    setHeicFeedback("");
    setHeicEnviado(false);

    const isHeic = picked.type === 'image/heic' || picked.type === 'image/heif' || picked.name.toLowerCase().endsWith('.heic') || picked.name.toLowerCase().endsWith('.heif');
    if (isHeic) {
      const msg = "Seu iPhone mandou em HEIC e nosso modelo ainda não lê. Exporta como JPEG e tenta de novo? Isso nos ajuda a saber quanta gente usa iPhone aqui.";
      setBlocked(msg);
      setFile(null);
      try {
        const db = getSupabase();
        const deviceId = getDeviceId();
        if (db) {
          await db.from("executions").insert({
            tipo: "blocked_heic",
            device_id: deviceId,
            modelo_usado: "heic_block",
            custo_estimado: 0,
            status: "blocked",
            metadata: { fileName: picked.name, fileType: picked.type }
          } as any);
          console.log("[leave] blocked_heic", deviceId);
        }
      } catch {}
      return;
    }

    const result = await checkImageQuality(picked);
    if (result.status === "block") {
      setBlocked(result.message);
      setFile(null);
      return;
    }
    setFile(picked);
    setStage(2);
  };

  const enviarHeicFeedback = async () => {
    if (!heicFeedback.trim()) return;
    try {
      const db = getSupabase();
      const deviceId = getDeviceId();
      if (db) {
        await db.from("executions").insert({
          tipo: "blocked_heic_feedback",
          device_id: deviceId,
          modelo_usado: "heic_feedback",
          custo_estimado: 0,
          status: "feedback",
          metadata: { feedback: heicFeedback.trim() }
        } as any);
      }
      setHeicEnviado(true);
    } catch {}
  };

  const submit = async () => {
    if (!file ||!plataforma ||!tom ||!manterTexto) return;
    setLoading(true);
    setErro(null);
    setStage(3);
    try {
      const imageBase64 = await fileToBase64(file);
      const res = await run({
        data: {
          imageBase64,
          mimeType: file.type,
          deviceId: getDeviceId(),
          answers: { plataforma, tom, manterTexto },
        },
      });
      if (!res.ok) {
        setErro(res.message);
      } else {
        setPost(res.post);
        setCusto(res.custo_estimado);
        setExecutionId(res.executionId?? null);
        setCreditos(res.creditosRestantes?? null);
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
              {!heicEnviado? (
                <div className="space-y-2">
                  <textarea
                    value={heicFeedback}
                    onChange={e => setHeicFeedback(e.target.value)}
                    placeholder="Consegue me dizer o que aconteceu? Ex: tirei foto direto da câmera, não consegui converter..."
                    className="w-full min-h-[70px] rounded-xl border bg-background p-3 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={enviarHeicFeedback}
                      disabled={!heicFeedback.trim()}
                      className="rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
                    >
                      Enviar feedback
                    </button>
                    <button
                      type="button"
                      onClick={() => setBlocked(null)}
                      className="rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-medium text-destructive"
                    >
                      Tentar outra imagem
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-green-400">Obrigado! Isso nos ajuda muito. Tenta agora com JPEG.</p>
              )}
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
            disabled={!plataforma ||!tom ||!manterTexto}
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
              {executionId && <FeedbackBar executionId={executionId} />}
              {custo!== null && (
                <p className="text-xs text-muted-foreground">
                  Custo estimado: ${custo.toFixed(6)} — modelo Gemini 3.1 Flash Lite
                </p>
              )}
              <p className="text-[11px] text-muted-foreground/70">
                Custo: 1 crédito
                {creditos!== null? ` · ${creditos} restante${creditos === 1? "" : "s"}` : ""}
              </p>
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