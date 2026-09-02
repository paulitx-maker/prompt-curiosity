import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, AudioLines, Loader2, Sparkles } from "lucide-react";
import { DropZone } from "./DropZone";
import { FeedbackBar } from "./FeedbackBar";
import { Segmented } from "./Segmented";
import { Steps } from "./Steps";
import { ResultCard } from "./ResultCard";
import { checkAudioQuality, fileToBase64 } from "@/lib/quality";
import { getDeviceId } from "@/lib/device";
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
  const [executionId, setExecutionId] = useState<string | null>(null);

  const reset = () => {
    setStage(1); setFile(null); setDuration(0); setBlocked(null); setWarning(null);
    setNumeroPessoas(null); setRuido(null); setResultado(null);
    setErro(null); setTranscricao(null); setResumo(null); setCusto(null); setExecutionId(null);
  };

  const handleFile = async (picked: File) => {
    setBlocked(null); setWarning(null);
    const result = await checkAudioQuality(picked);
    if (result.status === "block") { setBlocked(result.message); setFile(null); return; }
    setFile(picked); setDuration(result.durationSeconds ?? 0);
    if (result.status === "warn") { setWarning(result.message); return; }
    setStage(2);
  };

  const submit = async () => {
    if (!file || !numeroPessoas || !ruido || !resultado) return;
    setLoading(true); setErro(null); setStage(3);
    try {
      const audioBase64 = await fileToBase64(file);
      const res = await run({
        data: {
          audioBase64,
          mimeType: file.type,
          fileName: file.name,
          deviceId: getDeviceId(),
          durationSeconds: duration,
          answers: { numeroPessoas, ruido, resultado },
        },
      });
      if (!res.ok) setErro(res.message);
      else {
        setTranscricao(res.transcricao);
        setResumo(res.resumo);
        setCusto(res.custo_estimado);
        setExecutionId((res as any).executionId ?? null);
      }
    } catch { setErro("Algo quebrou no caminho."); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <Steps current={stage} />
      {stage === 1 && (
        <div className="space-y-4">
          <DropZone accept="audio/*" icon={<AudioLines className="h-6 w-6" />} title="Arraste um áudio" hint="MP3, WAV, M4A ou OGG — até 25MB e 1h" onFile={handleFile} />
          {blocked && <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{blocked}</div>}
          {warning && <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning">{warning}<button type="button" onClick={() => { setWarning(null); setStage(2); }} className="ml-2 underline">Continuar</button></div>}
        </div>
      )}
      {stage === 2 && (
        <div className="space-y-6 rounded-2xl border bg-surface p-5">
          <Segmented<NumeroPessoas> label="Quantas pessoas falam?" value={numeroPessoas} onChange={setNumeroPessoas} options={[{ value: "1", label: "1" }, { value: "2", label: "2" }, { value: "3_ou_mais", label: "3+" }]} />
          <Segmented<Ruido> label="Tem ruído?" value={ruido} onChange={setRuido} options={[{ value: "limpo", label: "Limpo" }, { value: "moderado", label: "Moderado" }, { value: "muito_ruido", label: "Muito ruído" }]} />
          <Segmented<Resultado> label="Resultado final?" value={resultado} onChange={setResultado} options={[{ value: "transcricao_literal", label: "Transcrição literal" }, { value: "resumo_curto", label: "Resumo curto" }, { value: "resumo_detalhado", label: "Resumo detalhado" }]} />
          <button type="button" disabled={!numeroPessoas || !ruido || !resultado} onClick={submit} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-neon px-4 py-3.5 text-sm font-semibold text-primary-foreground"><Sparkles className="h-4 w-4" />Gerar resumo</button>
        </div>
      )}
      {stage === 3 && (
        <div className="space-y-4">
          {loading && <div className="flex items-center gap-3 rounded-2xl border bg-surface p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin text-primary" />Transcrevendo...</div>}
          {erro && <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{erro}</div>}
          {resumo && (
            <>
              <ResultCard title="Transcrição" content={transcricao ?? ""} collapsible defaultOpen={false} />
              <ResultCard title="Resumo" content={resumo} />
              {executionId && <FeedbackBar executionId={executionId} />}
              {custo !== null && <p className="text-xs text-muted-foreground">Custo: ${custo.toFixed(6)} — Whisper + Gemini</p>}
              <button type="button" onClick={reset} className="w-full rounded-xl border bg-secondary px-4 py-3 text-sm">Começar de novo</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}