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
import { useCredits } from "@/hooks/use-credits";
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
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.72);
}

async function ensureUserViaApi(device_id: string) {
  if(!device_id) return null;
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

  const { consume } = useCredits() as any;
  const { track } = useTracking();

  useEffect(() => {
    const load = async () => {
      try {
        const dId = getDeviceId();
        if (!dId) return;
        const user = await ensureUserViaApi(dId);
        if (user?.credits!== undefined) setCreditsLocal(user.credits);
      } catch {}
    };
    load();
    const h = () => load();
    window.addEventListener("credits-updated", h);
    return () => window.removeEventListener("credits-updated", h);
  }, []);

  const reset = () => {
    setStage(1); setFile(null); setBlocked(null);
    setPlataforma(null); setTom(null); setManterTexto(null); setErro(null);
    setPost(null); setCusto(null); setExecutionId(null); setCreditos(null);
  };

  const handleFile = async (picked: File) => {
    setBlocked(null);
    const sizeMb = picked.size / 1024 / 1024;
    const isHeic = picked.type === 'image/heic' || picked.type === 'image/heif' || picked.name.toLowerCase().endsWith('.heic') || picked.name.toLowerCase().endsWith('.heif');
    if (isHeic || sizeMb > 5) {
      try {
        const db = supabase;
        if (db) {
          await db.from("monitor_arquivos").insert({
            device_id: getDeviceId(),
            file_name: picked.name,
            file_type: picked.type || 'heic',
            file_size_mb: Number(sizeMb.toFixed(2)),
            motivo: isHeic? 'heic_detectado' : 'maior_que_5mb'
          });
        }
      } catch {}
    }
    if (isHeic) { setBlocked("Seu iPhone mandou em HEIC e nosso modelo ainda não lê. Exporta como JPEG e tenta de novo?"); setFile(null); return; }
    const result = await checkImageQuality(picked);
    if (result.status === "block") { setBlocked(result.message); setFile(null); return; }
    setFile(picked); setStage(2);
  };

  const gastarCreditoLocal = async (tipo: string = 'geracao_post') => {
    const dId = getDeviceId();
    const { count } = await supabase.from("executions").select("*", { count: "exact", head: true }).eq("device_id", dId).gte("created_at", `${new Date().toISOString().slice(0,10)}T00:00:00`);
    if ((count || 0) >= 10) { toast.error("Limite de 10 hoje atingido."); throw new Error("LIMITE"); }
    if (creditsLocal <= 0) { await track('click_gerar_bloqueado' as any, { tipo }); window.dispatchEvent(new Event("abrir-paywall")); throw new Error("SEM_CREDITO"); }
    await consume(tipo === 'geracao_post'? 'consumo_geracao' : 'consumo_variacao', 'foto-post', undefined);
    const user = await ensureUserViaApi(dId);
    if (user?.credits!== undefined) { setCreditsLocal(user.credits); setCreditos(user.credits); }
    window.dispatchEvent(new Event("credits-updated"));
  };

  const submit = async () => {
    if (!file ||!plataforma ||!tom ||!manterTexto) return;
    setLoading(true); setErro(null); setStage(3);
    try {
      const gastar = (window as any).orquestradorGastarCredito || gastarCreditoLocal;
      await gastar('geracao_post');
      const b64 = await compressAndToBase64(file);
      const res: any = await run({ data: { imageBase64: b64, fileBase64: b64, mimeType: "image/jpeg", fileName: file.name, deviceId: getDeviceId(), answers: { plataforma, tom, manterTexto } } });
      if (!res.ok) {
        const msg = res.message || "";
        if (msg.includes("SEM_CREDITO") || msg.includes("LIMITE") || msg.includes("credits")) { window.dispatchEvent(new Event("abrir-paywall")); setStage(2); return; }
        throw new Error(msg || "Erro no servidor");
      }
      setPost(res.post || res.post_gerado || null);
      setCusto(res.custo_estimado?? res.custo_usd?? res.custo?? null);
      setExecutionId(res.executionId?? res.id?? null);
      setCreditos(res.creditosRestantes?? res.credits?? creditsLocal - 1);
      window.dispatchEvent(new CustomEvent("post-gerado", { detail: res.post }));
    } catch (e: any) {
      const msg = e.message || "";
      if (msg.includes("SEM_CREDITO") || msg.includes("LIMITE")) { window.dispatchEvent(new Event("abrir-paywall")); setStage(2); }
      else { console.error(e); setErro(msg.includes("Too Large")? "Foto muito grande, mas já comprimi. Tenta de novo." : msg || "Algo quebrou. Tenta de novo."); }
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <Steps current={stage} />
      {stage === 1 && (<div className="space-y-4"><DropZone accept="image/*" icon={<ImageIcon className="h-6 w-6" />} title="Arraste uma foto ou toque para escolher" hint="JPG ou PNG, mínimo 500x500px e 40KB" onFile={handleFile} />{blocked && <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive flex gap-2"><AlertTriangle className="h-4 w-4" />{blocked}</div>}</div>)}
      {stage === 2 && (<div className="space-y-6 rounded-2xl border border-border bg-surface p-5"><Segmented<Plataforma> label="Qual a plataforma?" value={plataforma} onChange={setPlataforma} options={[{ value: "instagram", label: "Instagram" }, { value: "linkedin", label: "LinkedIn" }, { value: "whatsapp", label: "WhatsApp" }]} /><Segmented<Tom> label="Qual o tom?" value={tom} onChange={setTom} options={[{ value: "vendas", label: "Vendas" }, { value: "informativo", label: "Informativo" }, { value: "engracado", label: "Engraçado" }]} /><Segmented<ManterTexto> label="O texto da imagem deve ser mantido ou reescrito?" value={manterTexto} onChange={setManterTexto} options={[{ value: "manter", label: "Manter" }, { value: "reescrever", label: "Reescrever" }]} /><button type="button" disabled={!plataforma ||!tom ||!manterTexto || loading} onClick={submit} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-neon px-4 py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"><Sparkles className="h-4 w-4" />Gerar post</button></div>)}
      {stage === 3 && (<div className="space-y-4">{loading && <div className="flex items-center gap-3 rounded-2xl border bg-surface p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin text-primary" />Gerando seu post...</div>}{erro && <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{erro}<button type="button" onClick={reset} className="ml-2 underline">Tentar de novo</button></div>}{post && (<><ResultCard title="Post gerado" content={post} />{executionId && <FeedbackBar executionId={executionId} />}{custo!== null && <p className="text-xs text-muted-foreground">Custo estimado: ${custo.toFixed(6)} — Gemini 2.5 Flash Lite</p>}<p className="text-[11px] text-muted-foreground/70">Custo: 1 crédito{creditos!== null? ` · ${creditos} restantes` : ` · ${creditsLocal} restantes`}</p><button type="button" onClick={reset} className="w-full rounded-xl border bg-secondary px-4 py-3 text-sm">Começar de novo</button></>)}</div>)}
    </div>
  );
}