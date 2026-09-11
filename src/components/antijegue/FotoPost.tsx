import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, ImageIcon, Loader2, Sparkles, Copy, RefreshCw, Plus } from "lucide-react";
import { toast } from "sonner";
import { DropZone } from "./DropZone";
import { FeedbackBar } from "./FeedbackBar";
import { checkImageQuality } from "@/lib/quality";
import { postImagem } from "@/lib/antijegue.functions";
import { useTracking } from "@/hooks/use-tracking";

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

// Ícones SVG reais com cor de marca
const IconInstagram = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" stroke="url(#ig)" strokeWidth="1.6"/><circle cx="12" cy="12" r="4" stroke="url(#ig)" strokeWidth="1.6"/><circle cx="17.5" cy="6.5" r="1.2" fill="#E4405F"/><defs><linearGradient id="ig" x1="2" y1="2" x2="22" y2="22"><stop stopColor="#FEDA75"/><stop offset="0.5" stopColor="#D62976"/><stop offset="1" stopColor="#4F5BD5"/></linearGradient></defs></svg>
);
const IconWhatsApp = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2a10 10 0 0 0-8.9 14.6L2 22l5.6-1.5A10 10 0 1 0 12 2Z" fill="#DCF8C6" stroke="#25D366" strokeWidth="1.4"/><path d="M8.5 8.5c.2 0 .4.2.5.5.2.6.5 1.3.6 1.5.1.3 0 .5-.2.8l-.5.6c-.1.1-.1.3 0 .4.3.5.8 1 1.4 1.4.2.1.3.2.4 0l.6-.5c.2-.2.4-.3.7-.2.3.1.9.4 1.5.6.3.1.5.3.5.5v1c0 .3-.2.6-.5.7-1.4.4-3.2-.1-5.3-2.2C6.1 11.7 5.6 9.9 6 8.5c.1-.3.4-.5.7-.5h1c.2 0 .4.1.6.3l.2.7Z" fill="#25D366"/></svg>
);
const IconLinkedIn = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="3" fill="#0A66C2"/><path d="M7 9H5v8h2V9Zm-1-4a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm4 4H8v8h2v-4c0-1 .5-1.8 1.5-1.8S13 12 13 13.2V17h2v-4.5c0-2-.8-3.2-2.5-3.2-1.2 0-1.8.7-2.1 1.2V9Z" fill="white"/></svg>
);

function SegmentedBrazuca<T extends string>({ label, value, onChange, options, color }: {
  label: string;
  value: T | null;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: React.ReactNode }[];
  color: string;
}) {
  return (
    <div className="space-y-3 p-4 rounded-[16px] border transition-all"
      style={{ background: value ? 'white' : '#FFFBF5', borderColor: value ? '#FF6B00/20' : 'rgba(0,0,0,0.06)' }}>
      <p className="text-[12px] font-extrabold uppercase tracking-widest flex items-center gap-2" style={{ color }}>
        <span className="w-1.5 h-5 rounded-full" style={{ background: color }} />
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`h-10 px-4 rounded-full text-[13px] font-bold border transition-all flex items-center gap-1.5
                ${active 
                  ? "bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-[0_4px_12px_rgba(0,0,0,0.15)] scale-[1.02]" 
                  : "bg-white text-black/70 border-black/10 hover:border-[#FF6B00]/40 hover:text-black hover:bg-[#FFF5EB]"}`}
            >
              {opt.icon && <span className="mr-1">{opt.icon}</span>}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type PostVersion = { id: number; content: string; variety: number; label: string; executionId?: string | null };

export function FotoPost({ deviceId }: { deviceId: string }) {
  const run = useServerFn(postImagem);
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [plataforma, setPlataforma] = useState<Plataforma | null>(null);
  const [tom, setTom] = useState<Tom | null>(null);
  const [manterTexto, setManterTexto] = useState<ManterTexto | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [versions, setVersions] = useState<PostVersion[]>([]);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const { track } = useTracking();

  const reset = () => {
    setStage(1); setFile(null); setPreviewUrl(null); setBlocked(null);
    setPlataforma(null); setTom(null); setManterTexto(null);
    setErro(null); setVersions([]); setExecutionId(null);
  };

  const handleFile = async (picked: File) => {
    setBlocked(null);
    const result = await checkImageQuality(picked);
    if (result.status === "block") { setBlocked(result.message); setFile(null); return; }
    setFile(picked);
    setPreviewUrl(URL.createObjectURL(picked));
    setStage(2);
    track?.("foto_selecionada");
  };

  const submit = async (varietyBoost = 0) => {
    if (!file ||!plataforma ||!tom ||!manterTexto) return;
    setLoading(true); setErro(null); 
    if (versions.length === 0) setStage(3);
    try {
      const b64 = await compressAndToBase64(file);
      const res: any = await run({ 
        data: { 
          imageBase64: b64, 
          fileBase64: b64, 
          mimeType: "image/jpeg", 
          fileName: file.name, 
          deviceId, 
          answers: { 
            plataforma, 
            tom, 
            manterTexto,
            variedade: varietyBoost > 0 ? varietyBoost : undefined,
            isVariacao: versions.length > 0,
            versaoAnterior: versions[versions.length-1]?.content?.slice(0,500)
          } 
        } 
      });
      if (!res.ok) {
        // REGRESSÃO FIX - Pier: AI_PROVIDER_ERROR sobreviveu? commit 7b29ece
        if (res.message === "AI_PROVIDER_ERROR") {
          // Erro 429 rate limit - backend já estornou crédito, mostra mensagem amigável do res.error
          setErro(res.error || "O modelo de IA que usamos está sobrecarregado agora. Seu crédito não foi cobrado - tenta de novo em 1 minuto.");
          try { toast.error(res.error || "IA sobrecarregada, tenta em 1 minuto"); } catch {}
          // Não avança, fica onde está pra tentar de novo
          if (versions.length === 0) setStage(2);
          return;
        }
        if (res.message?.includes("SEM_CREDITO") || res.message?.includes("LIMITE")) { try { localStorage.setItem("credits","0"); window.dispatchEvent(new CustomEvent("credits-updated", {detail:{credits:0}})); } catch {}; window.dispatchEvent(new Event("abrir-paywall")); if(versions.length===0) setStage(2); return; }
        throw new Error(res.error || res.message);
      }
      const content = res.post || res.post_gerado;
      const newVersion: PostVersion = {
        id: Date.now(),
        content,
        variety: varietyBoost,
        label: versions.length===0 ? "Original" : `Variação ${versions.length}`, // interno +15%/+50% escondido do cliente
        executionId: res.executionId ?? null
      };
      setVersions(prev => [...prev, newVersion]);
      setExecutionId(res.executionId ?? null);
      window.dispatchEvent(new CustomEvent("credits-updated", { detail: { delta: -1 } }));
      window.dispatchEvent(new CustomEvent("post-gerado", { detail: content }));
    } catch (e:any) {
      if(e.message?.includes("SEM_CREDITO")) { window.dispatchEvent(new Event("abrir-paywall")); if(versions.length===0) setStage(2); }
      else setErro(e.message || "Erro");
    } finally { setLoading(false); }
  };

  const handleVariacao = () => {
    const nextBoost = versions.length === 1 ? 0.15 : versions.length === 2 ? 0.5 : 0.5;
    // primeira variação = 15%, segunda em diante = 50% como pediu
    const boost = versions.length === 0 ? 0 : versions.length === 1 ? 0.15 : 0.5;
    submit(boost);
  };

  const copy = async (v: PostVersion) => {
    await navigator.clipboard.writeText(v.content);
    setCopiedId(v.id);
    setTimeout(()=> setCopiedId(null), 2000);
  };

  const canSubmit = plataforma && tom && manterTexto;

  return (
    <div className="max-w-[640px] mx-auto space-y-5">
      <div className="flex items-center gap-2 text-[12px] font-bold">
        <span className={`w-6 h-6 rounded-full flex items-center justify-center ${stage >=1 ? "bg-[#FF6B00] text-white" : "bg-black/10 text-black/40"}`}>1</span>
        <span className={stage>=1 ? "text-black" : "text-black/40"}>Foto</span>
        <div className="w-6 h-[2px] bg-black/10" />
        <span className={`w-6 h-6 rounded-full flex items-center justify-center ${stage >=2 ? "bg-[#FF6B00] text-white" : "bg-black/10 text-black/40"}`}>2</span>
        <span className={stage>=2 ? "text-black" : "text-black/40"}>3 perguntas</span>
        <div className="w-6 h-[2px] bg-black/10" />
        <span className={`w-6 h-6 rounded-full flex items-center justify-center ${stage >=3 ? "bg-[#FF6B00] text-white" : "bg-black/10 text-black/40"}`}>3</span>
        <span className={stage>=3 ? "text-black" : "text-black/40"}>Resultado</span>
      </div>

      {stage === 1 && (
        <div className="rounded-[24px] bg-white border border-black/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-2">
          <DropZone 
            accept="image/*" 
            icon={<ImageIcon className="h-7 w-7 text-[#FF6B00]" />} 
            title="Manda a foto do produto" 
            hint="JPG ou PNG - pode ser do celular mesmo" 
            onFile={handleFile} 
          />
          <p className="text-center text-[11px] text-black/40 py-2 font-medium">Leva 10 seg • Instantâneo • Usa no Instagram, WhatsApp ou LinkedIn</p>
        </div>
      )}

      {blocked && (
        <div className="flex gap-2 p-3 text-sm bg-amber-50 border border-amber-200 rounded-[14px] text-amber-800">
          <AlertTriangle className="h-4 w-4 mt-0.5" />{blocked}
        </div>
      )}

      {stage === 2 && (
        <div className="space-y-4 rounded-[24px] border border-[#FF6B00]/10 bg-white shadow-[0_12px_40px_rgba(255,107,0,0.08)] p-5">
          {previewUrl && (
            <div className="flex items-center gap-3 p-3 rounded-[14px] bg-[#FFFBF5] border border-[#FF6B00]/10">
              <img src={previewUrl} className="w-12 h-12 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold truncate">{file?.name}</p>
                <p className="text-[11px] text-black/50">Pronta pra virar propaganda • 1 crédito</p>
              </div>
              <button onClick={reset} className="text-[11px] font-bold text-black/50 hover:text-black px-2">Trocar</button>
            </div>
          )}

          <SegmentedBrazuca<Plataforma> 
            label="1. ONDE VAI POSTAR?" 
            color="#0A66C2"
            value={plataforma} 
            onChange={setPlataforma} 
            options={[
              { value: "instagram", label: "Instagram", icon: <IconInstagram /> }, 
              { value: "whatsapp", label: "WhatsApp", icon: <IconWhatsApp /> }, 
              { value: "linkedin", label: "LinkedIn", icon: <IconLinkedIn /> }
            ]} 
          />
          <SegmentedBrazuca<Tom> 
            label="2. QUAL TOM?" 
            color="#FF6B00"
            value={tom} 
            onChange={setTom} 
            options={[
              { value: "vendas", label: "Vendas" }, 
              { value: "informativo", label: "Informativo" }, 
              { value: "engraçado", label: "Engraçado" } as any
            ].map(o=> o.value==="engraçado" ? { value: "engracado" as any, label: "Engraçado" } : o as any)} 
          />
          <SegmentedBrazuca<ManterTexto> 
            label="3. TEM TEXTO NA FOTO?" 
            color="#8B5CF6"
            value={manterTexto} 
            onChange={setManterTexto} 
            options={[
              { value: "manter", label: "Manter texto" }, 
              { value: "reescrever", label: "Reescrever tudo" }
            ]} 
          />

          {/* BOTÃO com pisca 45% mais suave quando desabilitado */}
          <div className="pt-2">
            <button 
              onClick={()=> submit(0)} 
              disabled={!canSubmit || loading}
              className={`w-full rounded-full px-6 py-4 font-bold text-[16px] flex items-center justify-center gap-2 transition-all
                ${canSubmit 
                  ? "bg-[#FF6B00] text-white shadow-[0_10px_20px_rgba(255,107,0,0.3)] hover:brightness-105 active:scale-[0.98] animate-[pulseStrong_2s_ease-in-out_infinite]" 
                  : "bg-[#FF6B00]/55 text-white shadow-[0_4px_12px_rgba(255,107,0,0.15)] cursor-not-allowed animate-[pulseSoft_2.5s_ease-in-out_infinite]"}`}
            >
              <Sparkles className="h-4 w-4" />
              Gerar minha propaganda - 1 crédito
            </button>
            <p className="text-center text-[11px] text-black/40 font-medium mt-2">1 crédito = 1 propaganda • Acabou? 1 PIX e continua vendendo</p>
          </div>
        </div>
      )}

      {stage === 3 && (
        <div className="space-y-5">
          {loading && versions.length===0 && (
            <div className="flex flex-col items-center gap-3 p-10 border border-black/[0.06] rounded-[24px] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <Loader2 className="animate-spin h-8 w-8 text-[#FF6B00]" />
              <p className="text-[14px] font-bold">A gente tá escrevendo por você...</p>
              <p className="text-[12px] text-black/50">Legenda + arte pronta em 10 seg</p>
            </div>
          )}

          {/* Lista de versões empilhadas para comparar */}
          {versions.map((v, idx) => (
            <div key={v.id} className="space-y-3 rounded-[20px] border border-black/[0.08] bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full ${idx===0 ? "bg-[#FF6B00] text-white" : idx===1 ? "bg-[#0A66C2] text-white" : "bg-[#8B5CF6] text-white"}`}>{v.label}</span>
                  <span className="text-[11px] text-black/40">#{idx+1}</span>
                </div>
                <button onClick={()=> copy(v)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-black/10 text-[12px] font-bold bg-white hover:bg-black/[0.02]">
                  <Copy className="w-3.5 h-3.5" />
                  {copiedId===v.id ? "Copiado!" : "Copiar"}
                </button>
              </div>
              <div className="whitespace-pre-wrap text-[14px] leading-[1.5] text-black/80 bg-[#FFFBF5] rounded-[14px] p-4 border border-black/[0.04]">{v.content}</div>
              {idx===versions.length-1 && (
                <div className="flex gap-2 pt-1">
                  <button onClick={handleVariacao} disabled={loading} className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#1A1A1A] text-white px-4 py-2.5 text-[13px] font-bold hover:bg-black disabled:opacity-50">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Gerar variação (1 crédito)
                  </button>
                  <button onClick={()=> { window.location.href='/pack' /* fix /biblioteca -> /pack */ }} className="px-4 py-2.5 rounded-full bg-white border border-black/10 text-[13px] font-bold">Ver Biblioteca</button>
                </div>
              )}
            </div>
          ))}

          {loading && versions.length>0 && (
            <div className="rounded-[20px] border border-[#FF6B00]/20 bg-[#FFF5EB] p-5 flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-[#FF6B00]" />
              <p className="text-[13px] font-bold text-black/70">Criando variação... consome 1 crédito</p>
            </div>
          )}

          {executionId && <FeedbackBar executionId={executionId} />}
          {erro && <div className="text-[#E53935] text-sm bg-red-50 border border-red-200 rounded-xl p-3">{erro}</div>}

          <button onClick={reset} className="w-full rounded-full bg-white border border-black/10 py-3.5 text-[14px] font-bold hover:bg-black/[0.02] flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            Criar outra propaganda
          </button>
        </div>
      )}

      <style>{`
        @keyframes pulseSoft {
          0%, 100% { opacity: 0.55; transform: scale(1); box-shadow: 0 4px 12px rgba(255,107,0,0.15); }
          50% { opacity: 0.9; transform: scale(1.01); box-shadow: 0 8px 20px rgba(255,107,0,0.25); }
        }
        @keyframes pulseStrong {
          0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 10px 20px rgba(255,107,0,0.3); }
          50% { opacity: 0.95; transform: scale(1.02); box-shadow: 0 14px 28px rgba(255,107,0,0.4); }
        }
      `}</style>
    </div>
  );
}
