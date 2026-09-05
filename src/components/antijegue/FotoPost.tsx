import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, ImageIcon, Loader2, Sparkles } from "lucide-react";
import { DropZone } from "./DropZone";
import { FeedbackBar } from "./FeedbackBar";
import { Segmented } from "./Segmented";
import { Steps } from "./Steps";
import { ResultCard } from "./ResultCard";
import { checkImageQuality } from "@/lib/quality";
import { getDeviceId } from "@/lib/device";
import { postImagem } from "@/lib/antijegue.functions";
import { supabase } from "@/integrations/supabase/client";
import { useTracking } from "@/hooks/use-tracking";
import { toast } from "sonner";

type Plataforma = "instagram" | "linkedin" | "whatsapp";
type Tom = "vendas" | "informativo" | "engracado";
type ManterTexto = "manter" | "reescrever";

async function compressAndToBase64(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const max = 1024;
  let { width, height } = bitmap;
  if (width > max || height > max) {
    const ratio = Math.min(max / width, max / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.72);
}

async function ensureUserViaApi(device_id: string) {
  const res = await fetch('/api/ensure-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_id })
  });
  if (!res.ok) throw new Error('Falha ensure-user');
  return res.json();
}

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
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [creditos, setCreditos] = useState<number | null>(null);
  const [creditsLocal, setCreditsLocal] = useState<number>(99);
  const { track } = useTracking();

  useEffect(() => {
    const load = async () => {
      const dId = getDeviceId();
      if(!dId) return;
      try { const u = await ensureUserViaApi(dId); if(u?.credits!==undefined) setCreditsLocal(u.credits); } catch {}
    };
    load();
    window.addEventListener("credits-updated", load);
    return () => window.removeEventListener("credits-updated", load);
  }, []);

  const reset = () => {
    setStage(1); setFile(null); setBlocked(null);
    setPlataforma(null); setTom(null); setManterTexto(null);
    setErro(null); setPost(null); setCusto(null); setExecutionId(null); setCreditos(null);
  };

  const handleFile = async (picked: File) => {
    setBlocked(null);
    const result = await checkImageQuality(picked);
    if (result.status === "block") { setBlocked(result.message); setFile(null); return; }
    setFile(picked); setStage(2);
  };

  const submit = async () => {
    if (!file ||!plataforma ||!tom ||!manterTexto) return;
    if (creditsLocal <= 0) { track('click_gerar_bloqueado' as any, { tipo: 'geracao_post' }); window.dispatchEvent(new Event("abrir-paywall")); return; }
    try {
      const { count } = await supabase.from("executions").select("*", { count: "exact", head: true }).eq("device_id", getDeviceId()).gte("created_at", `${new Date().toISOString().slice(0,10)}T00:00:00`);
      if ((count || 0) >= 10) { toast.error("Limite de 10 hoje atingido."); return; }
    } catch {}

    setLoading(true); setErro(null); setStage(3);
    try {
      const b64 = await compressAndToBase64(file);
      const res: any = await run({ data: { imageBase64: b64, fileBase64: b64, mimeType: "image/jpeg", fileName: file.name, deviceId: getDeviceId(), answers: { plataforma, tom, manterTexto } } });
      if (!res.ok) {
        if (res.message?.includes("SEM_CREDITO") || res.message?.includes("LIMITE")) { window.dispatchEvent(new Event("abrir-paywall")); setStage(2); return; }
        throw new Error(res.message);
      }
      setPost(res.post || res.post_gerado);
      setCusto(res.custo_estimado?? null);
      setExecutionId(res.executionId?? null);
      const rest = res.creditosRestantes ?? res.credits ?? creditsLocal - 1;
      setCreditos(rest); setCreditsLocal(rest);
      window.dispatchEvent(new Event("credits-updated"));
    } catch (e:any) {
      if(e.message?.includes("SEM_CREDITO")) { window.dispatchEvent(new Event("abrir-paywall")); setStage(2); }
      else setErro(e.message || "Erro");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <Steps current={stage} />
      {stage === 1 && <DropZone accept="image/*" icon={<ImageIcon className="h-6 w-6" />} title="Arraste uma foto" hint="JPG ou PNG" onFile={handleFile} />}
      {stage === 2 && <div className="space-y-6 rounded-2xl border bg-surface p-5"><Segmented<Plataforma> label="Plataforma?" value={plataforma} onChange={setPlataforma} options={[{ value: "instagram", label: "Instagram" }, { value: "linkedin", label: "LinkedIn" }, { value: "whatsapp", label: "WhatsApp" }]} /><Segmented<Tom> label="Tom?" value={tom} onChange={setTom} options={[{ value: "vendas", label: "Vendas" }, { value: "informativo", label: "Informativo" }, { value: "engracado", label: "Engraçado" }]} /><Segmented<ManterTexto> label="Texto?" value={manterTexto} onChange={setManterTexto} options={[{ value: "manter", label: "Manter" }, { value: "reescrever", label: "Reescrever" }]} /><button onClick={submit} className="w-full rounded-xl bg-gradient-neon px-4 py-3.5 font-semibold"><Sparkles className="h-4 w-4 inline mr-2" />Gerar post</button></div>}
      {stage === 3 && <div className="space-y-4">{loading && <div className="flex gap-2 p-6 border rounded-2xl"><Loader2 className="animate-spin h-4 w-4" />Gerando...</div>}{post && <ResultCard title="Post gerado" content={post} />}{executionId && <FeedbackBar executionId={executionId} />}{erro && <div className="text-destructive text-sm">{erro}</div>}</div>}
    </div>
  );
}