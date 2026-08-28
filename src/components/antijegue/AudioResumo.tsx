import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, AudioLines, Loader2, Sparkles } from "lucide-react";
import { DropZone } from "./DropZone";
import { Segmented } from "./Segmented";
import { Steps } from "./Steps";
import { ResultCard } from "./ResultCard";
import { checkAudioQuality, fileToBase64 } from "@/lib/quality";
import { audioResumo } from "@/lib/antijegue.functions";

type NumeroPessoas = "1" | "2" | "3_ou_mais";
type Ruido = "limpo" | "moderado" | "muito_ruido";
type Resultado = "transcricao_literal" | "resumo_curto" | "resumo_detalhado";

export function AudioResumo() {
  const run = useServerFn(audioResumo);
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [numeroPessoas, setNumeroPessoas] = useState<NumeroPessoas | null>(null);
  const [ruido, setRuido] = useState<Ruido | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [transcricao, setTranscricao] = useState<string | null>(null);
  const [resumo, setResumo] = useState<string | null>(null);
  const [custo, setCusto] = useState<number | null>(null);

  const reset = () => {
    setStage(1);
    setFile(null);
    setDuration(0);
    setBlocked(null);
    setWarning(null);
    setNumeroPessoas(null);
    setRuido(null);
    setResultado(null);
    setErro(null);
    setTranscricao(null);
    setResumo(null);
    setCusto(null);
  };

  const handleFile = async (picked: File) => {
    setBlocked(null);
    setWarning(null);
    const result = await checkAudioQuality(picked);
    if (result.status === "block") {
      setBlocked(result.message);
      setFile(null);
      return;
    }
    setFile(picked);
    setDuration(result.durationSeconds ?? 0);
    if (result.status === "warn") {
      setWarning(result.message);
      return;
    }
    setStage(2);
  };

  const submit = async () => {
    if (!file || !numeroPessoas || !ruido || !resultado) return;
    setLoading(true);
    setErro(null);
    setStage(3);
    try {
      const audioBase64 = await fileToBase64(file);
      const res = await run({
        data: {
          audioBase64,
          mimeType: file.type,
          durationSeconds: duration,
          answers: { numeroPessoas, ruido, resultado },
        },
      });
      if (!res.ok) {
        setErro(res.message);
      } else {
        setTranscricao(res.transcricao);
        setResumo(res.resumo);
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
            accept="audio/*"
            icon={<AudioLines className="h-6 w-6" />}
            title="Arraste um áudio ou toque para escolher"
            hint="MP3, WAV, M4A ou OGG — até 25MB e 1h"
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
                Tentar outro áudio
              </button>
            </div>
          )}
          {warning && (
            <div className="space-y-3 rounded-2xl border border-warning/40 bg-warning/10 p-4">
              <p className="flex gap-2 text-sm text-warning">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {warning}
              </p>
              <button
                type="button"
                onClick={() => {
                  setWarning(null);
                  setStage(2);
                }}
                className="rounded-lg border border-warning/40 px-3 py-1.5 text-xs font-medium text-warning"
              >
                Continuar mesmo assim
              </button>
            </div>
          )}
        </div>
      )}

      {stage === 2 && (
        <div className="space-y-6 rounded-2xl border border-border bg-surface p-5">
          <p className="text-xs text-muted-foreground">
            O app não adivinha o contexto do áudio — você informa. Contexto certo, custo menor.
          </p>
          <Segmented<NumeroPessoas>
            label="Quantas pessoas falam?"
            value={numeroPessoas}
            onChange={setNumeroPessoas}
            options={[
              { value: "1", label: "1 pessoa" },
              { value: "2", label: "2 pessoas" },
              { value: "3_ou_mais", label: "3 ou mais" },
            ]}
          />
          <Segmented<Ruido>
            label="Tem ruído de fundo?"
            value={ruido}
            onChange={setRuido}
            options={[
              { value: "limpo", label: "Limpo" },
              { value: "moderado", label: "Moderado" },
              { value: "muito_ruido", label: "Muito ruído" },
            ]}
          />
          <Segmented<Resultado>
            label="Resultado final?"
            value={resultado}
            onChange={setResultado}
            options={[
              { value: "transcricao_literal", label: "Transcrição literal" },
              { value: "resumo_curto", label: "Resumo curto" },
              { value: "resumo_detalhado", label: "Resumo detalhado" },
            ]}
          />
          <button
            type="button"
            disabled={!numeroPessoas || !ruido || !resultado}
            onClick={submit}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-neon px-4 py-3.5 text-sm font-semibold text-primary-foreground glow-neon transition-opacity disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            <Sparkles className="h-4 w-4" />
            Gerar resumo
          </button>
        </div>
      )}

      {stage === 3 && (
        <div className="space-y-4">
          {loading && (
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Transcrevendo e resumindo...
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
          {resumo && (
            <>
              <ResultCard title="Transcrição" content={transcricao ?? ""} collapsible defaultOpen={false} />
              <ResultCard title="Resumo" content={resumo} />
              {custo !== null && (
                <p className="text-xs text-muted-foreground">
                  Custo estimado: ${custo.toFixed(6)} — Whisper Turbo + Gemini 3.1 Flash Lite
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
